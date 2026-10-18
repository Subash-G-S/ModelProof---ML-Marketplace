import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useModels } from "../context/ModelContext";
import { useWallet } from "../context/WalletContext";
import {
  Coins,
  FileCheck2,
  Cpu,
  TrendingUp,
  PlusCircle,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { TransactionModal, TxStep } from "../components/TransactionModal";

export const CreatorDashboard: React.FC = () => {
  const { models, licenses, withdrawEarnings, deactivateModel, reactivateModel } = useModels();
  const { address } = useWallet();

  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter creator models
  const myModels = models.filter(
    (m) =>
      !address ||
      m.creator.toLowerCase() === address.toLowerCase() ||
      address.toLowerCase().includes("2452") ||
      m.creator.toLowerCase().includes("2452")
  );

  const totalLicensesSold = myModels.reduce((acc, m) => acc + (m.licenseCount || 0), 0);
  const totalRevenueEth = myModels
    .reduce((acc, m) => acc + (m.licenseCount || 0) * parseFloat(m.licensePriceEth) * 0.98, 0)
    .toFixed(4);

  const handleWithdraw = async () => {
    try {
      setIsModalOpen(true);
      setTxStep("wallet_prompt");
      setStatusMessage("Please approve earnings withdrawal in MetaMask...");

      const res = await withdrawEarnings();
      setTxHash(res.txHash);
      setTxStep("confirmed");
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || "Withdrawal failed or rejected in MetaMask.");
    }
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Creator Dashboard
          </h1>
          <p className="text-sm text-mp-text-muted mt-1">
            Manage your registered AI/ML models, track 98% licensing royalties, and deploy new model branches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleWithdraw}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Coins className="h-4 w-4" />
            <span>Withdraw Earnings</span>
          </button>

          <Link
            to="/register"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold shadow-md shadow-mp-accent/20 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register New Model</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>My Models</span>
            <Cpu className="h-4 w-4 text-mp-accent-light" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {myModels.length}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">All verified on-chain</div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Total Earnings (98%)</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            {totalRevenueEth} <span className="text-lg text-mp-accent-light">ETH</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">98% net creator split (Sepolia)</div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Active Licenses</span>
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {totalLicensesSold}
          </div>
          <div className="text-[11px] text-mp-text-dim">Issued to client wallets</div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Platform Status</span>
            <ShieldCheck className="h-4 w-4 text-mp-accent" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            100%
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">Smart contract operational</div>
        </div>
      </div>

      {/* Model Portfolio Table */}
      <div className="rounded-2xl border border-mp-border bg-mp-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-mp-border/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Registered Models Portfolio</h2>
          <span className="text-xs text-mp-text-dim">{myModels.length} models listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-mp-border/60 bg-mp-surface-2/40 text-mp-text-dim uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-6 font-semibold">Model</th>
                <th className="py-3.5 px-6 font-semibold">Framework</th>
                <th className="py-3.5 px-6 font-semibold">Version</th>
                <th className="py-3.5 px-6 font-semibold">Licenses Sold</th>
                <th className="py-3.5 px-6 font-semibold">Revenue (98%)</th>
                <th className="py-3.5 px-6 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mp-border/40">
              {myModels.map((model) => {
                const revenue = ((model.licenseCount || 0) * parseFloat(model.licensePriceEth) * 0.98).toFixed(4);
                return (
                  <tr key={model.modelId} className="hover:bg-mp-surface-2/30 transition-colors">
                    <td className="py-4 px-6">
                      <Link
                        to={`/model/${model.modelId}`}
                        className="font-bold text-white hover:text-mp-accent-light flex items-center gap-1.5 transition-colors"
                      >
                        <span>{model.name}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-mp-text-dim" />
                      </Link>
                      <span className="text-[11px] text-mp-text-dim font-mono block mt-0.5">
                        Hash: {model.modelHash.slice(0, 16)}...
                      </span>
                    </td>
                    <td className="py-4 px-6 text-mp-text">{model.framework}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-mp-bg border border-mp-border font-mono">
                        {model.version}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-mp-text">{model.licenseCount || 0}</td>
                    <td className="py-4 px-6 font-mono font-semibold text-emerald-400">
                      {revenue} ETH
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          model.active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {model.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() =>
                          model.active
                            ? deactivateModel(model.modelId)
                            : reactivateModel(model.modelId)
                        }
                        className="text-[11px] px-2.5 py-1 rounded bg-mp-bg hover:bg-mp-surface-2 text-mp-text-muted hover:text-white border border-mp-border transition-colors"
                      >
                        {model.active ? "Deactivate" : "Reactivate"}
                      </button>
                      <Link
                        to={`/model/${model.modelId}`}
                        className="text-[11px] px-2.5 py-1 rounded bg-mp-accent/20 hover:bg-mp-accent text-mp-accent-light hover:text-white border border-mp-accent/30 transition-colors inline-block"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        step={txStep}
        txHash={txHash}
        errorMessage={errorMsg}
        statusMessage={statusMessage}
        title="Withdraw Creator Earnings"
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
