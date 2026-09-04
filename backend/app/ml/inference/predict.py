import os
import joblib
import numpy as np
import pandas as pd

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ml", "models"))
FLOOD_MODEL_PATH = os.path.join(MODELS_DIR, "flash_flood_model.joblib")
LANDSLIDE_MODEL_PATH = os.path.join(MODELS_DIR, "landslide_model.joblib")

_flood_model_data = None
_landslide_model_data = None

def load_models():
    global _flood_model_data, _landslide_model_data
    if os.path.exists(FLOOD_MODEL_PATH):
        try:
            _flood_model_data = joblib.load(FLOOD_MODEL_PATH)
        except Exception as e:
            print(f"Warning: Could not load flood model: {e}")
            _flood_model_data = None
            
    if os.path.exists(LANDSLIDE_MODEL_PATH):
        try:
            _landslide_model_data = joblib.load(LANDSLIDE_MODEL_PATH)
        except Exception as e:
            print(f"Warning: Could not load landslide model: {e}")
            _landslide_model_data = None

load_models()

def predict_flash_flood(features_dict: dict) -> float:
    """Predict flash flood probability using trained ML model or physics fallback."""
    global _flood_model_data
    if _flood_model_data and 'model' in _flood_model_data:
        try:
            feature_names = _flood_model_data['features']
            input_df = pd.DataFrame([{f: features_dict.get(f, 0.0) for f in feature_names}])
            prob = float(_flood_model_data['model'].predict_proba(input_df)[0][1])
            return round(prob, 4)
        except Exception as e:
            print(f"Inference error in flood model: {e}")

    # Fallback Hydrological Physics Formula
    r24 = features_dict.get('rainfall_24h', 0.0)
    r3 = features_dict.get('rainfall_3h', 0.0)
    dist = features_dict.get('distance_to_river', 1000.0)
    dd = features_dict.get('drainage_density', 2.0)
    hist = features_dict.get('historical_flood_freq', 1.0)

    score = (
        0.35 * (r24 / 150.0) +
        0.25 * (r3 / 40.0) +
        0.20 * (1.0 - min(dist / 1500.0, 1.0)) +
        0.10 * (dd / 4.0) +
        0.10 * (hist / 5.0)
    )
    return round(float(np.clip(score, 0.05, 0.98)), 4)

def predict_landslide(features_dict: dict) -> float:
    """Predict landslide susceptibility using trained ML model or physics fallback."""
    global _landslide_model_data
    if _landslide_model_data and 'model' in _landslide_model_data:
        try:
            feature_names = _landslide_model_data['features']
            input_df = pd.DataFrame([{f: features_dict.get(f, 0.0) for f in feature_names}])
            prob = float(_landslide_model_data['model'].predict_proba(input_df)[0][1])
            return round(prob, 4)
        except Exception as e:
            print(f"Inference error in landslide model: {e}")

    # Fallback Terrain Failure Physics Formula
    slope = features_dict.get('slope', 20.0)
    r24 = features_dict.get('rainfall_24h', 0.0)
    antecedent = features_dict.get('antecedent_rainfall', 0.0)
    roughness = features_dict.get('terrain_roughness', 0.5)
    hist = features_dict.get('historical_landslide_freq', 2.0)

    score = (
        0.35 * (slope / 45.0) +
        0.30 * (r24 / 120.0) +
        0.15 * (antecedent / 100.0) +
        0.10 * roughness +
        0.10 * (hist / 6.0)
    )
    return round(float(np.clip(score, 0.05, 0.98)), 4)
