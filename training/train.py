import argparse
import gc
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import joblib
import numpy as np
import psutil
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

# Enable running as script or module
if __name__ == "__main__" and __package__ is None:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from training.config import TrainingConfig
from training.data_loader import FraudDataLoader, FraudPreprocessor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def get_process_memory_mb() -> float:
    """Returns the current process memory consumption in megabytes."""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)


class FraudModelTrainer:
    """Handles end-to-end model training, memory-safe execution, metric evaluation,
    and persistent artifact/checkpoint generation.
    """

    def __init__(self, config: Optional[TrainingConfig] = None):
        self.config = config or TrainingConfig()
        self.data_loader = FraudDataLoader(self.config)
        self.config.models_dir.mkdir(parents=True, exist_ok=True)

    def _build_model(self):
        """Builds estimator based on configured model type."""
        model_type = self.config.model_type.lower()
        if model_type == "hist_gb":
            return HistGradientBoostingClassifier(
                class_weight="balanced",
                max_iter=100,
                learning_rate=0.1,
                random_state=self.config.random_state,
            )
        elif model_type == "random_forest":
            return RandomForestClassifier(
                n_estimators=50,
                max_depth=12,
                class_weight="balanced",
                random_state=self.config.random_state,
                n_jobs=-1,
            )
        elif model_type == "logistic_regression":
            return LogisticRegression(
                class_weight="balanced",
                max_iter=500,
                random_state=self.config.random_state,
            )
        else:
            raise ValueError(f"Unsupported model_type '{model_type}'. Choose 'hist_gb', 'random_forest', or 'logistic_regression'.")

    def train(
        self,
        max_rows: Optional[int] = None,
        save_artifacts: bool = True,
    ) -> Dict[str, Any]:
        """Executes the training workflow end-to-end.

        Args:
            max_rows: Optional limit on rows ingested for training.
            save_artifacts: Whether to save checkpoints and metrics to disk.

        Returns:
            Dictionary containing metrics, execution telemetry, and artifact paths.
        """
        gc.collect()
        mem_start_mb = get_process_memory_mb()
        t_start = time.time()

        logger.info(f"Starting training workflow [model={self.config.model_type}, memory={mem_start_mb:.1f}MB]")

        # 1. Ingest & Preprocess
        X_train, X_test, y_train, y_test, preprocessor = self.data_loader.get_train_test_split(
            max_rows=max_rows,
        )

        # 2. Shape Integrity Guard
        assert X_train.ndim == 2, f"Expected 2D features, got ndim={X_train.ndim}"
        assert X_train.shape[0] == y_train.shape[0], f"Train mismatch: {X_train.shape[0]} != {y_train.shape[0]}"
        assert X_test.shape[0] == y_test.shape[0], f"Test mismatch: {X_test.shape[0]} != {y_test.shape[0]}"
        assert X_train.shape[1] == X_test.shape[1], f"Feature mismatch: {X_train.shape[1]} != {X_test.shape[1]}"

        # 3. Model Initialization & Fitting
        model = self._build_model()
        logger.info(f"Fitting {self.config.model_type} on {X_train.shape[0]} samples with {X_train.shape[1]} features...")
        fit_start = time.time()
        model.fit(X_train, y_train)
        fit_time_s = time.time() - fit_start

        # 4. Evaluation & Metrics Calculation
        eval_start = time.time()
        y_prob = model.predict_proba(X_test)[:, 1]
        eval_time_s = time.time() - eval_start
        latency_us_per_sample = (eval_time_s / max(len(X_test), 1)) * 1_000_000

        # Predictions at threshold
        threshold = self.config.decision_threshold
        y_pred = (y_prob >= threshold).astype(int)

        # Compute classification metrics
        has_positive = (y_test == 1).any()
        has_negative = (y_test == 0).any()

        roc_auc = float(roc_auc_score(y_test, y_prob)) if (has_positive and has_negative) else 0.5
        pr_auc = float(average_precision_score(y_test, y_prob)) if has_positive else 0.0
        precision = float(precision_score(y_test, y_pred, zero_division=0))
        recall = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

        mem_end_mb = get_process_memory_mb()
        total_time_s = time.time() - t_start

        metrics: Dict[str, Any] = {
            "model_type": self.config.model_type,
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {
                "true_negative": tn,
                "false_positive": fp,
                "false_negative": fn,
                "true_positive": tp,
            },
            "decision_threshold": threshold,
            "samples": {
                "train_samples": int(X_train.shape[0]),
                "test_samples": int(X_test.shape[0]),
                "total_samples": int(X_train.shape[0] + X_test.shape[0]),
                "train_fraud_rate": round(float(np.mean(y_train)), 4),
                "test_fraud_rate": round(float(np.mean(y_test)), 4),
                "feature_count": int(X_train.shape[1]),
            },
            "performance": {
                "training_time_seconds": round(fit_time_s, 3),
                "total_time_seconds": round(total_time_s, 3),
                "inference_latency_us_per_sample": round(latency_us_per_sample, 2),
                "memory_start_mb": round(mem_start_mb, 2),
                "memory_end_mb": round(mem_end_mb, 2),
                "memory_delta_mb": round(mem_end_mb - mem_start_mb, 2),
            },
            "evaluated_at": datetime.now().isoformat(),
        }

        logger.info(f"Training completed. ROC-AUC: {roc_auc:.4f}, F1: {f1:.4f}, PR-AUC: {pr_auc:.4f}")

        # 5. Checkpoint & Artifact Generation
        checkpoint_data = {
            "model": model,
            "preprocessor": preprocessor,
            "feature_names_in": preprocessor.feature_names_in_,
            "feature_names_out": preprocessor.feature_names_out_,
            "config": {
                "model_type": self.config.model_type,
                "random_state": self.config.random_state,
                "decision_threshold": self.config.decision_threshold,
                "numerical_features": self.config.numerical_features,
                "categorical_features": self.config.categorical_features,
            },
            "metrics": metrics,
            "trained_at": datetime.now().isoformat(),
        }

        if save_artifacts:
            # Save Checkpoint
            checkpoint_path = self.config.checkpoint_path
            joblib.dump(checkpoint_data, checkpoint_path, compress=3)
            logger.info(f"Model checkpoint saved to {checkpoint_path} ({checkpoint_path.stat().st_size / 1024:.1f} KB)")

            # Save Metrics
            metrics_path = self.config.metrics_path
            metrics_path.write_text(json.dumps(metrics, indent=2))
            logger.info(f"Evaluation metrics saved to {metrics_path}")

            # Save Detailed Training Report
            report_path = self.config.report_path
            report = {
                "status": "SUCCESS",
                "checkpoint_file": str(checkpoint_path.name),
                "metrics_file": str(metrics_path.name),
                "training_summary": metrics,
            }
            report_path.write_text(json.dumps(report, indent=2))

            # 6. Post-training validation of saved checkpoint
            self._validate_saved_checkpoint(checkpoint_path, X_test[:10], y_prob[:10])

        # Cleanup memory
        del X_train, X_test, y_train, y_test, y_prob, y_pred
        gc.collect()

        return {
            "status": "SUCCESS",
            "metrics": metrics,
            "checkpoint_path": str(self.config.checkpoint_path) if save_artifacts else None,
            "metrics_path": str(self.config.metrics_path) if save_artifacts else None,
        }

    def _validate_saved_checkpoint(self, checkpoint_path: Path, sample_X: np.ndarray, expected_probs: np.ndarray):
        """Ensures saved checkpoint can be reloaded and produces identical inference results."""
        assert checkpoint_path.exists(), f"Checkpoint file missing at {checkpoint_path}"
        loaded = joblib.load(checkpoint_path)
        assert "model" in loaded, "Loaded checkpoint missing 'model' key"
        assert "preprocessor" in loaded, "Loaded checkpoint missing 'preprocessor' key"

        reloaded_model = loaded["model"]
        reloaded_probs = reloaded_model.predict_proba(sample_X)[:, 1]

        np.testing.assert_allclose(
            reloaded_probs,
            expected_probs,
            rtol=1e-5,
            err_msg="Reloaded checkpoint inference differs from in-memory model!",
        )
        logger.info("[OK] Saved checkpoint validated successfully with identical inference output.")


def main():
    parser = argparse.ArgumentParser(description="Train Fraud Detection ML Pipeline")
    parser.add_argument("--max-rows", type=int, default=50_000, help="Max rows to ingest for training")
    parser.add_argument("--model", type=str, default="hist_gb", choices=["hist_gb", "random_forest", "logistic_regression"])
    parser.add_argument("--test-size", type=float, default=0.20, help="Test set fraction")
    args = parser.parse_args()

    config = TrainingConfig(
        model_type=args.model,
        max_rows=args.max_rows,
        test_size=args.test_size,
    )
    trainer = FraudModelTrainer(config)
    result = trainer.train(max_rows=args.max_rows)
    print("\nTraining Result Summary:")
    print(json.dumps(result["metrics"], indent=2))


if __name__ == "__main__":
    main()
