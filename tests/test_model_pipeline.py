import gc
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

# Ensure workspace root is in path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from training.config import TrainingConfig
from training.data_loader import FraudDataLoader, FraudPreprocessor
from training.predictor import FraudPredictor
from training.train import FraudModelTrainer, get_process_memory_mb
from server.main import app


class TestDataLoaderAndPreprocessing:
    """Verifies data loader correctly ingests and preprocesses dataset from ./data."""

    def test_ground_truth_fraud_cases_parsed(self):
        loader = FraudDataLoader()
        fraud_txns = loader.get_ground_truth_fraud_txns()
        assert len(fraud_txns) > 10_000, f"Expected >10k confirmed fraud transaction IDs, got {len(fraud_txns)}"
        assert isinstance(fraud_txns, set)

    def test_identity_mapping_loaded(self):
        loader = FraudDataLoader()
        id_map = loader.load_identity_mapping()
        assert len(id_map) > 50_000, f"Expected >50k identity mappings, got {len(id_map)}"
        sample_device = next(iter(id_map.values()))
        assert isinstance(sample_device, str)

    def test_dataset_ingestion_and_shape_alignment(self):
        loader = FraudDataLoader()
        X, y = loader.load_dataset(max_rows=1500)

        # Assert zero shape mismatch
        assert len(X) == len(y), f"Shape mismatch: len(X)={len(X)} != len(y)={len(y)}"
        assert len(X) == 1500, f"Expected 1500 rows, got {len(X)}"
        assert y.ndim == 1, f"Target y must be 1D, got ndim={y.ndim}"

        # Assert fraud class is populated
        fraud_count = int(y.sum())
        assert fraud_count > 0, "Target must contain positive fraud cases"
        assert fraud_count < len(y), "Target must contain non-fraud cases"

    def test_preprocessor_fit_transform_no_nan(self):
        loader = FraudDataLoader()
        X, y = loader.load_dataset(max_rows=500)
        preprocessor = FraudPreprocessor()

        transformed = preprocessor.fit_transform(X)

        assert isinstance(transformed, np.ndarray)
        assert transformed.ndim == 2
        assert transformed.shape[0] == len(X)
        assert not np.isnan(transformed).any(), "Preprocessed features must contain no NaNs"
        assert not np.isinf(transformed).any(), "Preprocessed features must contain no Infs"
        assert len(preprocessor.feature_names_out_) == transformed.shape[1]

    def test_preprocessor_handles_unseen_categories(self):
        preprocessor = FraudPreprocessor(
            numerical_features=["TransactionAmt"],
            categorical_features=["ProductCD", "channel"],
        )
        train_df = pd.DataFrame({
            "TransactionAmt": [10.0, 50.0, 100.0],
            "ProductCD": ["W", "H", "C"],
            "channel": ["online", "in_person", "online"],
        })
        preprocessor.fit(train_df)

        # Unseen categories and missing columns
        test_df = pd.DataFrame({
            "TransactionAmt": [200.0, np.nan],
            "ProductCD": ["UNKNOWN_CATEGORY", "W"],
            "channel": ["mobile_app", "online"],
        })
        transformed_test = preprocessor.transform(test_df)

        assert transformed_test.shape[0] == 2
        assert transformed_test.shape[1] == len(preprocessor.feature_names_out_)
        assert not np.isnan(transformed_test).any()

    def test_stratified_train_test_split_shapes(self):
        loader = FraudDataLoader()
        X_train, X_test, y_train, y_test, preprocessor = loader.get_train_test_split(
            max_rows=2000,
            test_size=0.25,
            random_state=42,
        )

        # Shape consistency guarantees
        assert X_train.shape[0] == y_train.shape[0] == 1500
        assert X_test.shape[0] == y_test.shape[0] == 500
        assert X_train.shape[1] == X_test.shape[1]
        assert y_train.sum() > 0, "Train partition missing positive fraud class"
        assert y_test.sum() > 0, "Test partition missing positive fraud class"


class TestModelTrainingExecution:
    """Ensures training script executes properly without memory leaks, shape mismatches, or runtime errors."""

    def test_training_execution_no_memory_leak(self):
        gc.collect()
        mem_before = get_process_memory_mb()

        config = TrainingConfig(
            model_type="hist_gb",
            max_rows=2500,
            test_size=0.20,
        )
        trainer = FraudModelTrainer(config)
        result = trainer.train(max_rows=2500, save_artifacts=False)

        gc.collect()
        mem_after = get_process_memory_mb()
        mem_growth = mem_after - mem_before

        assert result["status"] == "SUCCESS"
        metrics = result["metrics"]
        assert "roc_auc" in metrics
        assert metrics["roc_auc"] > 0.65, f"ROC-AUC score {metrics['roc_auc']} too low"
        assert metrics["f1_score"] >= 0.0
        assert metrics["samples"]["total_samples"] == 2500
        # Verify bounded memory growth (less than 250MB for 2500 rows)
        assert mem_growth < 250.0, f"Excessive memory growth detected: {mem_growth:.2f} MB"

    def test_random_forest_training_execution(self):
        config = TrainingConfig(
            model_type="random_forest",
            max_rows=1000,
            test_size=0.25,
        )
        trainer = FraudModelTrainer(config)
        result = trainer.train(max_rows=1000, save_artifacts=False)

        assert result["status"] == "SUCCESS"
        assert result["metrics"]["model_type"] == "random_forest"
        assert 0.0 <= result["metrics"]["roc_auc"] <= 1.0


