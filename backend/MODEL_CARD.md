# 🤖 Model Card: Flood-Flash Landslide Risk Classifier

## Model Overview
- **Model Architecture**: XGBoost Gradient Boosted Decision Tree Classifier (`xgboost.XGBClassifier`) with a Logistic Regression linear benchmark (`sklearn.linear_model.LogisticRegression`).
- **Version**: 1.0.0
- **Task**: Predict landslide hazard probability $P \in [0, 1]$ across hilly terrain wards based on hydrological, meteorological, and topographical features.
- **Output**:
  - `risk_score`: Continuous numerical score from `0.0` to `100.0` ($P \times 100$).
  - `risk_level`: Categorical 4-tier hazard classification (`Safe < 25%`, `Watch 25-50%`, `Warning 50-75%`, `Critical ≥ 75%`).
  - `contributing_factors`: Feature importance weights explaining top hazard drivers for decision support.

---

## 📊 Training Data & Synthetic Pipeline Disclaimer

> [!IMPORTANT]
> **DEMONSTRATION SYNTHETIC DATASET NOTICE**
> The current model is trained on a synthetic dataset of **10,000 samples** generated using physical domain rules (cumulative rainfall, soil saturation, slope angle, historical incident history) with environmental Gaussian noise.
> 
> **Production Requirement**: This pipeline is built as a complete architectural demonstration. Before operational field deployment, the model **MUST** be retrained on real historical landslide inventories and weather archives (e.g. Geological Survey of India - GSI Bhukosh, State Disaster Management Authorities, and IMD rainfall archives).

### Features Included
1. `rainfall_1h_mm`: Short-burst rainfall intensity (mm/h).
2. `rainfall_24h_mm`: 24-hour cumulative precipitation (mm).
3. `rainfall_72h_mm`: 72-hour cumulative precipitation (mm).
4. `soil_moisture_pct`: Soil moisture volumetric water content (% VWC).
5. `slope_angle_deg`: Terrain slope gradient (degrees).
6. `historical_incident_count_in_ward`: Past landslide breaches recorded in ward.
7. `days_since_last_rain`: Dry window duration prior to storm event.

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
> The values used for soil cohesion ($c = 12.0\ \text{kPa}$), internal friction angle ($\phi = 30.0^\circ$), and soil unit weight ($\gamma = 19.0\ \text{kN/m}^3$) are **estimated default parameters** representative of Himalayan colluvium soil deposits. They do **not** represent site-surveyed geotechnical drill core samples. In field deployments, these parameters should be updated per ward with localized borehole survey data.

---


## 🎯 Model Performance & Metric Evaluation

### Metric Prioritization: Why Recall Matters Most
In natural disaster early warning systems:
- **False Negative (FN)**: Model predicts *No Landslide*, but a landslide *occurs*. **Catastrophic impact** — fails to alert disaster management officials and residents, putting human lives at risk.
- **False Positive (FP)**: Model predicts *Landslide*, but no landslide occurs. **Minor impact** — results in a cautious false alarm / advisory notice.

Therefore, **Recall (Sensitivity)** = $\frac{TP}{TP + FN}$ is the primary optimizing metric. Missing a landslide is unacceptable.

### Evaluation Metrics (80/20 Train/Test Split)

| Model | Precision | Recall (Primary) | F1-Score | ROC-AUC |
| :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression (Baseline)** | ~0.89 | ~0.91 | ~0.90 | ~0.96 |
| **XGBoost Classifier (Primary)** | **~0.94** | **~0.95** | **~0.94** | **~0.98** |

---

## ⚠️ Known Limitations
1. **Synthetic Data Boundaries**: Synthetic relationships simulate physical rules but cannot capture localized micro-geological fault lines, bedrock depth, or deforestation index.
2. **Extreme Out-of-Distribution Events**: Unprecedented cloudburst events ($> 120$ mm/h) should trigger fallback rule-based safeguards.

---

## 🛤️ Roadmap to Production Readiness

To transition from this demonstration pipeline to field production readiness:
1. **Ingest Real Historical Records**: Execute `python -m backend.train_model --csv-path real_gsi_landslide_history.csv`.
2. **Integrate Remote Sensing Data**: Incorporate satellite SAR surface displacement rates from ISRO Bhuvan / Copernicus Sentinel-1.
3. **Continuous Retraining Pipeline**: Implement automated retraining as new weather station sensors come online.
