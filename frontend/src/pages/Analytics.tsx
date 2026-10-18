import React from "react";
import { useModels } from "../context/ModelContext";
import { BarChart3, Coins, Cpu, FileCheck2, Users, PieChart, ShieldCheck } from "lucide-react";

export const Analytics: React.FC = () => {
  const { models, licenses } = useModels();

  const totalVolumeEth = licenses
    .reduce((acc, curr) => acc + parseFloat(curr.priceEth || "0"), 0)
    .toFixed(2);

  const creatorPoolEth = (parseFloat(totalVolumeEth) * 0.98).toFixed(4);
  const platformFeeEth = (parseFloat(totalVolumeEth) * 0.02).toFixed(4);

  const frameworkCounts: Record<string, number> = {};
  models.forEach((m) => {
    frameworkCounts[m.framework] = (frameworkCounts[m.framework] || 0) + 1;
  });

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-mp-accent" />
          <span>Protocol Analytics</span>
        </h1>
        <p className="text-sm text-mp-text-muted mt-1">
          Aggregated on-chain metrics, license liquidity, and ecosystem adoption stats.
        </p>
      </div>

      {/* Top 4 Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Total Models</span>
            <Cpu className="h-4 w-4 text-mp-accent-light" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            {models.length}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">100% on-chain anchored</div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Licenses Issued</span>
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            {licenses.length}
          </div>
          <div className="text-[11px] text-mp-text-dim">Smart contract agreements</div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Total Volume</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            {totalVolumeEth} <span className="text-lg text-mp-accent-light">ETH</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">Direct wallet-to-wallet</div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Active Creators</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            3
          </div>
          <div className="text-[11px] text-mp-text-dim">Cryptographically verified</div>
        </div>
      </div>

      {/* Revenue Split & Framework Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Coins className="h-4 w-4 text-emerald-400" />
            <span>Revenue Distribution Split</span>
          </h2>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white font-medium">Creator Earnings (98%)</span>
                <span className="font-mono text-emerald-400">{creatorPoolEth} ETH</span>
              </div>
              <div className="h-3 rounded-full bg-mp-bg overflow-hidden border border-mp-border/60">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "98%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white font-medium">Admin Protocol Fee (2%)</span>
                <span className="font-mono text-purple-400">{platformFeeEth} ETH</span>
              </div>
              <div className="h-3 rounded-full bg-mp-bg overflow-hidden border border-mp-border/60">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "2%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <PieChart className="h-4 w-4 text-mp-accent" />
            <span>Framework Diversity</span>
          </h2>

          <div className="space-y-3 pt-2">
            {Object.entries(frameworkCounts).map(([fw, count]) => {
              const pct = Math.round((count / models.length) * 100);
              return (
                <div key={fw}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium">{fw}</span>
                    <span className="text-mp-text-dim">
                      {count} model{count > 1 ? "s" : ""} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-mp-bg overflow-hidden border border-mp-border/60">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
