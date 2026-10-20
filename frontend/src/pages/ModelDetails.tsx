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
  Download,
  ArrowLeft,
  Coins,
  History,
  Layers,
  FileCode,
  Lock,
} from "lucide-react";
import { TransactionModal, TxStep } from "../components/TransactionModal";

export const ModelDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { models, purchaseLicense, hasActiveLicense, deactivateModel, reactivateModel } = useModels();
  const { address, isConnected, connectWallet, configuredAccounts, role, switchRole } = useWallet();

  const [copied, setCopied] = useState(false);
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const isLicensed = address ? hasActiveLicense(model.modelId, address) : false;
  const isCreator = address
    ? model.creator.toLowerCase() === address.toLowerCase() ||
      Boolean(configuredAccounts.creator && configuredAccounts.creator.toLowerCase() === address.toLowerCase()) ||
      role === "creator"
    : role === "creator";
  const canAccessWeights = isLicensed || isCreator || role === "admin";

  const handleCopyHash = () => {
    navigator.clipboard.writeText(model.modelHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuyLicense = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    try {
      setIsModalOpen(true);
      setTxStep("wallet_prompt");
      setStatusMessage("Please inspect and approve the transaction in MetaMask.");

      const result = await purchaseLicense(model.modelId, (status, hash) => {
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
            <span className="text-xs text-mp-text-dim">License Price (30 Days)</span>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white mt-0.5">
              {model.licensePriceEth} <span className="text-mp-accent-light text-xl">ETH</span>
            </span>
            <span className="text-[11px] text-emerald-400 mt-1">98% to Creator • 2% to Admin Protocol</span>
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

        {/* Action Buttons based on Role Authorization */}
        <div className="pt-4 border-t border-mp-border/60 flex flex-wrap items-center gap-4">
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
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Switch to Buyer to License
                </button>
              </div>
            )
          ) : role === "admin" ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold">
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
          ) : isLicensed ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Active License Acquired (Valid for 30 Days)</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={handleBuyLicense}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all transform active:scale-95"
              >
                <Coins className="h-4 w-4" />
                <span>Purchase 30-Day License ({model.licensePriceEth} ETH)</span>
              </button>

              <div className="px-3 py-2 rounded-xl bg-mp-bg border border-mp-border text-[11px] text-mp-text-muted flex items-center gap-2">
                <span className="text-emerald-400 font-medium">
                  Creator (98%): {(parseFloat(model.licensePriceEth) * 0.98).toFixed(4)} ETH
                </span>
                <span>•</span>
                <span className="text-purple-400 font-medium">
                  Admin (2%): {(parseFloat(model.licensePriceEth) * 0.02).toFixed(4)} ETH
                </span>
              </div>
            </div>
          )}

          <Link
            to={`/verify?modelId=${model.modelId}`}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-mp-border hover:border-mp-accent bg-mp-surface-2 hover:bg-mp-surface text-white text-xs font-semibold transition-all"
          >
            <ShieldCheck className="h-4 w-4 text-mp-accent-light" />
            <span>Verify Model Artifact</span>
          </Link>

          {model.filename && (
            canAccessWeights ? (
              <a
                href={`http://localhost:8000/download-sample-model/${model.filename}`}
                download
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all shadow-sm"
                title="Download verified model weights (.joblib)"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Model Weights ({model.filename})</span>
              </a>
            ) : (
              <button
                onClick={handleBuyLicense}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-mp-border hover:border-amber-500/40 bg-mp-bg hover:bg-mp-surface text-mp-text-muted hover:text-amber-300 text-xs font-medium transition-all group"
                title="Purchase a 30-day license to decrypt and download this model artifact"
              >
                <Lock className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Model Weights Locked (License Required)</span>
              </button>
            )
          )}
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        step={txStep}
        txHash={txHash}
        errorMessage={errorMsg}
        statusMessage={statusMessage}
        title="Purchase Model License (Sepolia Settlement)"
        splitInfo={{
          totalEth: model.licensePriceEth,
          creatorShareEth: (parseFloat(model.licensePriceEth) * 0.98).toFixed(4),
          adminFeeEth: (parseFloat(model.licensePriceEth) * 0.02).toFixed(4),
          creatorAddress: configuredAccounts.creator || model.creator,
          adminAddress: configuredAccounts.admin,
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
