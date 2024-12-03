import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { CONFIG } from '../config';
import { Loader2 } from 'lucide-react';

interface TokenPurchaseFormProps {
  onSubmit: (amount: string) => void;
  loading: boolean;
  minAmount: number;
  maxAmount: number;
}

export const TokenPurchaseForm: React.FC<TokenPurchaseFormProps> = ({
  onSubmit,
  loading,
  minAmount,
  maxAmount
}) => {
  const [amount, setAmount] = useState('');
  const { publicKey } = useWallet();
  const [solCost, setSolCost] = useState<number | null>(null);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (!isNaN(Number(value))) {
      setSolCost(Number(value) * CONFIG.PRICE_PER_TOKEN);
    } else {
      setSolCost(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      return;
    }
    onSubmit(amount);
  };

  if (!publicKey) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400 text-sm sm:text-base">Connect your wallet to begin your magical journey</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50 text-base transition-all duration-200 border border-gray-800"
              placeholder="Enter amount"
              disabled={loading}
              min={minAmount}
              max={maxAmount}
              step="any"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAmountChange(minAmount.toString())}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-black/20 rounded-lg hover:bg-black/30 transition-colors duration-200 text-sm font-medium border border-gray-800"
            >
              Min
            </button>
            <button
              type="button"
              onClick={() => handleAmountChange(maxAmount.toString())}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-black/20 rounded-lg hover:bg-black/30 transition-colors duration-200 text-sm font-medium border border-gray-800"
            >
              Max
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Min: {minAmount.toLocaleString()} | Max: {maxAmount.toLocaleString()}
        </p>
      </div>

      {solCost !== null && (
        <div className="text-sm text-gray-400 bg-black/20 p-3 rounded-lg border border-gray-800">
          Estimated Cost: <span className="text-yellow-400">{solCost.toFixed(4)} SOL</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !amount || isNaN(Number(amount))}
        className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Transaction...
          </div>
        ) : (
          'Purchase MEOWZ Tokens'
        )}
      </button>
    </form>
  );
};