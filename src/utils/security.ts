import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { CONFIG } from '../config';

// List of known trusted partners (you can add more)
const TRUSTED_PARTNERS = new Set([
  CONFIG.VAULT_WALLET.toString(),
]);

// Simulation configuration

// Check if an address is a trusted partner
export const isTrustedPartner = (address: string): boolean => {
  return TRUSTED_PARTNERS.has(address);
};

// Validate transaction amounts are within reasonable limits
export const validateTransactionAmounts = (
  tokenAmount: number,
  solAmount: number
): boolean => {
  // Check if amounts are within configured limits
  if (tokenAmount < CONFIG.MIN_PURCHASE || tokenAmount > CONFIG.MAX_PURCHASE) {
    throw new Error(`Invalid token amount. Must be between ${CONFIG.MIN_PURCHASE} and ${CONFIG.MAX_PURCHASE}`);
  }

  // Check if SOL amount is reasonable (add buffer for fees)
  const expectedSolAmount = tokenAmount * CONFIG.PRICE_PER_TOKEN;
  const maxAllowedDifference = 0.01; // 0.01 SOL buffer for fees
  
  if (Math.abs(solAmount - expectedSolAmount) > maxAllowedDifference) {
    throw new Error('Transaction amount mismatch');
  }

  return true;
};

// Simulate transaction to check for potential issues
export const simulateTransaction = async (
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
  _feePayer: PublicKey
): Promise<boolean> => {
  try {
    if (transaction instanceof VersionedTransaction) {
      const response = await connection.simulateTransaction(transaction);
      
      if (response.value.err) {
        console.error('Transaction simulation failed:', response.value.err);
        throw new Error('Transaction simulation failed');
      }

      // Check logs for any suspicious patterns
      const logs = response.value.logs || [];
      const suspiciousPatterns = [
        'unauthorized',
        'invalid program',
        'insufficient funds',
        'invalid account data'
      ];

      for (const log of logs) {
        if (suspiciousPatterns.some(pattern => log.toLowerCase().includes(pattern))) {
          console.error('Suspicious log detected:', log);
          throw new Error('Suspicious transaction pattern detected');
        }
      }

      return true;
    }

    throw new Error('Unsupported transaction type');
  } catch (error) {
    console.error('Transaction simulation error:', error);
    throw error;
  }
};

// Validate transaction recipients
export const validateTransactionRecipients = (
  recipients: string[],
  expectedRecipient: string
): boolean => {
  // Ensure we're only sending to our expected vault
  if (recipients.length !== 1 || recipients[0] !== expectedRecipient) {
    throw new Error('Invalid transaction recipient');
  }
  return true;
};

// Rate limiting to prevent spam
const RATE_LIMIT = {
  windowMs: 60000, // 1 minute
  maxRequests: 5
};

const userRequests = new Map<string, number[]>();

export const checkRateLimit = (userAddress: string): boolean => {
  const now = Date.now();
  const userTimes = userRequests.get(userAddress) || [];
  
  // Remove old requests
  const recentRequests = userTimes.filter(time => now - time < RATE_LIMIT.windowMs);
  
  if (recentRequests.length >= RATE_LIMIT.maxRequests) {
    throw new Error('Rate limit exceeded. Please wait before making more transactions.');
  }
  
  // Add new request
  recentRequests.push(now);
  userRequests.set(userAddress, recentRequests);
  
  return true;
};

// Add more comprehensive suspicious patterns

// Add domain verification
const VERIFIED_DOMAINS = new Set([
  'localhost',
  'localhost:5173', // Vite default dev port
  CONFIG.APP_URL,
  new URL(CONFIG.APP_URL).hostname
]);

export const isVerifiedDomain = (origin: string): boolean => {
  try {
    const hostname = new URL(origin).hostname;
    return VERIFIED_DOMAINS.has(hostname) || VERIFIED_DOMAINS.has(origin);
  } catch {
    return false;
  }
};

// Add transaction origin verification
export const validateTransactionOrigin = (origin: string): boolean => {
  if (!isVerifiedDomain(origin)) {
    throw new Error('Invalid transaction origin');
  }
  return true;
};
