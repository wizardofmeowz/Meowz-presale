import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { CONFIG } from '../config';
import { vaultKeypair } from './keys';

// Function to get or create associated token account
export const getOrCreateAssociatedTokenAccount = async (
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
) => {
  try {
    // Get the associated token account address
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mint,
      owner,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      // Try to get the token account
      return await getAccount(connection, associatedTokenAddress);
    } catch (error: any) {
      // If account doesn't exist, create it
      if (error.name === 'TokenAccountNotFoundError') {
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            payer.publicKey,
            associatedTokenAddress,
            owner,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        const signature = await connection.sendTransaction(transaction, [payer]);
        await connection.confirmTransaction(signature, 'confirmed');
        
        return await getAccount(connection, associatedTokenAddress);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in getOrCreateAssociatedTokenAccount:', error);
    throw error;
  }
};

// Initialize vault account if needed
export const initializeVaultAccount = async (connection: Connection): Promise<boolean> => {
  try {
    console.log('Checking vault token account...');
    
    const tokenMint = new PublicKey(CONFIG.TOKEN_MINT);
    const vaultATA = await getAssociatedTokenAddress(
      tokenMint,
      vaultKeypair.publicKey
    );

    console.log('Vault ATA:', {
      address: vaultATA.toString(),
      mint: tokenMint.toString(),
      owner: vaultKeypair.publicKey.toString()
    });

    try {
      // First try to get the account
      const account = await getAccount(connection, vaultATA);
      console.log('Vault account found:', {
        address: account.address.toString(),
        mint: account.mint.toString(),
        owner: account.owner.toString(),
        amount: account.amount.toString()
      });
      return true;
    } catch (e: any) {
      if (e.name === 'TokenAccountNotFoundError') {
        console.log('Creating new vault token account...');
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            vaultKeypair.publicKey,
            vaultATA,
            vaultKeypair.publicKey,
            tokenMint
          )
        );

        const signature = await connection.sendTransaction(transaction, [vaultKeypair]);
        console.log('Creating vault account, signature:', signature);
        
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        if (confirmation.value.err) {
          throw new Error(`Failed to confirm vault account creation: ${confirmation.value.err}`);
        }

        const account = await getAccount(connection, vaultATA);
        console.log('New vault account created:', {
          address: account.address.toString(),
          mint: account.mint.toString(),
          owner: account.owner.toString()
        });
        return true;
      }
      throw e;
    }
  } catch (error) {
    console.error('Error initializing vault account:', error);
    // Instead of silently returning false, throw the error
    throw new Error(`Failed to initialize vault account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Verify vault setup and balance
export const verifyVaultSetup = async (connection: Connection): Promise<{
  isInitialized: boolean;
  balance: number;
  address: string;
}> => {
  try {
    console.log('Verifying vault setup...');
    
    const tokenMint = new PublicKey(CONFIG.TOKEN_MINT);
    const vaultATA = await getAssociatedTokenAddress(
      tokenMint,
      vaultKeypair.publicKey
    );

    console.log('Checking vault account:', {
      vault: vaultKeypair.publicKey.toString(),
      ata: vaultATA.toString(),
      mint: tokenMint.toString()
    });

    try {
      const account = await getAccount(connection, vaultATA);
      const balance = Number(account.amount) / (10 ** CONFIG.TOKEN_DECIMALS);
      
      console.log('Vault account verified:', {
        address: account.address.toString(),
        balance: balance,
        rawBalance: account.amount.toString()
      });

      return {
        isInitialized: true,
        balance,
        address: vaultATA.toString()
      };
    } catch (error: any) {
      if (error.name === 'TokenAccountNotFoundError') {
        console.log('Vault token account not found, attempting to create...');
        await initializeVaultAccount(connection);
        
        // Check again after initialization
        const account = await getAccount(connection, vaultATA);
        const balance = Number(account.amount) / (10 ** CONFIG.TOKEN_DECIMALS);
        
        return {
          isInitialized: true,
          balance,
          address: vaultATA.toString()
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error verifying vault setup:', error);
    throw new Error(`Failed to verify vault setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
