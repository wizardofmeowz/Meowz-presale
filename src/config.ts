 import { PublicKey, clusterApiUrl } from '@solana/web3.js';
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
  
  // Development environment - use HTTPS even for local
  return 'https://localhost:5173';
};

// Generate placeholder URLs based on the current domain
const generatePlaceholderUrls = (domain: string) => {
  const base = domain.endsWith('/') ? domain.slice(0, -1) : domain;
  // Ensure URLs are HTTPS
  const secureBase = base.replace(/^http:/, 'https:');
  return {
    support: `${secureBase}/support`,
    privacy: `${secureBase}/privacy`,
    terms: `${secureBase}/terms`,
  };
};

// Get app identifier based on domain
const getAppIdentifier = (domain: string) => {
  // Ensure we're using a secure identifier
  return domain.includes('localhost') 
    ? 'app.meowz-presale.local-development'
    : 'app.meowz-presale.token-sale';
};

// Secure RPC endpoints
const SECURE_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

// Get a secure RPC endpoint
const getSecureRPCEndpoint = () => {
  const configRPC = import.meta.env.VITE_RPC_ENDPOINT;
  if (configRPC && configRPC.startsWith('https://')) {
    return configRPC;
  }
  return SECURE_RPC_ENDPOINTS[0];
};

export const CONFIG = {
  // RPC Configuration
  RPC_ENDPOINT: getSecureRPCEndpoint(),
  NETWORK: 'mainnet-beta',
  SECURE_RPC_LIST: SECURE_RPC_ENDPOINTS,
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
  APP_ICON: 'https://meowz-presale.vercel.app/meowz-logo.png',
  APP_IDENTIFIER: getAppIdentifier(getCurrentDomain()),
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
  SECURE_PROTOCOLS: ['https:'],
  ALLOWED_NETWORKS: ['mainnet-beta'],
  
  // Verification details (auto-generated based on domain)
  VERIFICATION: {
    VERIFIED: true,
    VERIFICATION_AUTHORITY: 'The Wizard Of MEOWZ',
    ...generatePlaceholderUrls(getCurrentDomain()),
    SUPPORT_EMAIL: 'support@meowz-presale.vercel.app',
  },

  // Development Configuration
  IS_DEV: import.meta.env.DEV || !process.env.VERCEL_ENV,
  IS_PREVIEW: process.env.VERCEL_ENV === 'preview',
  IS_PRODUCTION: process.env.VERCEL_ENV === 'production',
};
