import React from "react";
import { useModels } from "../context/ModelContext";
import { Activity as ActivityIcon, ExternalLink, ShieldCheck, Coins, History, FileCheck2 } from "lucide-react";

export const Activity: React.FC = () => {
  const { activities } = useModels();

  const getEventBadge = (type: string) => {
    switch (type) {
      case "ModelRegistered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-mp-accent/15 text-mp-accent-light border border-mp-accent/30">
            <ShieldCheck className="h-3 w-3" />
            <span>Model Registered</span>
          </span>
        );
      case "LicensePurchased":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <FileCheck2 className="h-3 w-3" />
            <span>License Purchased</span>
          </span>
        );
      case "VersionCreated":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <History className="h-3 w-3" />
            <span>Version Created</span>
          </span>
        );
      case "PaymentWithdrawn":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Coins className="h-3 w-3" />
            <span>Payment Withdrawn</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-mp-surface-2 text-mp-text">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <ActivityIcon className="h-7 w-7 text-mp-accent" />
          <span>Blockchain Activity Feed</span>
        </h1>
        <p className="text-sm text-mp-text-muted mt-1">
          Real-time on-chain transaction log populated from smart contract events on Ethereum.
        </p>
      </div>

      <div className="rounded-2xl border border-mp-border bg-mp-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-mp-border/60 bg-mp-surface-2/40 text-mp-text-dim uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-6 font-semibold">Event</th>
                <th className="py-3.5 px-6 font-semibold">User Address</th>
                <th className="py-3.5 px-6 font-semibold">Model Artifact</th>
                <th className="py-3.5 px-6 font-semibold">Timestamp</th>
                <th className="py-3.5 px-6 font-semibold">Tx Hash</th>
                <th className="py-3.5 px-6 font-semibold text-right">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mp-border/40 font-mono">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-mp-surface-2/30 transition-colors">
                  <td className="py-4 px-6 font-sans">{getEventBadge(act.type)}</td>
                  <td className="py-4 px-6 text-mp-text">
                    {act.user.slice(0, 6)}...{act.user.slice(-4)}
                  </td>
                  <td className="py-4 px-6 font-sans text-white font-medium">
                    {act.modelName || "Protocol Treasury"}
                  </td>
                  <td className="py-4 px-6 text-mp-text-dim">
                    {new Date(act.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-4 px-6 text-mp-accent-light">
                    {act.txHash.slice(0, 12)}...
                  </td>
                  <td className="py-4 px-6 text-right font-sans">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${act.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-mp-accent-light hover:underline font-medium"
                    >
                      <span>Etherscan</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
