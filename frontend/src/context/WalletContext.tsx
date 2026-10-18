import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { formatEther } from "viem";

export type UserRole = "creator" | "buyer" | "admin";

export interface ConfiguredAccounts {
  buyer: string;
  creator: string;
  admin: string;
}

export interface ConfiguredBalances {
  buyer: string;
  creator: string;
  admin: string;
}

interface WalletContextType {
  address: string | null;
  displayAddress: string;
  isConnected: boolean;
  isMetaMask: boolean;
  chainId: number;
  networkName: string;
  balance: string;
  role: UserRole;
  isCorrectNetwork: boolean;
  configuredAccounts: ConfiguredAccounts;
  configuredBalances: ConfiguredBalances;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchRole: (role: UserRole) => void;
  switchNetwork: (targetChainId: number) => Promise<void>;
  assignCurrentAccountToRole: (role: UserRole) => void;
  setAccountForRole: (role: UserRole, accountAddress: string) => void;
  refreshBalances: () => Promise<void>;
}

const STORAGE_KEY = "modelproof_3_accounts_v2";

const DEFAULT_ACCOUNTS: ConfiguredAccounts = {
  buyer: "0x022B8D7378982E11AF76Ad351C58D71501c15A60",
  creator: "0x24522a62C4aa130225D415Ee2b222fd473E90B83",
  admin: "0x740576446aF2EC9F567729073bbE0e4522e3E878",
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMetaMask, setIsMetaMask] = useState<boolean>(false);
  const [chainId, setChainId] = useState<number>(11155111); // Default to Sepolia
  const [balance, setBalance] = useState<string>("0.00 ETH");
  const [role, setRole] = useState<UserRole>("buyer");

  const [configuredAccounts, setConfiguredAccounts] = useState<ConfiguredAccounts>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.buyer && parsed.creator && parsed.admin) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read saved accounts:", e);
    }
    return DEFAULT_ACCOUNTS;
  });

  const [configuredBalances, setConfiguredBalances] = useState<ConfiguredBalances>({
    buyer: "0.00 ETH",
    creator: "0.00 ETH",
    admin: "0.00 ETH",
  });

  // Save to localStorage when accounts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configuredAccounts));
    } catch (e) {
      console.warn("Could not save accounts to localStorage:", e);
    }
  }, [configuredAccounts]);

  // Fetch balance helper for single address
  const fetchSingleBalance = useCallback(async (accountAddress: string): Promise<string> => {
    if (!accountAddress || typeof window === "undefined" || !(window as any).ethereum) {
      return "0.00 ETH";
    }
    try {
      const hexBalance = await (window as any).ethereum.request({
        method: "eth_getBalance",
        params: [accountAddress, "latest"],
      });
      if (hexBalance) {
        const wei = BigInt(hexBalance);
        const eth = parseFloat(formatEther(wei)).toFixed(4);
        return `${eth} ETH`;
      }
    } catch (err) {
      console.warn(`Could not fetch balance for ${accountAddress}:`, err);
    }
    return "0.00 ETH";
  }, []);

  // Refresh balances for all 3 configured accounts + active account
  const refreshBalances = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    if (address) {
      const activeBal = await fetchSingleBalance(address);
      setBalance(activeBal);
    }

    const [buyerBal, creatorBal, adminBal] = await Promise.all([
      configuredAccounts.buyer ? fetchSingleBalance(configuredAccounts.buyer) : Promise.resolve("0.00 ETH"),
      configuredAccounts.creator ? fetchSingleBalance(configuredAccounts.creator) : Promise.resolve("0.00 ETH"),
      configuredAccounts.admin ? fetchSingleBalance(configuredAccounts.admin) : Promise.resolve("0.00 ETH"),
    ]);

    setConfiguredBalances({
      buyer: buyerBal,
      creator: creatorBal,
      admin: adminBal,
    });
  }, [address, configuredAccounts, fetchSingleBalance]);

  // Assign currently connected MetaMask account to a role
  const assignCurrentAccountToRole = useCallback((targetRole: UserRole) => {
    if (!address) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }
    setConfiguredAccounts((prev) => ({
      ...prev,
      [targetRole]: address,
    }));
    setRole(targetRole);
  }, [address]);

  // Manually set an address for a specific role
  const setAccountForRole = useCallback((targetRole: UserRole, accountAddress: string) => {
    setConfiguredAccounts((prev) => ({
      ...prev,
      [targetRole]: accountAddress.trim(),
    }));
  }, []);

  // Initialize and listen to MetaMask events
  const initMetaMask = useCallback(async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      setIsMetaMask(true);

      try {
        const hexChainId = await (window as any).ethereum.request({
          method: "eth_chainId",
        });
        if (hexChainId) {
          setChainId(parseInt(hexChainId, 16));
        }

        const accounts = await (window as any).ethereum.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          const currentAcc = accounts[0];
          setAddress(currentAcc);
          setIsConnected(true);

          // Auto-detect role matching configured accounts
          if (configuredAccounts.buyer && currentAcc.toLowerCase() === configuredAccounts.buyer.toLowerCase()) {
            setRole("buyer");
          } else if (configuredAccounts.creator && currentAcc.toLowerCase() === configuredAccounts.creator.toLowerCase()) {
            setRole("creator");
          } else if (configuredAccounts.admin && currentAcc.toLowerCase() === configuredAccounts.admin.toLowerCase()) {
            setRole("admin");
          }
        }
      } catch (err) {
        console.warn("Error reading initial MetaMask status:", err);
      }

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          const newAcc = accounts[0];
          setAddress(newAcc);
          setIsConnected(true);

          // Auto-switch role if matching one of the 3 accounts
          if (configuredAccounts.buyer && newAcc.toLowerCase() === configuredAccounts.buyer.toLowerCase()) {
            setRole("buyer");
          } else if (configuredAccounts.creator && newAcc.toLowerCase() === configuredAccounts.creator.toLowerCase()) {
            setRole("creator");
          } else if (configuredAccounts.admin && newAcc.toLowerCase() === configuredAccounts.admin.toLowerCase()) {
            setRole("admin");
          }
        } else {
          setAddress(null);
          setIsConnected(false);
          setBalance("0.00 ETH");
        }
      };

      const handleChainChanged = (newHexChainId: string) => {
        setChainId(parseInt(newHexChainId, 16));
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if ((window as any).ethereum?.removeListener) {
          (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
          (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [configuredAccounts]);

  useEffect(() => {
    initMetaMask();
  }, [initMetaMask]);

  // Refresh balances whenever address, chainId, or configuredAccounts change
  useEffect(() => {
    refreshBalances();
  }, [address, chainId, configuredAccounts, refreshBalances]);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts && accounts[0]) {
          const acc = accounts[0];
          setAddress(acc);
          setIsConnected(true);

          const hexChainId = await (window as any).ethereum.request({
            method: "eth_chainId",
          });
          setChainId(parseInt(hexChainId, 16));

          // If no accounts configured yet, set current account as buyer by default
          if (!configuredAccounts.buyer && !configuredAccounts.creator && !configuredAccounts.admin) {
            setConfiguredAccounts((prev) => ({ ...prev, buyer: acc }));
          }

          return;
        }
      } catch (err: any) {
        if (err.code === 4001) {
          alert("MetaMask connection request was rejected. Please approve the prompt in MetaMask to connect.");
        } else {
          console.error("MetaMask connection error:", err);
        }
      }
    } else {
      alert("MetaMask extension not detected! Please ensure the MetaMask extension is installed in your browser.");
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setBalance("0.00 ETH");
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  const switchNetwork = async (targetChainId: number) => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const hexId = `0x${targetChainId.toString(16)}`;
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hexId }],
        });
        setChainId(targetChainId);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            if (targetChainId === 31337) {
              await (window as any).ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x7a69",
                    chainName: "Localhost 8545 (Hardhat)",
                    rpcUrls: ["http://127.0.0.1:8545"],
                    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                  },
                ],
              });
            } else if (targetChainId === 11155111) {
              await (window as any).ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0xaa36a7",
                    chainName: "Sepolia Testnet",
                    rpcUrls: ["https://rpc.sepolia.org"],
                    nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
                    blockExplorerUrls: ["https://sepolia.etherscan.io"],
                  },
                ],
              });
            }
            setChainId(targetChainId);
          } catch (addError) {
            console.error("Failed to add network to MetaMask", addError);
          }
        } else {
          console.error("Failed to switch network in MetaMask", switchError);
        }
      }
    } else {
      setChainId(targetChainId);
    }
  };

  const networkName =
    chainId === 11155111
      ? "Sepolia"
      : chainId === 31337
      ? "Local Hardhat"
      : chainId === 1
      ? "Ethereum Mainnet"
      : "Unknown Network";

  const isCorrectNetwork = chainId === 11155111 || chainId === 31337;

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <WalletContext.Provider
      value={{
        address,
        displayAddress,
        isConnected,
        isMetaMask,
        chainId,
        networkName,
        balance,
        role,
        isCorrectNetwork,
        configuredAccounts,
        configuredBalances,
        connectWallet,
        disconnectWallet,
        switchRole,
        switchNetwork,
        assignCurrentAccountToRole,
        setAccountForRole,
        refreshBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
};
