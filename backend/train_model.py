from typing import Dict, Any, List
import os
import joblib
import numpy as np
import pandas as pd
import logging
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from xgboost import XGBClassifier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("train_model")

def generate_synthetic_dataset(num_samples: int = 12000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)

    # 1. Feature sampling
    r1 = np.random.exponential(scale=8.0, size=num_samples)
    r1 = np.clip(r1, 0.0, 110.0)

    r24 = r1 * np.random.uniform(1.5, 5.0, size=num_samples) + np.random.exponential(scale=20.0, size=num_samples)
    r24 = np.clip(r24, 0.0, 320.0)

    r72 = r24 * np.random.uniform(1.2, 2.5, size=num_samples) + np.random.exponential(scale=35.0, size=num_samples)
    r72 = np.clip(r72, 0.0, 500.0)

    soil_moisture = np.random.uniform(15.0, 95.0, size=num_samples)
    slope = np.random.uniform(5.0, 55.0, size=num_samples)
    historical_incidents = np.random.poisson(lam=2.5, size=num_samples)
    historical_incidents = np.clip(historical_incidents, 0, 10)
    days_dry = np.random.geometric(p=0.3, size=num_samples) - 1
    days_dry = np.clip(days_dry, 0, 14)

    # 2. Continuous latent hazard score Z
    z = (
        0.012 * r72 +
        0.025 * r24 +
        0.040 * r1 +
        0.035 * (soil_moisture - 30.0) +
        0.045 * (slope - 25.0) +
        0.300 * historical_incidents -
        0.200 * days_dry -
        3.5
    )

    # 3. Add realistic continuous noise for decision boundary overlap
    latent_noise = np.random.normal(loc=0.0, scale=1.4, size=num_samples)
    z_noisy = z + latent_noise
    prob_true = 1.0 / (1.0 + np.exp(-z_noisy))

    # Bernoulli sample targets with noise near boundary
    y = (np.random.rand(num_samples) < prob_true).astype(int)

    # Introduce additional label noise (~10%) near boundary |z| < 0.7 for non-separable overlap
    boundary_mask = np.abs(z) < 0.7
    flip_indices = np.where(boundary_mask)[0]
    flip_sample = np.random.choice(flip_indices, size=int(len(flip_indices) * 0.15), replace=False)
    y[flip_sample] = 1 - y[flip_sample]

    df = pd.DataFrame({
        "rainfall_1h_mm": r1,
        "rainfall_24h_mm": r24,
        "rainfall_72h_mm": r72,
        "soil_moisture_pct": soil_moisture,
        "slope_angle_deg": slope,
        "historical_incident_count_in_ward": historical_incidents,
        "days_since_last_rain": days_dry,
        "target": y
    })

    return df

def analyze_probability_distribution(probs: np.ndarray, title: str) -> Dict[str, int]:
    bins = {
        "0.00-0.10 (Very Low)": int(np.sum((probs >= 0.0) & (probs < 0.10))),
        "0.10-0.30 (Low)": int(np.sum((probs >= 0.10) & (probs < 0.30))),
        "0.30-0.70 (Moderate/Ambiguous)": int(np.sum((probs >= 0.30) & (probs <= 0.70))),
        "0.70-0.90 (High)": int(np.sum((probs > 0.70) & (probs <= 0.90))),
        "0.90-1.00 (Very High)": int(np.sum((probs > 0.90) & (probs <= 1.00))),
    }
    logger.info(f"\n--- {title} ---")
    for k, v in bins.items():
        pct = (v / len(probs)) * 100.0
        logger.info(f"  {k:30s}: {v:5d} ({pct:5.1f}%)")
    return bins

def train_and_calibrate():
    logger.info("Generating realistic noisy synthetic dataset...")
    df = generate_synthetic_dataset(num_samples=12000, random_seed=42)

    feature_names = [
        "rainfall_1h_mm",
        "rainfall_24h_mm",
        "rainfall_72h_mm",
        "soil_moisture_pct",
        "slope_angle_deg",
        "historical_incident_count_in_ward",
        "days_since_last_rain"
    ]

    X = df[feature_names]
    y = df["target"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # 1. Base XGBoost model
    base_xgb = XGBClassifier(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric="logloss"
    )
    base_xgb.fit(X_train, y_train)

    uncalibrated_probs = base_xgb.predict_proba(X_test)[:, 1]
    logger.info("Evaluating Uncalibrated Base XGBoost Model...")
    analyze_probability_distribution(uncalibrated_probs, "Uncalibrated Probability Distribution")

    # 2. Probability Calibration via CalibratedClassifierCV (Sigmoid / Platt Scaling)
    calibrated_model = CalibratedClassifierCV(
        estimator=base_xgb,
        method="sigmoid",
        cv=5
    )
    calibrated_model.fit(X_train, y_train)

    calibrated_probs = calibrated_model.predict_proba(X_test)[:, 1]
    logger.info("Evaluating Calibrated XGBoost Model (CalibratedClassifierCV - Sigmoid)...")
    analyze_probability_distribution(calibrated_probs, "Calibrated Probability Distribution")

    # Metrics evaluation
    y_pred = (calibrated_probs >= 0.5).astype(int)
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, calibrated_probs))

    metrics_summary = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "dataset_size": 12000,
        "calibration": "CalibratedClassifierCV (Sigmoid)",
        "model_type": "XGBoost Classifier + Platt Scaling"
    }

    logger.info("\n" + "="*50)
    logger.info("       CALIBRATED ML MODEL PERFORMANCE METRICS")
    logger.info("="*50)
    logger.info(f"  Accuracy  : {metrics_summary['accuracy']*100:.2f}% ({metrics_summary['accuracy']})")
    logger.info(f"  Precision : {metrics_summary['precision']*100:.2f}% ({metrics_summary['precision']})")
    logger.info(f"  Recall    : {metrics_summary['recall']*100:.2f}% ({metrics_summary['recall']})")
    logger.info(f"  F1-Score  : {metrics_summary['f1_score']*100:.2f}% ({metrics_summary['f1_score']})")
    logger.info(f"  ROC-AUC   : {metrics_summary['roc_auc']:.4f}")
    logger.info("="*50 + "\n")

    # Extract feature importances from base_xgb
    importances = base_xgb.feature_importances_
    feat_imp_dict = {name: float(imp) for name, imp in zip(feature_names, importances)}

    artifact = {
        "model": calibrated_model,
        "feature_names": feature_names,
        "feature_importances": feat_imp_dict,
        "metrics": metrics_summary
    }

    output_paths = [
        os.path.join(os.path.dirname(__file__), "app", "ml", "landslide_xgb_model.joblib"),
        os.path.join(os.path.dirname(__file__), "models", "landslide_xgb_model.joblib")
    ]

    for p in output_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        joblib.dump(artifact, p)
        logger.info(f"Successfully saved calibrated model artifact to {p}")

if __name__ == "__main__":
    train_and_calibrate()
