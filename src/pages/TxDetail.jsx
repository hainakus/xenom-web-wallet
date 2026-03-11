import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { sompiToXenom } from '../sdk.js';

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
  const { txHistory, utxos, rpc, connected } = useWallet();

  const [mempoolEntry, setMempoolEntry]   = useState(null);
  const [utxoData, setUtxoData]           = useState(null);
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);

  const normalizedTxid = useMemo(() => normalizeTxId(txid), [txid]);

  const sessionTx = useMemo(
    () => txHistory.find(tx => normalizeTxId(tx.id) === normalizedTxid) ?? null,
    [txHistory, normalizedTxid],
  );

  useEffect(() => {
    let cancelled = false;

    async function lookup() {
      if (!rpc || !connected || !normalizedTxid) return;
      setLoading(true);
      setError('');
      setMempoolEntry(null);
      setUtxoData(null);

      // 1 — try mempool first
      try {
        const res = await rpc.getMempoolEntry({
          transactionId: normalizedTxid,
          includeOrphanPool: false,
          filterTransactionPool: false,
        });
        if (!cancelled && res?.mempoolEntry) {
          setMempoolEntry(res.mempoolEntry);
          setLoading(false);
          return;
        }
      } catch (_) {
        // not in mempool — expected for confirmed txs
      }

      if (cancelled) return;

      // 2 — look in wallet UTXOs for this txid
      const matchingUtxos = (utxos ?? []).filter(
        u => u?.outpoint?.transactionId === normalizedTxid,
      );

      if (matchingUtxos.length > 0) {
        const totalAmount = matchingUtxos.reduce(
          (sum, u) => sum + BigInt(u.amount ?? 0n), 0n,
        );
        const blockDaaScore = matchingUtxos[0].blockDaaScore;

        let ts = null;
        try {
          const tsRes = await rpc.getDaaScoreTimestampEstimate({
            daaScores: [BigInt(blockDaaScore)],
          });
          ts = Number(tsRes?.timestamps?.[0] ?? 0) || null;
        } catch (_) {}

        if (!cancelled) {
          setUtxoData({
            amount: sompiToXenom(totalAmount),
            blockDaaScore: blockDaaScore != null ? String(blockDaaScore) : null,
            timestamp: ts,
            outputCount: matchingUtxos.length,
          });
        }
      } else if (!sessionTx) {
        // 3 — nothing found anywhere
        if (!cancelled) setError(`Transaction ${normalizedTxid} not found in mempool, UTXO set, or session history.`);
      }

      if (!cancelled) setLoading(false);
    }

    void lookup();
    return () => { cancelled = true; };
  }, [rpc, connected, normalizedTxid, utxos, sessionTx]);

  // Merge data sources: session > utxo > mempool
  const isConfirmed = !!utxoData && !mempoolEntry;
  const isPending   = !!mempoolEntry;

  const type = sessionTx?.type
    ?? (isPending ? 'pending' : isConfirmed ? 'received' : 'unknown');

  const amount = sessionTx?.amount
    ?? utxoData?.amount
    ?? (mempoolEntry ? sompiToXenom(
        (mempoolEntry.transaction?.outputs ?? []).reduce((s, o) => s + BigInt(o.value ?? 0n), 0n)
       ) : '—');

  const rawTs = sessionTx?.timestamp ?? utxoData?.timestamp;
  const timestamp = rawTs ? new Date(rawTs).toLocaleString() : '—';

  const fee  = mempoolEntry?.fee  != null ? String(mempoolEntry.fee)  : '—';
  const mass = mempoolEntry?.mass != null ? String(mempoolEntry.mass) : '—';
  const blockDaaScore = utxoData?.blockDaaScore ?? '—';

  const source = sessionTx ? 'wallet session'
    : mempoolEntry ? 'mempool'
    : utxoData    ? 'utxo index'
    : 'unavailable';

  const statusColor = type === 'sent' ? '#ff3366'
    : type === 'received' || isConfirmed ? '#00ff88'
    : type === 'pending' ? '#ffcc00'
    : '#3a5040';

  const requestState = loading ? 'loading'
    : error ? 'error'
    : (sessionTx || mempoolEntry || utxoData) ? 'ready'
    : 'idle';

  const hasData = !!(sessionTx || mempoolEntry || utxoData);

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
            <span style={{ ...valueStyle, color: statusColor }}>
              {isConfirmed ? 'confirmed' : type}
            </span>
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
            <span style={keyStyle}>Block DAA Score</span>
            <span style={valueStyle}>{blockDaaScore}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Fee</span>
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
          <div style={row}>
            <span style={keyStyle}>UTXO Match</span>
            <span style={{ ...valueStyle, color: utxoData ? '#00ff88' : '#3a5040' }}>
              {utxoData ? `yes (${utxoData.outputCount} output${utxoData.outputCount !== 1 ? 's' : ''})` : 'no'}
            </span>
          </div>
          <div style={{ ...row, borderBottom: 'none' }}>
            <span style={keyStyle}>Request State</span>
            <span style={{ ...valueStyle, color: loading ? '#ffcc00' : error ? '#ff3366' : '#7ab090' }}>
              {requestState}
            </span>
          </div>
        </div>
      </div>

      {(loading || (error && !hasData)) && (
        <div style={{ ...panel, padding: '1rem 1.2rem' }}>
          {loading && <div style={{ ...mono, fontSize: '.64rem', color: '#3a5040' }}>Looking up transaction…</div>}
          {!loading && error && <div style={{ ...mono, fontSize: '.64rem', color: '#ff3366' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
