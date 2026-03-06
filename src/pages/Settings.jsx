import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { deleteWallet, loadWallet } from '../crypto.js';
import { DERIVATION_PATH, NETWORK_ID } from '../sdk.js';

export default function Settings() {
  const { nodeUrl, connect, connected, address, logout } = useWallet();
  const navigate = useNavigate();
  const [newUrl, setNewUrl] = useState(nodeUrl);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [exportPass, setExportPass] = useState('');
  const [exportedPhrase, setExportedPhrase] = useState('');
  const [exportErr, setExportErr] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  async function handleReconnect() {
    setBusy(true);
    setMsg('');
    try {
      await connect(newUrl);
      setMsg('Reconnected successfully');
    } catch (e) {
      setMsg('Failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(e) {
    e.preventDefault();
    setExportErr('');
    setExportedPhrase('');
    try {
      const phrase = await loadWallet(exportPass);
      setExportedPhrase(phrase);
      setExportPass('');
    } catch (e) {
      setExportErr(e.message);
    }
  }

  async function handleReset() {
    deleteWallet();
    await logout();
    navigate('/', { replace: true });
  }

  const P = {background:'#060f0a',border:'1px solid #0f2a1a',padding:'1.4rem'};
  const mono = {fontFamily:'Share Tech Mono,monospace'};

  return (
    <div style={{maxWidth:560,display:'flex',flexDirection:'column',gap:'1.25rem'}}>
      <div style={{marginBottom:'.5rem',paddingBottom:'1rem',borderBottom:'1px solid #0f2a1a'}}>
        <div className="pg-title">Settings</div>
        <div className="pg-sub">Node connection &amp; wallet management</div>
      </div>

      {/* Node connection */}
      <div style={P}>
        <div style={{borderBottom:'1px solid #0f2a1a',paddingBottom:'.65rem',marginBottom:'1rem'}}><span className="sec-title">Node Connection</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div>
            <label className="label">Node URL</label>
            <input type="text" className="input" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
            <button onClick={handleReconnect} disabled={busy} className="btn-primary">
              {busy ? '[ CONNECTING... ]' : '↺ Reconnect'}
            </button>
            <span style={{display:'flex',alignItems:'center',gap:'.4rem'}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:connected?'#00ff88':'#ff3366',boxShadow:connected?'0 0 8px #00ff88':'0 0 8px #ff3366',display:'inline-block'}} />
              <span style={{...mono,fontSize:'.62rem',color:connected?'#00ff88':'#ff3366'}}>
                {connected ? `Connected — ${nodeUrl}` : 'Disconnected'}
              </span>
            </span>
          </div>
          {msg && <div style={{...mono,fontSize:'.62rem',color:'#00ff88'}}>{msg}</div>}
        </div>
      </div>

      {/* Wallet info */}
      <div style={P}>
        <div style={{borderBottom:'1px solid #0f2a1a',paddingBottom:'.65rem',marginBottom:'1rem'}}><span className="sec-title">Wallet Info</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
          <div>
            <div className="label">Address</div>
            <div style={{...mono,fontSize:'.62rem',color:'#7ab090',wordBreak:'break-all',background:'#020408',border:'1px solid #0f2a1a',padding:'.5rem .75rem'}}>{address}</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div>
              <div className="label">Derivation Path</div>
              <div style={{...mono,fontSize:'.65rem',color:'#7ab090'}}>{DERIVATION_PATH}</div>
            </div>
            <div>
              <div className="label">Network</div>
              <div style={{...mono,fontSize:'.65rem',color:'#00e5ff'}}>{NETWORK_ID}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Export mnemonic */}
      <div style={P}>
        <div style={{borderBottom:'1px solid #0f2a1a',paddingBottom:'.65rem',marginBottom:'1rem'}}><span className="sec-title">Export Recovery Phrase</span></div>
        {exportedPhrase ? (
          <div style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
            <div style={{...mono,fontSize:'.62rem',color:'#ff3366',border:'1px solid rgba(255,51,102,.3)',padding:'.4rem .65rem',background:'rgba(255,51,102,.05)'}}>
              ⚠ Keep this phrase private. Anyone with it can access your funds.
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.35rem'}}>
              {exportedPhrase.split(' ').map((w, i) => (
                <div key={i} style={{display:'flex',gap:'.4rem',background:'#020408',border:'1px solid #0f2a1a',padding:'.35rem .5rem',alignItems:'center'}}>
                  <span style={{...mono,fontSize:'.55rem',color:'#3a5040',width:16,flexShrink:0}}>{i+1}.</span>
                  <span style={{...mono,fontSize:'.65rem',color:'#7ab090'}}>{w}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setExportedPhrase('')} className="btn-secondary" style={{alignSelf:'flex-start'}}>Hide phrase</button>
          </div>
        ) : !showExport ? (
          <button onClick={() => setShowExport(true)} className="btn-secondary">Reveal recovery phrase</button>
        ) : (
          <form onSubmit={handleExport} style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
            <div>
              <label className="label">Enter password to confirm</label>
              <input type="password" className="input" value={exportPass} onChange={e => setExportPass(e.target.value)} autoFocus />
            </div>
            {exportErr && <div style={{...mono,fontSize:'.62rem',color:'#ff3366'}}>{exportErr}</div>}
            <div style={{display:'flex',gap:'.75rem'}}>
              <button type="button" onClick={() => setShowExport(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Show phrase</button>
            </div>
          </form>
        )}
      </div>

      {/* Danger zone */}
      <div style={{...P,borderColor:'rgba(255,51,102,.2)'}}>
        <div style={{borderBottom:'1px solid rgba(255,51,102,.2)',paddingBottom:'.65rem',marginBottom:'1rem'}}>
          <span style={{fontFamily:'Orbitron,sans-serif',fontSize:'.72rem',color:'#ff3366',textTransform:'uppercase',letterSpacing:'.2em',fontWeight:700}}>Danger Zone</span>
        </div>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="btn-danger">⚠ Delete wallet &amp; reset</button>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
            <div style={{...mono,fontSize:'.65rem',color:'#ff3366'}}>This will permanently delete your local wallet. Make sure you have your recovery phrase backed up.</div>
            <div style={{display:'flex',gap:'.75rem'}}>
              <button onClick={() => setConfirmReset(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleReset} className="btn-danger">Confirm delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
