import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { deleteWallet, loadWallet } from '../crypto.js';
import { CONSOLIDATION_BATCH_SIZE, DERIVATION_PATH, NETWORK_ID } from '../sdk.js';

export default function Settings() {
  const { connect, connected, address, logout, utxos, consolidateWalletUtxos } = useWallet();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [consolidating, setConsolidating] = useState(false);
  const [msg, setMsg] = useState('');
  const [consolidationMsg, setConsolidationMsg] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [exportPass, setExportPass] = useState('');
  const [exportedPhrase, setExportedPhrase] = useState('');
  const [exportErr, setExportErr] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const consolidationBatchCount = Math.max(1, Math.ceil(utxos.length / CONSOLIDATION_BATCH_SIZE));
  const consolidationReady = utxos.length >= 2;

  async function handleReconnect() {
    setBusy(true);
    setMsg('');
    try {
      await connect();
      setMsg('Reconnected successfully');
    } catch (e) {
      setMsg('Failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleConsolidate() {
    setConsolidating(true);
    setConsolidationMsg('');
    try {
      const result = await consolidateWalletUtxos(utxos, {
        batchSize: 80,
        refreshAfter: true,
        trackHistory: true,
      });
      if (!result?.txids?.length) {
        setConsolidationMsg('Nothing to consolidate');
        return;
      }
      setConsolidationMsg(`Submitted ${result.txids.length} tx${result.txids.length === 1 ? '' : 's'} across ${result.batches} batch${result.batches === 1 ? '' : 'es'}.`);
    } catch (e) {
      setConsolidationMsg(`Failed: ${e.message}`);
    } finally {
      setConsolidating(false);
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

  const P = {background:'var(--panel)',border:'1px solid var(--border)',padding:'1.4rem',backdropFilter:'blur(20px)',boxShadow:'var(--shadow)',borderRadius:'24px'};
  const mono = {fontFamily:'Share Tech Mono,monospace'};

  return (
    <div style={{maxWidth:560,display:'flex',flexDirection:'column',gap:'1.25rem'}}>
      <div style={{marginBottom:'.5rem',paddingBottom:'1rem',borderBottom:'1px solid var(--border)'}}>
        <div className="pg-title">Settings</div>
        <div className="pg-sub">Node connection &amp; wallet management</div>
      </div>

      {/* Node connection */}
      <div style={P}>
        <div style={{borderBottom:'1px solid var(--border)',paddingBottom:'.65rem',marginBottom:'1rem'}}><span className="sec-title">Node Connection</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div>
            <label className="label">Node URL</label>
            <input type="text" className="input" value="wss://explorer.xenom.space/ws/" readOnly />
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
            <button onClick={handleReconnect} disabled={busy} className="btn-primary">
              {busy ? '[ CONNECTING... ]' : '↺ Reconnect'}
            </button>
            <span style={{display:'flex',alignItems:'center',gap:'.4rem'}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:connected?'var(--success)':'var(--danger)',boxShadow:connected?'0 0 8px rgba(127,224,196,.8)':'0 0 8px rgba(255,127,157,.8)',display:'inline-block'}} />
              <span style={{...mono,fontSize:'.62rem',color:connected?'var(--success)':'var(--danger)'}}>
                {connected ? 'Connected — wss://explorer.xenom.space/ws/' : 'Disconnected'}
              </span>
            </span>
          </div>
          {msg && <div style={{...mono,fontSize:'.62rem',color:'var(--success)'}}>{msg}</div>}
        </div>
      </div>

      {/* Wallet info */}
      <div style={P}>
        <div style={{borderBottom:'1px solid var(--border)',paddingBottom:'.65rem',marginBottom:'1rem'}}><span className="sec-title">Wallet Info</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
          <div>
            <div className="label">Address</div>
            <div style={{...mono,fontSize:'.62rem',color:'var(--text)',wordBreak:'break-all',background:'rgba(4,7,12,.54)',border:'1px solid var(--border)',padding:'.5rem .75rem',borderRadius:'14px'}}>{address}</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div>
              <div className="label">Derivation Path</div>
              <div style={{...mono,fontSize:'.65rem',color:'var(--text)'}}>{DERIVATION_PATH}</div>
            </div>
            <div>
              <div className="label">Network</div>
              <div style={{...mono,fontSize:'.65rem',color:'var(--accent-2)'}}>{NETWORK_ID}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Consolidation */}
      <div style={P}>
        <div style={{borderBottom:'1px solid var(--border)',paddingBottom:'.65rem',marginBottom:'1rem'}}><span className="sec-title">Consolidate UTXOs</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
            <div style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)',lineHeight:1.7}}>
              Merge fragmented UTXOs to reduce future fees and speed up sends. Runs in batches of 80 inputs per transaction.
            </div>
            <div style={{...mono,fontSize:'.62rem',color:'var(--text)',lineHeight:1.7}}>
              Preview: {utxos.length} UTXOs will be merged into about {consolidationBatchCount} tx{consolidationBatchCount === 1 ? '' : 's'}.
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
              <div style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)'}}>
                Current UTXOs: <span style={{color:'var(--text)'}}>{utxos.length}</span>
              </div>
              <button
                onClick={handleConsolidate}
                disabled={consolidating || !consolidationReady}
                className="btn-primary"
              >
                {consolidating ? '[ CONSOLIDATING... ]' : '↺ Consolidate UTXOs'}
              </button>
            </div>
            {!consolidationReady && (
              <div style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)'}}>
                Need at least 2 UTXOs to consolidate.
              </div>
            )}
            {consolidationMsg && <div style={{...mono,fontSize:'.62rem',color:consolidationMsg.startsWith('Failed') ? 'var(--danger)' : 'var(--success)'}}>{consolidationMsg}</div>}
          </div>
        </div>

      {/* Export mnemonic */}
      <div style={P}>
        <div style={{borderBottom:'1px solid var(--border)',paddingBottom:'.65rem',marginBottom:'1rem'}}><span className="sec-title">Export Recovery Phrase</span></div>
        {exportedPhrase ? (
          <div style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
            <div style={{...mono,fontSize:'.62rem',color:'var(--danger)',border:'1px solid rgba(255,127,157,.3)',padding:'.4rem .65rem',background:'rgba(255,127,157,.08)'}}>
              ⚠ Keep this phrase private. Anyone with it can access your funds.
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.35rem'}}>
              {exportedPhrase.split(' ').map((w, i) => (
                <div key={i} style={{display:'flex',gap:'.4rem',background:'rgba(4,7,12,.54)',border:'1px solid var(--border)',padding:'.35rem .5rem',alignItems:'center',borderRadius:'12px'}}>
                  <span style={{...mono,fontSize:'.55rem',color:'var(--muted-soft)',width:16,flexShrink:0}}>{i+1}.</span>
                  <span style={{...mono,fontSize:'.65rem',color:'var(--text)'}}>{w}</span>
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
            {exportErr && <div style={{...mono,fontSize:'.62rem',color:'var(--danger)'}}>{exportErr}</div>}
            <div style={{display:'flex',gap:'.75rem'}}>
              <button type="button" onClick={() => setShowExport(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Show phrase</button>
            </div>
          </form>
        )}
      </div>

      {/* Danger zone */}
      <div style={{...P,borderColor:'rgba(255,127,157,.2)'}}>
        <div style={{borderBottom:'1px solid rgba(255,127,157,.2)',paddingBottom:'.65rem',marginBottom:'1rem'}}>
          <span style={{fontFamily:'Orbitron,sans-serif',fontSize:'.72rem',color:'var(--danger)',textTransform:'uppercase',letterSpacing:'.2em',fontWeight:700}}>Danger Zone</span>
        </div>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="btn-danger">⚠ Delete wallet &amp; reset</button>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
            <div style={{...mono,fontSize:'.65rem',color:'var(--danger)'}}>This will permanently delete your local wallet. Make sure you have your recovery phrase backed up.</div>
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
