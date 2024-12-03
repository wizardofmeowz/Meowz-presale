import React from 'react';
import { ExternalLink } from 'lucide-react';
import { CONFIG } from '../config';

interface TransactionDetailsProps {
  isOpen: boolean;
  signature?: string;
  amount: number;
  solCost: number;
  buyerAddress: string;
  vaultAddress: string;
  tokenMint: string;
  timestamp: string;
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  isOpen,
  signature,
  amount,
  solCost,
  buyerAddress,
  vaultAddress,
  tokenMint,
  timestamp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="mt-4 p-4 bg-[#13141a] rounded-lg border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-3">Transaction Details</h3>
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-400">Status:</span>
          <span className="text-green-500 ml-2">Confirmed</span>
        </div>
        
        <div>
          <span className="text-gray-400">Timestamp:</span>
          <span className="text-white ml-2">{new Date(timestamp).toLocaleString()}</span>
        </div>

        <div className="pt-2 border-t border-gray-800">
          <h4 className="text-white font-medium mb-2">Token Transfer</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white text-right">
                {amount.toLocaleString()} {CONFIG.TOKEN_SYMBOL}
                <br />
                <span className="text-sm text-gray-500">
                  ({(amount * (10 ** CONFIG.TOKEN_DECIMALS)).toLocaleString()} raw)
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">From:</span>
              <a
                href={`https://solscan.io/account/${String(vaultAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {String(vaultAddress).slice(0, 4)}...{String(vaultAddress).slice(-4)}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">To:</span>
              <a
                href={`https://solscan.io/account/${buyerAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {buyerAddress.slice(0, 4)}...{buyerAddress.slice(-4)}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Token:</span>
              <a
                href={`https://solscan.io/token/${tokenMint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {CONFIG.TOKEN_SYMBOL}
              </a>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-800">
          <h4 className="text-white font-medium mb-2">SOL Transfer</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white text-right">
                {solCost.toFixed(4)} SOL
                <br />
                <span className="text-sm text-gray-500">
                  ({(solCost * (10 ** 9)).toLocaleString()} lamports)
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">From:</span>
              <a
                href={`https://solscan.io/account/${buyerAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {buyerAddress.slice(0, 4)}...{buyerAddress.slice(-4)}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">To:</span>
              <a
                href={`https://solscan.io/account/${String(vaultAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {String(vaultAddress).slice(0, 4)}...{String(vaultAddress).slice(-4)}
              </a>
            </div>
          </div>
        </div>

        {signature && (
          <div className="pt-3 border-t border-gray-800">
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-400 hover:text-blue-300"
            >
              View on Solscan
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
