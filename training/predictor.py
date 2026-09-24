import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import joblib
import numpy as np
import pandas as pd

from .config import MODELS_DIR, TrainingConfig
from .data_loader import FraudPreprocessor

logger = logging.getLogger(__name__)


class FraudPredictor:
    """Provides inference capabilities using the trained model checkpoint."""

    def __init__(self, checkpoint_path: Optional[Path] = None):
        self.checkpoint_path = Path(checkpoint_path or (MODELS_DIR / "fraud_detector_v1.joblib"))
        self.model = None
        self.preprocessor: Optional[FraudPreprocessor] = None
        self.metadata: Dict[str, Any] = {}
        self.is_loaded = False
        self._load_checkpoint()

    def _load_checkpoint(self):
        if not self.checkpoint_path.exists():
            logger.warning(f"Model checkpoint not found at {self.checkpoint_path}. Predictor in uninitialized state.")
            return

        data = joblib.load(self.checkpoint_path)
        self.model = data["model"]
        self.preprocessor = data["preprocessor"]
        self.metadata = {
            "trained_at": data.get("trained_at"),
            "config": data.get("config", {}),
            "metrics": data.get("metrics", {}),
            "feature_names_in": data.get("feature_names_in", []),
            "feature_names_out": data.get("feature_names_out", []),
        }
        self.is_loaded = True
        logger.info(f"Loaded fraud model checkpoint from {self.checkpoint_path} (trained_at: {self.metadata.get('trained_at')})")

    def _to_dataframe(self, data: Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]]) -> pd.DataFrame:
        if isinstance(data, pd.DataFrame):
            return data
        elif isinstance(data, dict):
            return pd.DataFrame([data])
        elif isinstance(data, list):
            return pd.DataFrame(data)
        else:
            raise TypeError(f"Expected DataFrame, dict, or list of dicts, got {type(data)}")

    def predict_proba(self, data: Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]]) -> np.ndarray:
        """Predicts fraud probability score in [0.0, 1.0]."""
        if not self.is_loaded:
            raise RuntimeError("Model checkpoint not loaded. Train a model first or check checkpoint path.")

        df = self._to_dataframe(data)
        X = self.preprocessor.transform(df)
        probs = self.model.predict_proba(X)[:, 1]
        return np.asarray(probs, dtype=np.float32)

    def predict(
        self,
        data: Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]],
        threshold: Optional[float] = None,
    ) -> np.ndarray:
        """Predicts binary classification: 1 for fraud, 0 for legitimate."""
        thresh = threshold if threshold is not None else self.metadata.get("config", {}).get("decision_threshold", 0.50)
        probs = self.predict_proba(data)
        return (probs >= thresh).astype(int)

    def assess_transaction(self, txn: Dict[str, Any]) -> Dict[str, Any]:
        """Provides full fraud assessment and explanatory breakdown for a single transaction."""
        prob = float(self.predict_proba(txn)[0])
        decision = "FLAGGED_FRAUD" if prob >= 0.50 else "CLEARED"

        # Risk signals analysis
        signals = []
        amt = float(txn.get("TransactionAmt", txn.get("amount", 0.0)) or 0.0)
        if amt > 1000.0:
            signals.append(f"High transaction amount: ${amt:,.2f}")
        if str(txn.get("channel", "")).lower() == "online":
            signals.append("Online channel without physical card presentation")
        if txn.get("DeviceType") == "mobile":
            signals.append("Mobile device origin")

        return {
            "fraud_probability": round(prob, 4),
            "verdict": decision,
            "threshold": 0.50,
            "risk_signals": signals,
            "model_version": self.metadata.get("trained_at", "v1.0"),
        }
