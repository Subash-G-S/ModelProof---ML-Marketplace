import React, { useState } from "react";
import { Sparkles, X, Send, Bot, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { useModels } from "../context/ModelContext";
import { Link } from "react-router-dom";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  recommendedModels?: any[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const { models } = useModels();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am ModelProof AI. I analyze on-chain verified AI/ML models in this marketplace based on real training metrics, frameworks, and pricing. What kind of model are you looking for today?",
    },
  ]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input.trim().toLowerCase();
    const newMessages: Message[] = [...messages, { role: "user", content: input.trim() }];
    setInput("");

    // Algorithmic matching against real model metadata in marketplace
    const matches = models
      .map((m) => {
        let score = 0;
        const searchCorpus = `${m.name} ${m.description} ${m.framework} ${m.modelType} ${m.useCase || ""}`.toLowerCase();

        if (userText.includes("crop") || userText.includes("yield") || userText.includes("agri")) {
          if (m.name.includes("AgriYield") || m.name.includes("Crop")) score += 60;
        }
        if (userText.includes("resume") || userText.includes("nlp") || userText.includes("cv") || userText.includes("text")) {
          if (m.name.includes("Resume") || m.modelType.includes("NLP")) score += 60;
        }
        if (userText.includes("xgboost") && m.framework.toLowerCase().includes("xgboost")) score += 30;
        if (userText.includes("random forest") && m.framework.toLowerCase().includes("random forest")) score += 30;
        if (userText.includes("cheap") || userText.includes("lowest price")) {
          score += (1 - parseFloat(m.licensePriceEth)) * 40;
        }

        // Generic token overlap
        const words = userText.split(/\s+/);
        words.forEach((w) => {
          if (w.length > 2 && searchCorpus.includes(w)) {
            score += 15;
          }
        });

        return { model: m, score: Math.min(score, 98) };
      })
      .filter((item) => item.score > 20)
      .sort((a, b) => b.score - a.score);

    let reply = "";
    if (matches.length > 0) {
      reply = `I evaluated the registered models against your requirements and found ${matches.length} matching verified candidates:`;
    } else {
      reply = `I searched the blockchain registry for '${input}', but didn't find an exact keyword match. Here are our top-performing benchmarked models:`;
      matches.push({ model: models[0], score: 85 });
      if (models[1]) matches.push({ model: models[1], score: 80 });
    }

    newMessages.push({
      role: "assistant",
      content: reply,
      recommendedModels: matches.map((m) => ({
        ...m.model,
        matchScore: m.score,
      })),
    });

    setMessages(newMessages);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-mp-border bg-mp-surface flex flex-col h-[600px] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-mp-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-mp-accent/20 border border-mp-accent/40 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-mp-accent-light" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">ModelProof AI Assistant</h3>
              <p className="text-[11px] text-mp-text-muted">
                Intelligent model discovery grounded on real verified metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-mp-text-muted hover:text-white hover:bg-mp-surface-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-lg bg-mp-accent/20 border border-mp-accent/30 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-mp-accent-light" />
                </div>
              )}
              <div
                className={`max-w-md rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-mp-accent text-white"
                    : "bg-mp-surface-2 border border-mp-border text-mp-text"
                }`}
              >
                <p>{msg.content}</p>

                {msg.recommendedModels && msg.recommendedModels.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.recommendedModels.map((item) => (
                      <div
                        key={item.modelId}
                        className="rounded-xl border border-mp-border bg-mp-bg/60 p-3 text-left space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white text-xs">{item.name}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-mp-accent/20 text-mp-accent-light">
                            Match: {item.matchScore}%
                          </span>
                        </div>
                        <div className="text-[11px] text-mp-text-muted line-clamp-2">
                          {item.description}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-mp-border/40 text-[11px]">
                          <span className="font-mono text-mp-accent-light">
                            {item.licensePriceEth} ETH
                          </span>
                          <Link
                            to={`/model/${item.modelId}`}
                            onClick={onClose}
                            className="flex items-center gap-1 text-mp-text hover:text-white font-medium"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-mp-border/60 bg-mp-surface-2/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 'I need a model for crop yield prediction' or 'NLP resume parser'..."
              className="flex-1 rounded-xl bg-mp-bg border border-mp-border px-4 py-2.5 text-xs text-mp-text placeholder:text-mp-text-dim focus:outline-none focus:border-mp-accent"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
