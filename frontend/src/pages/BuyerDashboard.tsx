import React from "react";
import { Link } from "react-router-dom";
import { useModels } from "../context/ModelContext";
import { useWallet } from "../context/WalletContext";
import {
  FileCheck2,
  ShieldCheck,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Terminal,
  Download,
  Sparkles,
  Award,
} from "lucide-react";

export const BuyerDashboard: React.FC = () => {
  const { licenses, models } = useModels();
  const { address } = useWallet();

  // Show licenses strictly belonging to the currently connected buyer wallet
  const myLicenses = address
    ? licenses.filter((l) => l.licensee.toLowerCase() === address.toLowerCase())
    : [];

  return (
    <div className="space-y-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="border-b border-mp-border/80 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-mp-surface-2 border border-mp-border text-mp-accent-light">
            Buyer License Vault
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Active Model Licenses<span className="text-mp-accent-light">.</span>
        </h1>
        <p className="text-sm text-mp-text-muted mt-1 max-w-2xl">
          Cryptographic permissions and model weight access settled directly via Ethereum smart contracts.
        </p>
      </div>

      {myLicenses.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myLicenses.map((lic) => {
            const isFullOwner = lic.licenseType === "full_ownership";
            const isExpired = !isFullOwner && Date.now() > lic.expiry;
            const status = !lic.active
              ? "REVOKED"
              : isExpired
              ? "EXPIRED"
              : isFullOwner
              ? "FULL OWNERSHIP"
              : "ACTIVE";

            const daysLeft = Math.max(
              0,
              Math.ceil((lic.expiry - Date.now()) / (1000 * 60 * 60 * 24))
            );

            const matchingModel = models.find((m) => m.modelId === lic.modelId);

            return (
              <div
                key={lic.licenseId}
                className={`rounded-2xl border transition-all p-6 flex flex-col justify-between space-y-5 group ${
                  isFullOwner
                    ? "border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-mp-surface to-mp-surface hover:border-emerald-500/70"
                    : "border-mp-border bg-mp-surface hover:border-mp-accent-light/60"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-mp-surface-2 border border-mp-border text-mp-accent-light">
                      License #{lic.licenseId}
                    </span>
                    {isFullOwner ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <Sparkles className="h-3 w-3 text-amber-300" />
                        <span>ModelProof Verified™</span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : status === "EXPIRED"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {status === "ACTIVE" && <CheckCircle2 className="h-3 w-3" />}
                        {status === "EXPIRED" && <AlertCircle className="h-3 w-3" />}
                        {status === "REVOKED" && <XCircle className="h-3 w-3" />}
                        <span>{status}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mt-3 group-hover:text-mp-accent-light transition-colors">
                    {lic.modelName}
                  </h3>
                  <div className="text-xs text-mp-text-dim font-mono mt-1">
                    Creator: {lic.creator.slice(0, 6)}...{lic.creator.slice(-4)}
                  </div>

                  <div className="mt-4 p-3.5 rounded-xl bg-mp-bg border border-mp-border space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-mp-text-dim">Purchased:</span>
                      <span className="text-mp-text">
                        {new Date(lic.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-mp-text-dim">Tier:</span>
                      <span className={isFullOwner ? "text-emerald-400 font-bold" : "text-mp-text"}>
                        {isFullOwner ? "Full Model Ownership" : "30-Day License"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-mp-border">
                      <span className="text-mp-text-dim">Validity:</span>
                      {isFullOwner ? (
                        <span className="text-emerald-400 font-bold">
                          Lifetime (Permanent)
                        </span>
                      ) : (
                        <span className="text-mp-accent-light font-bold">
                          {daysLeft} days remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-mp-border space-y-2">
                  {isFullOwner && (
                    <a
                      href={`http://localhost:8000/api/models/${lic.modelId}/download?licensee=${lic.licensee}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Model Weights ({matchingModel?.filename || "model.joblib"})</span>
                    </a>
                  )}

                  {lic.active && !isExpired && (
                    <Link
                      to={`/model/${lic.modelId}#playground`}
                      className="w-full py-2 rounded-xl bg-mp-surface-2 hover:bg-mp-surface-3 border border-mp-border text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      title="Run model predictions via hosted API playground"
                    >
                      <Terminal className="h-3.5 w-3.5 text-mp-accent-light" />
                      <span>Run Hosted Inference & API</span>
                    </Link>
                  )}

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/verify?modelId=${lic.modelId}`}
                      className="flex-1 py-2 rounded-xl bg-mp-surface-2 hover:bg-mp-surface-3 border border-mp-border text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-mp-accent-light" />
                      <span>Verify Fingerprint</span>
                    </Link>
                    <Link
                      to={`/model/${lic.modelId}`}
                      className="px-3 py-2 rounded-xl border border-mp-border hover:border-mp-accent-light text-mp-text hover:text-white text-xs transition-colors"
                      title="View Model Specifications"
                    >
                      Specs
                    </Link>
                  </div>

                  <a
                    href={`https://sepolia.etherscan.io/tx/${lic.transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1 text-[11px] text-mp-accent-light hover:underline font-mono"
                  >
                    <span>Tx: {lic.transactionHash.slice(0, 10)}...</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-mp-border bg-mp-surface p-8 space-y-4 max-w-lg mx-auto">
          <FileCheck2 className="h-10 w-10 text-mp-text-dim mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-white">No Model Licenses Acquired Yet</h3>
            <p className="text-xs text-mp-text-muted mt-1">
              You do not hold active permissions for any ML models. Browse the decentralized marketplace to acquire 30-day licenses.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold transition-all shadow-sm"
          >
            <span>Browse Models</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
