# Ready-to-Upload Test Models for ModelProof

These trained models are ready for testing on the **Register Model** page (`/register`):

---

### Option 1: Financial Fraud Detector (Classification) — Recommended
- **File to upload**: `sample_models/fraud_detector_rf.joblib`
- **File size**: ~178 KB
- **Model Name**: `FraudSentinel-RF`
- **Version**: `v1.0`
- **ML Framework**: `Random Forest` (or Scikit-Learn)
- **Task / Model Type**: `Classification`
- **License Price (ETH)**: `0.04`
- **Primary Use Case**: `Real-time credit card and transaction anomaly fraud screening`
- **Description**: `Ensemble Random Forest classifier trained on 6 financial indicators to classify suspicious transactions with low false-positive rates.`
- **Expected SHA-256 Hash**: `0x41072a044937425a6e0e13f7518b67e15d01683cc3116722823307ea565db7bb`

---

### Option 2: Real Estate Valuation Model (Regression)
- **File to upload**: `sample_models/housing_price_predictor.joblib`
- **File size**: ~63 KB
- **Model Name**: `MetroValuer-GBR`
- **Version**: `v1.0`
- **ML Framework**: `Scikit-Learn`
- **Task / Model Type**: `Regression`
- **License Price (ETH)**: `0.025`
- **Primary Use Case**: `Automated property appraisal and urban valuation forecasting`
- **Description**: `Gradient boosting regression model predicting residential market prices using multi-feature urban spatial and economic indicators.`
- **Expected SHA-256 Hash**: `0x88ececad4643d5912d52d087e3e534a79b41c04b2cd18d5a4a30fde844f28028`
