"""
ML Training Pipeline for Flood-Flash Landslide Early Warning System.

SYNTHETIC DATASET & PIPELINE NOTICE:
--------------------------------------------------------------------------------
This script generates a domain-informed synthetic training dataset (10,000 samples)
simulating physical relationships between precipitation, soil saturation, slope angle,
historical incidents, and landslide occurrence.

IMPORTANT DISCLAIMER:
This dataset is created to demonstrate the Machine Learning pipeline architecture,
feature scaling, model evaluation, and inference integration. Before field deployment,
this pipeline MUST be retrained on real historical landslide inventories (e.g., from
the Geological Survey of India - GSI Bhukosh, State Disaster Management Authorities,
and IMD rainfall archives).
--------------------------------------------------------------------------------
"""

import os
import sys
import argparse
import logging
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    classification_report, confusion_matrix
)
import xgboost as xgb

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("train_model")

FEATURE_COLUMNS = [
    "rainfall_1h_mm",
    "rainfall_24h_mm",
    "rainfall_72h_mm",
    "soil_moisture_pct",
    "slope_angle_deg",
    "historical_incident_count_in_ward",
    "days_since_last_rain"
]

TARGET_COLUMN = "landslide_occurred"

def generate_synthetic_dataset(n_samples: int = 10000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates domain-informed synthetic dataset using physical geotechnical principles.
    Higher cumulative rainfall + soil saturation + steep slope + prior incidents = higher P(landslide).
    Includes realistic Gaussian noise to avoid trivial linear separability.
    """
    np.random.seed(random_seed)

    logger.info(f"Generating {n_samples} synthetic training samples based on physical domain rules...")

    # 1. Simulate Features
    # Short-burst 1h rain (0 to 65 mm/h)
    r1 = np.random.exponential(scale=8.0, size=n_samples)
    r1 = np.clip(r1, 0.0, 65.0)

    # 24h rain (function of 1h rain + background accumulation)
    r24 = r1 * np.random.uniform(1.5, 3.5, n_samples) + np.random.gamma(shape=2, scale=15, size=n_samples)
    r24 = np.clip(r24, 0.0, 220.0)

    # 72h rain (function of 24h rain + background storm duration)
    r72 = r24 * np.random.uniform(1.2, 2.2, n_samples) + np.random.gamma(shape=2, scale=25, size=n_samples)
    r72 = np.clip(r72, 0.0, 380.0)

    # Soil moisture saturation percentage (correlated with 72h rainfall)
    sm_base = 25.0 + (r72 / 380.0) * 65.0 + np.random.normal(0, 8.0, n_samples)
    soil_moisture = np.clip(sm_base, 10.0, 98.0)

    # Terrain slope angle in degrees (10° to 48°)
    slope = np.random.uniform(12.0, 48.0, n_samples)

    # Historical landslide incidents in ward (0 to 5)
    hist_incidents = np.random.choice([0, 1, 2, 3, 4, 5], size=n_samples, p=[0.45, 0.25, 0.15, 0.08, 0.05, 0.02])

    # Days since last rainfall event (0 to 14)
    days_since_rain = np.where(r1 > 2.0, 0, np.random.randint(1, 14, n_samples))

    # 2. Physics-Informed Log Odds Target Generation
    # Z = base_bias + w1*r72 + w2*r1 + w3*sm + w4*slope + w5*incidents - w6*days_dry + noise
    z = (
        -6.2
        + 0.018 * r72
        + 0.045 * r1
        + 0.052 * soil_moisture
        + 0.075 * slope
        + 0.450 * hist_incidents
        - 0.220 * days_since_rain
        + np.random.normal(0, 0.85, n_samples)  # Real-world environmental noise
    )

    prob = 1.0 / (1.0 + np.exp(-z))
    landslide_occurred = (prob >= 0.50).astype(int)

    df = pd.DataFrame({
        "rainfall_1h_mm": np.round(r1, 1),
        "rainfall_24h_mm": np.round(r24, 1),
        "rainfall_72h_mm": np.round(r72, 1),
        "soil_moisture_pct": np.round(soil_moisture, 1),
        "slope_angle_deg": np.round(slope, 1),
        "historical_incident_count_in_ward": hist_incidents,
        "days_since_last_rain": days_since_rain,
        "landslide_occurred": landslide_occurred
    })

    pos_rate = df["landslide_occurred"].mean() * 100
    logger.info(f"Synthetic dataset generated successfully. Total rows: {len(df)}. Landslide positive rate: {pos_rate:.2f}%")

    return df

def train_and_evaluate(csv_path: str = None):
    """
    Loads dataset (from CSV if provided, else generates synthetic dataset),
    trains Logistic Regression baseline and XGBoost Classifier, evaluates metrics,
    and exports the best model artifact to backend/models/.
    """
    if csv_path and os.path.exists(csv_path):
        logger.info(f"Loading custom training dataset from CSV: {csv_path}")
        df = pd.read_csv(csv_path)
    else:
        if csv_path:
            logger.warning(f"CSV path '{csv_path}' not found. Falling back to synthetic dataset generation.")
        df = generate_synthetic_dataset(n_samples=10000)

    # Verify required columns exist
    missing_cols = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset is missing required columns: {missing_cols}")

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # Train / Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    logger.info(f"Dataset split complete: {len(X_train)} training rows, {len(X_test)} test evaluation rows.")

    # Standard Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # --------------------------------------------------------------------------
    # MODEL 1: Logistic Regression Baseline (Interpretable Linear Benchmark)
    # --------------------------------------------------------------------------
    logger.info("\n=== Training Baseline Model: Logistic Regression ===")
    lr_model = LogisticRegression(random_state=42, max_iter=1000)
    lr_model.fit(X_train_scaled, y_train)

    lr_preds = lr_model.predict(X_test_scaled)
    lr_probs = lr_model.predict_proba(X_test_scaled)[:, 1]

    lr_prec = precision_score(y_test, lr_preds)
    lr_rec = recall_score(y_test, lr_preds)
    lr_f1 = f1_score(y_test, lr_preds)
    lr_auc = roc_auc_score(y_test, lr_probs)

    logger.info(f"Logistic Regression -> Precision: {lr_prec:.4f} | Recall: {lr_rec:.4f} | F1: {lr_f1:.4f} | ROC-AUC: {lr_auc:.4f}")

    # --------------------------------------------------------------------------
    # MODEL 2: XGBoost Classifier (Primary Non-Linear Gradient Boosted Model)
    # --------------------------------------------------------------------------
    logger.info("\n=== Training Primary Model: XGBoost Classifier ===")
    xgb_model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric="logloss"
    )
    xgb_model.fit(X_train, y_train)  # Tree models don't strictly require scaling, but we train on raw features for native feature importances

    xgb_preds = xgb_model.predict(X_test)
    xgb_probs = xgb_model.predict_proba(X_test)[:, 1]

    xgb_prec = precision_score(y_test, xgb_preds)
    xgb_rec = recall_score(y_test, xgb_preds)
    xgb_f1 = f1_score(y_test, xgb_preds)
    xgb_auc = roc_auc_score(y_test, xgb_probs)

    logger.info(f"XGBoost Classifier -> Precision: {xgb_prec:.4f} | Recall: {xgb_rec:.4f} | F1: {xgb_f1:.4f} | ROC-AUC: {xgb_auc:.4f}")

    """
    ============================================================================
    CRITICAL METRIC EXPLANATION: WHY RECALL MATTERS MORE THAN PRECISION HERE
    ============================================================================
    In disaster management early warning systems (landslide / flash-flood alert):
    - False Negative (FN): The model predicts NO landslide, but a landslide OCCURS.
      Impact: Severe loss of human life, unevacuated residents, destroyed infrastructure.
    - False Positive (FP): The model predicts a landslide, but NO landslide occurs.
      Impact: Temporary false alarm / warning notice sent to officials.

    Because a False Negative costs human lives, RECALL (Sensitivity) is the primary
    optimizing metric for early warning classification systems.
    Recall = True Positives / (True Positives + False Negatives).
    ============================================================================
    """

    print("\n" + "=" * 60)
    print("                EVALUATION COMPARISON REPORT")
    print("=" * 60)
    print(f"{'Metric':<20} | {'Logistic Regression':<20} | {'XGBoost Classifier':<20}")
    print("-" * 60)
    print(f"{'Precision':<20} | {lr_prec:<20.4f} | {xgb_prec:<20.4f}")
    print(f"{'Recall (Primary)':<20} | {lr_rec:<20.4f} | {xgb_rec:<20.4f}")
    print(f"{'F1 Score':<20} | {lr_f1:<20.4f} | {xgb_f1:<20.4f}")
    print(f"{'ROC-AUC':<20} | {lr_auc:<20.4f} | {xgb_auc:<20.4f}")
    print("=" * 60)

    # Feature Importance Breakdown for XGBoost
    importances = xgb_model.feature_importances_
    feat_imp = pd.Series(importances, index=FEATURE_COLUMNS).sort_values(ascending=False)
    logger.info("\n--- XGBoost Feature Importances ---")
    for feat, imp in feat_imp.items():
        logger.info(f"  {feat:<35}: {imp:.4f} ({imp*100:.1f}%)")

    # --------------------------------------------------------------------------
    # Save Model Artifact to backend/models/
    # --------------------------------------------------------------------------
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    model_filepath = os.path.join(models_dir, "landslide_xgb_model.joblib")

    artifact = {
        "model": xgb_model,
        "baseline_model": lr_model,
        "scaler": scaler,
        "feature_names": FEATURE_COLUMNS,
        "feature_importances": feat_imp.to_dict(),
        "metrics": {
            "xgboost": {"precision": xgb_prec, "recall": xgb_rec, "f1": xgb_f1, "roc_auc": xgb_auc},
            "logistic_regression": {"precision": lr_prec, "recall": lr_rec, "f1": lr_f1, "roc_auc": lr_auc}
        },
        "is_synthetic": True,
        "notes": "Trained on synthetic domain-informed dataset for pipeline architecture demonstration."
    }

    joblib.dump(artifact, model_filepath)
    logger.info(f"\nSaved trained model artifact successfully to: {model_filepath}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Flood-Flash Landslide Risk ML Model")
    parser.add_argument("--csv-path", type=str, default=None, help="Optional path to real CSV training dataset")
    args = parser.parse_args()

    train_and_evaluate(args.csv_path)

