import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  Address,
  Hash,
  type Abi,
} from "viem";
import { sepolia, hardhat } from "viem/chains";
import contractConfig from "../contracts/modelProofConfig.json";

export const CONTRACT_ADDRESS = (contractConfig.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as Address;
export const CONTRACT_ABI = contractConfig.abi as unknown as Abi;

export function getPublicClient(chainId?: number) {
  const chain = chainId === 11155111 ? sepolia : hardhat;
  const isLocal = chainId === 31337 || (!chainId && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"));
  return createPublicClient({
    chain,
    transport: isLocal ? http("http://127.0.0.1:8545") : http(),
  });
}

export function getWalletClient(account: Address, chainId: number = 31337) {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    const chain = chainId === 11155111 ? sepolia : hardhat;
    return createWalletClient({
      account,
      chain,
      transport: custom((window as any).ethereum),
    });
  }
  return null;
}

/**
 * Checks whether a smart contract is actually deployed at CONTRACT_ADDRESS on the current chain.
 */
export async function isContractDeployed(chainId?: number): Promise<boolean> {
  try {
    const publicClient = getPublicClient(chainId);
    const bytecode = await publicClient.getBytecode({ address: CONTRACT_ADDRESS });
    return Boolean(bytecode && bytecode !== "0x");
  } catch (e) {
    console.warn("Could not check contract bytecode:", e);
    return false;
  }
}

/**
 * Checks if a specific modelId exists on the smart contract before trying to call it.
 */
export async function isModelRegisteredOnChain(modelId: number, chainId?: number): Promise<boolean> {
  try {
    const deployed = await isContractDeployed(chainId);
    if (!deployed) return false;
    const publicClient = getPublicClient(chainId);
    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "modelCount",
    });
    return BigInt(modelId) <= (count as bigint);
  } catch (e) {
    return false;
  }
}

/**
 * Waits for a transaction receipt on the blockchain and asserts it succeeded.
 * Throws if the transaction was reverted or failed in MetaMask / EVM.
 */
export async function waitForTransactionSuccess(hash: Hash, chainId?: number): Promise<void> {
  const publicClient = getPublicClient(chainId);
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      timeout: 90_000,
    });
    if (receipt.status === "reverted") {
      throw new Error(`Transaction reverted on-chain in MetaMask (Tx: ${hash.slice(0, 10)}...). Reason: Contract execution reverted.`);
    }
  } catch (err: any) {
    if (err.message?.includes("reverted")) {
      throw err;
    }
    throw new Error(err.shortMessage || err.message || "Failed waiting for transaction confirmation on blockchain.");
  }
}

/**
 * Triggers a real MetaMask transaction prompt to register an AI/ML model on-chain.
 */
export async function executeRegisterModelOnChain({
  name,
  description,
  framework,
  version,
  modelHash,
  ipfsCid,
  priceEth,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  name: string;
  description: string;
  framework: string;
  version: string;
  modelHash: string;
  ipfsCid: string;
  priceEth: string;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected. Please install the MetaMask extension.");
  }

  const deployed = await isContractDeployed(chainId);
  if (!deployed) {
    throw new Error(`No smart contract is deployed at ${CONTRACT_ADDRESS} on network chainId ${chainId}.`);
  }

  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) {
    throw new Error("Could not initialize wallet client for MetaMask.");
  }

  // Ensure hash is valid bytes32
  let formattedHash = modelHash;
  if (!formattedHash.startsWith("0x")) {
    formattedHash = `0x${formattedHash}`;
  }
  if (formattedHash.length < 66) {
    formattedHash = formattedHash.padEnd(66, "0");
  } else if (formattedHash.length > 66) {
    formattedHash = formattedHash.slice(0, 66);
  }

  const priceWei = parseEther(priceEth);
  const chain = chainId === 11155111 ? sepolia : hardhat;

  // 1. Prompt MetaMask
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "registerModel",
    args: [name, description, framework, version, formattedHash as `0x${string}`, ipfsCid, priceWei],
    account,
    chain,
  });

  onTxSubmitted?.(hash);

  // 2. Wait for block confirmation & ensure not reverted
  await waitForTransactionSuccess(hash, chainId);

  return hash;
}

