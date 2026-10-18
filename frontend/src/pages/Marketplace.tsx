import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useModels } from "../context/ModelContext";
import { useWallet } from "../context/WalletContext";
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
  PlusCircle,
  Shield,
  ShoppingBag,
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

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Model Marketplace
          </h1>
          <p className="text-sm text-mp-text-muted mt-1">
            Explore and license cryptographically authenticated AI/ML model artifacts registered on Ethereum.
          </p>
        </div>

        {/* Role-specific header action */}
        {role === "creator" ? (
          <Link
            to="/register"
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register New AI Model</span>
          </Link>
        ) : role === "admin" ? (
          <Link
            to="/admin"
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all"
          >
            <Shield className="h-4 w-4" />
            <span>Admin Governance Console (2%)</span>
          </Link>
        ) : (
          <Link
            to="/licenses"
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mp-surface-2 hover:bg-mp-surface text-mp-accent-light hover:text-white border border-mp-border text-xs font-semibold transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>View My Active Licenses</span>
          </Link>
        )}
      </div>

      {/* Role Notice Banner */}
      <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
        role === "creator"
          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
          : role === "admin"
          ? "bg-purple-500/10 border-purple-500/25 text-purple-300"
          : "bg-blue-500/10 border-blue-500/25 text-blue-300"
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full bg-white/10">
            {role} mode
          </span>
          <span>
            {role === "creator" && "You receive 98% instant ETH royalties when buyers license models. Register your weights to start earning."}
            {role === "buyer" && "You can purchase 30-day licenses with immediate on-chain settlement and verified model downloads."}
            {role === "admin" && "Platform audit mode: Supervising 2% protocol fees and on-chain model registry."}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4 rounded-2xl border border-mp-border/70 bg-mp-surface p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-text-dim" />
            <input
              type="text"
              placeholder="Search by model name, creator address, or framework..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-mp-bg border border-mp-border text-xs text-mp-text placeholder:text-mp-text-dim focus:outline-none focus:border-mp-accent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-mp-bg border border-mp-border text-xs text-mp-text focus:outline-none focus:border-mp-accent"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Framework & Type Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-mp-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-mp-text-dim font-medium mr-1">Framework:</span>
            {frameworks.map((fw) => (
              <button
                key={fw}
                onClick={() => setSelectedFramework(fw)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  selectedFramework === fw
                    ? "bg-mp-accent text-white font-semibold"
                    : "bg-mp-bg text-mp-text-muted hover:text-white border border-mp-border"
                }`}
              >
                {fw === "all" ? "All Frameworks" : fw}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-mp-text-dim font-medium mr-1">Type:</span>
            {modelTypes.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  selectedType === t
                    ? "bg-indigo-600 text-white font-semibold"
                    : "bg-mp-bg text-mp-text-muted hover:text-white border border-mp-border"
                }`}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Models */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedModels.map((model) => {
          const keyMetric =
            model.metrics.r2 !== undefined
              ? `R² = ${model.metrics.r2}`
              : model.metrics.accuracy !== undefined
              ? `Accuracy = ${model.metrics.accuracy}%`
              : "Standard Benchmark";

          return (
            <div
              key={model.modelId}
              className="rounded-2xl border border-mp-border bg-mp-surface hover:border-mp-accent/70 transition-all p-5 flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-mp-surface-2 border border-mp-border text-mp-accent-light">
                      {model.framework}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-mp-bg border border-mp-border text-mp-text-muted">
                      {model.modelType}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mt-3.5 group-hover:text-mp-accent-light transition-colors">
                  {model.name}
                </h3>

                {/* Creator */}
                <div className="text-xs text-mp-text-dim mt-1 font-mono">
                  by {model.creator.slice(0, 6)}...{model.creator.slice(-4)}
                </div>

                {/* Description */}
                <p className="text-xs text-mp-text-muted mt-2 line-clamp-3 leading-relaxed">
                  {model.description}
                </p>

                {/* Key Metric highlight */}
                <div className="mt-4 rounded-xl bg-mp-bg/80 border border-mp-border/60 p-2.5 flex items-center justify-between text-xs">
                  <span className="text-mp-text-dim">Key Metric:</span>
                  <span className="font-semibold text-white font-mono">{keyMetric}</span>
                </div>
              </div>

              {/* Bottom details & action */}
              <div className="pt-3 border-t border-mp-border/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-mp-text-muted">
                    Version <strong className="text-white">{model.version}</strong> •{" "}
                    {model.licenseCount || 0} licenses
                  </div>
                  <div className="text-sm font-bold text-mp-accent-light font-mono">
                    {model.licensePriceEth} ETH
                  </div>
                </div>

                <Link
                  to={`/model/${model.modelId}`}
                  className="w-full py-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-mp-accent/15"
                >
                  <span>View Model Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {sortedModels.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-mp-border bg-mp-surface p-8">
          <p className="text-sm text-mp-text-muted">No models matched your search criteria.</p>
        </div>
      )}
    </div>
  );
};
