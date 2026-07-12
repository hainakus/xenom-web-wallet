import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { storeWallet } from '../crypto.js';
import { deriveWallet } from '../sdk.js';
import { copyTextToClipboard } from '../clipboard.js';

const STEPS = { MODE: 0, MNEMONIC: 1, CONFIRM: 2, PASSWORD: 3 };

export default function Setup() {
  const { kaspa, ensureSDK, sdkReady, error: sdkError, unlock, connect } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.MODE);
  const [mode, setMode] = useState(null);
  const [mnemonic, setMnemonic] = useState('');
  const [importInput, setImportInput] = useState('');
  const [confirmWords, setConfirmWords] = useState({});
  const [confirmIndices, setConfirmIndices] = useState([]);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sdkReady) {
      ensureSDK().catch(() => {});
    }
  }, [sdkReady, ensureSDK]);

  if (!sdkReady) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',background:'var(--bg)'}} className="grid-bg">
        <div style={{width:'100%',maxWidth:520,textAlign:'center'}}>
          <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.7rem',color:'var(--muted-soft)'}}>
            {sdkError ? sdkError : 'Loading Xenom SDK…'}
          </div>
        </div>
      </div>
    );
  }

  function startCreate() {
    if (!kaspa) return;
    const mn = kaspa.Mnemonic.random(24);
    setMnemonic(mn.phrase);
    // Pick 3 random word positions to confirm
    const words = mn.phrase.split(' ');
    const idx = [];
    while (idx.length < 3) {
      const i = Math.floor(Math.random() * words.length);
      if (!idx.includes(i)) idx.push(i);
    }
    idx.sort((a, b) => a - b);
    setConfirmIndices(idx);
    setConfirmWords({});
    setMode('create');
    setStep(STEPS.MNEMONIC);
  }

  function checkConfirm() {
    const words = mnemonic.split(' ');
    for (const i of confirmIndices) {
      if ((confirmWords[i] ?? '').trim().toLowerCase() !== words[i].toLowerCase()) {
        setError(`Word #${i + 1} is incorrect`);
        return;
      }
    }
    setError('');
    setStep(STEPS.PASSWORD);
  }

  async function finalize() {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== passwordConfirm) { setError('Passwords do not match'); return; }

    setBusy(true);
    try {
      const phrase = mode === 'create' ? mnemonic : importInput.trim();
      if (!kaspa) throw new Error('SDK not ready');
      new kaspa.Mnemonic(phrase); // validate

      const { address, privateKeyHex } = deriveWallet(kaspa, phrase);
      await storeWallet(phrase, password);
      unlock(address, privateKeyHex);
      await connect();
      navigate('/wallet/dashboard', { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyMnemonic() {
    const ok = await copyTextToClipboard(mnemonic);
    if (!ok) {
      setError('Copy failed: your browser may block clipboard access on this connection');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const words = mnemonic ? mnemonic.split(' ') : [];
  const P = {background:'var(--panel)',border:'1px solid var(--border)',padding:'1.4rem',backdropFilter:'blur(20px)',boxShadow:'var(--shadow)'};
  const mono = {fontFamily:'Share Tech Mono,monospace'};
  const err = error ? (
    <div style={{...mono,fontSize:'.65rem',color:'var(--danger)',border:'1px solid rgba(255,127,157,.3)',padding:'.4rem .65rem',background:'rgba(255,127,157,.08)'}}>
      ⚠ {error}
    </div>
  ) : null;

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',background:'var(--bg)'}} className="grid-bg">
      <div style={{width:'100%',maxWidth:520}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'1.4rem',fontWeight:900,letterSpacing:'.25em',color:'var(--accent)',textShadow:'0 0 24px rgba(126,232,255,0.35)',marginBottom:'.4rem'}}>
            ⬡ XENOM
          </div>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'.65rem',letterSpacing:'.3em',color:'var(--muted-soft)'}}>
            WALLET SETUP
          </div>
        </div>

        {/* Mode selection */}
        {step === STEPS.MODE && (
          <div style={{...P,display:'flex',flexDirection:'column',gap:'1rem'}}>
            <div className="sec-title" style={{marginBottom:'.5rem'}}>Get Started</div>
            <button onClick={startCreate} style={{...P,border:'1px solid var(--border)',display:'flex',alignItems:'flex-start',gap:'1rem',cursor:'pointer',transition:'border-color .2s',textAlign:'left',padding:'1rem 1.2rem',borderRadius:'22px'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(126,232,255,.30)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <span style={{color:'var(--accent)',fontSize:'1.1rem',marginTop:'.05rem'}}>+</span>
              <div>
                <div style={{...mono,fontSize:'.72rem',color:'var(--text)',marginBottom:'.25rem'}}>CREATE NEW WALLET</div>
                <div style={{...mono,fontSize:'.6rem',color:'var(--muted-soft)'}}>Generate a fresh 24-word recovery phrase</div>
              </div>
            </button>
            <button onClick={() => { setMode('import'); setStep(STEPS.PASSWORD); }}
              style={{...P,border:'1px solid var(--border)',display:'flex',alignItems:'flex-start',gap:'1rem',cursor:'pointer',transition:'border-color .2s',textAlign:'left',padding:'1rem 1.2rem',background:'transparent',borderRadius:'22px'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(126,232,255,.30)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <span style={{color:'var(--accent-2)',fontSize:'1.1rem',marginTop:'.05rem'}}>⎗</span>
              <div>
                <div style={{...mono,fontSize:'.72rem',color:'var(--text)',marginBottom:'.25rem'}}>IMPORT EXISTING WALLET</div>
                <div style={{...mono,fontSize:'.6rem',color:'var(--muted-soft)'}}>Restore from your 12 or 24-word phrase</div>
              </div>
            </button>
          </div>
        )}

        {/* Show mnemonic */}
        {step === STEPS.MNEMONIC && (
          <div style={{...P,display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            <div>
              <div className="sec-title">Recovery Phrase</div>
              <div style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)',marginTop:'.4rem'}}>
                Write these 24 words down in order. Anyone with this phrase can access your funds.
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.4rem'}}>
              {words.map((w, i) => (
                <div key={i} style={{display:'flex',gap:'.5rem',background:'rgba(4,7,12,.54)',border:'1px solid var(--border)',padding:'.4rem .6rem',alignItems:'center',borderRadius:'12px'}}>
                  <span style={{...mono,fontSize:'.55rem',color:'var(--muted-soft)',width:18,flexShrink:0}}>{i+1}.</span>
                  <span style={{...mono,fontSize:'.7rem',color:'var(--text)'}}>{w}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'.75rem'}}>
              <button onClick={copyMnemonic} className="btn-secondary" style={{flex:1,justifyContent:'center'}}>
                {copied ? '✓ Copied' : '⎘ Copy'}
              </button>
              <button onClick={() => setStep(STEPS.CONFIRM)} className="btn-primary" style={{flex:1,justifyContent:'center'}}>
                Saved it →
              </button>
            </div>
          </div>
        )}

        {/* Confirm words */}
        {step === STEPS.CONFIRM && (
          <div style={{...P,display:'flex',flexDirection:'column',gap:'1.1rem'}}>
            <div>
              <div className="sec-title">Verify Phrase</div>
              <div style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)',marginTop:'.4rem'}}>Enter the requested words to confirm you saved your phrase.</div>
            </div>
            {confirmIndices.map(i => (
              <div key={i}>
                <label className="label">Word #{i + 1}</label>
                <input type="text" className="input" placeholder={`Word ${i+1}`}
                  value={confirmWords[i] ?? ''} onChange={e => setConfirmWords(p => ({...p,[i]:e.target.value}))} />
              </div>
            ))}
            {err}
            <div style={{display:'flex',gap:'.75rem'}}>
              <button onClick={() => setStep(STEPS.MNEMONIC)} className="btn-secondary" style={{flex:1,justifyContent:'center'}}>← Back</button>
              <button onClick={checkConfirm} className="btn-primary" style={{flex:1,justifyContent:'center'}}>Confirm →</button>
            </div>
          </div>
        )}

        {/* Password + node */}
        {step === STEPS.PASSWORD && (
          <div style={{...P,display:'flex',flexDirection:'column',gap:'1.1rem'}}>
            <div>
              <div className="sec-title">{mode === 'import' ? 'Import & Secure' : 'Secure Wallet'}</div>
              <div style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)',marginTop:'.4rem'}}>Your phrase will be encrypted locally with AES-256-GCM.</div>
            </div>

            {mode === 'import' && (
              <div>
                <label className="label">Recovery phrase (12 or 24 words)</label>
                <textarea className="input" style={{resize:'none',height:88}} placeholder="word1 word2 word3 ..."
                  value={importInput} onChange={e => setImportInput(e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">Password (min. 8 chars)</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input type="password" className="input" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} onKeyDown={e => e.key==='Enter' && finalize()} />
            </div>

            {err}

            <div style={{display:'flex',gap:'.75rem'}}>
              <button onClick={() => setStep(mode==='create' ? STEPS.CONFIRM : STEPS.MODE)} className="btn-secondary" style={{flex:1,justifyContent:'center'}}>← Back</button>
              <button onClick={finalize} disabled={busy} className="btn-primary" style={{flex:1,justifyContent:'center'}}>
                {busy ? '[ SETTING UP... ]' : mode==='create' ? '[ CREATE WALLET ]' : '[ IMPORT WALLET ]'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
