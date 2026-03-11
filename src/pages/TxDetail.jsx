import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';

const mono = { fontFamily: 'Share Tech Mono,monospace' };
const page = { display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 8.5rem)' };
const panel = { background: '#060f0a', border: '1px solid #0f2a1a', overflow: 'hidden' };
const row = { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '.8rem 1rem', borderBottom: '1px solid rgba(15,42,26,.5)' };
const keyStyle = { ...mono, fontSize: '.6rem', color: '#3a5040', textTransform: 'uppercase', letterSpacing: '.08em' };
const valueStyle = { ...mono, fontSize: '.68rem', color: '#d7e6de', textAlign: 'right', wordBreak: 'break-all' };

function normalizeTxId(txid = '') {
  return txid.replace(/^spent-/, '').replace(/^consolidate-/, '');
}

export default function TxDetail() {
  const { txid = '' } = useParams();
  const { txHistory, rpc, connected } = useWallet();
  const [mempoolEntry, setMempoolEntry] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedTxid = useMemo(() => normalizeTxId(txid), [txid]);
  const sessionTx = useMemo(
    () => txHistory.find(tx => normalizeTxId(tx.id) === normalizedTxid) ?? null,
    [txHistory, normalizedTxid],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadMempoolEntry() {
      if (!rpc || !connected || !normalizedTxid) return;
      setLoading(true);
      setError('');
      try {
        const res = await rpc.getMempoolEntry({
          transactionId: normalizedTxid,
          includeOrphanPool: false,
          filterTransactionPool: false,
        });
        if (!cancelled) {
          setMempoolEntry(res?.mempoolEntry ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setMempoolEntry(null);
          setError(String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMempoolEntry();
    return () => {
      cancelled = true;
    };
  }, [rpc, connected, normalizedTxid]);

  const type = sessionTx?.type ?? (mempoolEntry ? 'pending' : 'unknown');
  const amount = sessionTx?.amount ?? '—';
  const timestamp = sessionTx?.timestamp
    ? new Date(sessionTx.timestamp).toLocaleString()
    : '—';
  const fee = mempoolEntry?.fee != null ? mempoolEntry.fee.toString() : '—';
  const mass = mempoolEntry?.mass != null ? mempoolEntry.mass.toString() : '—';
  const source = sessionTx ? 'wallet session' : mempoolEntry ? 'mempool' : 'unavailable';
  const statusColor = type === 'sent' ? '#ff3366' : type === 'received' ? '#00ff88' : '#ffcc00';

  return (
    <div style={page}>
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #0f2a1a', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <div className="pg-title">Transaction Detail</div>
          <div className="pg-sub">Inspect transaction by hash</div>
        </div>
        <Link to="/wallet/history" className="btn-secondary">← Back</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: '1rem', alignItems: 'start' }}>
        <div style={{ ...panel, minHeight: '100%' }}>
          <div style={row}>
            <span style={keyStyle}>Tx Hash</span>
            <span style={valueStyle}>{normalizedTxid}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Status</span>
            <span style={{ ...valueStyle, color: statusColor }}>{type}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Amount</span>
            <span style={valueStyle}>{amount}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Timestamp</span>
            <span style={valueStyle}>{timestamp}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Mempool Fee</span>
            <span style={valueStyle}>{fee}</span>
          </div>
          <div style={{ ...row, borderBottom: 'none' }}>
            <span style={keyStyle}>Mass</span>
            <span style={valueStyle}>{mass}</span>
          </div>
        </div>

        <div style={{ ...panel, minHeight: '100%' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(15,42,26,.5)' }}>
            <div style={{ ...mono, fontSize: '.65rem', color: '#7ab090', textTransform: 'uppercase', letterSpacing: '.08em' }}>Lookup</div>
          </div>
          <div style={row}>
            <span style={keyStyle}>Source</span>
            <span style={valueStyle}>{source}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Session Match</span>
            <span style={valueStyle}>{sessionTx ? 'yes' : 'no'}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Mempool Match</span>
            <span style={valueStyle}>{mempoolEntry ? 'yes' : 'no'}</span>
          </div>
          <div style={{ ...row, borderBottom: 'none' }}>
            <span style={keyStyle}>Request State</span>
            <span style={{ ...valueStyle, color: loading ? '#ffcc00' : error ? '#ff3366' : '#7ab090' }}>
              {loading ? 'loading' : error ? 'error' : 'ready'}
            </span>
          </div>
        </div>
      </div>

      {(loading || error || (!sessionTx && !mempoolEntry)) && (
        <div style={{ ...panel, marginTop: '1rem', padding: '1rem 1.2rem' }}>
          {loading && <div style={{ ...mono, fontSize: '.64rem', color: '#3a5040' }}>Loading mempool data…</div>}
          {!loading && error && <div style={{ ...mono, fontSize: '.64rem', color: '#ff3366' }}>{error}</div>}
          {!loading && !error && !sessionTx && !mempoolEntry && (
            <div style={{ ...mono, fontSize: '.64rem', color: '#3a5040' }}>Transaction not found in this wallet session or current mempool.</div>
          )}
        </div>
      )}
    </div>
  );
}
