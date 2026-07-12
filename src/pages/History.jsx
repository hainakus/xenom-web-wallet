import { useWallet } from '../context/WalletContext.jsx';
import { Link } from 'react-router-dom';

const mono = {fontFamily:'Share Tech Mono,monospace'};
const tblTd = {padding:'.6rem .85rem',borderBottom:'1px solid rgba(143,212,229,.10)',...mono,fontSize:'.68rem',verticalAlign:'middle'};
const tblTh = {textAlign:'left',padding:'.55rem .85rem',color:'var(--muted-soft)',textTransform:'uppercase',letterSpacing:'.08em',borderBottom:'1px solid var(--border)',fontSize:'.58rem',fontWeight:400,...mono};

function normalizeTxId(txid = '') {
  return txid.replace(/^spent-/, '').replace(/^consolidate-/, '');
}

export default function History() {
  const { txHistory, utxos } = useWallet();
  const P = {background:'var(--panel)',border:'1px solid var(--border)',backdropFilter:'blur(20px)',boxShadow:'var(--shadow)',borderRadius:'24px'};

  return (
    <div>
      <div style={{marginBottom:'1.75rem',paddingBottom:'1rem',borderBottom:'1px solid var(--border)'}}>
        <div className="pg-title">Transactions</div>
        <div className="pg-sub">UTXO events from this session</div>
      </div>

      <div style={P}>
        <div style={{padding:'.65rem 1rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span className="sec-title">Transaction Log</span>
          <span style={{...mono,fontSize:'.58rem',color:'var(--muted-soft)'} }>{txHistory.length} events</span>
        </div>

        {txHistory.length === 0 ? (
          <div style={{padding:'3rem',textAlign:'center',...mono,fontSize:'.7rem',color:'var(--muted-soft)'}}>
            No transactions yet — events will appear when UTXOs change
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={tblTh}>Type</th>
                <th style={tblTh}>Tx ID</th>
                <th style={{...tblTh,textAlign:'right'}}>Amount</th>
                <th style={{...tblTh,textAlign:'right'}}>Time</th>
              </tr>
            </thead>
            <tbody>
              {txHistory.map(tx => {
                const isSent = tx.type === 'sent';
                const color = isSent ? 'var(--danger)' : 'var(--success)';
                const date = new Date(tx.timestamp).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
                return (
                  <tr key={tx.id}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(126,232,255,.05)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={tblTd}><span style={{color}}>{isSent?'↑':'↓'} {tx.type}</span></td>
                    <td style={{...tblTd,color:'var(--muted-soft)'}}>
                      <Link to={`/wallet/txs/${normalizeTxId(tx.id)}`} style={{color:'var(--text)',textDecoration:'none'}}>
                        {normalizeTxId(tx.id).slice(0,24)}…
                      </Link>
                    </td>
                    <td style={{...tblTd,textAlign:'right',color}}>{isSent?'−':'+'}{tx.amount}</td>
                    <td style={{...tblTd,textAlign:'right',color:'var(--muted-soft)',borderBottom:'none'}}>{date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{...P,padding:'1rem 1.4rem',marginTop:'1rem'}}>
        <div style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)',display:'flex',justifyContent:'space-between'}}>
          <span>UTXO count: <span style={{color:'var(--text)'}}>{utxos.length}</span></span>
          <span style={{color:'rgba(255,255,255,.2)'}}>Full history via block explorer</span>
        </div>
      </div>
    </div>
  );
}
