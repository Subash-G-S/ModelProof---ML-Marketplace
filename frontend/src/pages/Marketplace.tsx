import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useModels } from "../context/ModelContext";
import { useWallet } from "../context/WalletContext";
import {
  Search,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  PlusCircle,
  Shield,
  ShoppingBag,
  KeyRound,
  Sparkles,
  BarChart2,
  Lock,
  ArrowUpRight,
  Filter,
} from "lucide-react";

export const Marketplace: React.FC = () => {
  const { models } = useModels();
  const { role } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");

  const frameworks = ["all", "XGBoost", "Random Forest", "Scikit-Learn"];
  const modelTypes = ["all", "Regression", "Classification", "NLP Classification"];

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.framework.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFramework =
      selectedFramework === "all" ||
      model.framework.toLowerCase().includes(selectedFramework.toLowerCase());

    const matchesType =
      selectedType === "all" ||
      model.modelType.toLowerCase().includes(selectedType.toLowerCase());

    return matchesSearch && matchesFramework && matchesType;
  });

  const sortedModels = [...filteredModels].sort((a, b) => {
    if (sortBy === "price_asc") return parseFloat(a.licensePriceEth) - parseFloat(b.licensePriceEth);
    if (sortBy === "price_desc") return parseFloat(b.licensePriceEth) - parseFloat(a.licensePriceEth);
    return 0;
  });

  const featuredModel = sortedModels[0];
  const secondaryModels = sortedModels.slice(1);

  return (
    <div className="space-y-10 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Editorial Headline Header */}
      <div className="border-b border-mp-border/80 pb-8 pt-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-mp-surface-2 border border-mp-border text-mp-accent-light">
                Ethereum AI/ML Protocol
              </span>
              <span className="text-[11px] font-mono text-mp-text-dim">
                // ZERO-TRUST MODEL LICENSING
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Empirical Model Intelligence<span className="text-mp-accent-light">.</span>
            </h1>
            
            <p className="text-sm text-mp-text-muted leading-relaxed">
              Cryptographically authenticated machine learning weights anchored on-chain. Provable benchmark metrics, tamper-evident hash verification, and trustless 30-day ETH licensing.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono border-t lg:border-t-0 lg:border-l border-mp-border/70 pt-4 lg:pt-0 lg:pl-6">
            <div>
              <div className="text-mp-text-dim uppercase text-[10px]">Active Models</div>
              <div className="text-xl font-bold text-white mt-0.5">{models.length}</div>
            </div>
            <div className="h-8 w-px bg-mp-border" />
            <div>
              <div className="text-mp-text-dim uppercase text-[10px]">Royalties</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">98% / 2%</div>
            </div>
            <div className="h-8 w-px bg-mp-border" />
            <div>
              <div className="text-mp-text-dim uppercase text-[10px]">Anchor</div>
              <div className="text-xl font-bold text-mp-accent-light mt-0.5">SHA-256</div>
            </div>
          </div>
        </div>

        {/* Dynamic Role Guidance Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-mp-surface border border-mp-border text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-mp-surface-2 text-mp-accent-light border border-mp-border">
              {role} View
            </span>
            <span className="text-mp-text-muted">
              {role === "creator" && "You receive 98% immediate ETH revenue on license settlements. Register new models to distribute your weights."}
              {role === "buyer" && "Acquire 30-day cryptographically verified licenses with instant on-chain settlement and tamper-proof model downloads."}
              {role === "admin" && "Platform supervisory mode: Overseeing 2% platform fee allocation and decentralized model registry."}
            </span>
          </div>

          {role === "creator" && (
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold transition-all shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Deploy Model</span>
            </Link>
          )}
          {role === "buyer" && (
            <Link
              to="/licenses"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mp-surface-2 hover:bg-mp-surface-3 text-mp-accent-light hover:text-white border border-mp-border text-xs font-medium transition-all"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>My Licenses</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-text-dim" />
          <input
            type="text"
            placeholder="Search by model name, architecture, or creator address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-mp-surface border border-mp-border text-xs text-mp-text placeholder:text-mp-text-dim focus:outline-none focus:border-mp-accent-light transition-all"
          />
        </div>

        {/* Framework Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {frameworks.map((fw) => {
            const isSel = selectedFramework === fw;
            return (
              <button
                key={fw}
                onClick={() => setSelectedFramework(fw)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isSel
                    ? "bg-mp-accent text-white font-semibold shadow-sm"
                    : "bg-mp-surface hover:bg-mp-surface-2 border border-mp-border text-mp-text-muted hover:text-white"
                }`}
              >
                {fw === "all" ? "All Frameworks" : fw}
              </button>
            );
          })}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-mp-surface border border-mp-border text-xs text-mp-text-muted hover:text-white focus:outline-none focus:border-mp-accent-light"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          SWISS MINIMALIST BENTO GRID PRESENTATION
          ========================================================================= */}
      {sortedModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Bento Cell 1: Featured Hero Model (Spans 2 columns on large screens) */}
          {featuredModel && (
            <div className="md:col-span-2 rounded-2xl border border-mp-border bg-mp-surface hover:border-mp-accent-light/80 transition-all p-6 sm:p-7 flex flex-col justify-between space-y-6 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-mp-accent/5 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-mp-accent/15 border border-mp-accent/30 text-mp-accent-light">
                      Featured Model
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-mp-bg border border-mp-border text-mp-text-muted">
                      {featuredModel.framework}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-mp-bg border border-mp-border text-mp-text-muted">
                      {featuredModel.modelType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>On-Chain Verified</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h2 className="text-2xl font-bold text-white group-hover:text-mp-accent-light transition-colors">
                    {featuredModel.name}
                  </h2>
                  <div className="text-xs text-mp-text-dim font-mono mt-1">
                    Registered by {featuredModel.creator.slice(0, 8)}...{featuredModel.creator.slice(-6)} • Version {featuredModel.version}
                  </div>
                  <p className="text-sm text-mp-text-muted mt-3 leading-relaxed max-w-2xl">
                    {featuredModel.description}
                  </p>
                </div>

                {/* Empirical Benchmark Bento Stat Row */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(featuredModel.metrics).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-mp-bg border border-mp-border text-center">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-mp-text-dim">
                        {k.replace("_", " ")}
                      </div>
                      <div className="text-base font-bold text-white font-mono mt-1">
                        {typeof v === "number" ? v : String(v)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Cryptographic Stamp and Action */}
              <div className="pt-4 border-t border-mp-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-mono text-mp-text-dim">
                  <KeyRound className="h-3.5 w-3.5 text-mp-accent-light" />
                  <span className="truncate max-w-xs">{featuredModel.modelHash}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-mp-text-dim font-mono">30-Day License</div>
                    <div className="text-lg font-bold text-mp-accent-light font-mono leading-none">
                      {featuredModel.licensePriceEth} ETH
                    </div>
                  </div>

                  <Link
                    to={`/model/${featuredModel.modelId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                  >
                    <span>Inspect & License</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Bento Cell 2: Zero-Trust Verification Guarantee Micro-Panel */}
          <div className="rounded-2xl border border-mp-border bg-mp-surface-2 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-mp-accent-light">
                <Shield className="h-4 w-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Zero-Trust Assurance</span>
              </div>
              <h3 className="text-base font-bold text-white mt-2">
                Cryptographic Model Verification
              </h3>
              <p className="text-xs text-mp-text-muted mt-2 leading-relaxed">
                Every AI/ML model artifact published to ModelProof is cryptographically fingerprinted via SHA-256 and anchored in the Ethereum smart contract.
              </p>

              <div className="mt-4 p-3 rounded-xl bg-mp-bg border border-mp-border space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Weights cannot be altered post-registration</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[11px]">98% royalty automatically forwarded to creator</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Client-side hash verification tool included</span>
                </div>
              </div>
            </div>

            <Link
              to="/verify"
              className="w-full py-2.5 rounded-xl border border-mp-border hover:border-mp-accent-light bg-mp-surface hover:bg-mp-surface-3 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <span>Test Verify Tool</span>
              <ArrowRight className="h-3.5 w-3.5 text-mp-accent-light" />
            </Link>
          </div>

          {/* Remaining Secondary Models Bento Cells */}
          {secondaryModels.map((model) => {
            const keyMetricName = Object.keys(model.metrics)[0] || "Benchmark";
            const keyMetricVal = model.metrics[keyMetricName] || "Verified";

            return (
              <div
                key={model.modelId}
                className="rounded-2xl border border-mp-border bg-mp-surface hover:border-mp-accent-light/70 transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-mp-surface-2 border border-mp-border text-mp-accent-light">
                        {model.framework}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-mp-bg border border-mp-border text-mp-text-muted">
                        {model.modelType}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>v{model.version}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-3.5 group-hover:text-mp-accent-light transition-colors">
                    {model.name}
                  </h3>

                  <div className="text-xs text-mp-text-dim mt-1 font-mono">
                    by {model.creator.slice(0, 6)}...{model.creator.slice(-4)}
                  </div>

                  <p className="text-xs text-mp-text-muted mt-2 line-clamp-2 leading-relaxed">
                    {model.description}
                  </p>

                  <div className="mt-4 rounded-xl bg-mp-bg border border-mp-border p-2.5 flex items-center justify-between text-xs">
                    <span className="text-mp-text-dim uppercase text-[10px] font-mono">{keyMetricName.replace("_", " ")}</span>
                    <span className="font-semibold text-white font-mono">{String(keyMetricVal)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-mp-border/70 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mp-text-dim font-mono">{model.licenseCount || 0} active licenses</span>
                    <span className="text-sm font-bold text-mp-accent-light font-mono">
                      {model.licensePriceEth} ETH
                    </span>
                  </div>

                  <Link
                    to={`/model/${model.modelId}`}
                    className="w-full py-2.5 rounded-xl bg-mp-surface-2 hover:bg-mp-accent text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>View Model Specifications</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-mp-border bg-mp-surface p-8 space-y-3">
          <p className="text-sm text-mp-text-muted">No models matched your search or framework filter.</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedFramework("all");
            }}
            className="text-xs text-mp-accent-light hover:underline font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
