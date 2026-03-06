import { useWallet } from '../context/WalletContext.jsx';

const mono = {fontFamily:'Share Tech Mono,monospace'};
const tblTd = {padding:'.6rem .85rem',borderBottom:'1px solid rgba(15,42,26,.5)',...mono,fontSize:'.68rem',verticalAlign:'middle'};
const tblTh = {textAlign:'left',padding:'.55rem .85rem',color:'#3a5040',textTransform:'uppercase',letterSpacing:'.08em',borderBottom:'1px solid #0f2a1a',fontSize:'.58rem',fontWeight:400,...mono};

export default function History() {
  const { txHistory, utxos } = useWallet();
  const P = {background:'#060f0a',border:'1px solid #0f2a1a'};

  return (
    <div>
      <div style={{marginBottom:'1.75rem',paddingBottom:'1rem',borderBottom:'1px solid #0f2a1a'}}>
        <div className="pg-title">Transactions</div>
        <div className="pg-sub">UTXO events from this session</div>
      </div>

      <div style={P}>
        <div style={{padding:'.65rem 1rem',borderBottom:'1px solid #0f2a1a',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span className="sec-title">Transaction Log</span>
          <span style={{...mono,fontSize:'.58rem',color:'#3a5040'}}>{txHistory.length} events</span>
        </div>

        {txHistory.length === 0 ? (
          <div style={{padding:'3rem',textAlign:'center',...mono,fontSize:'.7rem',color:'#3a5040'}}>
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
                const color = isSent ? '#ff3366' : '#00ff88';
                const date = new Date(tx.timestamp).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
                return (
                  <tr key={tx.id}
                    onMouseEnter={e=>e.currentTarget.style.background='#0d1f15'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={tblTd}><span style={{color}}>{isSent?'↑':'↓'} {tx.type}</span></td>
                    <td style={{...tblTd,color:'#3a5040'}}>{tx.id.replace('spent-','').slice(0,24)}…</td>
                    <td style={{...tblTd,textAlign:'right',color}}>{isSent?'−':'+'}{tx.amount}</td>
                    <td style={{...tblTd,textAlign:'right',color:'#3a5040',borderBottom:'none'}}>{date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{...P,padding:'1rem 1.4rem',marginTop:'1rem'}}>
        <div style={{...mono,fontSize:'.62rem',color:'#3a5040',display:'flex',justifyContent:'space-between'}}>
          <span>UTXO count: <span style={{color:'#7ab090'}}>{utxos.length}</span></span>
          <span style={{color:'#1a3828'}}>Full history via block explorer</span>
        </div>
      </div>
    </div>
  );
}
