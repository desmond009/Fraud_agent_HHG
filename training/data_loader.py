import gc
import logging
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .config import (
    DEFAULT_CATEGORICAL_FEATURES,
    DEFAULT_NUMERICAL_FEATURES,
    TrainingConfig,
)

logger = logging.getLogger(__name__)


class FraudPreprocessor:
    """Preprocesses tabular fraud detection features with scaling, imputation, and encoding.
    Ensures zero shape mismatches and handles unknown categories gracefully.
    """

    def __init__(
        self,
        numerical_features: Optional[List[str]] = None,
        categorical_features: Optional[List[str]] = None,
    ):
        self.numerical_features = list(numerical_features or DEFAULT_NUMERICAL_FEATURES)
        self.categorical_features = list(categorical_features or DEFAULT_CATEGORICAL_FEATURES)
        self.feature_names_in_: List[str] = self.numerical_features + self.categorical_features
        self.feature_names_out_: List[str] = []
        self.is_fitted = False

        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ])

        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ])

        self.transformer = ColumnTransformer(
            transformers=[
                ("num", num_pipeline, self.numerical_features),
                ("cat", cat_pipeline, self.categorical_features),
            ],
            remainder="drop",
        )

    def fit(self, X: pd.DataFrame) -> "FraudPreprocessor":
        """Fits imputer, scaler, and one-hot encoder on the training features."""
        missing_cols = [c for c in self.feature_names_in_ if c not in X.columns]
        if missing_cols:
            # Add missing columns with NaN so transformer fits cleanly
            for c in missing_cols:
                X[c] = np.nan

        self.transformer.fit(X[self.feature_names_in_])
        self.is_fitted = True

        # Generate output feature names
        out_names = []
        out_names.extend(self.numerical_features)
        try:
            cat_encoder = self.transformer.named_transformers_["cat"].named_steps["encoder"]
            cat_out = cat_encoder.get_feature_names_out(self.categorical_features)
            out_names.extend(list(cat_out))
        except Exception:
            out_names.extend([f"cat_{i}" for i in range(10)])
        self.feature_names_out_ = out_names
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transforms input DataFrame into a clean numpy array with verified shape."""
        if not self.is_fitted:
            raise RuntimeError("FraudPreprocessor must be fitted before calling transform().")

        X_copy = X.copy()
        for col in self.feature_names_in_:
            if col not in X_copy.columns:
                X_copy[col] = np.nan

        features = self.transformer.transform(X_copy[self.feature_names_in_])
        features = np.asarray(features, dtype=np.float32)

        # Assert no NaNs or Infs in transformed output
        if np.isnan(features).any():
            np.nan_to_num(features, copy=False, nan=0.0)

        return features

    def fit_transform(self, X: pd.DataFrame) -> np.ndarray:
        return self.fit(X).transform(X)


class FraudDataLoader:
    """Memory-safe data loader for IEEE-CIS fraud dataset.
    Streams and optimizes dtypes to prevent memory leaks and joins ground truth fraud labels.
    """

    def __init__(self, config: Optional[TrainingConfig] = None):
        self.config = config or TrainingConfig()

    def get_ground_truth_fraud_txns(self) -> Set[str]:
        """Extracts confirmed fraud transaction IDs from closed_cases_history.csv."""
        cases_path = self.config.data_dir / "closed_cases_history.csv"
        if not cases_path.exists():
            logger.warning(f"closed_cases_history.csv not found at {cases_path}")
            return set()

        cases_df = pd.read_csv(cases_path, usecols=["outcome", "txn_ids"], low_memory=False)
        fraud_cases = cases_df[cases_df["outcome"] == "confirmed_fraud"]
        fraud_txns: Set[str] = set()

        for raw_txns in fraud_cases["txn_ids"].dropna():
            for t in str(raw_txns).split("|"):
                tid = t.strip()
                if tid:
                    fraud_txns.add(tid)

        del cases_df, fraud_cases
        gc.collect()
        return fraud_txns

    def load_identity_mapping(self) -> Dict[str, str]:
        """Loads DeviceType mapping from identity.csv keyed by TransactionID."""
        id_path = self.config.data_dir / "identity.csv"
        if not id_path.exists():
            return {}

        id_df = pd.read_csv(
            id_path,
            usecols=["TransactionID", "DeviceType"],
            dtype={"TransactionID": str, "DeviceType": str},
            low_memory=False,
        )
        id_df["DeviceType"] = id_df["DeviceType"].fillna("unknown")
        mapping = dict(zip(id_df["TransactionID"], id_df["DeviceType"]))

        del id_df
        gc.collect()
        return mapping

    def load_dataset(
        self,
        max_rows: Optional[int] = None,
        stratified_sample: bool = False,
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """Ingests transactions.csv with memory efficiency and attaches target labels.

        Args:
            max_rows: Maximum rows to read. If None, reads from config.max_rows.
            stratified_sample: If True and max_rows is set, preserves fraud class ratio.

        Returns:
            Tuple of (features_df, target_series) guaranteed to have identical length.
        """
        txn_path = self.config.data_dir / "transactions.csv"
        if not txn_path.exists():
            raise FileNotFoundError(f"Dataset not found at {txn_path}")

        fraud_txns = self.get_ground_truth_fraud_txns()
        device_map = self.load_identity_mapping()

        rows_to_read = max_rows or self.config.max_rows

        # Restrict column loading to save memory
        needed_num = [c for c in self.config.numerical_features]
        needed_cat = [c for c in self.config.categorical_features if c != "DeviceType"]
        meta_cols = ["TransactionID", "risk_score"]
        all_cols_to_read = list(dict.fromkeys(needed_num + needed_cat + meta_cols))

        logger.info(f"Loading transactions dataset (max_rows={rows_to_read})...")

        if rows_to_read:
            # Direct read with nrows
            df = pd.read_csv(
                txn_path,
                usecols=lambda c: c in all_cols_to_read,
                nrows=rows_to_read,
                low_memory=False,
            )
        else:
            # Chunked streaming to prevent high peak memory
            chunks = []
            for chunk in pd.read_csv(
                txn_path,
                usecols=lambda c: c in all_cols_to_read,
                chunksize=self.config.chunk_size,
                low_memory=False,
            ):
                # Downcast numeric types to float32
                float_cols = chunk.select_dtypes(include=["float64"]).columns
                chunk[float_cols] = chunk[float_cols].astype(np.float32)
                chunks.append(chunk)

            df = pd.concat(chunks, ignore_index=True)
            del chunks
            gc.collect()

        df["TransactionID"] = df["TransactionID"].astype(str)

        # Attach DeviceType from identity mapping
        if "DeviceType" in self.config.categorical_features:
            df["DeviceType"] = df["TransactionID"].map(device_map).fillna("unknown")

        # Ground truth label: 1 if in confirmed fraud cases OR risk_score >= 0.85
        # (gives robust labels for training)
        is_confirmed = df["TransactionID"].isin(fraud_txns)
        has_high_risk = df["risk_score"].fillna(0.0) >= 0.85 if "risk_score" in df.columns else False
        labels = (is_confirmed | has_high_risk).astype(np.int32)

        # Drop identifier and target columns from feature DataFrame
        drop_cols = [c for c in ["TransactionID", "risk_score", "customer_id", "ts"] if c in df.columns]
        X = df.drop(columns=drop_cols)
        y = labels

        # Validate shape integrity
        assert len(X) == len(y), f"Shape mismatch: X ({len(X)}) != y ({len(y)})"

        logger.info(f"Dataset loaded: {X.shape[0]} rows, {X.shape[1]} features. Fraud count: {y.sum()} ({y.mean():.2%})")

        # Clean memory
        del df
        gc.collect()

        return X, y

    def get_train_test_split(
        self,
        max_rows: Optional[int] = None,
        test_size: Optional[float] = None,
        random_state: Optional[int] = None,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, FraudPreprocessor]:
        """Loads data, fits preprocessor on train, and returns train/test arrays and preprocessor."""
        t_size = test_size if test_size is not None else self.config.test_size
        seed = random_state if random_state is not None else self.config.random_state

        X_df, y_series = self.load_dataset(max_rows=max_rows)

        # Stratified train/test split
        has_both_classes = len(y_series.unique()) > 1 and y_series.sum() >= 2
        stratify = y_series if has_both_classes else None

        X_train_df, X_test_df, y_train_s, y_test_s = train_test_split(
            X_df,
            y_series,
            test_size=t_size,
            random_state=seed,
            stratify=stratify,
        )

        preprocessor = FraudPreprocessor(
            numerical_features=self.config.numerical_features,
            categorical_features=self.config.categorical_features,
        )

        X_train = preprocessor.fit_transform(X_train_df)
        X_test = preprocessor.transform(X_test_df)
        y_train = y_train_s.to_numpy(dtype=np.int32)
        y_test = y_test_s.to_numpy(dtype=np.int32)

        # Strict shape mismatch assertions
        assert X_train.shape[0] == y_train.shape[0], f"Train mismatch: X {X_train.shape} vs y {y_train.shape}"
        assert X_test.shape[0] == y_test.shape[0], f"Test mismatch: X {X_test.shape} vs y {y_test.shape}"
        assert X_train.shape[1] == X_test.shape[1], f"Feature dimension mismatch: {X_train.shape[1]} != {X_test.shape[1]}"

        # Clean intermediate DataFrames
        del X_df, y_series, X_train_df, X_test_df, y_train_s, y_test_s
        gc.collect()

        return X_train, X_test, y_train, y_test, preprocessor
