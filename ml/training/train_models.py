import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def generate_synthetic_disaster_dataset(num_samples=2500, random_seed=42):
    np.random.seed(random_seed)
    
    # 1. Rainfall Features
    rainfall_1h = np.random.exponential(scale=8.0, size=num_samples)
    rainfall_3h = rainfall_1h * np.random.uniform(1.5, 2.5, size=num_samples)
    rainfall_6h = rainfall_3h * np.random.uniform(1.2, 1.8, size=num_samples)
    rainfall_12h = rainfall_6h * np.random.uniform(1.1, 1.5, size=num_samples)
    rainfall_24h = rainfall_12h * np.random.uniform(1.1, 1.4, size=num_samples)
    rainfall_72h = rainfall_24h + np.random.exponential(scale=20.0, size=num_samples)
    rainfall_intensity = rainfall_1h / 1.0 # mm/hr
    antecedent_rainfall = rainfall_72h - rainfall_24h
    
    # 2. Terrain Features (Himalayan Hilly District profile)
    elevation = np.random.uniform(500, 3200, size=num_samples) # meters
    slope = np.random.uniform(5, 55, size=num_samples) # degrees
    aspect = np.random.uniform(0, 360, size=num_samples)
    terrain_roughness = np.random.uniform(0.1, 0.9, size=num_samples)
    drainage_density = np.random.uniform(0.5, 4.5, size=num_samples) # km/km2
    distance_to_river = np.random.uniform(20, 2500, size=num_samples) # meters
    land_cover_code = np.random.choice([1, 2, 3, 4], size=num_samples, p=[0.4, 0.3, 0.2, 0.1]) # Forest, Agriculture, Settlement, Barren
    historical_flood_freq = np.random.poisson(lam=1.5, size=num_samples)
    historical_landslide_freq = np.random.poisson(lam=2.0, size=num_samples)

    # 3. Flash Flood Target Physics Formula
    # High 24h & 3h rainfall, high drainage density, low distance to river, lower elevation basin
    flood_score = (
        0.35 * (rainfall_24h / 150.0) +
        0.25 * (rainfall_3h / 40.0) +
        0.20 * (1.0 - np.clip(distance_to_river / 1500.0, 0, 1)) +
        0.10 * (drainage_density / 4.0) +
        0.10 * (historical_flood_freq / 5.0) +
        np.random.normal(0, 0.08, size=num_samples)
    )
    flood_event = (flood_score > 0.45).astype(int)

    # 4. Landslide Target Physics Formula
    # High slope, high 24h & antecedent rainfall, steep elevation, barren/settlement land, terrain roughness
    landslide_score = (
        0.35 * (slope / 45.0) +
        0.30 * (rainfall_24h / 120.0) +
        0.15 * (antecedent_rainfall / 100.0) +
        0.10 * terrain_roughness +
        0.10 * (historical_landslide_freq / 6.0) +
        np.random.normal(0, 0.08, size=num_samples)
    )
    landslide_event = (landslide_score > 0.42).astype(int)

    df = pd.DataFrame({
        'rainfall_1h': rainfall_1h,
        'rainfall_3h': rainfall_3h,
        'rainfall_6h': rainfall_6h,
        'rainfall_12h': rainfall_12h,
        'rainfall_24h': rainfall_24h,
        'rainfall_72h': rainfall_72h,
        'rainfall_intensity': rainfall_intensity,
        'antecedent_rainfall': antecedent_rainfall,
        'elevation': elevation,
        'slope': slope,
        'aspect': aspect,
        'terrain_roughness': terrain_roughness,
        'drainage_density': drainage_density,
        'distance_to_river': distance_to_river,
        'land_cover_code': land_cover_code,
        'historical_flood_freq': historical_flood_freq,
        'historical_landslide_freq': historical_landslide_freq,
        'flood_event': flood_event,
        'landslide_event': landslide_event
    })
    
    return df

