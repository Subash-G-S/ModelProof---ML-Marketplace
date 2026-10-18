import React, { useState } from "react";
import { useWallet, UserRole } from "../context/WalletContext";
import {
  X,
  Wallet,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Percent,
  Sparkles,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";

interface ThreeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreeAccountModal: React.FC<ThreeAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    address,
    role,
    chainId,
    networkName,
    configuredAccounts,
    configuredBalances,
    assignCurrentAccountToRole,
    setAccountForRole,
    switchRole,
    refreshBalances,
  } = useWallet();

  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [editInput, setEditInput] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, r: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedRole(r);
    setTimeout(() => setCopiedRole(null), 2000);
  };

  const handleSaveManual = (r: UserRole) => {
    if (editInput.trim().startsWith("0x") && editInput.trim().length === 42) {
      setAccountForRole(r, editInput.trim());
      setEditingRole(null);
      setEditInput("");
    } else {
      alert("Please enter a valid 42-character Ethereum address (0x...)");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const rolesConfig = [
    {
      key: "buyer" as UserRole,
      title: "Buyer Account",
      badge: "Payer (100%)",
      badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      description: "Purchases 30-day AI model licenses on Sepolia. Transfers 98% to Creator and 2% to Admin.",
      share: "Transfers 100% Sepolia ETH",
      address: configuredAccounts.buyer,
      balance: configuredBalances.buyer,
    },
    {
      key: "creator" as UserRole,
      title: "Creator Account",
      badge: "Royalty: 98%",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      description: "Registers AI models on-chain. Immediately receives 98% of all license purchases.",
      share: "Receives 98% of License Fee",
      address: configuredAccounts.creator,
      balance: configuredBalances.creator,
    },
    {
      key: "admin" as UserRole,
      title: "Admin Account",
      badge: "Protocol: 2%",
      badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      description: "Platform owner & governor. Immediately receives 2% protocol fee from all purchases.",
      share: "Receives 2% Protocol Platform Fee",
      address: configuredAccounts.admin,
      balance: configuredBalances.admin,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl border border-mp-border bg-mp-bg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-mp-border/70 bg-mp-surface/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-mp-accent animate-pulse" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                3-Account MetaMask Configuration
              </h2>
            </div>
            <p className="text-xs text-mp-text-muted mt-1">
              Configure your 3 MetaMask accounts for Sepolia ETH 98% / 2% split settlement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl border border-mp-border hover:border-mp-accent text-mp-text-muted hover:text-white bg-mp-surface transition-all"
              title="Refresh balances"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-mp-accent" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-mp-text-muted hover:text-white hover:bg-mp-surface-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Current Active Wallet Banner */}
        <div className="px-6 py-3.5 bg-mp-surface-2/70 border-b border-mp-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-mp-text-dim">Currently Connected in MetaMask:</span>
            {address ? (
              <span className="px-2 py-0.5 rounded bg-mp-surface text-mp-accent-light font-semibold border border-mp-border">
                {address.slice(0, 8)}...{address.slice(-6)}
              </span>
            ) : (
              <span className="text-amber-400 font-sans">No MetaMask account connected</span>
            )}
            <span className="text-mp-text-dim">({networkName})</span>
          </div>

          <div className="flex items-center gap-2 font-medium">
            <span className="text-mp-text-muted">Active Role in App:</span>
            <span className="capitalize px-2 py-0.5 rounded bg-mp-accent/20 text-mp-accent-light border border-mp-accent/30 font-semibold">
              {role}
            </span>
          </div>
        </div>

        {/* 98% / 2% Revenue Split Diagram */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950/20 via-emerald-950/20 to-purple-950/20 border-b border-mp-border/50">
          <div className="flex items-center justify-between text-xs font-semibold text-white mb-2">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span>Buyer (Payer)</span>
            </span>
            <div className="flex items-center gap-1 text-mp-text-dim text-[11px]">
              <span>Automated Sepolia Settlement</span>
              <ArrowRight className="h-3 w-3" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-emerald-400 font-bold">Creator (98%)</span>
              <span className="text-mp-text-dim">+</span>
              <span className="text-purple-400 font-bold">Admin (2%)</span>
            </div>
          </div>
          <div className="w-full h-2.5 rounded-full bg-mp-surface overflow-hidden flex">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full w-[98%]" title="98% to Creator" />
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-[2%]" title="2% to Admin" />
          </div>
          <div className="flex justify-between text-[11px] text-mp-text-muted mt-1.5">
            <span>Example: 0.05 Sepolia ETH</span>
            <span>0.049 ETH directly to Creator • 0.001 ETH directly to Admin</span>
          </div>
        </div>

        {/* 3 Account Cards */}
        <div className="p-6 overflow-y-auto space-y-4">
          {rolesConfig.map((item) => {
            const isAssigned = Boolean(item.address);
            const isCurrentMetaMask = Boolean(
              address && item.address && address.toLowerCase() === item.address.toLowerCase()
            );
            const isEditing = editingRole === item.key;

            return (
              <div
                key={item.key}
                className={`rounded-2xl border p-4.5 transition-all ${
                  role === item.key
                    ? "bg-mp-surface/90 border-mp-accent/60 shadow-lg shadow-mp-accent/10 ring-1 ring-mp-accent/30"
                    : "bg-mp-surface/40 border-mp-border hover:border-mp-border/80"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Role Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      {isCurrentMetaMask && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>Connected in MetaMask</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-mp-text-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => switchRole(item.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        role === item.key
                          ? "bg-mp-accent text-white shadow-md shadow-mp-accent/25"
                          : "bg-mp-surface-2 text-mp-text hover:text-white border border-mp-border hover:border-mp-accent"
                      }`}
                    >
                      {role === item.key ? "Active Role" : "Select Role"}
                    </button>

                    <button
                      onClick={() => assignCurrentAccountToRole(item.key)}
                      disabled={!address}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-mp-surface-2 hover:bg-mp-surface text-mp-accent-light hover:text-white border border-mp-border hover:border-mp-accent transition-all disabled:opacity-40"
                      title="Bind currently connected MetaMask address to this role"
                    >
                      Use Connected
                    </button>
                  </div>
                </div>

                {/* Address & Balance Bar */}
                <div className="mt-3.5 pt-3 border-t border-mp-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        placeholder="0x..."
                        className="flex-1 bg-mp-bg border border-mp-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-mp-accent"
                      />
                      <button
                        onClick={() => handleSaveManual(item.key)}
                        className="px-3 py-1.5 rounded-lg bg-mp-accent text-white text-xs font-medium hover:bg-mp-accent-light"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingRole(null)}
                        className="px-2.5 py-1.5 rounded-lg bg-mp-surface text-mp-text-muted hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-mp-text-dim">Assigned Address:</span>
                        {isAssigned ? (
                          <span className="text-white bg-mp-bg px-2 py-0.5 rounded border border-mp-border select-all">
                            {item.address}
                          </span>
                        ) : (
                          <span className="text-amber-400 italic font-sans">
                            Not assigned yet (click 'Use Connected' or edit)
                          </span>
                        )}

                        {isAssigned && (
                          <button
                            onClick={() => handleCopy(item.address, item.key)}
                            className="p-1 text-mp-text-dim hover:text-white"
                            title="Copy address"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingRole(item.key);
                            setEditInput(item.address || "");
                          }}
                          className="text-[11px] text-mp-accent-light hover:underline font-sans ml-1"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-mp-text-dim">Sepolia Balance:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {item.balance || "0.00 ETH"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Instructions */}
        <div className="p-4 bg-mp-surface/80 border-t border-mp-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-mp-text-muted">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-mp-accent shrink-0" />
            <span>
              Tip: Switch accounts in MetaMask at any time. ModelProof will automatically detect your active role!
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white font-semibold text-xs transition-colors shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
