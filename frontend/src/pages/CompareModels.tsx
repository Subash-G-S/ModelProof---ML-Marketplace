import React, { useState, useEffect } from "react";
import { useModels } from "../context/ModelContext";
import { compareModelsWithAI } from "../services/apiService";
import { Scale, Sparkles, CheckCircle2, Cpu, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const CompareModels: React.FC = () => {
  const { models } = useModels();
  const [selectedIds, setSelectedIds] = useState<number[]>([1, 2]);
  const [recommendation, setRecommendation] = useState<string>("");
  const [isComparing, setIsComparing] = useState(false);

  const selectedModels = models.filter((m) => selectedIds.includes(m.modelId));

  const toggleModel = (id: number) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  useEffect(() => {
    async function runCompare() {
      if (selectedModels.length < 2) return;
      setIsComparing(true);
      try {
        const result = await compareModelsWithAI(selectedModels);
        setRecommendation(result.recommendation_text);
      } catch {
        setRecommendation("Evaluation based on comparative R², Accuracy, and License cost.");
      } finally {
        setIsComparing(false);
      }
    }
    runCompare();
  }, [selectedIds]);

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Model Comparison & AI Recommendation
        </h1>
        <p className="text-sm text-mp-text-muted mt-1">
          Directly benchmark ML performance metrics, training characteristics, and license pricing across 2 to 4 models.
        </p>
      </div>

      {/* Model Selection Chips */}
      <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-3">
        <label className="text-xs font-semibold text-white">
          Select 2 to 4 Models to Benchmark:
        </label>
        <div className="flex flex-wrap gap-2.5">
          {models.map((m) => {
            const isSelected = selectedIds.includes(m.modelId);
            return (
              <button
                key={m.modelId}
                onClick={() => toggleModel(m.modelId)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-mp-accent text-white border-mp-accent shadow-sm"
                    : "bg-mp-bg text-mp-text-muted hover:text-white border-mp-border"
                }`}
              >
                <span>{m.name}</span>
                <span className="font-mono text-[11px] opacity-80">({m.framework})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {recommendation && (
        <div className="rounded-2xl border border-mp-accent/40 bg-gradient-to-r from-mp-accent/15 to-indigo-950/30 p-6 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-mp-accent-light">
            <Sparkles className="h-4 w-4" />
            <span>AI Analytical Recommendation (Metric-Driven)</span>
          </div>
          <p className="text-sm text-white font-medium leading-relaxed">
            {recommendation}
          </p>
        </div>
      )}

      {/* Metric Comparison Table */}
      <div className="rounded-2xl border border-mp-border bg-mp-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-mp-border bg-mp-surface-2/40 text-mp-text-dim uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6 font-semibold w-48">Metric / Dimension</th>
                {selectedModels.map((m) => (
                  <th key={m.modelId} className="py-4 px-6 font-semibold">
                    <span className="text-white text-sm block font-bold">{m.name}</span>
                    <span className="text-mp-accent-light font-normal text-xs">{m.framework}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mp-border/40 font-mono">
              <tr>
                <td className="py-3.5 px-6 font-sans text-mp-text font-medium">Framework & Type</td>
                {selectedModels.map((m) => (
                  <td key={m.modelId} className="py-3.5 px-6 text-mp-text">
                    {m.modelType}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-sans text-mp-text font-medium">R² Score / Accuracy</td>
                {selectedModels.map((m) => (
                  <td key={m.modelId} className="py-3.5 px-6 text-emerald-400 font-bold">
                    {m.metrics.r2 !== undefined
                      ? `R² = ${m.metrics.r2}`
                      : m.metrics.accuracy !== undefined
                      ? `${m.metrics.accuracy}%`
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-sans text-mp-text font-medium">MAE (Mean Absolute Error)</td>
                {selectedModels.map((m) => (
                  <td key={m.modelId} className="py-3.5 px-6 text-mp-text">
                    {m.metrics.mae !== undefined ? m.metrics.mae : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-sans text-mp-text font-medium">RMSE</td>
                {selectedModels.map((m) => (
                  <td key={m.modelId} className="py-3.5 px-6 text-mp-text">
                    {m.metrics.rmse !== undefined ? m.metrics.rmse : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-sans text-mp-text font-medium">Training Dataset Size</td>
                {selectedModels.map((m) => (
                  <td key={m.modelId} className="py-3.5 px-6 text-mp-text">
                    {m.metrics.dataset_size || "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-sans text-mp-text font-medium">Training Compute Time</td>
                {selectedModels.map((m) => (
                  <td key={m.modelId} className="py-3.5 px-6 text-mp-text">
                    {m.metrics.training_time || "N/A"}
                  </td>
                ))}
              </tr>
              <tr className="bg-mp-surface-2/20">
                <td className="py-4 px-6 font-sans text-white font-bold">License Price (30 Days)</td>
                {selectedModels.map((m) => (
                  <td key={m.modelId} className="py-4 px-6 text-mp-accent-light font-bold text-sm">
                    {m.licensePriceEth} ETH
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-6 font-sans text-mp-text font-medium">Action</td>
                {selectedModels.map((m) => (
                  <td key={m.modelId} className="py-4 px-6">
                    <Link
                      to={`/model/${m.modelId}`}
                      className="px-4 py-2 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white font-sans text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Inspect Model</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