def train_and_evaluate_models():
    print("=== Generating synthetic dataset based on Himalayan hydrological dynamics ===")
    df = generate_synthetic_disaster_dataset()

    flood_features = [
        'rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h',
        'rainfall_72h', 'rainfall_intensity', 'antecedent_rainfall',
        'drainage_density', 'distance_to_river', 'elevation', 'slope'
    ]
    
    landslide_features = [
        'slope', 'elevation', 'rainfall_24h', 'rainfall_intensity', 'antecedent_rainfall',
        'terrain_roughness', 'drainage_density', 'distance_to_river',
        'historical_landslide_freq', 'land_cover_code'
    ]

    metrics_report = {'flood': {}, 'landslide': {}}

    # ==================== 1. FLASH FLOOD MODEL ====================
    print("\n--- Training Flash Flood Prediction Models ---")
    X_f = df[flood_features]
    y_f = df['flood_event']
    X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(X_f, y_f, test_size=0.2, random_state=42, stratify=y_f)

    models_f = {
        'LogisticRegression': LogisticRegression(max_iter=1000, class_weight='balanced'),
        'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced'),
        'XGBoost': XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
    }

    best_f_model = None
    best_f_score = 0.0
    best_f_name = ""

    for name, model in models_f.items():
        model.fit(X_train_f, y_train_f)
        y_pred = model.predict(X_test_f)
        y_prob = model.predict_proba(X_test_f)[:, 1]

        p = precision_score(y_test_f, y_pred)
        r = recall_score(y_test_f, y_pred)
        f1 = f1_score(y_test_f, y_pred)
        auc = roc_auc_score(y_test_f, y_prob)

        metrics_report['flood'][name] = {
            'precision': round(float(p), 4),
            'recall': round(float(r), 4),
            'f1_score': round(float(f1), 4),
            'roc_auc': round(float(auc), 4),
            'confusion_matrix': confusion_matrix(y_test_f, y_pred).tolist()
        }

        print(f"   [{name}] Precision: {p:.4f} | Recall: {r:.4f} | F1: {f1:.4f} | ROC-AUC: {auc:.4f}")
        # Prioritize Recall for early warning disaster prevention
        if r > best_f_score:
            best_f_score = r
            best_f_model = model
            best_f_name = name

    print(f"Selected Flood Model: {best_f_name} (Recall: {best_f_score:.4f})")
    joblib.dump({
        'model': best_f_model,
        'model_name': best_f_name,
        'features': flood_features,
        'metrics': metrics_report['flood']
    }, os.path.join(MODELS_DIR, "flash_flood_model.joblib"))

    # ==================== 2. LANDSLIDE MODEL ====================
    print("\n--- Training Landslide Susceptibility Models ---")
    X_l = df[landslide_features]
    y_l = df['landslide_event']
    X_train_l, X_test_l, y_train_l, y_test_l = train_test_split(X_l, y_l, test_size=0.2, random_state=42, stratify=y_l)

    models_l = {
        'LogisticRegression': LogisticRegression(max_iter=1000, class_weight='balanced'),
        'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced'),
        'XGBoost': XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
    }

    best_l_model = None
    best_l_score = 0.0
    best_l_name = ""

    for name, model in models_l.items():
        model.fit(X_train_l, y_train_l)
        y_pred = model.predict(X_test_l)
        y_prob = model.predict_proba(X_test_l)[:, 1]

        p = precision_score(y_test_l, y_pred)
        r = recall_score(y_test_l, y_pred)
        f1 = f1_score(y_test_l, y_pred)
        auc = roc_auc_score(y_test_l, y_prob)

        metrics_report['landslide'][name] = {
            'precision': round(float(p), 4),
            'recall': round(float(r), 4),
            'f1_score': round(float(f1), 4),
            'roc_auc': round(float(auc), 4),
            'confusion_matrix': confusion_matrix(y_test_f, y_pred).tolist()
        }

        print(f"   [{name}] Precision: {p:.4f} | Recall: {r:.4f} | F1: {f1:.4f} | ROC-AUC: {auc:.4f}")
        if r > best_l_score:
            best_l_score = r
            best_l_model = model
            best_l_name = name

    print(f"Selected Landslide Model: {best_l_name} (Recall: {best_l_score:.4f})")
    joblib.dump({
        'model': best_l_model,
        'model_name': best_l_name,
        'features': landslide_features,
        'metrics': metrics_report['landslide']
    }, os.path.join(MODELS_DIR, "landslide_model.joblib"))

    # Save metrics report JSON
    with open(os.path.join(MODELS_DIR, "model_metrics.json"), "w") as f:
        json.dump(metrics_report, f, indent=2)

    print("\nMachine Learning models trained and serialized successfully!")

if __name__ == "__main__":
    train_and_evaluate_models()
