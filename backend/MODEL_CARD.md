# 🤖 Model Card: Flood-Flash Landslide Risk Classifier

## Model Overview
- **Model Architecture**: Calibrated XGBoost Gradient Boosted Decision Tree Classifier (`CalibratedClassifierCV` + `xgboost.XGBClassifier`) with Sigmoid / Platt scaling probability calibration.
- **Version**: 1.1.0 (Calibrated & Real-Rainfall Enabled)
- **Task**: Predict landslide hazard probability $P \in [0, 1]$ across hilly terrain wards based on hydrological, meteorological, and topographical features.
- **Output**:
  - `risk_score`: Continuous numerical score from `0.0` to `100.0` ($P \times 100$).
  - `risk_level`: Categorical 4-tier hazard classification (`Safe < 25%`, `Watch 25-50%`, `Warning 50-75%`, `Critical ≥ 75%`).
  - `contributing_factors`: Feature importance weights & data provenance logs explaining top hazard drivers.

---

## 📊 Training Data, Calibration & Real-Data Provenance

> [!IMPORTANT]
> **REAL RAINFALL VS SYNTHETIC INPUT DISTINCTION**
> - **Real Rainfall Data**: Ingested in near-real-time / forecast mode via **GPM IMERG (NASA/JAXA)**, **GSMaP (JAXA)**, and **GFS (NOAA NOMADS)** via `rainfall_data_service.py`.
> - **Synthetic Inputs**: Ground soil moisture (`soil_moisture_pct`) and terrain slope (`slope_angle_deg`) remain derived from ward telemetry baselines because real-time ground soil moisture sensor networks are not deployed across all remote hill locations.
> - **Production Retraining Requirement**: For operational field deployment, the model should be retrained on official GSI (Geological Survey of India) historical landslide records and IMD station rain-gauge archives.

### Features Included
1. `rainfall_1h_mm`: Short-burst rainfall intensity (mm/h) [Real-data backed].
2. `rainfall_24h_mm`: 24-hour cumulative precipitation (mm) [Real-data backed].
3. `rainfall_72h_mm`: 72-hour cumulative precipitation (mm) [Real-data backed].
4. `soil_moisture_pct`: Soil moisture volumetric water content (% VWC) [Ward baseline / Synthetic].
5. `slope_angle_deg`: Terrain slope gradient (degrees) [Ward baseline / Synthetic].
6. `historical_incident_count_in_ward`: Past landslide breaches recorded in ward.
7. `days_since_last_rain`: Dry window duration prior to storm event.

---

## ⚖️ Probability Calibration & Overconfidence Fix

To address model overconfidence and extreme probability outputs (near 0% or 100%) on moderate/ambiguous inputs:
1. **Decision Boundary Noise Overlap**: The synthetic dataset generation (`backend/train_model.py`) includes continuous logistic Gaussian noise and label overlap near boundary regions ($|Z| < 0.7$), preventing artificially hyper-separable classes.
2. **Platt Scaling Calibration**: Post-hoc probability calibration is applied using `sklearn.calibration.CalibratedClassifierCV(estimator=XGBClassifier(...), method='sigmoid', cv=5)`.
3. **Extreme Probability Sanity Warning**: The inference engine (`ml_risk_engine.py`) logs a warning flag whenever predicted probability exceeds `0.97` or falls below `0.03`.

### Before vs. After Calibration Probability Distribution (2,400 Test Set Samples)

| Probability Bin | Hazard Tier | Raw XGBoost (Uncalibrated) | Calibrated XGBoost (`CalibratedClassifierCV`) |
| :--- | :--- | :--- | :--- |
| **0.00 – 0.10** | Very Low | 23 (1.0%) | **6 (0.2%)** |
| **0.10 – 0.30** | Low | 379 (15.8%) | **449 (18.7%)** |
| **0.30 – 0.70** | Moderate / Ambiguous | 1,051 (43.8%) | **915 (38.1%)** |
| **0.70 – 0.90** | High | 596 (24.8%) | **791 (33.0%)** |
| **0.90 – 1.00** | Very High | 351 (14.6%) | **239 (10.0%)** |

*Result*: Predictions now smoothly span the probability spectrum across moderate inputs without clustering at 0.0 or 1.0.

---

## ⛰️ Geotechnical Infinite-Slope Stability Model (Factor of Safety)

The risk engines compute a deterministic geotechnical Factor of Safety (FoS) based on the **Infinite-Slope Model**:

$$\text{FoS} = \frac{c + (\gamma - \gamma_w \cdot m) \cdot \cos^2(\beta) \cdot \tan(\phi)}{\gamma \cdot \sin(\beta) \cdot \cos(\beta)}$$

Where:
- $c$: Soil cohesion ($\text{kPa}$).
- $\gamma$: Soil unit weight ($\text{kN/m}^3$).
- $\gamma_w$: Water unit weight ($9.81\ \text{kN/m}^3$).
- $m$: Pore pressure ratio derived from `soil_moisture_pct` ($m = \text{soil\_moisture\_pct} / 100.0$).
- $\beta$: Slope angle in radians ($\text{radians}(\text{slope\_angle\_deg})$).
- $\phi$: Soil internal friction angle in radians ($\text{radians}(\text{soil\_friction\_angle\_deg})$).

> [!NOTE]
> **ESTIMATED GEOTECHNICAL DEFAULTS**
> The values used for soil cohesion ($c = 12.0\ \text{kPa}$), internal friction angle ($\phi = 30.0^\circ$), and soil unit weight ($\gamma = 19.0\ \text{kN/m}^3$) are estimated default parameters representative of Himalayan colluvium soil deposits.

---

## 🎯 Model Performance & Metric Evaluation

### Metric Prioritization: Why Recall Matters Most
In natural disaster early warning systems, missing a real landslide (False Negative) can be catastrophic. Therefore, **Recall (Sensitivity)** is prioritized.

### Calibrated Model Evaluation Metrics (80/20 Train/Test Split)

| Metric | Score |
| :--- | :--- |
| **Accuracy** | 0.7125 |
| **Precision** | 0.7437 |
| **Recall (Sensitivity)** | **0.7786** |
| **F1-Score** | 0.7607 |
| **ROC-AUC** | **0.7929** |

---

## ⚠️ Known Limitations & Scope Exclusions

1. **WRF (Weather Research and Forecasting) Numerical Model Scope Limitation**: Running WRF requires operating an actual HPC numerical weather prediction atmospheric physics model, which is out of scope for this application. High-resolution forecast fields are sourced directly from NOAA's public GFS NOMADS server.
2. **Ground Soil Sensor Absence**: Soil moisture and slope inputs remain derived from ward baselines and synthetic interpolation due to the lack of ground soil moisture sensor infrastructure across all locations.
3. **Extreme Cloudburst Safeguards**: Rule-based fallback safeguards activate if short-burst rainfall rates exceed 120 mm/h.

---

## 🛤️ Roadmap to Production Readiness

1. **Ingest Real Historical Records**: Retrain on official GSI Bhukosh landslide inventories.
2. **Integrate Ground Soil Sensors**: Upgrade ward baselines with IoT telemetry as sensor networks deploy.
3. **Continuous Retraining Pipeline**: Automate weekly retraining on live IMD and satellite archives.

