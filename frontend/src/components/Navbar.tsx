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
    // Automatically redirect if current path is restricted under the newly selected role
    if (newRole === "buyer" && (location.pathname === "/dashboard" || location.pathname === "/register" || location.pathname === "/admin")) {
      navigate("/marketplace");
    } else if (newRole === "creator" && (location.pathname === "/licenses" || location.pathname === "/admin")) {
      navigate("/dashboard");
    } else if (newRole === "admin" && (location.pathname === "/licenses" || location.pathname === "/dashboard" || location.pathname === "/register")) {
      navigate("/admin");
    }
  };

  // Check if current connected address matches active role's assigned address
  const activeRoleAddress = configuredAccounts[role];
  const isAddressMatchingRole =
    !activeRoleAddress ||
    !address ||
    activeRoleAddress.toLowerCase() === address.toLowerCase();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-mp-border/60 bg-mp-bg/85 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-mp-accent to-indigo-600 flex items-center justify-center shadow-lg shadow-mp-accent/20 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                ModelProof
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-mp-accent/20 text-mp-accent-light border border-mp-accent/30">
                  Web3
                </span>
              </span>
            </div>
          </Link>

          {/* Center / Quick Info */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mp-surface border border-mp-border text-mp-text-muted">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Settlement Split:{" "}
                <strong className="text-emerald-400">98% Creator</strong> •{" "}
                <strong className="text-purple-400">2% Admin</strong>
              </span>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 3 Accounts Button */}
            <button
              onClick={() => setIsAccountsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mp-surface hover:bg-mp-surface-2 text-mp-text hover:text-white border border-mp-border hover:border-mp-accent transition-all text-xs font-medium shadow-sm"
              title="Manage 3 MetaMask accounts (Buyer, Creator, Admin)"
            >
              <Users className="h-3.5 w-3.5 text-mp-accent-light" />
              <span className="hidden sm:inline">3 Accounts</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-mp-accent/20 text-mp-accent-light">
                3
              </span>
            </button>

            {/* AI Assistant button */}
            <button
              onClick={onOpenAssistant}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-mp-surface-2 hover:bg-mp-surface text-mp-accent-light hover:text-white border border-mp-accent/30 hover:border-mp-accent transition-all text-xs font-medium shadow-sm"
              title="Ask ModelProof AI"
            >
              <Sparkles className="h-3.5 w-3.5 text-mp-accent" />
              <span>AI</span>
            </button>

            {/* Role switcher */}
            <div className="flex items-center bg-mp-surface rounded-xl p-0.5 border border-mp-border text-xs shadow-inner">
              {(["buyer", "creator", "admin"] as const).map((r) => {
                const isActive = role === r;
                const activeColor =
                  r === "creator"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                    : r === "admin"
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                    : "bg-blue-600 text-white shadow-sm shadow-blue-500/20";

                return (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all ${
                      isActive
                        ? activeColor
                        : "text-mp-text-muted hover:text-mp-text hover:bg-mp-surface-2/60"
                    }`}
                    title={`Switch role to ${r}`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            {/* Network indicator */}
            <button
              onClick={() => switchNetwork(chainId === 11155111 ? 31337 : 11155111)}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                isCorrectNetwork
                  ? "bg-mp-surface border-mp-border text-mp-text hover:border-mp-accent/50"
                  : "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25 animate-pulse"
              }`}
              title="Click to switch network in MetaMask"
            >
              {isCorrectNetwork ? (
                <span className="h-2 w-2 rounded-full bg-mp-success" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              )}
              <span>{isCorrectNetwork ? networkName : "Switch Network"}</span>
            </button>

            {/* Wallet Connection */}
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setIsAccountsModalOpen(true)}
                  className="hidden sm:flex flex-col text-right cursor-pointer hover:opacity-80"
                  title="Click to manage 3 accounts"
                >
                  <span className="text-xs font-semibold text-white tracking-wide font-mono">
                    {displayAddress}
                  </span>
                  <span className="text-[11px] text-mp-accent-light font-mono font-medium">
                    {balance}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mp-surface hover:bg-red-500/10 text-mp-text hover:text-red-400 border border-mp-border hover:border-red-500/30 transition-all text-xs font-medium"
                  title="Disconnect MetaMask wallet"
                >
                  <Wallet className="h-3.5 w-3.5 text-mp-accent" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold tracking-wide shadow-lg shadow-mp-accent/20 transition-all active:scale-95 animate-pulse"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect MetaMask</span>
              </button>
            )}
          </div>
        </div>

        {/* Warning banner if current connected account differs from active role assigned address */}
        {!isAddressMatchingRole && isConnected && (
          <div className="bg-amber-500/15 border-t border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                MetaMask is currently on <strong>{displayAddress}</strong>, but active role is <strong>{role}</strong> (assigned to {activeRoleAddress.slice(0, 6)}...{activeRoleAddress.slice(-4)}).
              </span>
            </div>
            <button
              onClick={() => setIsAccountsModalOpen(true)}
              className="text-[11px] font-semibold underline hover:text-white"
            >
              Open 3-Account Manager
            </button>
          </div>
        )}
      </header>

      {/* 3 Accounts Configuration Modal */}
      <ThreeAccountModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
      />
    </>
  );
};
