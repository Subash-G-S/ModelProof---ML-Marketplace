import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { useModels } from "../context/ModelContext";
import {
  ShieldCheck,
  Percent,
  Coins,
  Settings,
  ArrowRight,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Cpu,
} from "lucide-react";
import {
  executeSetAdminOnChain,
  executeSetPlatformFeeOnChain,
  readAdminAddressOnChain,
  readPlatformFeeBpsOnChain,
} from "../services/contractService";
import { TransactionModal, TxStep } from "../components/TransactionModal";
import { Address } from "viem";

export const AdminDashboard: React.FC = () => {
  const { address, chainId, configuredAccounts, configuredBalances, setAccountForRole } = useWallet();
  const { models, licenses, withdrawEarnings } = useModels();

  const [onChainAdmin, setOnChainAdmin] = useState<string>("");
  const [onChainFeeBps, setOnChainFeeBps] = useState<number>(200);
  const [newAdminInput, setNewAdminInput] = useState<string>("");
  const [newFeeInput, setNewFeeInput] = useState<string>("200");

  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load on-chain values
  useEffect(() => {
    let isMounted = true;
    const loadContractData = async () => {
      const [admin, fee] = await Promise.all([
        readAdminAddressOnChain(chainId),
        readPlatformFeeBpsOnChain(chainId),
      ]);
      if (isMounted) {
        if (admin) setOnChainAdmin(admin);
        if (fee) setOnChainFeeBps(fee);
      }
    };
    loadContractData();
    return () => {
      isMounted = false;
    };
  }, [chainId]);

  const totalVolumeEth = models.reduce(
    (acc, m) => acc + (m.licenseCount || 0) * parseFloat(m.licensePriceEth),
    0
  );
  const adminRevenueEth = (totalVolumeEth * 0.02).toFixed(4); // 2% protocol fee
  const creatorRevenueEth = (totalVolumeEth * 0.98).toFixed(4); // 98% creators

  const handleUpdateAdmin = async () => {
    if (!address) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }
    if (!newAdminInput.trim().startsWith("0x") || newAdminInput.trim().length !== 42) {
      alert("Please enter a valid 42-character Ethereum address (0x...)");
      return;
    }

    try {
      setIsModalOpen(true);
      setTxStep("wallet_prompt");
      setStatusMessage("Please review and sign admin recipient update in MetaMask...");
      const hash = await executeSetAdminOnChain({
        newAdmin: newAdminInput.trim() as Address,
        account: address as Address,
        chainId,
        onTxSubmitted: (h) => {
          setTxHash(h);
          setTxStep("submitted");
          setStatusMessage("Admin update transaction submitted. Waiting for blockchain confirmation...");
        },
      });
      setTxHash(hash);
      setTxStep("confirmed");
      setOnChainAdmin(newAdminInput.trim());
      setAccountForRole("admin", newAdminInput.trim());
      setNewAdminInput("");
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || "Failed to update admin on-chain.");
    }
  };

  const handleUpdateFee = async () => {
    if (!address) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }
    const feeNum = parseInt(newFeeInput, 10);
    if (isNaN(feeNum) || feeNum < 0 || feeNum > 2000) {
      alert("Please enter a valid fee between 0 and 2000 basis points (max 20%).");
      return;
    }

    try {
      setIsModalOpen(true);
      setTxStep("wallet_prompt");
      setStatusMessage("Please review and sign platform fee update in MetaMask...");
      const hash = await executeSetPlatformFeeOnChain({
        newFeeBps: feeNum,
        account: address as Address,
        chainId,
        onTxSubmitted: (h) => {
          setTxHash(h);
          setTxStep("submitted");
          setStatusMessage("Platform fee transaction submitted. Waiting for blockchain confirmation...");
        },
      });
      setTxHash(hash);
      setTxStep("confirmed");
      setOnChainFeeBps(feeNum);
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || "Failed to update fee on-chain.");
    }
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
              Protocol Governance
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              98% Creator • 2% Admin
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1.5">
            Admin Console & Revenue Split
          </h1>
          <p className="text-sm text-mp-text-muted mt-1">
            Oversee on-chain settlement, verify the 2% protocol fee destination, and configure smart contract governance.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Admin Protocol Fee</span>
            <Percent className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {(onChainFeeBps / 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-purple-400 font-mono">
            {onChainFeeBps} bps on-chain parameter
          </div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Total Admin 2% Revenue</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            {adminRevenueEth} <span className="text-base text-mp-accent-light">ETH</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Immediate Sepolia transfer
          </div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Creators 98% Royalties</span>
            <Coins className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            {creatorRevenueEth} <span className="text-base text-mp-accent-light">ETH</span>
          </div>
          <div className="text-[11px] text-mp-text-dim">
            Distributed to model creators
          </div>
        </div>

        <div className="rounded-2xl border border-mp-border bg-mp-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-mp-text-muted font-medium">
            <span>Admin Sepolia Balance</span>
            <ShieldCheck className="h-4 w-4 text-mp-accent" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono text-emerald-400">
            {configuredBalances.admin || "0.00 ETH"}
          </div>
          <div className="text-[11px] text-mp-text-dim truncate font-mono">
            {configuredAccounts.admin ? `${configuredAccounts.admin.slice(0, 6)}...${configuredAccounts.admin.slice(-4)}` : "No account assigned"}
          </div>
        </div>
      </div>

      {/* Revenue Split Mechanism Card */}
      <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-mp-accent" />
          <span>Automated 98% / 2% Revenue Routing Architecture</span>
        </h2>
        <p className="text-xs sm:text-sm text-mp-text-muted leading-relaxed">
          Every license purchased by a <strong>Buyer</strong> automatically splits the exact Sepolia ETH amount inside the smart contract during the purchase transaction:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-mp-bg border border-mp-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">Model Creator Split</span>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                98.0%
              </span>
            </div>
            <p className="text-xs text-mp-text-muted">
              Transferred directly to the creator's wallet address upon license creation. Immediate liquidity, zero escrow delay.
            </p>
            <div className="text-[11px] text-mp-text-dim font-mono pt-1">
              Recipient: {configuredAccounts.creator || "Creator MetaMask Account"}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-mp-bg border border-mp-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-400">Platform Admin Fee</span>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300">
                2.0%
              </span>
            </div>
            <p className="text-xs text-mp-text-muted">
              Transferred directly to the configured platform Admin address. Sustains protocol verification and IPFS pinning.
            </p>
            <div className="text-[11px] text-mp-text-dim font-mono pt-1">
              Recipient: {configuredAccounts.admin || onChainAdmin || "Admin MetaMask Account"}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Set Admin Address Form */}
        <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-mp-accent" />
            <h3 className="font-semibold text-white text-base">Update On-Chain Admin Address</h3>
          </div>
          <p className="text-xs text-mp-text-muted leading-relaxed">
            Changes the destination address for all future 2% protocol fees. Requires signature from the current contract owner in MetaMask.
          </p>

          <div className="text-xs font-mono p-3 rounded-xl bg-mp-bg border border-mp-border space-y-1">
            <div className="text-mp-text-dim">Current On-Chain Admin:</div>
            <div className="text-mp-accent-light break-all select-all font-semibold">
              {onChainAdmin || configuredAccounts.admin || "0x..."}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white">New Admin Address</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAdminInput}
                onChange={(e) => setNewAdminInput(e.target.value)}
                placeholder="0x..."
                className="flex-1 bg-mp-bg border border-mp-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-mp-accent"
              />
              <button
                onClick={handleUpdateAdmin}
                className="px-4 py-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold transition-all shrink-0"
              >
                Set Admin
              </button>
            </div>
          </div>
        </div>

        {/* Set Platform Fee Form */}
        <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-mp-accent" />
            <h3 className="font-semibold text-white text-base">Platform Fee Configuration (BPS)</h3>
          </div>
          <p className="text-xs text-mp-text-muted leading-relaxed">
            Platform fee is calculated in basis points (10000 = 100%, 200 = 2%). The default and requested configuration is 200 bps (2%).
          </p>

          <div className="text-xs font-mono p-3 rounded-xl bg-mp-bg border border-mp-border space-y-1">
            <div className="text-mp-text-dim">Current Configured Fee:</div>
            <div className="text-purple-400 font-semibold text-sm">
              {onChainFeeBps} Basis Points ({(onChainFeeBps / 100).toFixed(1)}%)
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white">New Fee in Basis Points (e.g. 200 for 2%)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={newFeeInput}
                onChange={(e) => setNewFeeInput(e.target.value)}
                placeholder="200"
                min="0"
                max="2000"
                className="flex-1 bg-mp-bg border border-mp-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-mp-accent"
              />
              <button
                onClick={handleUpdateFee}
                className="px-4 py-2.5 rounded-xl bg-mp-surface-2 hover:bg-mp-surface border border-mp-border hover:border-mp-accent text-white text-xs font-semibold transition-all shrink-0"
              >
                Update Fee
              </button>
            </div>
          </div>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        step={txStep}
        txHash={txHash}
        errorMessage={errorMsg}
        statusMessage={statusMessage}
        title="Admin Governance Transaction"
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
