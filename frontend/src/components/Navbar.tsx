import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useWallet, UserRole } from "../context/WalletContext";
import {
  ShieldCheck,
  Wallet,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ChevronDown,
  Activity,
  BarChart3,
} from "lucide-react";
import { ThreeAccountModal } from "./ThreeAccountModal";

interface NavbarProps {
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant }) => {
  const {
    address,
    displayAddress,
    isConnected,
    balance,
    chainId,
    networkName,
    role,
    isCorrectNetwork,
    configuredAccounts,
    connectWallet,
    disconnectWallet,
    switchRole,
    switchNetwork,
  } = useWallet();

  const navigate = useNavigate();
  const location = useLocation();
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);

  const handleRoleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    if (newRole === "buyer" && (location.pathname === "/dashboard" || location.pathname === "/register" || location.pathname === "/admin")) {
      navigate("/marketplace");
    } else if (newRole === "creator" && (location.pathname === "/licenses" || location.pathname === "/admin")) {
      navigate("/dashboard");
    } else if (newRole === "admin" && (location.pathname === "/licenses" || location.pathname === "/dashboard" || location.pathname === "/register")) {
      navigate("/admin");
    }
  };

  const navLinks = [
    { label: "Marketplace", path: "/marketplace" },
    ...(role === "buyer" ? [{ label: "My Licenses", path: "/licenses" }] : []),
    ...(role === "creator"
      ? [
          { label: "Register Model", path: "/register" },
          { label: "Creator Studio", path: "/dashboard" },
        ]
      : []),
    ...(role === "admin" ? [{ label: "Protocol Governance", path: "/admin" }] : []),
    { label: "Verify", path: "/verify" },
    { label: "Analytics", path: "/analytics" },
  ];

  return (
    <>
      <header className="sticky top-3 z-50 w-full px-3 sm:px-6 max-w-7xl mx-auto transition-all">
        <div className="rounded-2xl border border-mp-border bg-mp-surface/90 backdrop-blur-xl px-4 py-2.5 shadow-2xl shadow-black/50 flex items-center justify-between gap-3">
          
          {/* Brand - Swiss Minimalist Typography */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-mp-surface-2 border border-mp-border group-hover:border-mp-accent-light flex items-center justify-center transition-all">
                <span className="font-mono font-black text-xs text-mp-accent-light">MP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white uppercase">
                  ModelProof
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-mp-accent-light" />
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 border-l border-mp-border/60 pl-4">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-mp-surface-2 text-white font-semibold border border-mp-border"
                        : "text-mp-text-muted hover:text-white hover:bg-mp-surface-2/40"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Minimalist Role Pill Switcher */}
            <div className="flex items-center bg-mp-bg rounded-xl p-1 border border-mp-border/80 text-[11px] font-mono">
              {(["buyer", "creator", "admin"] as const).map((r) => {
                const isActive = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`px-2.5 py-1 rounded-lg uppercase tracking-wider font-semibold transition-all ${
                      isActive
                        ? "bg-mp-surface-2 text-mp-accent-light border border-mp-accent/40 shadow-sm"
                        : "text-mp-text-dim hover:text-mp-text"
                    }`}
                    title={`Switch role to ${r}`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>


            {/* Network Badge */}
            <button
              onClick={() => switchNetwork(chainId === 11155111 ? 31337 : 11155111)}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors ${
                isCorrectNetwork
                  ? "bg-mp-bg border-mp-border text-mp-text-muted hover:text-white"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isCorrectNetwork ? "bg-emerald-400" : "bg-red-400 animate-pulse"}`} />
              <span>{isCorrectNetwork ? networkName : "Wrong Net"}</span>
            </button>

            {/* Wallet Button */}
            {isConnected ? (
              <div className="flex items-center gap-2 bg-mp-surface-2 border border-mp-border rounded-xl px-2.5 py-1">
                {balance && (
                  <span className="text-xs font-mono font-semibold text-mp-accent-light hidden sm:inline">
                    {parseFloat(balance).toFixed(3)} ETH
                  </span>
                )}
                <button
                  onClick={disconnectWallet}
                  className="font-mono text-xs text-white hover:text-mp-accent-light px-1.5 py-0.5 rounded transition-colors"
                  title="Disconnect wallet"
                >
                  {displayAddress}
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>Connect</span>
              </button>
            )}

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAssistant}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-mp-surface-2 border border-mp-border text-mp-accent-light hover:text-white hover:border-mp-accent-light transition-all"
              title="Open AI Analysis Assistant"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 px-1 text-xs">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-mp-surface text-white border border-mp-border"
                    : "text-mp-text-muted hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      <ThreeAccountModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
      />
    </>
  );
};
