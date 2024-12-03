import { Connection, PublicKey } from '@solana/web3.js';
import toast from 'react-hot-toast';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_TRANSACTIONS_PER_WINDOW = 10;
const transactionTimestamps = new Map<string, number[]>();

export function checkRateLimit(walletAddress: string): boolean {
  const now = Date.now();
  const userTransactions = transactionTimestamps.get(walletAddress) || [];
  const recentTransactions = userTransactions.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentTransactions.length >= MAX_TRANSACTIONS_PER_WINDOW) {
    toast.error('Transaction rate limit exceeded. Please wait a moment.');
    return false;
  }

  // Update timestamps
  transactionTimestamps.set(walletAddress, [...recentTransactions, now]);
  return true;
}

// RPC Configuration
export const RPC_ENDPOINTS = [
  import.meta.env.VITE_RPC_ENDPOINT,
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com'
];

export const getWorkingRPC = async (): Promise<string> => {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint);
      await connection.getLatestBlockhash();
      return endpoint;
    } catch (e) {
      console.warn(`RPC ${endpoint} failed, trying next...`);
    }
  }
  throw new Error('No working RPC endpoint found');
};

// Transaction monitoring
export const monitorTransaction = async (
  connection: Connection,
  signature: string,
  maxRetries = 30
): Promise<boolean> => {
  let retries = maxRetries;
  
  while (retries > 0) {
    try {
      const status = await connection.getSignatureStatus(signature);
      
      if (status?.value?.confirmationStatus === 'finalized') {
        toast.success('Transaction confirmed!');
        return true;
      }
      
      if (status?.value?.err) {
        toast.error('Transaction failed. Please try again.');
        return false;
      }
    } catch (e) {
      console.warn(`Error monitoring transaction: ${e}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    retries--;
  }
  
  toast.error('Transaction confirmation timeout. Please check your wallet for status.');
  return false;
};

// Error handling utilities
export const handleTransactionError = (error: any): string => {
  console.error('Transaction error:', error);
  
  if (typeof error === 'string') {
    if (error.includes('insufficient funds')) {
      return 'Insufficient SOL balance for transaction';
    }
    if (error.includes('TokenAccountNotFoundError')) {
      return 'Token account not found. Please try again.';
    }
  }
  
  if (error.message) {
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient SOL balance for transaction';
    }
    if (error.message.includes('TokenAccountNotFoundError')) {
      return 'Token account not found. Please try again.';
    }
  }
  
  return 'Transaction failed. Please try again later.';
};

// Analytics tracking (basic implementation)
export const logTransaction = (type: string, amount: number, wallet: string) => {
  try {
    // Basic console logging - replace with your analytics service
    console.log('Transaction:', {
      event: 'token_purchase',
      properties: {
        type,
        amount,
        wallet: wallet.slice(0, 8),
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {
    console.error('Analytics error:', e);
  }
};
