import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: {},
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['process/browser'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['@solana/web3.js', '@solana/wallet-adapter-react']
        }
      }
    }
  },
  resolve: {
    alias: {
      process: resolve(__dirname, 'node_modules/process/browser.js'),
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util'
    }
  }
});
