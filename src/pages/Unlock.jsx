import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { loadWallet, deleteWallet } from '../crypto.js';
import { deriveWallet } from '../sdk.js';

export default function Unlock() {
  const { kaspa, unlock, connect } = useWallet();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [nodeUrl, setNodeUrl] = useState('127.0.0.1:27110');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);

  async function handleUnlock(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const mnemonic = await loadWallet(password);
      if (!mnemonic) throw new Error('No wallet found');
      const { address, privateKeyHex } = deriveWallet(kaspa, mnemonic);
      unlock(address, privateKeyHex);
      await connect(nodeUrl);
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

  const panel = {background:'#060f0a',border:'1px solid #0f2a1a',padding:'1.4rem'};

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',background:'#020408'}} className="grid-bg">
      <div style={{width:'100%',maxWidth:360}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'1.4rem',fontWeight:900,letterSpacing:'.25em',color:'#00ff88',textShadow:'0 0 24px rgba(0,255,136,0.5)',marginBottom:'.4rem'}}>
            ⬡ XENOM
          </div>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'.65rem',letterSpacing:'.3em',color:'#3a5040',fontWeight:400}}>
            WALLET
          </div>
          <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.65rem',color:'#3a5040',marginTop:'.75rem',letterSpacing:'.05em'}}>
            Enter your password to unlock
          </div>
        </div>

        <form onSubmit={handleUnlock} style={{...panel, display:'flex', flexDirection:'column', gap:'1rem'}}>
          <div>
            <label className="label">Node URL</label>
            <input type="text" className="input" value={nodeUrl} onChange={e => setNodeUrl(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} autoFocus onChange={e => setPassword(e.target.value)} />
          </div>
          {error && (
            <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.65rem',color:'#ff3366',border:'1px solid rgba(255,51,102,.3)',padding:'.4rem .65rem',background:'rgba(255,51,102,.05)'}}>
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
            style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.6rem',color:'#3a5040',background:'none',border:'none',cursor:'pointer',letterSpacing:'.08em',textTransform:'uppercase',transition:'color .2s'}}
            onMouseEnter={e => e.target.style.color='#00ff88'}
            onMouseLeave={e => e.target.style.color='#3a5040'}
          >
            Forgot password / Reset wallet
          </button>
          {showReset && (
            <div style={{...panel, marginTop:'.75rem', borderColor:'rgba(255,51,102,.3)'}}>
              <p style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.62rem',color:'#ff3366',marginBottom:'.75rem'}}>
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