/**
 * Triggers a real MetaMask transaction prompt to purchase a 30-day model license with ETH on-chain.
 */
export async function executePurchaseLicenseOnChain({
  modelId,
  priceEth,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  modelId: number;
  priceEth: string;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected. Please install the MetaMask extension.");
  }

  const deployed = await isContractDeployed(chainId);
  if (!deployed) {
    throw new Error(
      `No smart contract is deployed at ${CONTRACT_ADDRESS} on this network. Direct transfer should be used.`
    );
  }

  const existsOnChain = await isModelRegisteredOnChain(modelId, chainId);
  if (!existsOnChain) {
    throw new Error(`Model #${modelId} is not registered on the smart contract yet. Please use direct account transfer.`);
  }

  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) {
    throw new Error("Could not initialize wallet client for MetaMask.");
  }

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const valueWei = parseEther(priceEth);

  // 1. Prompt MetaMask
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "purchaseLicense",
    args: [BigInt(modelId)],
    value: valueWei,
    account,
    chain,
  });

  onTxSubmitted?.(hash);

  // 2. Wait for block confirmation & verify success
  await waitForTransactionSuccess(hash, chainId);

  return hash;
}

/**
 * Triggers a real MetaMask transaction prompt to purchase full, perpetual Model Ownership on-chain.
 * Grants lifetime license, raw weights access, and ModelProof Verified status.
 */
export async function executePurchaseModelOwnershipOnChain({
  modelId,
  priceEth,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  modelId: number;
  priceEth: string;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected. Please install the MetaMask extension.");
  }

  const deployed = await isContractDeployed(chainId);
  if (!deployed) {
    throw new Error(
      `No smart contract is deployed at ${CONTRACT_ADDRESS} on this network.`
    );
  }

  const existsOnChain = await isModelRegisteredOnChain(modelId, chainId);
  if (!existsOnChain) {
    throw new Error(`Model #${modelId} is not registered on the smart contract yet.`);
  }

  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) {
    throw new Error("Could not initialize wallet client for MetaMask.");
  }

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const valueWei = parseEther(priceEth);

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "purchaseModelOwnership",
    args: [BigInt(modelId)],
    value: valueWei,
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

/**
 * Checks if a specific buyer holds full model ownership on-chain.
 */
export async function readHasModelOwnershipOnChain(
  modelId: number,
  buyerAddress: string,
  chainId?: number
): Promise<boolean> {
  try {
    if (!buyerAddress || !buyerAddress.startsWith("0x")) return false;
    const deployed = await isContractDeployed(chainId);
    if (!deployed) return false;
    const publicClient = getPublicClient(chainId);
    const hasOwnership = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "checkOwnership",
      args: [BigInt(modelId), buyerAddress as Address],
    });
    return Boolean(hasOwnership);
  } catch (e) {
    return false;
  }
}

/**
 * Triggers a real MetaMask transaction prompt to withdraw creator earnings.
 */
export async function executeWithdrawEarningsOnChain({
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected. Please install the MetaMask extension.");
  }

  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) {
    throw new Error("Could not initialize wallet client for MetaMask.");
  }

  const chain = chainId === 11155111 ? sepolia : hardhat;

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "withdrawEarnings",
    args: [],
    account,
    chain,
  });

  onTxSubmitted?.(hash);

  await waitForTransactionSuccess(hash, chainId);

  return hash;
}

/**
 * Updates on-chain Admin address (platform fee recipient).
 */
export async function executeSetAdminOnChain({
  newAdmin,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  newAdmin: Address;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }

  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) {
    throw new Error("Could not initialize wallet client.");
  }

  const chain = chainId === 11155111 ? sepolia : hardhat;

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "setAdmin",
    args: [newAdmin],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);

  return hash;
}

/**
 * Updates platform fee BPS on-chain (max 2000 = 20%, default 200 = 2%).
 */
