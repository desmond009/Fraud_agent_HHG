import gc
import json
import logging
import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from training.config import TrainingConfig
from training.data_loader import FraudDataLoader, FraudPreprocessor
from training.train import FraudModelTrainer, get_process_memory_mb
from training.predictor import FraudPredictor
from config import update_task, load_progress

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def test_data_loader_ingestion():
    print("\n--- 1. Testing Data Loader Ingestion & Preprocessing ---")
    results = {}
    loader = FraudDataLoader()

    # Ground truth parsing
    fraud_txns = loader.get_ground_truth_fraud_txns()
    gt_pass = len(fraud_txns) > 10_000
    results["ground_truth_parsing"] = "PASS" if gt_pass else "FAIL"
    print(f"  Confirmed fraud transaction IDs parsed: {len(fraud_txns):,} [{'PASS' if gt_pass else 'FAIL'}]")

    # Identity mapping
    id_map = loader.load_identity_mapping()
    id_pass = len(id_map) > 50_000
    results["identity_device_mapping"] = "PASS" if id_pass else "FAIL"
    print(f"  Identity device mappings loaded: {len(id_map):,} [{'PASS' if id_pass else 'FAIL'}]")

    # Ingestion & shape alignment
    X, y = loader.load_dataset(max_rows=2000)
    shape_pass = len(X) == len(y) == 2000 and y.sum() > 0
    results["dataset_shape_alignment"] = "PASS" if shape_pass else "FAIL"
    print(f"  Dataset loaded: X={X.shape}, y={y.shape}, fraud count={int(y.sum())} [{'PASS' if shape_pass else 'FAIL'}]")

    # Preprocessor transform
    preprocessor = FraudPreprocessor()
    transformed = preprocessor.fit_transform(X)
    no_nan = not np.isnan(transformed).any() and not np.isinf(transformed).any()
    prep_pass = no_nan and transformed.shape[0] == 2000 and transformed.shape[1] > 20
    results["preprocessing_clean_matrix"] = "PASS" if prep_pass else "FAIL"
    print(f"  Preprocessed feature matrix: shape={transformed.shape}, NaN/Inf free={no_nan} [{'PASS' if prep_pass else 'FAIL'}]")

    all_pass = all(v == "PASS" for v in results.values())
    return results, all_pass


def test_model_training_execution():
    print("\n--- 2. Testing Model Training Execution & Memory Safety ---")
    results = {}

    gc.collect()
    mem_before = get_process_memory_mb()
    t_start = time.time()

    config = TrainingConfig(
        model_type="hist_gb",
        max_rows=5000,
        test_size=0.20,
    )
    trainer = FraudModelTrainer(config)
    train_output = trainer.train(max_rows=5000, save_artifacts=False)

    gc.collect()
    mem_after = get_process_memory_mb()
    duration = time.time() - t_start
    mem_delta = mem_after - mem_before

    status_pass = train_output.get("status") == "SUCCESS"
    metrics = train_output.get("metrics", {})
    roc_pass = metrics.get("roc_auc", 0.0) >= 0.70
    mem_pass = mem_delta < 300.0  # Safe memory bound

    results["training_status"] = "PASS" if status_pass else "FAIL"
    results["roc_auc_metric"] = "PASS" if roc_pass else "FAIL"
    results["memory_safety"] = "PASS" if mem_pass else "FAIL"

    print(f"  Model training status: {train_output.get('status')} [{'PASS' if status_pass else 'FAIL'}]")
    print(f"  Evaluation ROC-AUC: {metrics.get('roc_auc')} (threshold: >= 0.70) [{'PASS' if roc_pass else 'FAIL'}]")
    print(f"  Evaluation F1-Score: {metrics.get('f1_score')}, PR-AUC: {metrics.get('pr_auc')}")
    print(f"  Memory delta: {mem_delta:+.2f} MB, Duration: {duration:.2f}s [{'PASS' if mem_pass else 'FAIL'}]")

    all_pass = all(v == "PASS" for v in results.values())
    return results, all_pass


