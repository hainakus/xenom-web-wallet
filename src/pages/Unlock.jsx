import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { loadWallet, deleteWallet } from '../crypto.js';
import { deriveWallet } from '../sdk.js';

export default function Unlock() {
  const { kaspa, ensureSDK, sdkReady, error: sdkError, unlock, connect } = useWallet();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    if (!sdkReady) {
      ensureSDK().catch(() => {});
    }
  }, [sdkReady, ensureSDK]);

  async function handleUnlock(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const mnemonic = await loadWallet(password);
      if (!mnemonic) throw new Error('No wallet found');
      const { address, privateKeyHex } = deriveWallet(kaspa, mnemonic);
      unlock(address, privateKeyHex);
      await connect();
      navigate('/wallet/dashboard', { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    deleteWallet();
    navigate('/setup', { replace: true });
  }

  const glassPanel = {background:'var(--panel)',border:'1px solid var(--border)',padding:'1.4rem',backdropFilter:'blur(20px)',boxShadow:'var(--shadow)'};

  if (!sdkReady) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',background:'var(--bg)'}} className="grid-bg">
        <div style={{width:'100%',maxWidth:360,textAlign:'center'}}>
          <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.7rem',color:'var(--muted-soft)'}}>
            {sdkError ? sdkError : 'Loading Xenom SDK…'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',background:'var(--bg)'}} className="grid-bg">
      <div style={{width:'100%',maxWidth:360}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'1.4rem',fontWeight:900,letterSpacing:'.25em',color:'var(--accent)',textShadow:'0 0 24px rgba(126,232,255,0.35)',marginBottom:'.4rem'}}>
            ⬡ XENOM
          </div>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'.65rem',letterSpacing:'.3em',color:'var(--muted-soft)',fontWeight:400}}>
            WALLET
          </div>
          <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.65rem',color:'var(--muted-soft)',marginTop:'.75rem',letterSpacing:'.05em'}}>
            Enter your password to unlock
          </div>
        </div>

        <form onSubmit={handleUnlock} style={{...glassPanel, display:'flex', flexDirection:'column', gap:'1rem', borderRadius:'24px'}}>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} autoFocus onChange={e => setPassword(e.target.value)} />
          </div>
          {error && (
            <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.65rem',color:'var(--danger)',border:'1px solid rgba(255,127,157,.3)',padding:'.4rem .65rem',background:'rgba(255,127,157,.08)'}}>
              {error}
            </div>
          )}
          <button type="submit" disabled={busy || !kaspa} className="btn-primary" style={{width:'100%',justifyContent:'center',marginTop:'.25rem'}}>
            {busy ? '[ UNLOCKING... ]' : '[ UNLOCK WALLET ]'}
          </button>
        </form>

        <div style={{marginTop:'1.25rem',textAlign:'center'}}>
          <button
            onClick={() => setShowReset(p => !p)}
            style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.6rem',color:'var(--muted-soft)',background:'none',border:'none',cursor:'pointer',letterSpacing:'.08em',textTransform:'uppercase',transition:'color .2s'}}
            onMouseEnter={e => e.target.style.color='var(--accent)'}
            onMouseLeave={e => e.target.style.color='var(--muted-soft)'}
          >
            Forgot password / Reset wallet
          </button>
          {showReset && (
            <div style={{...glassPanel, marginTop:'.75rem', borderColor:'rgba(255,127,157,.3)',borderRadius:'24px'}}>
              <p style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.62rem',color:'var(--danger)',marginBottom:'.75rem'}}>
                This will permanently delete your local wallet.
              </p>
              <button onClick={handleReset} className="btn-danger" style={{width:'100%',justifyContent:'center'}}>
                Delete wallet &amp; start over
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
