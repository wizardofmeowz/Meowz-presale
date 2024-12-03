import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Toaster } from 'react-hot-toast';
import { TokenSale } from './components/TokenSale';
import { CONFIG } from './config';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  // Use the Meowz logo from public directory
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({
        appIdentity: {
          name: "The Wizard Of MEOWZ",
          uri: window.location.origin,
          icon: "https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/solana.svg"
        }
      })
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={CONFIG.RPC_ENDPOINT} config={{ 
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: CONFIG.RPC_ENDPOINT.replace('https', 'wss')
    }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <div className="container mx-auto px-4 py-8">
              <TokenSale />
              <Toaster position="bottom-right" />
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;