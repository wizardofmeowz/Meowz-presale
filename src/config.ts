 import { PublicKey } from '@solana/web3.js';
import { vaultKeypair } from './utils/keys';

// Get the current domain using Vercel's environment variables
const getCurrentDomain = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://meowz-presale.vercel.app`;
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
  return 'app.meowz-presale.token-sale';
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
  APP_URL: 'https://meowz-presale.vercel.app',
  APP_ICON: 'https://meowz-presale.vercel.app/meowz-logo.png',
  APP_IDENTIFIER: 'app.meowz-presale.token-sale',
  APP_VERSION: '1.0.0',
  APP_FAVICON: '/favicon.ico',

  // Developer Information
  DEVELOPER: {
    NAME: 'The Wizard Of MEOWZ Team',
    WEBSITE: 'https://meowz-presale.vercel.app',
    CONTACT: 'support@meowz-presale.vercel.app',
    VERIFIED: true
  },

  // Security Configuration
  SECURE_PROTOCOLS: ['https:', 'http:'],
  ALLOWED_NETWORKS: ['mainnet-beta'],
  
  // Verification details (auto-generated based on domain)
  VERIFICATION: {
    VERIFIED: true,
    VERIFICATION_AUTHORITY: 'The Wizard Of MEOWZ',
    ...generatePlaceholderUrls('https://meowz-presale.vercel.app'),
    SUPPORT_EMAIL: 'support@meowz-presale.vercel.app',
  },

  // Development Configuration
  IS_DEV: import.meta.env.DEV || !process.env.VERCEL_ENV,
  IS_PREVIEW: process.env.VERCEL_ENV === 'preview',
  IS_PRODUCTION: process.env.VERCEL_ENV === 'production',
};