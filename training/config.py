import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
MODELS_DIR = OUTPUTS_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_NUMERICAL_FEATURES: List[str] = [
    "TransactionAmt",
    "card1",
    "card2",
    "card3",
    "card5",
    "addr1",
    "addr2",
    "dist1",
    "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14",
    "D1", "D2", "D3", "D4",
    "V1", "V2", "V3", "V4", "V5", "V12", "V13", "V14", "V15"
]

DEFAULT_CATEGORICAL_FEATURES: List[str] = [
    "ProductCD",
    "card4",
    "card6",
    "channel",
    "P_emaildomain",
    "DeviceType"
]

@dataclass
class TrainingConfig:
    data_dir: Path = DATA_DIR
    models_dir: Path = MODELS_DIR
    model_type: str = "hist_gb"  # "hist_gb", "random_forest", "logistic_regression"
    test_size: float = 0.20
    random_state: int = 42
    max_rows: Optional[int] = None
    chunk_size: int = 50_000
    checkpoint_name: str = "fraud_detector_v1.joblib"
    metrics_name: str = "metrics.json"
    report_name: str = "training_report.json"
    decision_threshold: float = 0.50
    numerical_features: List[str] = field(default_factory=lambda: list(DEFAULT_NUMERICAL_FEATURES))
    categorical_features: List[str] = field(default_factory=lambda: list(DEFAULT_CATEGORICAL_FEATURES))

    @property
    def checkpoint_path(self) -> Path:
        return self.models_dir / self.checkpoint_name

    @property
    def metrics_path(self) -> Path:
        return self.models_dir / self.metrics_name

    @property
    def report_path(self) -> Path:
        return self.models_dir / self.report_name
