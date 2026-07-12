import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext.jsx';
import { hasStoredWallet } from './crypto.js';
import Setup from './pages/Setup.jsx';
import Unlock from './pages/Unlock.jsx';
import Wallet from './pages/Wallet.jsx';

const AMBIENT_PARTICLES = [
  { left: '8%', top: '16%', size: 2, duration: '29s', delay: '-4s' },
  { left: '15%', top: '68%', size: 3, duration: '34s', delay: '-15s' },
  { left: '22%', top: '38%', size: 2, duration: '25s', delay: '-9s' },
  { left: '34%', top: '12%', size: 2, duration: '32s', delay: '-12s' },
  { left: '41%', top: '74%', size: 3, duration: '28s', delay: '-8s' },
  { left: '50%', top: '22%', size: 2, duration: '36s', delay: '-19s' },
  { left: '58%', top: '60%', size: 3, duration: '31s', delay: '-14s' },
  { left: '66%', top: '18%', size: 2, duration: '27s', delay: '-7s' },
  { left: '74%', top: '44%', size: 2, duration: '35s', delay: '-22s' },
  { left: '82%', top: '72%', size: 3, duration: '33s', delay: '-10s' },
  { left: '88%', top: '28%', size: 2, duration: '30s', delay: '-18s' },
  { left: '93%', top: '54%', size: 2, duration: '37s', delay: '-26s' },
];

function Landing({ walletStored }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg" style={{background:'var(--bg)'}}>
      <div className="hero-x" aria-hidden="true">
        <span className="hero-x-bar hero-x-bar-a" />
        <span className="hero-x-bar hero-x-bar-b" />
        <span className="hero-x-core" />
      </div>
      <div className="glass-panel" style={{width:'100%',maxWidth:420,padding:'1.5rem',borderRadius:'28px',position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'1.4rem',fontWeight:900,letterSpacing:'.25em',color:'var(--accent)',textShadow:'0 0 24px rgba(126,232,255,0.35)',marginBottom:'.4rem'}}>
            ⬡ XENOM
          </div>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'.65rem',letterSpacing:'.3em',color:'var(--muted-soft)'}}>
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
        <Route path="/txs/:txid" element={
          address ? <TxRedirect /> : <Navigate to="/unlock" replace />
        } />
        <Route path="/blocks/:daa_score" element={
          address ? <BlockRedirect /> : <Navigate to="/unlock" replace />
        } />
        <Route path="/wallets/:wallet" element={
          address ? <WalletRedirect /> : <Navigate to="/unlock" replace />
        } />
        <Route path="/wallet/*" element={
          address ? <Wallet /> : <Navigate to="/" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

function TxRedirect() {
  const { txid = '' } = useParams();
  return <Navigate to={`/wallet/txs/${txid}`} replace />;
}

function BlockRedirect() {
  const { daa_score = '' } = useParams();
  return <Navigate to={`/wallet/blocks/${daa_score}`} replace />;
}

function WalletRedirect() {
  const { wallet = '' } = useParams();
  return <Navigate to={`/wallet/wallets/${wallet}`} replace />;
}

export default function App() {
  return (
    <WalletProvider>
      <div className="ambient-particles" aria-hidden="true">
        {AMBIENT_PARTICLES.map((particle, index) => (
          <span
            key={index}
            className="ambient-particle"
            style={{
              left: particle.left,
              top: particle.top,
              '--size': `${particle.size}px`,
              '--duration': particle.duration,
              '--delay': particle.delay,
            }}
          />
        ))}
      </div>
      <Router />
    </WalletProvider>
  );
}
