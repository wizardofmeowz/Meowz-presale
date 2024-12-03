import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  LAMPORTS_PER_SOL, 
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
  Connection
} from '@solana/web3.js';
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { Loader2, ChevronDown, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactConfetti from 'react-confetti';
import { CONFIG } from '../config';
import { TokenPurchaseForm } from './TokenPurchaseForm';
import { vaultKeypair } from '../utils/keys';
import { initializeVaultAccount } from '../utils/token';
import { getWorkingRPC, monitorTransaction, logTransaction } from '../utils/production';
import { validateTransactionAmounts, simulateTransaction } from '../utils/security';
import { TransactionDetails } from './TransactionDetails';

interface TokenMetadata {
  decimals: number;
  supply: bigint;
  mintAuthority: string | undefined;
  mint: PublicKey;
}

export const TokenSale: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [, setVaultInitialized] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState<string>('0');
  const [userSolBalance, setUserSolBalance] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fallbackConnection, setFallbackConnection] = useState<Connection | null>(null);
  const [lastTransaction, setLastTransaction] = useState<{
    signature: string;
    amount: number;
    solCost: number;
    timestamp: string;
  } | null>(null);

  const getActiveConnection = (): Connection | undefined => {
    if (connection) return connection;
    if (fallbackConnection) return fallbackConnection;
    return undefined;
  };

  useEffect(() => {
    const setupFallbackConnection = async () => {
      try {
        const workingRPC = await getWorkingRPC();
        if (workingRPC !== connection.rpcEndpoint) {
          console.log('Using fallback RPC:', workingRPC);
          setFallbackConnection(new Connection(workingRPC));
        }
      } catch (error) {
        console.error('Failed to setup fallback connection:', error);
      }
    };

    if (connection) {
      setupFallbackConnection();
    }
  }, [connection]);

  useEffect(() => {
    async function checkTokenAndVault() {
      const activeConnection = getActiveConnection();
      if (!activeConnection) return;

      try {
        console.log('Checking token and vault setup...');
        const mintPubkey = new PublicKey(CONFIG.TOKEN_MINT);
        const mint = await getMint(activeConnection, mintPubkey);
        setTokenMetadata({
          decimals: mint.decimals,
          supply: mint.supply,
          mintAuthority: mint.mintAuthority?.toString(),
          mint: mintPubkey
        });

        try {
          const isInitialized = await initializeVaultAccount(activeConnection);
          setVaultInitialized(isInitialized);
        } catch (error) {
          console.error('Vault initialization error:', error);
          toast.error('Failed to initialize vault. Please check your network connection and try again.');
          setVaultInitialized(false);
        }
      } catch (error) {
        console.error('Error checking token setup:', error);
        toast.error('Failed to initialize. Please try again later.');
      }
    }

    checkTokenAndVault();
  }, [connection, fallbackConnection]);

  useEffect(() => {
    async function checkUserBalance() {
      const activeConnection = getActiveConnection();
      if (!publicKey || !activeConnection) return;

      try {
        // Get SOL balance
        const balance = await activeConnection.getBalance(publicKey);
        setUserSolBalance(balance / LAMPORTS_PER_SOL);

        const userATA = await getAssociatedTokenAddress(
          new PublicKey(CONFIG.TOKEN_MINT),
          publicKey
        );

        try {
          const tokenAccount = await getAccount(activeConnection, userATA);
          const balance = Number(tokenAccount.amount) / (10 ** CONFIG.TOKEN_DECIMALS);
          setUserTokenBalance(balance.toString());
        } catch (error) {
          setUserTokenBalance('0');
        }
      } catch (error) {
        console.error('Error checking user balance:', error);
      }
    }

    checkUserBalance();
  }, [publicKey]);

  const updateBalances = async (): Promise<void> => {
    const activeConnection = getActiveConnection();
    if (!publicKey || !activeConnection) return;

    try {
      // Get SOL balance
      const balance = await activeConnection.getBalance(publicKey);
      setUserSolBalance(balance / LAMPORTS_PER_SOL);

      // Get token balance
      const userATA = await getAssociatedTokenAddress(
        new PublicKey(CONFIG.TOKEN_MINT),
        publicKey
      );

      try {
        const tokenAccount = await getAccount(activeConnection, userATA);
        const balance = Number(tokenAccount.amount) / (10 ** CONFIG.TOKEN_DECIMALS);
        setUserTokenBalance(balance.toString());
      } catch (error) {
        setUserTokenBalance('0');
      }
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  };

  const handleTransactionError = (error: unknown): string => {
    console.error('Transaction error:', error);
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'Transaction failed. Please try again.';
  };

  const handlePurchase = async (amount: string): Promise<void> => {
    if (!publicKey || !getActiveConnection()) return;

    setIsProcessing(true);
    
    const processingToast = toast.custom(
      <div className="bg-[#1a1b23] border border-gray-800 p-4 rounded-lg shadow-xl backdrop-blur-sm min-w-[300px]">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <div>
            <p className="font-medium text-white">Processing Transaction</p>
            <p className="text-sm text-gray-400 mt-1">
              {Number(amount).toLocaleString()} {CONFIG.TOKEN_SYMBOL} for {(Number(amount) * CONFIG.PRICE_PER_TOKEN).toFixed(4)} SOL
            </p>
          </div>
        </div>
      </div>,
      {
        duration: Infinity,
        position: 'bottom-right',
      }
    );

    try {
      const activeConnection = getActiveConnection();
      if (!activeConnection) {
        throw new Error('No active connection available');
      }

      // Pre-transaction checks
      console.log('Starting transaction checks...');
      const tokenAmount = Number(amount);
      const solAmount = tokenAmount * CONFIG.PRICE_PER_TOKEN;

      // Validate transaction parameters
      await validateTransactionAmounts(tokenAmount, solAmount);
      console.log('Amount validation passed');

      // Get token accounts
      const tokenMint = new PublicKey(CONFIG.TOKEN_MINT);
      const buyerATA = await getAssociatedTokenAddress(tokenMint, publicKey);
      const vaultATA = await getAssociatedTokenAddress(tokenMint, CONFIG.VAULT_WALLET);

      // Create and simulate transaction
      const transaction = await createPurchaseTransaction(
        activeConnection,
        publicKey,
        buyerATA,
        vaultATA,
        tokenAmount,
        solAmount
      );
      console.log('Transaction created, simulating...');

      // Simulate the transaction
      const simulation = await simulateTransaction(activeConnection, transaction, publicKey);
      console.log('Transaction simulation result:', simulation);

      // Send transaction
      console.log('Sending transaction...');
      const signature = await sendTransaction(transaction, activeConnection);
      console.log('Transaction sent:', signature);
      
      // Log transaction details
      logTransaction('purchase', tokenAmount, publicKey.toString());
      
      // Monitor transaction
      const success = await monitorTransaction(activeConnection, signature);
      if (success) {
        await updateBalances();
        
        toast.dismiss(processingToast);
        
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
        
        // Store transaction details with enhanced information
        setLastTransaction({
          signature,
          amount: tokenAmount,
          solCost: solAmount,
          timestamp: new Date().toISOString(),
        });
        setShowDetails(true);

        // Show success toast with detailed information
        toast.success(
          <div className="bg-[#1a1b23] border border-gray-800 rounded-lg shadow-xl backdrop-blur-sm min-w-[300px]">
            <div className="p-4">
              <p className="text-lg font-medium text-white mb-2">🎉 Purchase Successful!</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-medium">{Number(amount).toLocaleString()} {CONFIG.TOKEN_SYMBOL}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cost</span>
                  <span className="text-white font-medium">{solAmount.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400">Confirmed</span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 p-3">
              <a
                href={`https://solscan.io/tx/${signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300"
              >
                View on Solscan
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>,
          {
            duration: 10000,
            style: {
              background: 'transparent',
              boxShadow: 'none',
            },
          }
        );
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast.dismiss(processingToast);
      toast.error(
        <div className="bg-[#1a1b23] border border-gray-800 p-4 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="font-medium text-white">Transaction Failed</p>
          <p className="text-sm text-red-400 mt-1">{handleTransactionError(error)}</p>
        </div>
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const createPurchaseTransaction = async (
    connection: Connection,
    publicKey: PublicKey,
    buyerATA: PublicKey,
    vaultATA: PublicKey,
    tokenAmount: number,
    solCost: number
  ): Promise<VersionedTransaction> => {
    const instructions = [];

    const buyerATAInfo = await connection.getAccountInfo(buyerATA);
    if (!buyerATAInfo) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          publicKey,
          buyerATA,
          publicKey,
          new PublicKey(CONFIG.TOKEN_MINT)
        )
      );
    }

    instructions.push(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: CONFIG.VAULT_WALLET,
        lamports: Math.floor(solCost * LAMPORTS_PER_SOL),
      }),
      createTransferInstruction(
        vaultATA,
        buyerATA,
        CONFIG.VAULT_WALLET,
        BigInt(Math.floor(tokenAmount * (10 ** CONFIG.TOKEN_DECIMALS))),
        [vaultKeypair]
      )
    );

    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    
    const messageV0 = new TransactionMessage({
      payerKey: publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([vaultKeypair]);

    return transaction;
  };

  return (
    <div className="max-w-lg mx-auto p-4 min-h-screen">
      {showConfetti && (
        <ReactConfetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={window.innerWidth < 768 ? 100 : 200}
          gravity={0.3}
        />
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center justify-center sm:justify-start gap-3">
            <img src="/meowz-logo.png" alt="MEOWZ Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/10" />
            {CONFIG.TOKEN_NAME}
          </h1>
          <p className="text-sm text-gray-400">Purchase {CONFIG.TOKEN_SYMBOL} tokens instantly</p>
        </div>
        <WalletMultiButton className="!w-full sm:!w-auto" />
      </div>

      <div className="space-y-3 sm:space-y-4">
        {publicKey && (
          <div className="bg-white/5 p-3 sm:p-4 rounded-lg backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-between sm:items-center">
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Your Balance</p>
                <p className="text-base sm:text-lg font-medium">{userSolBalance !== null ? userSolBalance.toFixed(4) : '...'} SOL</p>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-400">{CONFIG.TOKEN_SYMBOL} Balance</p>
                <p className="text-base sm:text-lg font-medium">
                  {userTokenBalance !== null ? Number(userTokenBalance).toLocaleString() : '...'} {CONFIG.TOKEN_SYMBOL}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/5 p-3 sm:p-4 rounded-lg backdrop-blur-sm">
          <TokenPurchaseForm 
            onSubmit={handlePurchase} 
            loading={isProcessing}
            minAmount={CONFIG.MIN_PURCHASE}
            maxAmount={CONFIG.MAX_PURCHASE}
          />
        </div>

        <div className="bg-white/5 rounded-lg backdrop-blur-sm overflow-hidden">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-3 sm:p-4 flex justify-between items-center hover:bg-white/5"
          >
            <span className="font-medium text-sm sm:text-base">Token Details</span>
            <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>
          
          {showDetails && tokenMetadata && (
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 border-t border-gray-800 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Price</span>
                <span>{CONFIG.PRICE_PER_TOKEN.toFixed(10)} SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Min Purchase</span>
                <span>{CONFIG.MIN_PURCHASE.toLocaleString()} {CONFIG.TOKEN_SYMBOL}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Max Purchase</span>
                <span>{CONFIG.MAX_PURCHASE.toLocaleString()} {CONFIG.TOKEN_SYMBOL}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Token Address</span>
                <a 
                  href={`https://solscan.io/token/${tokenMetadata.mint.toString()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {`${tokenMetadata.mint.toString().slice(0, 4)}...${tokenMetadata.mint.toString().slice(-4)}`}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Supply</span>
                <span>{(Number(tokenMetadata.supply) / (10 ** CONFIG.TOKEN_DECIMALS)).toLocaleString()} {CONFIG.TOKEN_SYMBOL}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {lastTransaction && (
        <TransactionDetails
          isOpen={showDetails}
          signature={lastTransaction.signature}
          amount={lastTransaction.amount}
          solCost={lastTransaction.solCost}
          buyerAddress={publicKey?.toString() || ''}
          vaultAddress={CONFIG.VAULT_WALLET.toString()}
          tokenMint={CONFIG.TOKEN_MINT.toString()}
          timestamp={lastTransaction.timestamp}
        />
      )}
    </div>
  );
};