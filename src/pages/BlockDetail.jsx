import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';

const mono = { fontFamily: 'Share Tech Mono,monospace' };
const page = { display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 8.5rem)' };
const panel = { background: 'var(--panel)', border: '1px solid var(--border)', overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow)', borderRadius: '24px' };
const row = { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '.8rem 1rem', borderBottom: '1px solid rgba(143,212,229,.10)' };
const keyStyle = { ...mono, fontSize: '.6rem', color: 'var(--muted-soft)', textTransform: 'uppercase', letterSpacing: '.08em' };
const valueStyle = { ...mono, fontSize: '.68rem', color: 'var(--text)', textAlign: 'right', wordBreak: 'break-all' };

export default function BlockDetail() {
  const { daa_score = '' } = useParams();
  const { dagHeight, networkId, connected, rpc } = useWallet();
  const [dagInfo, setDagInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDagInfo() {
      if (!rpc || !connected) return;
      setLoading(true);
      setError('');
      try {
        const res = await rpc.getBlockDagInfo();
        if (!cancelled) setDagInfo(res ?? null);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDagInfo();
    return () => {
      cancelled = true;
    };
  }, [rpc, connected]);

  return (
    <div style={page}>
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <div className="pg-title">Block Detail</div>
          <div className="pg-sub">Inspect block by DAA score</div>
        </div>
        <Link to="/wallet/dashboard" className="btn-secondary">← Back</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: '1rem', alignItems: 'start' }}>
        <div style={panel}>
          <div style={row}>
            <span style={keyStyle}>DAA Score</span>
            <span style={valueStyle}>{daa_score}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Current DAG Height</span>
            <span style={valueStyle}>{dagHeight ?? '—'}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Network</span>
            <span style={valueStyle}>{networkId ?? '—'}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Node Tip Hash</span>
            <span style={valueStyle}>{dagInfo?.tipHashes?.[0] ?? '—'}</span>
          </div>
          <div style={{ ...row, borderBottom: 'none' }}>
            <span style={keyStyle}>Difficulty</span>
            <span style={valueStyle}>{dagInfo?.difficulty != null ? String(dagInfo.difficulty) : '—'}</span>
          </div>
        </div>

        <div style={panel}>
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(143,212,229,.10)' }}>
            <div style={{ ...mono, fontSize: '.65rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Node Snapshot</div>
          </div>
          <div style={row}>
            <span style={keyStyle}>Tip Count</span>
            <span style={valueStyle}>{dagInfo?.tipHashes?.length ?? '—'}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Past Median Time</span>
            <span style={valueStyle}>{dagInfo?.pastMedianTime != null ? String(dagInfo.pastMedianTime) : '—'}</span>
          </div>
          <div style={{ ...row, borderBottom: 'none' }}>
            <span style={keyStyle}>Request State</span>
            <span style={{ ...valueStyle, color: loading ? 'var(--warning)' : error ? 'var(--danger)' : 'var(--text)' }}>
              {loading ? 'loading' : error ? 'error' : 'ready'}
            </span>
          </div>
        </div>
      </div>

      {(loading || error) && (
        <div style={{ ...panel, padding: '1rem 1.2rem' }}>
          {loading && <div style={{ ...mono, fontSize: '.64rem', color: 'var(--muted-soft)' }}>Loading DAG data…</div>}
          {!loading && error && <div style={{ ...mono, fontSize: '.64rem', color: 'var(--danger)' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
