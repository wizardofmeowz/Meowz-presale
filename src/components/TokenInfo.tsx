import React from 'react';
import { CONFIG } from '../config';

export function TokenInfo() {
  return (
    <div className="mt-8 p-4 bg-[#13141a] rounded-lg border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-3">Token Information</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Token Name:</span>
          <span className="text-white">{CONFIG.TOKEN_NAME}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Symbol:</span>
          <span className="text-white">{CONFIG.TOKEN_SYMBOL}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Price per token:</span>
          <span className="text-white">{CONFIG.PRICE_PER_TOKEN} SOL</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Min purchase:</span>
          <span className="text-white">{CONFIG.MIN_PURCHASE} {CONFIG.TOKEN_SYMBOL}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Max purchase:</span>
          <span className="text-white">{CONFIG.MAX_PURCHASE} {CONFIG.TOKEN_SYMBOL}</span>
        </div>
      </div>
    </div>
  );
}