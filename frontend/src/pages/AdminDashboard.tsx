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
  AlertTriangle,
  FileCheck2,
  Cpu,
  Pause,
  Play,
  Trash2,
  UserX,
  UserCheck,
  Ban,
  ShieldAlert,
  Search,
  UserPlus,
} from "lucide-react";
import {
  executeSetAdminOnChain,
  executeSetPlatformFeeOnChain,
  readAdminAddressOnChain,
  readPlatformFeeBpsOnChain,
  executePauseContract,
  executeUnpauseContract,
  readIsContractPaused,
  executeDeactivateUserOnChain,
  executeReactivateUserOnChain,
  readIsUserDeactivatedOnChain,
  executeDeleteModelOnChain,
  executeDeactivateModelOnChain,
  executeReactivateModelOnChain,
  executeRegisterBuyerOnChain,
  executeRegisterCreatorOnChain,
  readAllBuyersOnChain,
  readAllCreatorsOnChain,
} from "../services/contractService";
import {
  deleteModelInDb,
  deactivateModelInDb,
  reactivateModelInDb,
  fetchGovernanceStatusFromDb,
  updateGovernancePauseInDb,
  updateUserStatusInDb,
  fetchAllUsersFromDb,
  registerUserInDb,
} from "../services/apiService";
import { TransactionModal, TxStep } from "../components/TransactionModal";
import { Address } from "viem";