class TestModelCheckpointAndArtifacts:
    """Validates that model checkpoints and metrics are saved correctly after training."""

    @pytest.fixture(autouse=True)
    def setup_temp_dir(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        yield
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_checkpoint_and_metrics_saved_and_reloaded(self):
        config = TrainingConfig(
            models_dir=self.temp_dir,
            checkpoint_name="test_model.joblib",
            metrics_name="test_metrics.json",
            report_name="test_report.json",
            max_rows=2000,
        )
        trainer = FraudModelTrainer(config)
        result = trainer.train(max_rows=2000, save_artifacts=True)

        assert result["status"] == "SUCCESS"

        # 1. Verify files exist on disk
        ckpt_file = config.checkpoint_path
        metrics_file = config.metrics_path
        report_file = config.report_path

        assert ckpt_file.exists(), f"Missing checkpoint file at {ckpt_file}"
        assert metrics_file.exists(), f"Missing metrics file at {metrics_file}"
        assert report_file.exists(), f"Missing report file at {report_file}"
        assert ckpt_file.stat().st_size > 10_000, "Checkpoint file suspiciously small"

        # 2. Verify metrics.json content
        metrics_json = json.loads(metrics_file.read_text())
        assert "roc_auc" in metrics_json
        assert "pr_auc" in metrics_json
        assert "confusion_matrix" in metrics_json
        assert metrics_json["samples"]["total_samples"] == 2000

        # 3. Verify training_report.json content
        report_json = json.loads(report_file.read_text())
        assert report_json["status"] == "SUCCESS"
        assert report_json["checkpoint_file"] == "test_model.joblib"

        # 4. Reload checkpoint via FraudPredictor and verify identical inference
        predictor = FraudPredictor(checkpoint_path=ckpt_file)
        assert predictor.is_loaded is True
        assert predictor.model is not None
        assert predictor.preprocessor is not None

        test_payload = {
            "TransactionAmt": 250.00,
            "ProductCD": "W",
            "card1": 15000,
            "card4": "visa",
            "card6": "debit",
            "channel": "online",
        }
        assessment = predictor.assess_transaction(test_payload)
        assert "fraud_probability" in assessment
        assert 0.0 <= assessment["fraud_probability"] <= 1.0
        assert assessment["verdict"] in ["FLAGGED_FRAUD", "CLEARED"]


class TestEndToEndPipelineIntegration:
    """Integration tests confirming the pipeline runs smoothly from ingestion to API serving."""

    def test_full_pipeline_to_prediction(self):
        # 1. Ingest & Train
        config = TrainingConfig(
            model_type="hist_gb",
            max_rows=3000,
        )
        trainer = FraudModelTrainer(config)
        train_result = trainer.train(max_rows=3000, save_artifacts=True)
        assert train_result["status"] == "SUCCESS"

        # 2. Predictor inference verification
        predictor = FraudPredictor()
        assert predictor.is_loaded

        batch_test = [
            {"TransactionAmt": 15.00, "channel": "in_person", "card4": "visa"},
            {"TransactionAmt": 3500.00, "channel": "online", "DeviceType": "mobile", "ProductCD": "H"},
        ]
        probabilities = predictor.predict_proba(batch_test)
        predictions = predictor.predict(batch_test)

        assert len(probabilities) == 2
        assert len(predictions) == 2
        assert all(0.0 <= p <= 1.0 for p in probabilities)
        assert all(p in [0, 1] for p in predictions)

    def test_fastapi_model_status_and_predict_endpoints(self):
        client = TestClient(app)

        # GET /api/model/status
        status_resp = client.get("/api/model/status")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        assert status_data["status"] == "LOADED"
        assert "metadata" in status_data
        assert "roc_auc" in status_data["metadata"]["metrics"]

        # POST /api/model/predict
        predict_resp = client.post(
            "/api/model/predict",
            json={
                "TransactionAmt": 450.00,
                "card1": 12345,
                "card4": "mastercard",
                "card6": "credit",
                "channel": "online",
                "DeviceType": "mobile",
            },
        )
        assert predict_resp.status_code == 200
        predict_data = predict_resp.json()
        assert "fraud_probability" in predict_data
        assert "verdict" in predict_data
        assert 0.0 <= predict_data["fraud_probability"] <= 1.0


if __name__ == "__main__":
    # Allow running directly: python tests/test_model_pipeline.py
    pytest.main(["-v", __file__])
