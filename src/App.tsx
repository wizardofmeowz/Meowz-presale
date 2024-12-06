import { useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Toaster } from 'react-hot-toast';
import { TokenSale } from './components/TokenSale';
import { CONFIG } from './config';
import { verifyVaultSetup } from './utils/token';
import { clusterApiUrl, Cluster } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

// Constants for network and wallet configuration
const network = (CONFIG.NETWORK || 'mainnet-beta') as Cluster;
const endpoint = CONFIG.RPC_ENDPOINT || clusterApiUrl(network);

// Wallet configuration
const walletConfig = {
  network,
  walletName: CONFIG.APP_NAME,
  icon: CONFIG.APP_ICON,
  url: CONFIG.APP_URL,
};

function AppContent() {
  const { connection } = useConnection();

  useEffect(() => {
    const verifySetup = async () => {
      if (!connection) return;
      
      try {
        console.log('Verifying vault setup on app initialization...');
        const vaultStatus = await verifyVaultSetup(connection);
        console.log('Vault verification complete:', vaultStatus);
        
        if (vaultStatus.balance <= 0) {
          console.warn('Warning: Vault has no token balance');
        }
      } catch (error) {
        console.error('Failed to verify vault setup:', error);
      }
    };

    verifySetup();
  }, [connection]);

  return (
    <div className="container mx-auto px-4 py-8">
      <TokenSale />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default function App() {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({
        ...walletConfig,
        name: CONFIG.APP_NAME,
      }),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <AppContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