def test_checkpoint_and_metrics_artifacts():
    print("\n--- 3. Testing Model Checkpoint & Metrics Artifact Persistence ---")
    results = {}

    config = TrainingConfig(
        model_type="hist_gb",
        max_rows=4000,
        test_size=0.20,
    )
    trainer = FraudModelTrainer(config)
    trainer.train(max_rows=4000, save_artifacts=True)

    # Checkpoint validation
    ckpt_path = config.checkpoint_path
    ckpt_pass = ckpt_path.exists() and ckpt_path.stat().st_size > 10_000
    results["checkpoint_persisted"] = "PASS" if ckpt_pass else "FAIL"
    print(f"  Checkpoint file exists: {ckpt_path.name} ({ckpt_path.stat().st_size / 1024:.1f} KB) [{'PASS' if ckpt_pass else 'FAIL'}]")

    # Metrics validation
    metrics_path = config.metrics_path
    metrics_pass = False
    if metrics_path.exists():
        try:
            m_data = json.loads(metrics_path.read_text())
            metrics_pass = "roc_auc" in m_data and "confusion_matrix" in m_data
        except Exception:
            metrics_pass = False
    results["metrics_json_persisted"] = "PASS" if metrics_pass else "FAIL"
    print(f"  Metrics JSON file exists and valid: {metrics_path.name} [{'PASS' if metrics_pass else 'FAIL'}]")

    # Report validation
    report_path = config.report_path
    report_pass = report_path.exists()
    results["report_json_persisted"] = "PASS" if report_pass else "FAIL"
    print(f"  Training report JSON exists: {report_path.name} [{'PASS' if report_pass else 'FAIL'}]")

    # Reload checkpoint & check inference parity
    predictor = FraudPredictor(checkpoint_path=ckpt_path)
    pred_pass = predictor.is_loaded
    results["checkpoint_reload"] = "PASS" if pred_pass else "FAIL"
    print(f"  Predictor loaded from checkpoint: is_loaded={predictor.is_loaded} [{'PASS' if pred_pass else 'FAIL'}]")

    sample_txn = {
        "TransactionAmt": 125.50,
        "ProductCD": "W",
        "card1": 15000,
        "card4": "visa",
        "card6": "debit",
        "channel": "online",
        "DeviceType": "mobile",
    }
    assessment = predictor.assess_transaction(sample_txn)
    score_pass = 0.0 <= assessment.get("fraud_probability", -1.0) <= 1.0
    results["inference_score_valid"] = "PASS" if score_pass else "FAIL"
    print(f"  Inference scoring on sample: {assessment.get('fraud_probability')} [{assessment.get('verdict')}] [{'PASS' if score_pass else 'FAIL'}]")

    all_pass = all(v == "PASS" for v in results.values())
    return results, all_pass


def run_all_tests():
    print("=" * 70)
    print("BACKEND MODEL TRAINING & INFERENCE PIPELINE VERIFICATION")
    print("=" * 70)

    loader_results, loader_pass = test_data_loader_ingestion()
    train_results, train_pass = test_model_training_execution()
    artifact_results, artifact_pass = test_checkpoint_and_metrics_artifacts()

    overall_pass = loader_pass and train_pass and artifact_pass

    print("\n" + "=" * 70)
    print(f"OVERALL STATUS: {'PASS' if overall_pass else 'FAIL'}")
    print("=" * 70)

    summary = {
        "data_loader": loader_results,
        "training_execution": train_results,
        "artifacts_and_checkpointing": artifact_results,
        "overall": "PASS" if overall_pass else "FAIL",
    }

    update_task("model_training_pipeline", "completed" if overall_pass else "failed", summary)
    return 0 if overall_pass else 1


if __name__ == "__main__":
    import numpy as np
    sys.exit(run_all_tests())
