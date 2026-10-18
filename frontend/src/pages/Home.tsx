import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Cpu, KeyRound, Clock, ArrowRight, CheckCircle2, Lock, Sparkles, Database } from "lucide-react";
import { useModels } from "../context/ModelContext";

export const Home: React.FC = () => {
  const { models, licenses } = useModels();

  const totalVolumeEth = licenses
    .reduce((acc, curr) => acc + parseFloat(curr.priceEth || "0"), 0)
    .toFixed(2);

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative text-center py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[400px] w-[600px] rounded-full bg-gradient-to-tr from-mp-accent/15 to-indigo-600/10 blur-[120px] pointer-events-none" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-mp-accent/30 bg-mp-accent/10 text-mp-accent-light text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Decentralized AI Artifact Layer</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Own your AI. <br />
          <span className="bg-gradient-to-r from-mp-accent-light via-indigo-300 to-white bg-clip-text text-transparent">
            Prove your model.
          </span>{" "}
          <br />
          License with trust.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-mp-text-muted max-w-2xl mx-auto font-normal leading-relaxed">
          A blockchain-powered infrastructure protocol for AI/ML model provenance, cryptographic fingerprinting, versioning, and trustless licensing.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/marketplace"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white font-semibold text-sm shadow-xl shadow-mp-accent/25 transition-all transform active:scale-95"
          >
            <span>Explore Models</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-mp-border hover:border-mp-accent/70 bg-mp-surface hover:bg-mp-surface-2 text-white font-semibold text-sm transition-all"
          >
            <ShieldCheck className="h-4 w-4 text-mp-accent-light" />
            <span>Register Model</span>
          </Link>
        </div>

        {/* Live Network Stats */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: "Models Registered", value: `${models.length}`, sub: "On-chain registry" },
            { label: "Licenses Issued", value: `${licenses.length}`, sub: "Smart contract agreements" },
            { label: "Active Creators", value: "3+", sub: "Verified developers" },
            { label: "Total Volume", value: `${totalVolumeEth} ETH`, sub: "Revenue distributed" },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl border border-mp-border/60 bg-mp-surface/60 p-5 backdrop-blur-sm text-left"
            >
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-mp-text mt-1">{stat.label}</div>
              <div className="text-[11px] text-mp-text-dim mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Value Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cryptographic Separation of Concerns
          </h2>
          <p className="text-sm text-mp-text-muted mt-2">
            AI/ML evaluates model accuracy. Blockchain establishes ownership, registration, and licenses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-mp-accent/20 border border-mp-accent/30 flex items-center justify-center text-mp-accent-light">
              <KeyRound className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">SHA-256 Fingerprinting</h3>
            <p className="text-xs text-mp-text-muted leading-relaxed">
              Every trained weight matrix, serialized estimator, and pipeline artifact generates a deterministic SHA-256 digest before registration.
            </p>
          </div>

          <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Immutable On-Chain Registry</h3>
            <p className="text-xs text-mp-text-muted leading-relaxed">
              Model provenance, creator wallet, timestamp, and version ancestry are written directly to Ethereum smart contracts with zero centralized gatekeeping.
            </p>
          </div>

          <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Automated ETH Licensing</h3>
            <p className="text-xs text-mp-text-muted leading-relaxed">
              Time-delimited 30-day licenses are purchased with ETH Sepolia. Revenue splits 98% directly to the model creator and 2% to the admin account.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Models Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Featured Verified Models
            </h2>
            <p className="text-xs text-mp-text-muted mt-1">
              Pre-trained sample artifacts ready for license purchase and instant hash verification.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="text-xs text-mp-accent-light hover:underline font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {models.slice(0, 3).map((model) => (
            <div
              key={model.modelId}
              className="rounded-2xl border border-mp-border bg-mp-surface hover:border-mp-accent/60 transition-all p-5 flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-mp-surface-2 border border-mp-border text-mp-accent-light">
                    {model.framework}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-3 group-hover:text-mp-accent-light transition-colors">
                  {model.name}
                </h3>
                <p className="text-xs text-mp-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                  {model.description}
                </p>
              </div>

              <div className="pt-3 border-t border-mp-border/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mp-text-dim">Version: <strong className="text-mp-text">{model.version}</strong></span>
                  <span className="font-mono text-white font-semibold">{model.licensePriceEth} ETH</span>
                </div>
                <Link
                  to={`/model/${model.modelId}`}
                  className="w-full py-2.5 rounded-xl bg-mp-surface-2 hover:bg-mp-accent text-white text-xs font-semibold text-center block transition-colors"
                >
                  View Details & License
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
