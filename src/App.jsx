import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext.jsx';
import { hasStoredWallet } from './crypto.js';
import Setup from './pages/Setup.jsx';
import Unlock from './pages/Unlock.jsx';
import Wallet from './pages/Wallet.jsx';

function Landing({ walletStored }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#020408'}}>
      <div style={{width:'100%',maxWidth:420,padding:'1.5rem'}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'1.4rem',fontWeight:900,letterSpacing:'.25em',color:'#00ff88',textShadow:'0 0 24px rgba(0,255,136,0.5)',marginBottom:'.4rem'}}>
            ⬡ XENOM
          </div>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'.65rem',letterSpacing:'.3em',color:'#3a5040'}}>
            WEB WALLET
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          {walletStored ? (
            <button className="btn-primary" style={{justifyContent:'center'}} onClick={() => navigate('/unlock')}>
              [ UNLOCK WALLET ]
            </button>
          ) : (
            <button className="btn-primary" style={{justifyContent:'center'}} onClick={() => navigate('/setup')}>
              [ SETUP WALLET ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Router() {
  const { address } = useWallet();
  const [walletStored] = useState(() => hasStoredWallet());

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          address ? <Navigate to="/wallet/dashboard" replace /> :
          <Landing walletStored={walletStored} />
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
