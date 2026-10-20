import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Cpu, KeyRound, Clock, ArrowRight, CheckCircle2, Lock, Sparkles, Database, ArrowUpRight, Scale } from "lucide-react";
import { useModels } from "../context/ModelContext";

export const Home: React.FC = () => {
  const { models, licenses } = useModels();

  const totalVolumeEth = licenses
    .reduce((acc, curr) => acc + parseFloat(curr.priceEth || "0"), 0)
    .toFixed(2);

  return (
    <div className="space-y-20 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section - Swiss Editorial Typography */}
      <section className="relative text-center py-12 md:py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-mp-border bg-mp-surface-2 text-mp-accent-light text-[11px] font-mono tracking-wider uppercase mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-mp-accent-light animate-pulse" />
          <span>Ethereum Machine Learning Registry</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
          Decentralized AI Artifacts<span className="text-mp-accent-light">.</span> <br />
          <span className="text-mp-text-muted font-light">Cryptographic Proof & Provenance.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-mp-text-muted max-w-2xl mx-auto font-normal leading-relaxed">
          Zero-trust infrastructure protocol for AI/ML model integrity. Commit SHA-256 fingerprints to Ethereum, verify model weights, and license algorithms with 98% creator royalties.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/marketplace"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-mp-accent/15 transition-all transform active:scale-95"
          >
            <span>Explore Marketplace</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/verify"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-mp-border hover:border-mp-accent-light bg-mp-surface hover:bg-mp-surface-2 text-white font-semibold text-xs uppercase tracking-wider transition-all"
          >
            <ShieldCheck className="h-4 w-4 text-mp-accent-light" />
            <span>Verify Model Weights</span>
          </Link>
        </div>

        {/* Live Network Stats Row */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { label: "Active Models", value: `${models.length}`, sub: "On-chain registered" },
            { label: "Licenses Settled", value: `${licenses.length}`, sub: "Smart contract agreements" },
            { label: "Royalty Distribution", value: "98% / 2%", sub: "Creator / Protocol split" },
            { label: "Verification Anchor", value: "SHA-256", sub: "Immutable bytecode digest" },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl border border-mp-border bg-mp-surface p-5 text-left"
            >
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-mp-text mt-1">{stat.label}</div>
              <div className="text-[11px] text-mp-text-dim mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Editorial Pillars */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-mp-border pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-mp-accent-light tracking-widest">Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Separation of Compute & Consensus
            </h2>
          </div>
          <p className="text-xs text-mp-text-muted max-w-md">
            Model weights reside safely in decentralized storage while immutable fingerprints, ownership trees, and licensing state live on Ethereum.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4 hover:border-mp-accent-light/60 transition-all">
            <div className="h-10 w-10 rounded-xl bg-mp-surface-2 border border-mp-border flex items-center justify-center text-mp-accent-light">
              <KeyRound className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">SHA-256 Fingerprinting</h3>
            <p className="text-xs text-mp-text-muted leading-relaxed">
              Every trained weight matrix, serialized estimator, and pipeline artifact generates an immutable SHA-256 digest before registration.
            </p>
          </div>

          <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4 hover:border-mp-accent-light/60 transition-all">
            <div className="h-10 w-10 rounded-xl bg-mp-surface-2 border border-mp-border flex items-center justify-center text-mp-accent-light">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">98/2 Revenue Settlement</h3>
            <p className="text-xs text-mp-text-muted leading-relaxed">
              License purchases automatically distribute 98% direct ETH to model creators and 2% protocol fee without custodial intermediaries.
            </p>
          </div>

          <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4 hover:border-mp-accent-light/60 transition-all">
            <div className="h-10 w-10 rounded-xl bg-mp-surface-2 border border-mp-border flex items-center justify-center text-mp-accent-light">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Zero-Trust Verification</h3>
            <p className="text-xs text-mp-text-muted leading-relaxed">
              Verify any downloaded model file client-side against the on-chain registry in seconds to prove it hasn't been poisoned or modified.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
