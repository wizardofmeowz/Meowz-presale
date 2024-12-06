import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { CONFIG } from '../config';

// List of known trusted partners (you can add more)
const TRUSTED_PARTNERS = new Set([
  CONFIG.VAULT_WALLET.toString(),
]);

// List of trusted RPC endpoints
export const RPC_ENDPOINTS = [
  CONFIG.RPC_ENDPOINT,
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

// Simulation configuration

// Check if an address is a trusted partner
export const isTrustedPartner = (address: string): boolean => {
  return TRUSTED_PARTNERS.has(address);
};

// Enhanced rate limiting configuration
export const RATE_LIMIT = {
  windowMs: 60000, // 1 minute
  maxRequests: 5,
  penaltyTime: 300000 // 5 minutes penalty for exceeding
};

// Transaction timeout
export const TRANSACTION_TIMEOUT = 60000; // 1 minute

// Slippage tolerance (0.5%)
export const SLIPPAGE_TOLERANCE = 0.005;

// Input validation
export const validateUserInput = (input: string): boolean => {
  if (!input) return false;
  // Allow only alphanumeric characters and basic punctuation
  return /^[a-zA-Z0-9\s.,!?-]*$/.test(input);
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

  // Check if SOL amount is reasonable (add slippage tolerance)
  const expectedSolAmount = tokenAmount * CONFIG.PRICE_PER_TOKEN;
  const maxAllowedAmount = expectedSolAmount * (1 + SLIPPAGE_TOLERANCE);
  const minAllowedAmount = expectedSolAmount * (1 - SLIPPAGE_TOLERANCE);
  
  if (solAmount > maxAllowedAmount || solAmount < minAllowedAmount) {
    throw new Error(`Price impact too high. Maximum slippage: ${SLIPPAGE_TOLERANCE * 100}%`);
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
      console.log('Simulating transaction...');
      const response = await connection.simulateTransaction(transaction);
      
      if (response.value.err) {
        console.error('Transaction simulation failed:', {
          error: response.value.err,
          logs: response.value.logs,
          unitsConsumed: response.value.unitsConsumed,
        });
        
        // Parse the error message
        let errorMessage = 'Transaction simulation failed';
        if (response.value.logs) {
          const logs = response.value.logs;
          if (logs.some(log => log.includes('insufficient funds'))) {
            errorMessage = 'Insufficient SOL balance for transaction';
          } else if (logs.some(log => log.includes('insufficient lamports'))) {
            errorMessage = 'Insufficient SOL balance for transaction fees';
          } else if (logs.some(log => log.includes('custom program error: 0x1'))) {
            errorMessage = 'Insufficient token balance in vault';
          } else {
            // Log all simulation logs for debugging
            console.log('Simulation logs:', logs);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Check logs for any suspicious patterns
      const logs = response.value.logs || [];
      const suspiciousPatterns = [
        'unauthorized',
        'invalid program',
        'insufficient funds',
        'invalid account data',
        'custom program error'
      ];

      for (const log of logs) {
        if (suspiciousPatterns.some(pattern => log.toLowerCase().includes(pattern))) {
          console.error('Suspicious log detected:', {
            log,
            fullLogs: logs
          });
          throw new Error('Transaction validation failed: ' + log);
        }
      }

      console.log('Transaction simulation successful');
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
