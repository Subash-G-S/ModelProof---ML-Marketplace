# ModelProof
> **Decentralized AI/ML Model Ownership, Verification & Licensing Marketplace**

ModelProof provides a blockchain-backed ownership, provenance, and licensing layer for AI/ML models. It bridges machine learning evaluation with cryptographic Web3 guarantees:

- **Cryptographic Fingerprinting**: Deterministic SHA-256 digests identify each model weight artifact.
- **On-Chain Registry**: Immutable Ethereum records establish who created a model, when, and under what version.
- **Version Lineage Tree**: Historical model versions maintain their distinct fingerprints without overwriting prior records.
- **Trustless Licensing**: Buyers acquire 30-day licenses using ETH directly through smart contracts.
- **Automated Revenue Distribution**: 95% of payments flow to creators, and 5% to the protocol treasury via secure non-reentrant pull-payments.
- **Artifact Verification**: Anyone can upload an offline `.joblib` / `.pkl` / `.onnx` file to verify whether its bytes match the registered on-chain fingerprint.
- **ModelProof AI Assistant**: Conversational discovery engine matching user needs against verified models using real evaluation metrics.

> **Key Architectural Principle**: Blockchain proves ownership, registration, version history, and licensing transactions. AI/ML evaluates model accuracy, R², and classification metrics. ModelProof maintains strict separation between these layers.

---

## Architecture

```
                    ┌─────────────────────────────────┐
                    │  React + Vite Frontend (Viem)  │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────┴─────────────────┐
                    │        Web3 / MetaMask          │
                    └───────────────┬─────────────────┘
                                    ▼
                    ┌─────────────────────────────────┐
                    │    ModelProof Smart Contract    │
                    │   (Solidity ^0.8.24 + Hardhat)   │
                    └─────────────────────────────────┘
                                    ▲
                                    │
┌───────────────────────────────┐   │
│   FastAPI Python ML Engine    │───┤ (On-Chain Hash Anchor & Metadata)
│  (scikit-learn, XGBoost, etc.)│   │
└───────────────────────────────┘   ▼
                               ┌─────────┐
                               │  IPFS   │
                               └─────────┘
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React, Viem |
| **Blockchain** | Solidity `^0.8.24`, Hardhat, OpenZeppelin (`Ownable`, `ReentrancyGuard`), Sepolia / Localhost |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic, HTTPX |
| **Machine Learning** | scikit-learn, XGBoost, pandas, NumPy, joblib |
| **Storage** | IPFS (Pinata CID anchors) + On-Chain bytes32 / SHA-256 |
| **Wallet** | MetaMask + Integrated Multi-Role Wallet Simulator (Creator / Buyer / Admin) |

---

## Pre-trained Demo Models

ModelProof includes 3 fully trained models with genuine datasets and evaluation metrics in `ml/models/`:

1. **`AgriYield-XGBoost` (`v1.2`)**:
   - **Type**: Regression
   - **Framework**: XGBoost
   - **Task**: Crop yield prediction (rainfall, temperature, fertilizer, soil pH, sunlight)
   - **Metrics**: $R^2 = 0.955$, $\text{MAE} = 134.3\text{ kg/ha}$, $\text{RMSE} = 170.8$
   - **Price**: 0.05 ETH
   - **Artifact**: `ml/models/agri_yield_xgboost.joblib`
2. **`CropClassification-RandomForest` (`v1.0`)**:
   - **Type**: Classification
   - **Framework**: Random Forest (100 estimators)
   - **Task**: Agro-botanical cultivar suitability across 5 crops (N-P-K, pH, rainfall)
   - **Metrics**: Accuracy = 97.2%, Weighted F1 = 0.972
   - **Price**: 0.03 ETH
   - **Artifact**: `ml/models/crop_classification_rf.joblib`
3. **`ResumeClassifier` (`v2.0`)**:
   - **Type**: NLP Classification
   - **Framework**: Scikit-Learn (TF-IDF Vectorizer + Logistic Regression)
   - **Task**: Resume tech domain classification across 8 tech verticals
   - **Metrics**: Accuracy = 100.0%, 1,200 vocabulary features
   - **Price**: 0.04 ETH
   - **Artifact**: `ml/models/resume_classifier.joblib`

---

## Quick Start & Running Locally

### 1. Smart Contracts & Local Node

```powershell
cd contracts

# Run unit test suite (19 tests covering registration, versioning, licensing, fees)
npm test

# (Optional) Start local Ethereum node
npx hardhat node

# Deploy contract and export ABI & addresses to frontend:
npx hardhat run scripts/deploy.ts --network localhost
```

### 2. Python Backend (FastAPI ML Engine)

```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
- API root: [http://localhost:8000](http://localhost:8000)
- Swagger docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend (React + Vite)

```powershell
cd frontend
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## Verification & 20-Step Demo Workflow

The application supports the full 20-step demonstration lifecycle:

1. **Step 1–2**: Open [http://localhost:5173](http://localhost:5173). Connect Wallet (toggle between **Creator** and **Buyer** roles in the top navbar).
2. **Step 3–8**: Open **Creator Dashboard** (`/dashboard`) or **Register Model** (`/register`). Upload `agri_yield_xgboost.joblib`. View the real-time SHA-256 fingerprint generated client-side and via backend (`0xc9a9cbb4...`). Confirm transaction to register on-chain.
3. **Step 9–10**: Switch role to **Buyer** in the navbar to test cross-wallet interaction.
4. **Step 11–16**: Navigate to **Marketplace** (`/marketplace`). Select **AgriYield-XGBoost**. Click **Purchase License** (0.05 ETH). Step through the multi-stage transaction prompt (Submitted $\to$ Confirmed). Open **My Licenses** (`/licenses`) to view the active 30-day timer.
5. **Step 17–18**: Open **Verify Model** (`/verify`). Click **"Test Original AgriYield-XGBoost ✓"**.
   - Result: **`VERIFIED MODEL ✓ - ORIGINAL FILE MATCH`** (Uploaded SHA-256 matches on-chain anchor).
6. **Step 19–20**: Click **"Test Modified / Tampered Model ❌"**.
   - Result: **`NOT VERIFIED ❌ - HASH MISMATCH`** (Proof of tampering).

---

## Smart Contract Security Highlights

- **`Ownable` & Access Control**: Only creators can create versions of their models or deactivate them. Only owners can adjust platform fees (capped at 20%).
- **Reentrancy Protection**: Uses OpenZeppelin `ReentrancyGuard` across `purchaseLicense` and `withdrawEarnings`.
- **Pull Payment Pattern**: Earnings are accrued to `pendingBalances` and withdrawn via `withdrawEarnings()`, preventing denial-of-service fallback attacks.
- **No Self-Licensing**: Enforces `require(creator != msg.sender)` on license purchases.
- **30-Day Expiry Guarantee**: Verified on-chain using `block.timestamp < expiry`.
