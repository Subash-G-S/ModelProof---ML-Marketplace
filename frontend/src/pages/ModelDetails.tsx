import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useModels } from "../context/ModelContext";
import { useWallet } from "../context/WalletContext";
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Clock,
  KeyRound,
  ArrowLeft,
  Coins,
  History,
  Layers,
  FileCode,
  Lock,
  Play,
  Terminal,
  Code2,
  RefreshCw,
  Zap,
  Check,
  AlertCircle,
  Download,
  Award,
  Sparkles,
} from "lucide-react";
import { TransactionModal, TxStep } from "../components/TransactionModal";
import { runModelInference } from "../services/apiService";

export const ModelDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    models,
    purchaseLicense,
    purchaseModelOwnership,
    hasActiveLicense,
    hasFullOwnership,
    deactivateModel,
    reactivateModel,
  } = useModels();
  const { address, isConnected, connectWallet, configuredAccounts, role, switchRole } = useWallet();

  const [copied, setCopied] = useState(false);
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"license" | "ownership">("ownership");

  const model = models.find((m) => m.modelId === Number(id));

  if (!model) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold text-white">Model Not Found</h2>
        <Link to="/marketplace" className="text-xs text-mp-accent-light hover:underline mt-2 inline-block">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isFullOwner = address ? hasFullOwnership(model.modelId, address) : false;
  const isLicensed = address ? (hasActiveLicense(model.modelId, address) || isFullOwner) : false;
  const isCreator = address
    ? model.creator.toLowerCase() === address.toLowerCase() ||
      Boolean(configuredAccounts.creator && configuredAccounts.creator.toLowerCase() === address.toLowerCase()) ||
      role === "creator"
    : role === "creator";
  const canAccessWeights = isLicensed || isCreator || role === "admin" || isFullOwner;

  const fullOwnershipPrice = (parseFloat(model.licensePriceEth) * 3).toFixed(4);
  const currentTierPrice = selectedTier === "ownership" ? fullOwnershipPrice : model.licensePriceEth;

  // Hosted Inference Playground state
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<"playground" | "python_api">("playground");
  const [inferenceInput, setInferenceInput] = useState<string>(() => {
    if (model.name.toLowerCase().includes("agri") || model.modelId === 1) {
      return JSON.stringify([600, 24, 120, 6.5, 8], null, 2);
    } else if (model.name.toLowerCase().includes("crop") || model.modelId === 2) {
      return JSON.stringify([80, 50, 40, 6.5, 650], null, 2);
    } else if (model.name.toLowerCase().includes("resume") || model.modelId === 3) {
      return JSON.stringify("Python Docker PostgreSQL Kubernetes AWS React software engineering", null, 2);
    }
    return JSON.stringify([10, 20, 30, 40, 50], null, 2);
  });
  const [inferenceResult, setInferenceResult] = useState<any>(null);
  const [isInferenceLoading, setIsInferenceLoading] = useState<boolean>(false);
  const [inferenceError, setInferenceError] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);

  const handleExecuteInference = async () => {
    if (!address) {
      await connectWallet();
      return;
    }
    setIsInferenceLoading(true);
    setInferenceError("");
    setInferenceResult(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(inferenceInput);
      } catch {
        parsed = inferenceInput;
      }
      const res = await runModelInference(model.modelId, address, parsed);
      if (!res.success) {
        setInferenceError(res.error || "Inference call failed");
      } else {
        setInferenceResult(res);
      }
    } catch (e: any) {
      setInferenceError(e.message || "Execution failed");
    } finally {
      setIsInferenceLoading(false);
    }
  };

  const handleCopyCode = () => {
    const code = `# ModelProof Python Inference Client
# Authenticated via your active on-chain license wallet
import requests

ENDPOINT = "http://localhost:8000/api/models/${model.modelId}/predict"
BUYER_WALLET = "${address || "0x022B8D7378982E11AF76Ad351C58D71501c15A60"}"

payload = {
    "licensee": BUYER_WALLET,
    "inputs": ${inferenceInput.trim()}
}

response = requests.post(ENDPOINT, json=payload)

if response.status_code == 200:
    data = response.json()
    print("✓ Inference Successful!")
    print(f"Prediction: {data['primary_result']}")
    print(f"Execution Latency: {data['latency_ms']} ms")
    print(f"Days Left on 30-Day License: {data['license_status']['days_remaining']} days")
elif response.status_code == 403:
    print("✗ 403 Forbidden: License expired or not found. Please renew on ModelProof.")
else:
    print(f"✗ Error ({response.status_code}): {response.text}")
`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(model.modelHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuy = async (tierOverride?: "license" | "ownership") => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    const tierToPurchase = tierOverride || selectedTier;

    try {
      setIsModalOpen(true);
      setTxStep("wallet_prompt");
      setStatusMessage("Please inspect and approve the transaction in MetaMask.");

      const isOwnership = tierToPurchase === "ownership";
      const buyFn = isOwnership ? purchaseModelOwnership : purchaseLicense;

      const result = await buyFn(model.modelId, (status, hash) => {
        if (hash) {
          setTxHash(hash);
          setTxStep("submitted");
        }
        setStatusMessage(status);
      });

      setTxHash(result.txHash);
      setTxStep("confirmed");
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || "Failed or rejected in MetaMask.");
    }
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs text-mp-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      {/* Main Model Card */}
      <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 sm:p-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-mp-surface-2 border border-mp-border text-mp-accent-light">
                {model.framework}
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-mp-bg border border-mp-border text-mp-text-muted">
                {model.modelType}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                <span>On-Chain Verified</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {model.name}
            </h1>
            <div className="text-xs text-mp-text-dim mt-1.5 font-mono flex items-center gap-2">
              <span>Creator:</span>
              <span className="text-mp-text">{model.creator}</span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-mp-text-dim">Acquisition Pricing</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white">
                {model.licensePriceEth} <span className="text-mp-accent-light text-xl">ETH</span>
              </span>
              <span className="text-xs text-mp-text-muted">(30-Day License)</span>
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-400 mt-1 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>{fullOwnershipPrice} ETH</span>
              <span className="text-mp-text-muted font-sans font-normal text-[11px]">• ModelProof Verified™ Full Ownership</span>
            </div>
            <span className="text-[11px] text-mp-text-dim mt-1">98% to Creator • 2% to Admin Protocol</span>
          </div>
        </div>

        {/* Description & Use Case */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Model Description</h3>
          <p className="text-xs sm:text-sm text-mp-text-muted leading-relaxed">
            {model.description}
          </p>
          {model.useCase && (
            <div className="p-3 rounded-xl bg-mp-bg/60 border border-mp-border/50 text-xs">
              <strong className="text-white">Primary Use Case: </strong>
              <span className="text-mp-text-muted">{model.useCase}</span>
            </div>
          )}
        </div>

        {/* Cryptographic Fingerprint & IPFS Section */}
        <div className="rounded-xl border border-mp-border bg-mp-bg/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-mp-accent" />
              <span>SHA-256 Model Fingerprint (Public Blockchain Anchor)</span>
            </span>
            <button
              onClick={handleCopyHash}
              className="text-xs text-mp-accent-light hover:text-white flex items-center gap-1 transition-colors"
            >
              <Copy className="h-3 w-3" />
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-mp-surface border border-mp-border text-xs font-mono text-mp-accent-light break-all select-all">
            {model.modelHash}
          </div>
          <div className="text-[11px] text-mp-text-dim flex items-center gap-1.5">
            <span>🛡️ Public commitment: One-way cryptographic anchor that proves authenticity and benchmark reproducibility without exposing model weights.</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-mp-border/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-mp-text-dim">IPFS Storage:</span>
              {canAccessWeights ? (
                <span className="font-mono text-mp-text truncate max-w-xs">{model.ipfsCid}</span>
              ) : (
                <span className="font-mono text-mp-text-muted flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span>ipfs://Qm••••••••••••••••••••••••</span>
                </span>
              )}
            </div>
            {canAccessWeights ? (
              <a
                href={`https://ipfs.io/ipfs/${model.ipfsCid}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-mp-accent-light hover:underline text-xs"
              >
                <span>Inspect IPFS Node</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <Lock className="h-3 w-3" />
                <span>Encrypted: 30-Day License Required</span>
              </span>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Empirical ML Evaluation Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(model.metrics).map(([key, value]) => (
              <div key={key} className="p-3 rounded-xl bg-mp-bg border border-mp-border text-center">
                <div className="text-[11px] uppercase tracking-wider text-mp-text-dim font-medium">
                  {key.replace("_", " ")}
                </div>
                <div className="text-base font-bold text-white mt-1 font-mono">
                  {typeof value === "number" ? value : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version History Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-mp-accent" />
            <span>Version History Timeline</span>
          </h3>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {(model.versionHistory || [model.version]).map((ver, idx) => {
              const isCurrent = ver === model.version;
              return (
                <div
                  key={ver}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs ${
                    isCurrent
                      ? "bg-mp-accent/15 border-mp-accent text-white font-semibold"
                      : "bg-mp-bg border-mp-border text-mp-text-muted"
                  }`}
                >
                  <span>Version {ver}</span>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-mp-accent text-white font-bold">
                      CURRENT
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hosted Inference API & Live Playground (Active License Gated) */}
        <div id="playground" className="rounded-2xl border border-mp-border bg-mp-surface-2 p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mp-border/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-mp-bg border border-mp-border flex items-center justify-center text-mp-accent-light">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Hosted Model Inference API</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-mp-accent/15 text-mp-accent-light border border-mp-accent/30 font-semibold">
                    Live Engine
                  </span>
                </h3>
                <p className="text-xs text-mp-text-muted mt-0.5">
                  Strict DRM enforcement: Prediction queries are evaluated on-chain; access automatically revokes upon 30-day expiry.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canAccessWeights ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>License Active (Authorized)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Locked: Active License Required</span>
                </span>
              )}
            </div>
          </div>

          {canAccessWeights ? (
            <div className="space-y-4">
              {/* Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-mp-border/60 pb-3">
                <button
                  onClick={() => setActivePlaygroundTab("playground")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activePlaygroundTab === "playground"
                      ? "bg-mp-surface text-white border border-mp-border shadow-sm"
                      : "text-mp-text-muted hover:text-white"
                  }`}
                >
                  <Play className="h-3.5 w-3.5 text-mp-accent-light" />
                  <span>Interactive Playground</span>
                </button>
                <button
                  onClick={() => setActivePlaygroundTab("python_api")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activePlaygroundTab === "python_api"
                      ? "bg-mp-surface text-white border border-mp-border shadow-sm"
                      : "text-mp-text-muted hover:text-white"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5 text-mp-accent-light" />
                  <span>Python API Client Snippet</span>
                </button>
              </div>

              {activePlaygroundTab === "playground" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-mp-text font-medium flex items-center gap-1.5">
                        <span>Model Inputs (JSON Array or String):</span>
                      </label>
                      <button
                        onClick={() => {
                          if (model.name.toLowerCase().includes("agri") || model.modelId === 1) {
                            setInferenceInput(JSON.stringify([600, 24, 120, 6.5, 8], null, 2));
                          } else if (model.name.toLowerCase().includes("crop") || model.modelId === 2) {
                            setInferenceInput(JSON.stringify([80, 50, 40, 6.5, 650], null, 2));
                          } else if (model.name.toLowerCase().includes("resume") || model.modelId === 3) {
                            setInferenceInput(JSON.stringify("Python Docker PostgreSQL Kubernetes AWS React software engineering", null, 2));
                          }
                          setInferenceResult(null);
                          setInferenceError("");
                        }}
                        className="text-mp-accent-light hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Reset to Sample Features</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={inferenceInput}
                      onChange={(e) => setInferenceInput(e.target.value)}
                      className="w-full p-3 rounded-xl bg-mp-bg border border-mp-border text-xs font-mono text-mp-text focus:outline-none focus:border-mp-accent-light"
                      placeholder="Enter inference input vector..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExecuteInference}
                      disabled={isInferenceLoading}
                      className="px-5 py-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-mp-accent/15 transition-all disabled:opacity-50"
                    >
                      {isInferenceLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Executing Inference...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5" />
                          <span>Execute Live Prediction</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-mp-text-dim font-mono">
                      Calls backend server /api/models/{model.modelId}/predict
                    </span>
                  </div>

                  {/* Results Display */}
                  {inferenceResult && (
                    <div className="p-4 rounded-xl bg-mp-bg border border-emerald-500/30 space-y-3 animate-in fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Inference Response Received</span>
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-mp-surface border border-mp-border text-mp-accent-light">
                            ⏱️ {inferenceResult.latency_ms} ms
                          </span>
                          {inferenceResult.confidence_percentage && (
                            <span className="px-2 py-0.5 rounded bg-mp-surface border border-mp-border text-emerald-400">
                              Confidence: {inferenceResult.confidence_percentage}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-mp-surface border border-mp-border font-mono text-xs space-y-1">
                        <div className="text-mp-text-dim uppercase text-[10px]">Predicted Output</div>
                        <div className="text-white text-base font-bold break-all">
                          {typeof inferenceResult.primary_result === "number"
                            ? `${Number(inferenceResult.primary_result).toFixed(2)}`
                            : String(inferenceResult.primary_result)}
                        </div>
                      </div>

                      <div className="text-[11px] text-mp-text-dim flex items-center justify-between font-mono">
                        <span>Authentication: On-Chain Wallet Proof Verified</span>
                        <span>
                          {inferenceResult.license_status?.is_creator
                            ? "Creator Unlimited Access"
                            : `${inferenceResult.license_status?.days_remaining} Days Remaining on 30-Day License`}
                        </span>
                      </div>
                    </div>
                  )}

                  {inferenceError && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Inference Error</div>
                        <div className="mt-0.5">{inferenceError}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-mp-text-muted">
                      Use this Python script to query the hosted model securely from your external servers or pipelines:
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="text-xs text-mp-accent-light hover:text-white flex items-center gap-1 font-mono transition-colors"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCode ? "Copied Snippet!" : "Copy Code"}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-mp-bg border border-mp-border text-[11px] font-mono text-mp-text overflow-x-auto selection:bg-mp-accent/20">
                    <code>{`# ModelProof Python Inference Client
import requests

ENDPOINT = "http://localhost:8000/api/models/${model.modelId}/predict"
BUYER_WALLET = "${address || "0x022B8D7378982E11AF76Ad351C58D71501c15A60"}"

payload = {
    "licensee": BUYER_WALLET,
    "inputs": ${inferenceInput.trim()}
}

response = requests.post(ENDPOINT, json=payload)
if response.status_code == 200:
    data = response.json()
    print("✓ Prediction Result:", data["primary_result"])
    print(f"Latency: {data['latency_ms']} ms | Days remaining: {data['license_status']['days_remaining']}")
elif response.status_code == 403:
    print("✗ 403 License Expired: Time-limited access elapsed. Please renew on ModelProof.")
`}</code>
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-mp-bg border border-amber-500/30 space-y-4 text-center">
              <Lock className="h-8 w-8 text-amber-400 mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-white">Live Prediction API Locked</h4>
                <p className="text-xs text-mp-text-muted">
                  Hosted inference calls verify smart contract licenses on every request. Acquire a 30-day license to immediately unlock predictions and developer API keys.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handleBuy("license")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-mp-surface-2 hover:bg-mp-surface border border-mp-border text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Coins className="h-3.5 w-3.5 text-mp-accent-light" />
                  <span>Purchase 30-Day License ({model.licensePriceEth} ETH)</span>
                </button>
                <button
                  onClick={() => handleBuy("ownership")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Buy Whole Model ({fullOwnershipPrice} ETH)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons based on Role Authorization */}
        <div className="pt-4 border-t border-mp-border/60 flex flex-col gap-4">
          {role === "creator" ? (
            isCreator ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>You are the registered creator of this model (98% Royalty recipient)</span>
                </div>
                <Link
                  to={`/register?versionOf=${model.modelId}`}
                  className="px-4 py-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold transition-colors"
                >
                  Deploy New Version
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2.5 rounded-xl bg-mp-surface-2 border border-mp-border text-xs text-mp-text-muted">
                  Creator View: You are inspecting another creator's model.
                </div>
                <button
                  onClick={() => switchRole("buyer")}
                  className="px-4 py-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Switch to Buyer to License
                </button>
              </div>
            )
          ) : role === "admin" ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-mp-surface-2 border border-mp-border text-mp-accent-light text-xs font-semibold">
                Admin Protocol Mode (2% fee governance)
              </div>
              {model.active ? (
                <button
                  onClick={() => {
                    deactivateModel(model.modelId);
                    alert(`Model #${model.modelId} has been deactivated by Admin.`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-semibold transition-colors"
                >
                  Deactivate Model
                </button>
              ) : (
                <button
                  onClick={() => {
                    reactivateModel(model.modelId);
                    alert(`Model #${model.modelId} has been reactivated by Admin.`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-semibold transition-colors"
                >
                  Reactivate Model
                </button>
              )}
            </div>
          ) : isFullOwner ? (
            <div className="w-full p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-mp-surface to-mp-surface-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>ModelProof Verified™ Full Ownership</span>
                  </span>
                  <span className="text-xs text-white font-semibold">
                    You own this model permanently on Ethereum
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 self-start sm:self-auto">
                  Lifetime Perpetual Access
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={`http://localhost:8000/api/models/${model.modelId}/download?licensee=${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Model Weights ({model.filename || "model.joblib"})</span>
                </a>
                <Link
                  to={`/verify?modelId=${model.modelId}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mp-surface-2 hover:bg-mp-surface-3 border border-mp-border text-white text-xs font-semibold transition-all"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Verify Authenticity Certificate</span>
                </Link>
              </div>
            </div>
          ) : isLicensed ? (
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-mp-bg border border-mp-border">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Active 30-Day License Acquired</span>
              </div>
              <button
                onClick={() => handleBuy("ownership")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-semibold transition-all"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Upgrade to ModelProof Verified™ Full Ownership ({fullOwnershipPrice} ETH)</span>
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {/* Dual Tier Selector Cards */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                {/* Option 1: 30-Day License */}
                <div
                  onClick={() => setSelectedTier("license")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTier === "license"
                      ? "border-mp-accent bg-mp-accent/10 ring-1 ring-mp-accent"
                      : "border-mp-border bg-mp-bg hover:border-mp-border/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-mp-accent-light" />
                        <span>30-Day License</span>
                      </div>
                      <div className="text-[11px] text-mp-text-muted mt-1 leading-snug">
                        Hosted prediction API & real-time inference playground. DRM revoked upon 30-day expiry.
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-bold text-white">
                        {model.licensePriceEth} ETH
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option 2: Buy Whole Model (ModelProof Verified™) */}
                <div
                  onClick={() => setSelectedTier("ownership")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${
                    selectedTier === "ownership"
                      ? "border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500"
                      : "border-mp-border bg-mp-bg hover:border-emerald-500/50"
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-bl-md flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>ModelProof Verified™</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-amber-400" />
                        <span>Buy Whole Model</span>
                      </div>
                      <div className="text-[11px] text-mp-text-muted mt-1 leading-snug">
                        Permanent lifetime access + raw weights download (.joblib) + on-chain ModelProof Verified™ proof.
                      </div>
                    </div>
                    <div className="text-right shrink-0 mt-3 sm:mt-0">
                      <div className="text-sm font-mono font-bold text-emerald-400">
                        {fullOwnershipPrice} ETH
                      </div>
                      <div className="text-[10px] text-mp-text-dim">Lifetime</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Button and Fee Split */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <button
                  onClick={() => handleBuy()}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all transform active:scale-95 ${
                    selectedTier === "ownership"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20"
                      : "bg-mp-accent hover:bg-mp-accent-light text-white shadow-mp-accent/20"
                  }`}
                >
                  <Coins className="h-4 w-4" />
                  <span>
                    {selectedTier === "ownership"
                      ? `Buy Whole Model (${fullOwnershipPrice} ETH) • ModelProof Verified™`
                      : `Purchase 30-Day License (${model.licensePriceEth} ETH)`}
                  </span>
                </button>

                <div className="px-3 py-2 rounded-xl bg-mp-bg border border-mp-border text-[11px] text-mp-text-muted flex items-center gap-2">
                  <span className="text-emerald-400 font-medium">
                    Creator (98%): {(parseFloat(currentTierPrice) * 0.98).toFixed(4)} ETH
                  </span>
                  <span>•</span>
                  <span className="text-purple-400 font-medium">
                    Admin (2%): {(parseFloat(currentTierPrice) * 0.02).toFixed(4)} ETH
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={`/verify?modelId=${model.modelId}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-mp-border hover:border-mp-accent bg-mp-surface-2 hover:bg-mp-surface text-white text-xs font-semibold transition-all"
            >
              <ShieldCheck className="h-4 w-4 text-mp-accent-light" />
              <span>Verify Model Artifact</span>
            </Link>

            <a
              href="#playground"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-mp-accent/40 bg-mp-accent/10 hover:bg-mp-accent/20 text-mp-accent-light hover:text-white text-xs font-semibold transition-all shadow-sm"
              title="Access the hosted real-time prediction playground and developer API"
            >
              <Terminal className="h-4 w-4" />
              <span>Hosted Inference API & Playground</span>
            </a>
          </div>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        step={txStep}
        txHash={txHash}
        errorMessage={errorMsg}
        statusMessage={statusMessage}
        title={
          selectedTier === "ownership"
            ? "Acquire ModelProof Verified™ Full Ownership"
            : "Purchase Model License (Sepolia Settlement)"
        }
        splitInfo={{
          totalEth: currentTierPrice,
          creatorShareEth: (parseFloat(currentTierPrice) * 0.98).toFixed(4),
          adminFeeEth: (parseFloat(currentTierPrice) * 0.02).toFixed(4),
          creatorAddress: configuredAccounts.creator || model.creator,
          adminAddress: configuredAccounts.admin,
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
