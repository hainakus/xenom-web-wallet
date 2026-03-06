import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { SOMPI_PER_XENOM } from '../sdk.js';

const S = {
  panel: { background:'#060f0a', border:'1px solid #0f2a1a', padding:'1.4rem' },
  panelHdr: { padding:'.65rem 1rem', borderBottom:'1px solid #0f2a1a', display:'flex', alignItems:'center', justifyContent:'space-between' },
  tblTh: { textAlign:'left', padding:'.55rem .85rem', color:'#3a5040', textTransform:'uppercase', letterSpacing:'.08em', borderBottom:'1px solid #0f2a1a', fontSize:'.58rem', fontWeight:400, fontFamily:'Share Tech Mono,monospace' },
  tblTd: { padding:'.6rem .85rem', borderBottom:'1px solid rgba(15,42,26,.5)', fontFamily:'Share Tech Mono,monospace', fontSize:'.68rem', verticalAlign:'middle' },
};

export default function Dashboard() {
  const { balance, pendingBalance, utxos, txHistory, dagHeight, networkId } = useWallet();
  const navigate = useNavigate();

  const sompiVal = balance !== '0'
    ? String(Math.round(parseFloat(balance) * Number(SOMPI_PER_XENOM)))
    : '0';
  const [whole, frac = ''] = balance.split('.');
  const fracDisplay = frac.padEnd(8, '0');

  return (
    <div className="space-y-5">

      {/* Page heading */}
      <div style={{marginBottom:'1.75rem',paddingBottom:'1rem',borderBottom:'1px solid #0f2a1a'}}>
        <div className="pg-title">Overview</div>
        <div className="pg-sub">Portfolio balance &amp; recent activity</div>
      </div>

      {/* Balance panel */}
      <div style={S.panel}>
        <div className="label">Total Balance</div>

        <div style={{display:'flex',alignItems:'baseline',gap:'1rem',margin:'.6rem 0 .3rem'}}>
          <span style={{fontFamily:'Orbitron,sans-serif',fontSize:'2.6rem',fontWeight:700,color:'#e8f5ee',letterSpacing:'-.01em',lineHeight:1,textShadow:'0 0 30px rgba(0,255,136,0.15)'}}>
            {whole}.{fracDisplay}
          </span>
          <span style={{fontFamily:'Orbitron,sans-serif',fontSize:'1rem',fontWeight:700,color:'#00ff88',letterSpacing:'.2em',textShadow:'0 0 12px rgba(0,255,136,0.4)'}}>
            XENOM
          </span>
        </div>

        <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.62rem',color:'#3a5040',marginBottom:'1.1rem'}}>
          {sompiVal} sompi
        </div>

        {pendingBalance && pendingBalance !== '0' && (
          <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.62rem',color:'#ffcc00',marginBottom:'.75rem'}}>
            + {pendingBalance} XENOM pending
          </div>
        )}

        <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap'}}>
          <button className="btn-primary" onClick={() => navigate('/wallet/send')}>
            ↗ Send
          </button>
          <button className="btn-secondary" onClick={() => navigate('/wallet/receive')}>
            ↙ Receive
          </button>
          <button className="btn-secondary" onClick={() => navigate('/wallet/dashboard')}>
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.85rem'}}>
        <div className="stat-card">
          <div className="stat-label">DAG Height</div>
          <div className="stat-value">{dagHeight ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Network</div>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:'1.1rem',fontWeight:700,color:'#00e5ff',textShadow:'0 0 10px rgba(0,229,255,.3)'}}>
            {networkId ?? 'mainnet'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">UTXO Count</div>
          <div className="stat-value">{utxos.length}</div>
        </div>
      </div>

      {/* Recent transactions */}
      <div style={S.panel}>
        <div style={S.panelHdr}>
          <span className="sec-title">Recent Transactions</span>
          {txHistory.length > 0 && (
            <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.58rem',color:'#3a5040'}}>
              {txHistory.length} events
            </span>
          )}
        </div>

        {txHistory.length === 0 ? (
          <div style={{padding:'3rem',textAlign:'center',fontFamily:'Share Tech Mono,monospace',fontSize:'.7rem',color:'#3a5040'}}>
            No transactions yet
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={S.tblTh}>Type</th>
                <th style={S.tblTh}>Tx ID</th>
                <th style={{...S.tblTh,textAlign:'right'}}>Amount</th>
                <th style={{...S.tblTh,textAlign:'right'}}>Time</th>
              </tr>
            </thead>
            <tbody>
              {txHistory.slice(0, 10).map(tx => (
                <tr key={tx.id} style={{cursor:'default'}}
                  onMouseEnter={e => e.currentTarget.style.background='#0d1f15'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={S.tblTd}>
                    <span style={{color: tx.type==='sent' ? '#ff3366' : '#00ff88'}}>
                      {tx.type==='sent' ? '↑' : '↓'} {tx.type}
                    </span>
                  </td>
                  <td style={{...S.tblTd,color:'#3a5040'}}>
                    {tx.id.replace('spent-','').slice(0,22)}…
                  </td>
                  <td style={{...S.tblTd,textAlign:'right',color:tx.type==='sent'?'#ff3366':'#00ff88'}}>
                    {tx.type==='sent'?'−':'+'}{tx.amount}
                  </td>
                  <td style={{...S.tblTd,textAlign:'right',color:'#3a5040'}}>
                    {new Date(tx.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