export const AdminDashboard: React.FC = () => {
  const { address, role, chainId, configuredAccounts, configuredBalances, setAccountForRole } = useWallet();
  const { models, licenses, deactivateModel, reactivateModel, deleteModel } = useModels();

  const [onChainAdmin, setOnChainAdmin] = useState<string>("");
  const [onChainFeeBps, setOnChainFeeBps] = useState<number>(200);
  const [newAdminInput, setNewAdminInput] = useState<string>("");
  const [newFeeInput, setNewFeeInput] = useState<string>("200");

  // System Pause State
  const [isSystemPaused, setIsSystemPaused] = useState<boolean>(false);
  const [isCheckingPause, setIsCheckingPause] = useState<boolean>(true);

  // User Governance State
  const [onChainBuyers, setOnChainBuyers] = useState<string[]>([]);
  const [onChainCreators, setOnChainCreators] = useState<string[]>([]);
  const [newBuyerInput, setNewBuyerInput] = useState<string>("");
  const [newCreatorInput, setNewCreatorInput] = useState<string>("");
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [deactivatedUsers, setDeactivatedUsers] = useState<Set<string>>(new Set());
  const [targetUserAddress, setTargetUserAddress] = useState<string>("");
  const [userSearchFilter, setUserSearchFilter] = useState<string>("");

  // Transaction Modal State
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [modalTitle, setModalTitle] = useState<string>("Admin Governance Transaction");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load on-chain and backend governance values
  useEffect(() => {
    let isMounted = true;
    const loadContractData = async () => {
      try {
        const [admin, fee, pausedOnChain, govDb, usersDb, buyers, creators] = await Promise.all([
          readAdminAddressOnChain(chainId),
          readPlatformFeeBpsOnChain(chainId),
          readIsContractPaused(chainId),
          fetchGovernanceStatusFromDb(),
          fetchAllUsersFromDb(),
          readAllBuyersOnChain(chainId),
          readAllCreatorsOnChain(chainId),
        ]);
        if (isMounted) {
          if (admin) setOnChainAdmin(admin);
          if (fee) setOnChainFeeBps(fee);
          setIsSystemPaused(pausedOnChain || govDb.paused);
          setRegisteredUsers(usersDb || []);
          if (buyers) setOnChainBuyers(buyers);
          if (creators) setOnChainCreators(creators);

          const deactSet = new Set<string>((govDb.deactivated_users || []).map((u: string) => u.toLowerCase()));
          (usersDb || []).forEach((u: any) => {
            if (u.is_deactivated) deactSet.add(u.address.toLowerCase());
          });
          setDeactivatedUsers(deactSet);
          setIsCheckingPause(false);
        }
      } catch (err) {
        if (isMounted) setIsCheckingPause(false);
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

  // ---------------------------------------------------------------------------
  // Handlers: System Pause & Resume
  // ---------------------------------------------------------------------------
  const handleToggleSystemPause = async () => {
    if (!address) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }

    const targetAction = isSystemPaused ? "resume" : "pause";
    setModalTitle(isSystemPaused ? "Resume Platform Operations" : "Emergency Pause Circuit Breaker");
    setIsModalOpen(true);
    setTxStep("wallet_prompt");
    setStatusMessage(
      isSystemPaused
        ? "Please confirm unpause() transaction in MetaMask to re-enable platform operations..."
        : "Please confirm pause() emergency transaction in MetaMask to halt model operations..."
    );

    try {
      let hash: string;
      if (isSystemPaused) {
        hash = await executeUnpauseContract({
          account: address as Address,
          chainId,
          onTxSubmitted: (h) => {
            setTxHash(h);
            setTxStep("submitted");
            setStatusMessage("Unpause transaction submitted. Waiting for blockchain confirmation...");
          },
        });
        setIsSystemPaused(false);
        await updateGovernancePauseInDb(false);
      } else {
        hash = await executePauseContract({
          account: address as Address,
          chainId,
          onTxSubmitted: (h) => {
            setTxHash(h);
            setTxStep("submitted");
            setStatusMessage("Emergency pause transaction submitted. Waiting for blockchain confirmation...");
          },
        });
        setIsSystemPaused(true);
        await updateGovernancePauseInDb(true);
      }
      setTxHash(hash);
      setTxStep("confirmed");
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || `Failed to ${targetAction} system on-chain.`);
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers: User Deactivation / Reactivation (Buyer or Creator)
  // ---------------------------------------------------------------------------
  const handleToggleUserStatus = async (userAddr: string, currentlyDeactivated: boolean) => {
    if (!address) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }
    const cleanAddr = userAddr.trim().toLowerCase();
    if (!cleanAddr.startsWith("0x") || cleanAddr.length !== 42) {
      alert("Please enter a valid 42-character Ethereum address (0x...)");
      return;
    }

    const actionText = currentlyDeactivated ? "reactivateUser" : "deactivateUser";
    setModalTitle(currentlyDeactivated ? "Reactivate User Account" : "Deactivate / Ban User Account");
    setIsModalOpen(true);
    setTxStep("wallet_prompt");
    setStatusMessage(`Please confirm ${actionText}(${cleanAddr.slice(0, 10)}...) transaction in MetaMask...`);

    try {
      let hash: string;
      if (currentlyDeactivated) {
        hash = await executeReactivateUserOnChain({
          userAddress: cleanAddr as Address,
          account: address as Address,
          chainId,
          onTxSubmitted: (h) => {
            setTxHash(h);
            setTxStep("submitted");
            setStatusMessage("Reactivation transaction submitted. Awaiting block receipt...");
          },
        });
        setDeactivatedUsers((prev) => {
          const next = new Set(prev);
          next.delete(cleanAddr);
          return next;
        });
        await updateUserStatusInDb(cleanAddr, false);
      } else {
        hash = await executeDeactivateUserOnChain({
          userAddress: cleanAddr as Address,
          account: address as Address,
          chainId,
          onTxSubmitted: (h) => {
            setTxHash(h);
            setTxStep("submitted");
            setStatusMessage("Deactivation transaction submitted. Awaiting block receipt...");
          },
        });
        setDeactivatedUsers((prev) => {
          const next = new Set(prev);
          next.add(cleanAddr);
          return next;
        });
        await updateUserStatusInDb(cleanAddr, true);
      }
      setTxHash(hash);
      setTxStep("confirmed");
      setTargetUserAddress("");
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || `Failed to execute ${actionText} on-chain.`);
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers: Register New Buyer & New Creator (Explicit Solidity Function Calls)
  // ---------------------------------------------------------------------------
  const handleRegisterBuyer = async () => {
    if (!address) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }
    const cleanAddr = newBuyerInput.trim();
    if (!cleanAddr.startsWith("0x") || cleanAddr.length !== 42) {
      alert("Please enter a valid 42-character Ethereum address (0x...)");
      return;
    }

    setModalTitle("Register New Buyer On-Chain");
    setIsModalOpen(true);
    setTxStep("wallet_prompt");
    setStatusMessage(`Please confirm registerBuyer(${cleanAddr.slice(0, 6)}...${cleanAddr.slice(-4)}) in MetaMask...`);

    try {
      const hash = await executeRegisterBuyerOnChain({
        buyerAddress: cleanAddr as Address,
        account: address as Address,
        chainId,
        onTxSubmitted: (h) => {
          setTxHash(h);
          setTxStep("submitted");
          setStatusMessage("Buyer registration transaction submitted. Awaiting block receipt...");
        },
      });
      setTxHash(hash);
      setTxStep("confirmed");
      setOnChainBuyers((prev) => Array.from(new Set([...prev, cleanAddr.toLowerCase()])));

      // Persist in backend SQLite DB so it permanently remains on refresh
      await registerUserInDb(cleanAddr, "buyer");
      setAccountForRole("buyer", cleanAddr);
      setRegisteredUsers((prev) => [
        ...prev.filter((u) => u.address.toLowerCase() !== cleanAddr.toLowerCase()),
        {
          address: cleanAddr,
          role: "buyer",
          first_seen_at: Date.now(),
          last_seen_at: Date.now(),
          is_deactivated: false,
        },
      ]);
      setNewBuyerInput("");
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || "Failed to register buyer on-chain.");
    }
  };

  const handleRegisterCreator = async () => {
    if (!address) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }
    const cleanAddr = newCreatorInput.trim();
    if (!cleanAddr.startsWith("0x") || cleanAddr.length !== 42) {
      alert("Please enter a valid 42-character Ethereum address (0x...)");
      return;
    }

    setModalTitle("Register New Creator On-Chain");
    setIsModalOpen(true);
    setTxStep("wallet_prompt");
    setStatusMessage(`Please confirm registerCreator(${cleanAddr.slice(0, 6)}...${cleanAddr.slice(-4)}) in MetaMask...`);

    try {
      const hash = await executeRegisterCreatorOnChain({
        creatorAddress: cleanAddr as Address,
        account: address as Address,
        chainId,
        onTxSubmitted: (h) => {
          setTxHash(h);
          setTxStep("submitted");
          setStatusMessage("Creator registration transaction submitted. Awaiting block receipt...");
        },
      });
      setTxHash(hash);
      setTxStep("confirmed");
      setOnChainCreators((prev) => Array.from(new Set([...prev, cleanAddr.toLowerCase()])));

      // Persist in backend SQLite DB so it permanently remains on refresh
      await registerUserInDb(cleanAddr, "creator");
      setAccountForRole("creator", cleanAddr);
      setRegisteredUsers((prev) => [
        ...prev.filter((u) => u.address.toLowerCase() !== cleanAddr.toLowerCase()),
        {
          address: cleanAddr,
          role: "creator",
          first_seen_at: Date.now(),
          last_seen_at: Date.now(),
          is_deactivated: false,
        },
      ]);
      setNewCreatorInput("");
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || "Failed to register creator on-chain.");
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers: Model Deactivation / Reactivation & Deletion
  // ---------------------------------------------------------------------------
  const handleToggleModelActive = async (modelId: number, currentActive: boolean) => {
    if (!address) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }

    const actionText = currentActive ? "deactivateModel" : "reactivateModel";
    setModalTitle(currentActive ? "Deactivate Model Listing" : "Reactivate Model Listing");
    setIsModalOpen(true);
    setTxStep("wallet_prompt");
    setStatusMessage(`Please confirm ${actionText}(#${modelId}) in MetaMask...`);

    try {
      let hash: string;
      if (currentActive) {
        hash = await executeDeactivateModelOnChain({
          modelId,
          account: address as Address,
          chainId,
          onTxSubmitted: (h) => {
            setTxHash(h);
            setTxStep("submitted");
            setStatusMessage(`Deactivate transaction submitted for Model #${modelId}...`);
          },
        });
        await deactivateModel(modelId);
        await deactivateModelInDb(modelId);
      } else {
        hash = await executeReactivateModelOnChain({
          modelId,
          account: address as Address,
          chainId,
          onTxSubmitted: (h) => {
            setTxHash(h);
            setTxStep("submitted");
            setStatusMessage(`Reactivate transaction submitted for Model #${modelId}...`);
          },
        });
        await reactivateModel(modelId);
        await reactivateModelInDb(modelId);
      }
      setTxHash(hash);
      setTxStep("confirmed");
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || `Failed to ${actionText} model.`);
    }
  };

  const handleDeleteModel = async (modelId: number, modelName: string) => {
    if (!address) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${modelName}" (Model #${modelId})?\n\nThis will execute the deleteModel() Solidity function on-chain and remove it from marketplace listings.`
    );
    if (!confirmDelete) return;

    setModalTitle(`Permanently Delete Model #${modelId}`);
    setIsModalOpen(true);
    setTxStep("wallet_prompt");
    setStatusMessage(`Please review and sign deleteModel(#${modelId}) transaction in MetaMask...`);

    try {
      const hash = await executeDeleteModelOnChain({
        modelId,
        account: address as Address,
        chainId,
        onTxSubmitted: (h) => {
          setTxHash(h);
          setTxStep("submitted");
          setStatusMessage(`deleteModel transaction broadcasted. Awaiting block receipt...`);
        },
      });
      setTxHash(hash);
      setTxStep("confirmed");
      await deleteModel(modelId);
      await deleteModelInDb(modelId);
    } catch (e: any) {
      setTxStep("error");
      setErrorMsg(e.message || "Failed to execute deleteModel on-chain.");
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers: Set Admin & Platform Fee
  // ---------------------------------------------------------------------------
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
      setModalTitle("Update Protocol Fee Recipient");
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
      setModalTitle("Update Platform Fee (BPS)");
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

  // Build unique known users list based on explicit registrations & model/license activity
  const knownUsersMap = new Map<string, { role: string; modelsCount: number; licensesCount: number; firstSeen?: number; lastSeen?: number }>();

  // 1. Populate registered users from backend SQLite DB (persisted across page reloads)
  registeredUsers.forEach((u) => {
    const addr = u.address.toLowerCase();
    const roleLabel =
      addr === "0x022b8d7378982e11af76ad351c58d71501c15a60".toLowerCase()
        ? "Configured Buyer"
        : addr === "0x740576446af2ec9f567729073bbe0e4522e3e878".toLowerCase()
        ? "Platform Admin"
        : u.role === "creator"
        ? "Registered Creator"
        : u.role === "admin"
        ? "Platform Admin"
        : "Registered Buyer";
    knownUsersMap.set(addr, {
      role: roleLabel,
      modelsCount: models.filter((m) => m.creator.toLowerCase() === addr).length,
      licensesCount: licenses.filter((l) => l.licensee.toLowerCase() === addr).length,
      firstSeen: u.first_seen_at,
      lastSeen: u.last_seen_at,
    });
  });

  // 2. Populate registered creators from Solidity smart contract
  onChainCreators.forEach((c) => {
    const addr = c.toLowerCase();
    const existing = knownUsersMap.get(addr);
    if (!existing) {
      knownUsersMap.set(addr, {
        role: "Registered Creator (On-Chain)",
        modelsCount: models.filter((m) => m.creator.toLowerCase() === addr).length,
        licensesCount: licenses.filter((l) => l.licensee.toLowerCase() === addr).length,
      });
    }
  });

  // 3. Populate registered buyers from Solidity smart contract
  onChainBuyers.forEach((b) => {
    const addr = b.toLowerCase();
    const existing = knownUsersMap.get(addr);
    if (existing) {
      if (existing.role.includes("Creator")) {
        existing.role = "Registered Creator & Buyer (On-Chain)";
      }
    } else {
      knownUsersMap.set(addr, {
        role: "Registered Buyer (On-Chain)",
        modelsCount: models.filter((m) => m.creator.toLowerCase() === addr).length,
        licensesCount: licenses.filter((l) => l.licensee.toLowerCase() === addr).length,
      });
    }
  });

  // 3. Fallback check for configured demo accounts
  if (configuredAccounts?.admin && !knownUsersMap.has(configuredAccounts.admin.toLowerCase())) {
    knownUsersMap.set(configuredAccounts.admin.toLowerCase(), {
      role: "Platform Admin",
      modelsCount: 0,
      licensesCount: 0,
    });
  }
  if (configuredAccounts?.creator && !knownUsersMap.has(configuredAccounts.creator.toLowerCase())) {
    knownUsersMap.set(configuredAccounts.creator.toLowerCase(), {
      role: "Configured Creator",
      modelsCount: models.filter((m) => m.creator.toLowerCase() === configuredAccounts.creator.toLowerCase()).length,
      licensesCount: 0,
    });
  }
  if (configuredAccounts?.buyer && !knownUsersMap.has(configuredAccounts.buyer.toLowerCase())) {
    knownUsersMap.set(configuredAccounts.buyer.toLowerCase(), {
      role: "Configured Buyer",
      modelsCount: 0,
      licensesCount: licenses.filter((l) => l.licensee.toLowerCase() === configuredAccounts.buyer.toLowerCase()).length,
    });
  }

  // 4. Merge any additional models/licenses creators and buyers
  models.forEach((m) => {
    const c = m.creator.toLowerCase();
    if (!knownUsersMap.has(c)) {
      knownUsersMap.set(c, {
        role: "Model Creator",
        modelsCount: models.filter((item) => item.creator.toLowerCase() === c).length,
        licensesCount: 0,
      });
    }
  });

  licenses.forEach((l) => {
    const lic = l.licensee.toLowerCase();
    if (!knownUsersMap.has(lic)) {
      knownUsersMap.set(lic, {
        role: "License Buyer",
        modelsCount: 0,
        licensesCount: licenses.filter((item) => item.licensee.toLowerCase() === lic).length,
      });
    }
  });

  const knownUsersList = Array.from(knownUsersMap.entries()).filter(([addr]) => {
    if (!userSearchFilter.trim()) return true;
    return addr.includes(userSearchFilter.trim().toLowerCase());
  });

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
            Admin Console & Smart Contract Controls
          </h1>
          <p className="text-sm text-mp-text-muted mt-1">
            Manage on-chain pause/resume breakers, deactivate users, delete invalid models, and oversee protocol fee distribution.
          </p>
        </div>

        {/* Emergency System Pause Banner Status */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold backdrop-blur-md shadow-lg transition-all ${
              isSystemPaused
                ? "bg-red-500/15 border-red-500/40 text-red-300 shadow-red-500/10"
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isSystemPaused ? "bg-red-400 animate-ping" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span>{isSystemPaused ? "SYSTEM PAUSED (CIRCUIT BREAKER ON)" : "SYSTEM OPERATIONAL & ACTIVE"}</span>
          </div>
        </div>
      </div>

      {/* EMERGENCY CIRCUIT BREAKER SECTION */}
      <div className={`rounded-2xl border p-6 space-y-4 transition-all shadow-xl ${
        isSystemPaused
          ? "border-red-500/50 bg-red-950/20 shadow-red-500/10"
          : "border-mp-border bg-mp-surface"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`h-5 w-5 ${isSystemPaused ? "text-red-400" : "text-amber-400"}`} />
              <h2 className="text-lg font-bold text-white">
                Emergency Circuit Breaker (Solidity <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/40">pause()</code> & <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/40">unpause()</code>)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-mp-text-muted max-w-3xl leading-relaxed">
              When tripped, the contract's <code className="font-mono text-mp-accent-light">whenNotPaused</code> modifier halts all new model registrations, versioning, and license purchases immediately on Ethereum. Calling this triggers an immutable on-chain state update.
            </p>
          </div>

          <button
            onClick={handleToggleSystemPause}
            className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all transform active:scale-95 shadow-lg shrink-0 ${
              isSystemPaused
                ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30"
                : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
            }`}
          >
            {isSystemPaused ? (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Resume System Operations</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Trigger Emergency Pause</span>
              </>
            )}
          </button>
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

      {/* USER ACCOUNT GOVERNANCE: DEACTIVATE / REACTIVATE BUYER OR CREATOR */}
      <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-mp-accent-light" />
              <h2 className="text-lg font-bold text-white">
                User Governance (Solidity <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/40">deactivateUser</code> & <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/40">reactivateUser</code>)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-mp-text-muted">
              Deactivate malicious creators (blocks model registration) or rogue buyers (blocks license purchases) directly on Ethereum.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-mp-bg border border-mp-border text-mp-text-muted">
              {deactivatedUsers.size} Deactivated Address{deactivatedUsers.size === 1 ? "" : "es"}
            </span>
          </div>
        </div>

        {/* On-Chain Registration Cards for New Buyer and New Creator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Register New Buyer */}
          <div className="p-4 rounded-xl bg-mp-bg border border-mp-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-blue-400" />
                <span>Register New Buyer (Solidity <code className="text-[11px] font-mono px-1 py-0.5 rounded bg-black/40">registerBuyer</code>):</span>
              </label>
              {address && (
                <button
                  type="button"
                  onClick={() => setNewBuyerInput(address)}
                  className="text-[10px] text-mp-accent-light hover:underline font-mono"
                >
                  Use Connected
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBuyerInput}
                onChange={(e) => setNewBuyerInput(e.target.value)}
                placeholder="0x... (Buyer Ethereum address)"
                className="flex-1 bg-mp-surface border border-mp-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-mp-accent"
              />
              <button
                onClick={handleRegisterBuyer}
                disabled={!newBuyerInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Register Buyer</span>
              </button>
            </div>
            <div className="text-[11px] text-mp-text-dim flex items-center justify-between">
              <span>Recorded in <code className="font-mono text-blue-300">allBuyers</code></span>
              <span className="font-mono font-bold text-blue-400">{onChainBuyers.length} Registered</span>
            </div>
          </div>

          {/* Register New Creator */}
          <div className="p-4 rounded-xl bg-mp-bg border border-mp-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-purple-400" />
                <span>Register New Creator (Solidity <code className="text-[11px] font-mono px-1 py-0.5 rounded bg-black/40">registerCreator</code>):</span>
              </label>
              {address && (
                <button
                  type="button"
                  onClick={() => setNewCreatorInput(address)}
                  className="text-[10px] text-mp-accent-light hover:underline font-mono"
                >
                  Use Connected
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCreatorInput}
                onChange={(e) => setNewCreatorInput(e.target.value)}
                placeholder="0x... (Creator Ethereum address)"
                className="flex-1 bg-mp-surface border border-mp-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-mp-accent"
              />
              <button
                onClick={handleRegisterCreator}
                disabled={!newCreatorInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Register Creator</span>
              </button>
            </div>
            <div className="text-[11px] text-mp-text-dim flex items-center justify-between">
              <span>Recorded in <code className="font-mono text-purple-300">allCreators</code></span>
              <span className="font-mono font-bold text-purple-400">{onChainCreators.length} Registered</span>
            </div>
          </div>
        </div>

        {/* Custom Address Deactivation Bar */}
        <div className="p-4 rounded-xl bg-mp-bg border border-mp-border space-y-3">
          <label className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Ban className="h-3.5 w-3.5 text-red-400" />
            <span>Target Any Ethereum Wallet Address (Creator or Buyer):</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={targetUserAddress}
              onChange={(e) => setTargetUserAddress(e.target.value)}
              placeholder="0x... (42-character Ethereum address)"
              className="flex-1 bg-mp-surface border border-mp-border rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-mp-accent"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleUserStatus(targetUserAddress, false)}
                disabled={!targetUserAddress.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
              >
                <UserX className="h-3.5 w-3.5" />
                <span>Deactivate User</span>
              </button>
              <button
                onClick={() => handleToggleUserStatus(targetUserAddress, true)}
                disabled={!targetUserAddress.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Reactivate User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Known Platform Users Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Known Platform Participants ({knownUsersList.length})
            </h3>
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-mp-text-dim" />
              <input
                type="text"
                value={userSearchFilter}
                onChange={(e) => setUserSearchFilter(e.target.value)}
                placeholder="Filter address..."
                className="w-full pl-8 pr-3 py-1.5 bg-mp-bg border border-mp-border rounded-lg text-xs font-mono text-white focus:outline-none focus:border-mp-accent"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-mp-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-mp-surface-2 text-mp-text-dim border-b border-mp-border font-medium">
                <tr>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Role Designation</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Solidity Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mp-border/60">
                {knownUsersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-mp-text-dim">
                      No matching user addresses found.
                    </td>
                  </tr>
                ) : (
                  knownUsersList.map(([userAddr, details]) => {
                    const isDeactivated = deactivatedUsers.has(userAddr);
                    return (
                      <tr key={userAddr} className="hover:bg-mp-surface-2/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-white break-all">
                          {userAddr}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-mp-bg border border-mp-border text-[11px] text-mp-accent-light font-medium">
                            {details.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-mp-text-muted">
                          {details.modelsCount > 0 && `${details.modelsCount} model(s)`}
                          {details.modelsCount > 0 && details.licensesCount > 0 && " • "}
                          {details.licensesCount > 0 && `${details.licensesCount} license(s)`}
                          {details.modelsCount === 0 && details.licensesCount === 0 && "Participant"}
                        </td>
                        <td className="px-4 py-3">
                          {isDeactivated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-semibold text-[11px]">
                              <Ban className="h-3 w-3" /> Deactivated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> Authorized
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(userAddr, isDeactivated)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isDeactivated
                                ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                                : "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                            }`}
                          >
                            {isDeactivated ? "Reactivate" : "Deactivate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODEL REGISTRY GOVERNANCE: DELETE / DEACTIVATE / REACTIVATE */}
      <div className="rounded-2xl border border-mp-border bg-mp-surface p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">
                Model Registry Governance (Solidity <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/40">deleteModel</code> & <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/40">deactivateModel</code>)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-mp-text-muted">
              Oversee AI model listings. Admins can permanently delete invalid models or toggle active listing status on-chain.
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-mp-bg border border-mp-border text-mp-text-muted">
            {models.length} Registered Model{models.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-mp-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-mp-surface-2 text-mp-text-dim border-b border-mp-border font-medium">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Model Name & Framework</th>
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">License Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mp-border/60">
              {models.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-mp-text-dim">
                    No models registered in the system.
                  </td>
                </tr>
              ) : (
                models.map((m) => {
                  const isDeleted = m.description?.includes("[DELETED]");
                  return (
                    <tr key={m.modelId} className="hover:bg-mp-surface-2/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-mp-text-dim font-bold">
                        #{m.modelId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="text-[11px] text-mp-text-dim">
                          {m.version} • {m.framework} • {m.modelType}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-mp-text-muted text-[11px]">
                        {m.creator.slice(0, 6)}...{m.creator.slice(-4)}
                      </td>
                      <td className="px-4 py-3 font-mono text-white font-semibold">
                        {m.licensePriceEth} ETH
                      </td>
                      <td className="px-4 py-3">
                        {isDeleted ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-semibold text-[11px]">
                            Deleted
                          </span>
                        ) : m.active ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                            Active Listing
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-[11px]">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {!isDeleted && (
                          <button
                            onClick={() => handleToggleModelActive(m.modelId, m.active)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              m.active
                                ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {m.active ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteModel(m.modelId, m.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition-all inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
        title={modalTitle}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
