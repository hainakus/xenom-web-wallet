import { useState } from 'react';
import { useWallet } from '../context/WalletContext.jsx';
import { sendXenom } from '../sdk.js';

export default function Send() {
  const { kaspa, rpc, address, privateKeyHex, balance, connected, refreshBalance } = useWallet();
  const [toAddr, setToAddr] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleSend(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!connected) { setError('Not connected to node'); return; }
    if (!toAddr.trim()) { setError('Recipient address is required'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
    if (parseFloat(amount) > parseFloat(balance)) { setError('Insufficient balance'); return; }

    setBusy(true);
    try {
      const feeSompi = BigInt(Math.round(parseFloat(fee || '0') * 1e8));
      const { txids, fees } = await sendXenom(kaspa, rpc, privateKeyHex, address, toAddr.trim(), amount, feeSompi);
      setResult({ txids, fees });
      setAmount('');
      setToAddr('');
      setTimeout(refreshBalance, 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function setMax() {
    setAmount(balance);
  }

  const P = {background:'var(--panel)',border:'1px solid var(--border)',padding:'1.4rem',backdropFilter:'blur(20px)',boxShadow:'var(--shadow)',borderRadius:'24px'};
  const mono = {fontFamily:'Share Tech Mono,monospace'};

  return (
    <div style={{maxWidth:580}}>
      <div style={{marginBottom:'1.75rem',paddingBottom:'1rem',borderBottom:'1px solid var(--border)'}}>
        <div className="pg-title">Send XENOM</div>
        <div className="pg-sub">Transfer to another address</div>
      </div>

      {result && (
        <div style={{...P,borderColor:'rgba(127,224,196,.34)',marginBottom:'1.25rem',display:'flex',flexDirection:'column',gap:'.5rem'}}>
          <div style={{...mono,fontSize:'.7rem',color:'var(--success)'}}>✓ Transaction submitted</div>
          {result.txids.map(id => (
            <div key={id} style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)',wordBreak:'break-all'}}>{id}</div>
          ))}
          <div style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)'}}>Fees paid: {result.fees?.toString()} sompi</div>
          <button onClick={() => setResult(null)} className="btn-ghost" style={{alignSelf:'flex-start',padding:'.2rem .5rem'}}>Dismiss</button>
        </div>
      )}

      <form onSubmit={handleSend} style={{...P,display:'flex',flexDirection:'column',gap:'1.1rem'}}>
        <div>
          <label className="label">Recipient address</label>
          <input type="text" className="input" placeholder="xenom:q..." value={toAddr} onChange={e => setToAddr(e.target.value)} />
        </div>

        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.5rem'}}>
            <span className="label" style={{marginBottom:0}}>Amount (XENOM)</span>
            <button type="button" onClick={setMax}
              style={{...mono,fontSize:'.6rem',color:'var(--muted-soft)',background:'none',border:'none',cursor:'pointer',transition:'color .2s'}}
              onMouseEnter={e=>e.target.style.color='var(--accent)'}
              onMouseLeave={e=>e.target.style.color='var(--muted-soft)'}>
              Max: {balance}
            </button>
          </div>
          <input type="number" className="input" placeholder="0.00000000" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>

        <div>
          <label className="label">Priority fee (XENOM) — optional</label>
          <input type="number" className="input" placeholder="0" min="0" step="any" value={fee} onChange={e => setFee(e.target.value)} />
        </div>

        {error && (
          <div style={{...mono,fontSize:'.65rem',color:'var(--danger)',border:'1px solid rgba(255,127,157,.3)',padding:'.4rem .65rem',background:'rgba(255,127,157,.08)'}}>
            ⚠ {error}
          </div>
        )}

        <button type="submit" disabled={busy || !connected} className="btn-primary" style={{justifyContent:'center'}}>
          {busy ? '[ BROADCASTING... ]' : '↗ [ SEND XENOM ]'}
        </button>
      </form>

      <div style={{...P,marginTop:'1rem'}}>
        <div className="label">Sending from</div>
        <div style={{...mono,fontSize:'.65rem',color:'var(--muted-soft)',wordBreak:'break-all'}}>{address}</div>
      </div>
    </div>
  );
}
