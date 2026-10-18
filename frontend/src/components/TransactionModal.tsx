import React from "react";
import { CheckCircle2, Loader2, ExternalLink, X, ShieldAlert, ArrowRight } from "lucide-react";

export type TxStep = "idle" | "preparing" | "wallet_prompt" | "submitted" | "confirmed" | "error";

export interface RevenueSplitDisplay {
  totalEth: string;
  creatorShareEth: string;
  adminFeeEth: string;
  creatorAddress?: string;
  adminAddress?: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  step: TxStep;
  txHash?: string;
  errorMessage?: string;
  statusMessage?: string;
  title?: string;
  splitInfo?: RevenueSplitDisplay;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  step,
  txHash,
  errorMessage,
  statusMessage,
  title = "Blockchain Transaction",
  splitInfo,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-mp-border bg-mp-surface p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-mp-text-muted hover:text-white hover:bg-mp-surface-2 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>

        {/* 98% / 2% Revenue Split Card if present */}
        {splitInfo && (
          <div className="mb-4 p-3.5 rounded-xl bg-mp-bg border border-mp-border/70 space-y-2 text-xs">
            <div className="flex items-center justify-between text-mp-text-muted pb-1.5 border-b border-mp-border/50">
              <span>Total Payment</span>
              <span className="font-mono font-bold text-white text-sm">
                {splitInfo.totalEth} ETH
              </span>
            </div>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-medium">98% to Creator</span>
                <span className="font-mono text-emerald-300 font-semibold">
                  {splitInfo.creatorShareEth} ETH
                </span>
              </div>
              {splitInfo.creatorAddress && (
                <div className="text-[10px] font-mono text-mp-text-dim truncate">
                  To: {splitInfo.creatorAddress}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-purple-400 font-medium">2% to Admin Protocol</span>
                <span className="font-mono text-purple-300 font-semibold">
                  {splitInfo.adminFeeEth} ETH
                </span>
              </div>
              {splitInfo.adminAddress && (
                <div className="text-[10px] font-mono text-mp-text-dim truncate">
                  To: {splitInfo.adminAddress}
                </div>
              )}
            </div>
          </div>
        )}

        {step === "preparing" && (
          <div className="flex flex-col items-center py-6 text-center space-y-3">
            <Loader2 className="h-10 w-10 text-mp-accent animate-spin" />
            <h4 className="font-medium text-white">Preparing Transaction...</h4>
            <p className="text-xs text-mp-text-muted">
              Hashing model artifact and building on-chain calldata.
            </p>
          </div>
        )}

        {step === "wallet_prompt" && (
          <div className="flex flex-col items-center py-6 text-center space-y-3">
            <Loader2 className="h-10 w-10 text-mp-accent animate-spin" />
            <h4 className="font-medium text-white">
              {statusMessage?.includes("Waiting") || statusMessage?.includes("approve") ? "MetaMask Authorization" : "Waiting for MetaMask Confirmation"}
            </h4>
            <p className="text-xs text-mp-text-muted">
              {statusMessage || "Please inspect and sign the transaction prompt in your Web3 wallet."}
            </p>
          </div>
        )}

        {step === "submitted" && (
          <div className="flex flex-col items-center py-6 text-center space-y-3">
            <Loader2 className="h-10 w-10 text-mp-accent-light animate-spin" />
            <h4 className="font-medium text-white">Processing On Blockchain</h4>
            <p className="text-xs text-mp-text-muted">
              {statusMessage || "Broadcasting to blockchain mempool. Waiting for block inclusion..."}
            </p>
            {txHash && (
              <div className="text-[11px] font-mono text-mp-accent-light break-all px-3 py-1.5 rounded bg-mp-bg border border-mp-border">
                {txHash}
              </div>
            )}
          </div>
        )}

        {step === "confirmed" && (
          <div className="flex flex-col items-center py-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base">Transaction Confirmed ✓</h4>
              <p className="text-xs text-mp-text-muted mt-1">
                Sepolia ETH transfer and license registration recorded immutably.
              </p>
            </div>
            {txHash && (
              <div className="w-full">
                <div className="text-[11px] font-mono text-mp-accent-light break-all px-3 py-2 rounded-lg bg-mp-bg border border-mp-border mb-3">
                  Tx: {txHash}
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-mp-accent-light hover:underline font-medium"
                >
                  <span>View on Etherscan</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-mp-accent hover:bg-mp-accent-light text-white text-xs font-semibold tracking-wide transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center py-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base">Transaction Failed</h4>
              <p className="text-xs text-red-400 mt-1 max-w-xs break-words">
                {errorMessage || "The transaction was rejected or reverted by the network."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-mp-surface-2 hover:bg-mp-surface text-white text-xs font-semibold border border-mp-border transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
