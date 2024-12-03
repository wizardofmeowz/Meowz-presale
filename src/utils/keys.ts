import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

// Load environment variables directly
const VAULT_PRIVATE_KEY = import.meta.env.VITE_VAULT_PRIVATE_KEY;
const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const TOKEN_MINT = import.meta.env.VITE_TOKEN_MINT;

// Validate required environment variables
const validateEnvVariables = () => {
  // Log available environment variables (without exposing sensitive data)
  console.log('Environment check:', {
    hasVaultKey: !!VAULT_PRIVATE_KEY,
    vaultKeyLength: VAULT_PRIVATE_KEY?.length,
    hasTokenMint: !!TOKEN_MINT,
    rpcEndpoint: RPC_ENDPOINT,
    availableEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  });

  if (!VAULT_PRIVATE_KEY) {
    throw new Error(
      'Missing VITE_VAULT_PRIVATE_KEY environment variable. ' +
      'Please make sure it is set in your Netlify environment variables.'
    );
  }
  if (!TOKEN_MINT) {
    throw new Error(
      'Missing VITE_TOKEN_MINT environment variable. ' +
      'Please make sure it is set in your Netlify environment variables.'
    );
  }
};

// Initialize vault keypair from environment variable
export const initializeVaultKeypair = (): Keypair => {
  try {
    validateEnvVariables();
    
    const decodedKey = bs58.decode(VAULT_PRIVATE_KEY);
    return Keypair.fromSecretKey(decodedKey);
  } catch (error) {
    console.error('Keypair initialization error:', error);
    throw error;
  }
};

// Create vault keypair instance
export const vaultKeypair = initializeVaultKeypair();

// Get RPC endpoint
export const getRpcEndpoint = (): string => {
  return RPC_ENDPOINT;
};

// Get token mint address
export const getTokenMint = (): string => {
  validateEnvVariables();
  return TOKEN_MINT;
};

// Utility function to generate a new keypair (for development/testing)
export const generateNewKeypair = (): { publicKey: string; privateKey: string } => {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
  };
};