export async function executeSetPlatformFeeOnChain({
  newFeeBps,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  newFeeBps: number;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }

  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) {
    throw new Error("Could not initialize wallet client.");
  }

  const chain = chainId === 11155111 ? sepolia : hardhat;

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "setPlatformFee",
    args: [BigInt(newFeeBps)],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);

  return hash;
}

/**
 * Reads current admin address directly from smart contract.
 */
export async function readAdminAddressOnChain(chainId?: number): Promise<string> {
  try {
    const deployed = await isContractDeployed(chainId);
    if (!deployed) return "";
    const publicClient = getPublicClient(chainId);
    const admin = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "adminAddress",
    });
    return String(admin);
  } catch (e) {
    return "";
  }
}

/**
 * Reads current platform fee BPS from smart contract.
 */
export async function readPlatformFeeBpsOnChain(chainId?: number): Promise<number> {
  try {
    const deployed = await isContractDeployed(chainId);
    if (!deployed) return 200;
    const publicClient = getPublicClient(chainId);
    const feeBps = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "platformFeeBps",
    });
    return Number(feeBps);
  } catch (e) {
    return 200; // default 2%
  }
}

/**
 * Direct 98% Creator and 2% Admin transfer via MetaMask.
 * Sequentially prompts for Creator (98%) and Admin (2%), awaiting on-chain block confirmation
 * for each so MetaMask does not reject concurrent/nonce conflicting transactions.
 */
export async function executeDirectTransfer98_2({
  buyerAccount,
  creatorAccount,
  adminAccount,
  priceEth,
  chainId,
  onStatusUpdate,
}: {
  buyerAccount: string;
  creatorAccount: string;
  adminAccount: string;
  priceEth: string;
  chainId?: number;
  onStatusUpdate?: (status: string, txHash?: string) => void;
}): Promise<{ creatorTxHash: string; adminTxHash: string }> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected. Please install the MetaMask extension.");
  }

  const totalWei = parseEther(priceEth);
  const feeWei = (totalWei * 200n) / 10000n; // 2% to admin
  const creatorWei = totalWei - feeWei;      // 98% to creator

  // 1. Send 98% to Creator in MetaMask
  onStatusUpdate?.("Please approve 98% Creator payment in MetaMask...");
  const creatorTxHash: Hash = await (window as any).ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: buyerAccount,
        to: creatorAccount,
        value: `0x${creatorWei.toString(16)}`,
      },
    ],
  });

  onStatusUpdate?.("Waiting for Creator (98%) transaction confirmation on blockchain...", creatorTxHash);
  await waitForTransactionSuccess(creatorTxHash, chainId);

  // 2. Send 2% to Admin in MetaMask
  onStatusUpdate?.("Creator payment confirmed! Now approve 2% Admin fee in MetaMask...", creatorTxHash);
  const adminTxHash: Hash = await (window as any).ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: buyerAccount,
        to: adminAccount,
        value: `0x${feeWei.toString(16)}`,
      },
    ],
  });

  onStatusUpdate?.("Waiting for Admin (2%) protocol fee transaction confirmation on blockchain...", adminTxHash);
  await waitForTransactionSuccess(adminTxHash, chainId);

  return { creatorTxHash, adminTxHash };
}

// ---------------------------------------------------------------------------
// On-Chain Emergency Governance & System Controls
// ---------------------------------------------------------------------------

/**
 * Pauses all smart contract operations (registerModel, purchaseLicense, createModelVersion).
 * Emergency circuit-breaker called by Admin/Owner in MetaMask.
 */
export async function executePauseContract({
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) throw new Error("Could not initialize wallet client.");

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "pause",
    args: [],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

/**
 * Resumes smart contract operations after emergency pause.
 */
export async function executeUnpauseContract({
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) throw new Error("Could not initialize wallet client.");

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "unpause",
    args: [],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

/**
 * Reads whether the contract is currently paused on-chain.
 */
export async function readIsContractPaused(chainId?: number): Promise<boolean> {
  try {
    const deployed = await isContractDeployed(chainId);
    if (!deployed) return false;
    const publicClient = getPublicClient(chainId);
    const isPaused = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "paused",
    });
    return Boolean(isPaused);
  } catch (e) {
    return false;
  }
}

