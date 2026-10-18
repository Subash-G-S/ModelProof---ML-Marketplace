import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useModels } from "../context/ModelContext";
import { useWallet } from "../context/WalletContext";
import { analyzeModelFile, computeClientSha256 } from "../services/apiService";
import {
  UploadCloud,
  KeyRound,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import { TransactionModal, TxStep } from "../components/TransactionModal";

export const RegisterModel: React.FC = () => {
  const navigate = useNavigate();
  const { registerModel } = useModels();
  const { address, isConnected, connectWallet } = useWallet();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState("XGBoost");
  const [modelType, setModelType] = useState("Regression");
  const [version, setVersion] = useState("v1.0");
  const [licensePriceEth, setLicensePriceEth] = useState("0.05");
  const [useCase, setUseCase] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelHash, setModelHash] = useState<string>("");
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [analysisSummary, setAnalysisSummary] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsHashing(true);
    setAnalysisSummary("");

    try {
      // Analyze artifact and compute real SHA-256
      const analysis = await analyzeModelFile(file);
      setModelHash(analysis.sha256_hash);
      setAnalysisSummary(analysis.summary);

      if (analysis.framework && analysis.framework !== "Unknown") {
        setFramework(analysis.framework.includes("XGB") ? "XGBoost" : analysis.framework);
      }
    } catch (e) {
      // Fallback client hashing
      const clientHash = await computeClientSha256(file);
      setModelHash(clientHash);
      setAnalysisSummary("SHA-256 fingerprint computed client-side.");
    } finally {
      setIsHashing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!name.trim()) {
      alert("Please enter a model name.");
      return;
    }

    if (!modelHash) {
      alert("Please upload a model file to generate its cryptographic fingerprint.");
      return;
    }

    try {
      setIsModalOpen(true);
      setTxStep("wallet_prompt");
      setStatusMessage("Please review and sign the registration transaction in MetaMask.");

      const simulatedCid = `bafybei${Math.random().toString(36).substring(2, 12)}mp${Date.now().toString(36)}`;
      const result = await registerModel(
        {
          creator: address || "0x24522a62C4aa130225D415Ee2b222fd473E90B83",
          name,
          description,
          framework,
          version,
          modelType,
          modelHash,
          ipfsCid: simulatedCid,
          licensePriceEth,
          useCase,
          filename: selectedFile?.name || "model_weights.joblib",
          filesize: selectedFile?.size || 1024,
          metrics: {
            dataset_size: "Custom Dataset",
            training_time: "Verified Run",
          },
        },
        (status, hash) => {
          if (hash) {
            setTxHash(hash);
            setTxStep("submitted");
          }
          setStatusMessage(status);
        }
      );

      setTxHash(result.txHash);
      setTxStep("confirmed");
    } catch (err: any) {
      setTxStep("error");
      setErrorMsg(err.message || "Registration failed or rejected in MetaMask.");
    }
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Register AI/ML Model
        </h1>
        <p className="text-sm text-mp-text-muted mt-1">
          Cryptographically anchor your model weights to Ethereum with immutable ownership and customizable licensing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Artifact Upload & Hashing Zone */}
        <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-mp-accent" />
            <span>1. Model Artifact Upload & SHA-256 Fingerprinting</span>
          </h2>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              selectedFile
                ? "border-mp-accent/60 bg-mp-accent/5"
                : "border-mp-border hover:border-mp-accent/40 bg-mp-bg/60"
            }`}
          >
            <input
              type="file"
              id="model-file-upload"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center pointer-events-none">
              {isHashing ? (
                <Loader2 className="h-10 w-10 text-mp-accent animate-spin mb-3" />
              ) : selectedFile ? (
                <FileCode className="h-10 w-10 text-mp-accent-light mb-3" />
              ) : (
                <UploadCloud className="h-10 w-10 text-mp-text-dim mb-3" />
              )}

              <p className="text-sm font-semibold text-white">
                {selectedFile ? selectedFile.name : "Drag & drop your model file (.joblib, .pkl, .onnx, .pt, .h5)"}
              </p>
              <p className="text-xs text-mp-text-muted mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready for on-chain registration`
                  : "or browse from local disk"}
              </p>
            </div>
          </div>

          {/* Fingerprint Display */}
          {modelHash && (
            <div className="rounded-xl border border-mp-border bg-mp-bg/90 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-mp-accent" />
                  <span>MODEL FINGERPRINT (SHA-256)</span>
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Calculated</span>
                </span>
              </div>
              <div className="text-xs font-mono text-mp-accent-light break-all p-2 rounded bg-mp-surface border border-mp-border">
                {modelHash}
              </div>
              {analysisSummary && (
                <p className="text-[11px] text-mp-text-muted italic pt-1">{analysisSummary}</p>
              )}
            </div>
          )}
        </div>

        {/* Model Metadata */}
        <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">2. Model Metadata & Specifications</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mp-text">Model Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. AgriYield-XGBoost"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-mp-bg border border-mp-border text-xs text-mp-text placeholder:text-mp-text-dim focus:outline-none focus:border-mp-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mp-text">Version *</label>
              <input
                type="text"
                required
                placeholder="e.g. v1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-mp-bg border border-mp-border text-xs text-mp-text placeholder:text-mp-text-dim focus:outline-none focus:border-mp-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-mp-text">Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe the architecture, training dataset, and performance capabilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mp-bg border border-mp-border text-xs text-mp-text placeholder:text-mp-text-dim focus:outline-none focus:border-mp-accent"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mp-text">ML Framework</label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-mp-bg border border-mp-border text-xs text-mp-text focus:outline-none focus:border-mp-accent"
              >
                <option value="XGBoost">XGBoost</option>
                <option value="Random Forest">Random Forest</option>
                <option value="Scikit-Learn">Scikit-Learn</option>
                <option value="PyTorch">PyTorch</option>
                <option value="TensorFlow">TensorFlow</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mp-text">Task / Model Type</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-mp-bg border border-mp-border text-xs text-mp-text focus:outline-none focus:border-mp-accent"
              >
                <option value="Regression">Regression</option>
                <option value="Classification">Classification</option>
                <option value="NLP Classification">NLP Classification</option>
                <option value="Computer Vision">Computer Vision</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-mp-text">Primary Use Case</label>
            <input
              type="text"
              placeholder="e.g. Precision agriculture crop yield prediction"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mp-bg border border-mp-border text-xs text-mp-text placeholder:text-mp-text-dim focus:outline-none focus:border-mp-accent"
            />
          </div>
        </div>

        {/* Licensing Parameters */}
        <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">3. Licensing Parameters & Price</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mp-text">License Price (ETH) *</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={licensePriceEth}
                onChange={(e) => setLicensePriceEth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-mp-bg border border-mp-border text-xs text-mp-text font-mono focus:outline-none focus:border-mp-accent"
              />
              <span className="text-[11px] text-emerald-400">
                Admin protocol fee: 2% • Creator earnings: 98%
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mp-text">Standard Duration</label>
              <input
                type="text"
                disabled
                value="30 Days (Smart Contract Standard)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-mp-bg/50 border border-mp-border text-xs text-mp-text-muted cursor-not-allowed"
              />
              <span className="text-[11px] text-mp-text-dim">
                Enforced immutably by block.timestamp on-chain
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-sm font-semibold shadow-xl shadow-mp-accent/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Confirm & Register Model on Ethereum</span>
          </button>
        </div>
      </form>

      <TransactionModal
        isOpen={isModalOpen}
        step={txStep}
        txHash={txHash}
        errorMessage={errorMsg}
        statusMessage={statusMessage}
        title="Register Model on Blockchain"
        onClose={() => {
          setIsModalOpen(false);
          if (txStep === "confirmed") {
            navigate("/marketplace");
          }
        }}
      />
    </div>
  );
};
