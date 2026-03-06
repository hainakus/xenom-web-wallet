import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext.jsx';
import { hasStoredWallet } from './crypto.js';
import Setup from './pages/Setup.jsx';
import Unlock from './pages/Unlock.jsx';
import Wallet from './pages/Wallet.jsx';

function Router() {
  const { sdkReady, address, error } = useWallet();
  const [walletStored] = useState(() => hasStoredWallet());

  if (!sdkReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          {error ? (
            <div className="max-w-md space-y-3">
              <div className="text-status-error text-lg font-semibold">SDK not loaded</div>
              <p className="text-text-secondary text-sm">{error}</p>
              <pre className="text-xs bg-bg-secondary rounded-lg p-4 text-text-secondary text-left">
{`# Build the web WASM SDK first:
cd ../wasm
./build-web --sdk

# Then copy to public/sdk:
cd ../xenom-wallet
npm run copy-sdk`}
              </pre>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 border-2 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-text-secondary">Loading Xenom SDK…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          address ? <Navigate to="/wallet/dashboard" replace /> :
          walletStored ? <Navigate to="/unlock" replace /> :
          <Navigate to="/setup" replace />
        } />
        <Route path="/setup" element={<Setup />} />
        <Route path="/unlock" element={<Unlock />} />
        <Route path="/wallet/*" element={
          address ? <Wallet /> : <Navigate to="/" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <Router />
    </WalletProvider>
  );
}