/**
 * Registers a new buyer on-chain in Solidity via registerBuyer(address).
 */
export async function executeRegisterBuyerOnChain({
  buyerAddress,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  buyerAddress: Address;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) throw new Error("Could not initialize wallet client.");

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "registerBuyer",
    args: [buyerAddress],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

/**
 * Registers a new creator on-chain in Solidity via registerCreator(address).
 */
export async function executeRegisterCreatorOnChain({
  creatorAddress,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  creatorAddress: Address;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) throw new Error("Could not initialize wallet client.");

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "registerCreator",
    args: [creatorAddress],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

/**
 * Reads all registered buyers from the smart contract.
 */
export async function readAllBuyersOnChain(chainId?: number): Promise<string[]> {
  try {
    const deployed = await isContractDeployed(chainId);
    if (!deployed) return [];
    const publicClient = getPublicClient(chainId);
    const buyers = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getAllBuyers",
    });
    return Array.isArray(buyers) ? (buyers as string[]) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Reads all registered creators from the smart contract.
 */
export async function readAllCreatorsOnChain(chainId?: number): Promise<string[]> {
  try {
    const deployed = await isContractDeployed(chainId);
    if (!deployed) return [];
    const publicClient = getPublicClient(chainId);
    const creators = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getAllCreators",
    });
    return Array.isArray(creators) ? (creators as string[]) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Deactivates/blacklists a user address (creator or buyer) on-chain in Solidity.
 */
export async function executeDeactivateUserOnChain({
  userAddress,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  userAddress: Address;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) throw new Error("Could not initialize wallet client.");

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "deactivateUser",
    args: [userAddress],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

/**
 * Reactivates a user address (creator or buyer) on-chain in Solidity.
 */
export async function executeReactivateUserOnChain({
  userAddress,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  userAddress: Address;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) throw new Error("Could not initialize wallet client.");

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "reactivateUser",
    args: [userAddress],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

/**
 * Checks whether a user address is deactivated on-chain.
 */
export async function readIsUserDeactivatedOnChain(
  userAddress: string,
  chainId?: number
): Promise<boolean> {
  try {
    if (!userAddress || !userAddress.startsWith("0x")) return false;
    const deployed = await isContractDeployed(chainId);
    if (!deployed) return false;
    const publicClient = getPublicClient(chainId);
    const deactivated = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "isUserDeactivated",
      args: [userAddress as Address],
    });
    return Boolean(deactivated);
  } catch (e) {
    return false;
  }
}

/**
 * Permanently deletes / marks a model inactive on-chain via Solidity deleteModel.
 */
export async function executeDeleteModelOnChain({
  modelId,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  modelId: number;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) throw new Error("Could not initialize wallet client.");

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "deleteModel",
    args: [BigInt(modelId)],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

/**
 * Deactivates a model on-chain via Solidity deactivateModel.
 */
export async function executeDeactivateModelOnChain({
  modelId,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  modelId: number;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) throw new Error("Could not initialize wallet client.");

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "deactivateModel",
    args: [BigInt(modelId)],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

/**
 * Reactivates a model on-chain via Solidity reactivateModel.
 */
export async function executeReactivateModelOnChain({
  modelId,
  account,
  chainId = 31337,
  onTxSubmitted,
}: {
  modelId: number;
  account: Address;
  chainId?: number;
  onTxSubmitted?: (hash: Hash) => void;
}): Promise<Hash> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask is not detected.");
  }
  const walletClient = getWalletClient(account, chainId);
  if (!walletClient) throw new Error("Could not initialize wallet client.");

  const chain = chainId === 11155111 ? sepolia : hardhat;
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "reactivateModel",
    args: [BigInt(modelId)],
    account,
    chain,
  });

  onTxSubmitted?.(hash);
  await waitForTransactionSuccess(hash, chainId);
  return hash;
}

export { parseEther, formatEther };
