import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';

const mono = { fontFamily: 'Share Tech Mono,monospace' };
const panel = { background: '#060f0a', border: '1px solid #0f2a1a' };
const row = { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '.8rem 1rem', borderBottom: '1px solid rgba(15,42,26,.5)' };
const keyStyle = { ...mono, fontSize: '.6rem', color: '#3a5040', textTransform: 'uppercase', letterSpacing: '.08em' };
const valueStyle = { ...mono, fontSize: '.68rem', color: '#d7e6de', textAlign: 'right', wordBreak: 'break-all' };

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
    <div>
      <div style={{ marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid #0f2a1a', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <div className="pg-title">Block Detail</div>
          <div className="pg-sub">Inspect block by DAA score</div>
        </div>
        <Link to="/wallet/dashboard" className="btn-secondary">← Back</Link>
      </div>

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

      {(loading || error) && (
        <div style={{ ...panel, marginTop: '1rem', padding: '1rem 1.2rem' }}>
          {loading && <div style={{ ...mono, fontSize: '.64rem', color: '#3a5040' }}>Loading DAG data…</div>}
          {!loading && error && <div style={{ ...mono, fontSize: '.64rem', color: '#ff3366' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
