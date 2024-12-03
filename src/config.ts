 import { PublicKey } from '@solana/web3.js';
import { vaultKeypair } from './utils/keys';

// Get the current domain using Vercel's environment variables
const getCurrentDomain = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Local development
  return 'http://localhost:5173';
};

// Generate placeholder URLs based on the current domain
const generatePlaceholderUrls = (domain: string) => {
  const base = domain.endsWith('/') ? domain.slice(0, -1) : domain;
  return {
    support: `${base}/support`,
    privacy: `${base}/privacy`,
    terms: `${base}/terms`,
  };
};

// Get app identifier based on domain
const getAppIdentifier = (_domain: string) => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `com.${host.replace(/\./g, '-')}.presale`;
};

export const CONFIG = {
  // RPC Configuration
  RPC_ENDPOINT: import.meta.env.VITE_RPC_ENDPOINT,
  VAULT_WALLET: vaultKeypair.publicKey,

  // Token Configuration
  TOKEN_MINT: new PublicKey(import.meta.env.VITE_TOKEN_MINT),
  TOKEN_DECIMALS: Number(import.meta.env.VITE_TOKEN_DECIMALS),
  PRICE_PER_TOKEN: Number(import.meta.env.VITE_PRICE_PER_TOKEN),
  MIN_PURCHASE: Number(import.meta.env.VITE_MIN_PURCHASE),
  MAX_PURCHASE: Number(import.meta.env.VITE_MAX_PURCHASE),
  TOKEN_SYMBOL: import.meta.env.VITE_TOKEN_SYMBOL,
  TOKEN_NAME: import.meta.env.VITE_TOKEN_NAME,

  // App Configuration
  APP_NAME: 'The Wizard Of MEOWZ',
  APP_DESCRIPTION: 'Purchase $MEOWZ tokens instantly with SOL',
  APP_URL: getCurrentDomain(),
  APP_ICON: '/meowz-logo.png',  // Updated to use root path
  APP_IDENTIFIER: getAppIdentifier(getCurrentDomain()),

  // Security Configuration
  SECURE_PROTOCOLS: ['https:', 'http:'],
  ALLOWED_NETWORKS: ['mainnet-beta'],
  
  // Verification details (auto-generated based on domain)
  VERIFICATION: {
    VERIFIED: true,
    VERIFICATION_AUTHORITY: 'The Wizard Of MEOWZ',
    ...generatePlaceholderUrls(getCurrentDomain()),
    SUPPORT_EMAIL: `support@${new URL(getCurrentDomain()).hostname}`,
  },

  // Development Configuration
  IS_DEV: import.meta.env.DEV || !process.env.VERCEL_ENV,
  IS_PREVIEW: process.env.VERCEL_ENV === 'preview',
  IS_PRODUCTION: process.env.VERCEL_ENV === 'production',
};