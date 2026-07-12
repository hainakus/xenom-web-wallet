import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { sompiToXenom } from '../sdk.js';

const mono = { fontFamily: 'Share Tech Mono,monospace' };
const page = { display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 8.5rem)' };
const panel = { background: 'var(--panel)', border: '1px solid var(--border)', overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow)', borderRadius: '24px' };
const row = { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '.8rem 1rem', borderBottom: '1px solid rgba(143,212,229,.10)' };
const keyStyle = { ...mono, fontSize: '.6rem', color: 'var(--muted-soft)', textTransform: 'uppercase', letterSpacing: '.08em' };
const valueStyle = { ...mono, fontSize: '.68rem', color: 'var(--text)', textAlign: 'right', wordBreak: 'break-all' };

export default function WalletDetail() {
  const { wallet = '' } = useParams();
  const { rpc, connected, address: activeAddress, networkId } = useWallet();
  const [balance, setBalance] = useState('—');
  const [utxoCount, setUtxoCount] = useState('—');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWalletData() {
      if (!rpc || !connected || !wallet) return;
      setLoading(true);
      setError('');
      try {
        const [bal, utxoRes] = await Promise.all([
          rpc.getBalanceByAddress({ address: wallet }),
          rpc.getUtxosByAddresses([wallet]),
        ]);
        if (!cancelled) {
          setBalance(sompiToXenom(bal?.balance ?? 0n));
          setUtxoCount(String((utxoRes?.entries ?? []).length));
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err));
          setBalance('—');
          setUtxoCount('—');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadWalletData();
    return () => {
      cancelled = true;
    };
  }, [rpc, connected, wallet]);

  return (
    <div style={page}>
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <div className="pg-title">Wallet Detail</div>
          <div className="pg-sub">Inspect wallet address</div>
        </div>
        <Link to="/wallet/receive" className="btn-secondary">← Back</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: '1rem', alignItems: 'start' }}>
        <div style={panel}>
          <div style={row}>
            <span style={keyStyle}>Wallet Address</span>
            <span style={valueStyle}>{wallet}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Network</span>
            <span style={valueStyle}>{networkId ?? '—'}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>Balance</span>
            <span style={valueStyle}>{balance}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>UTXO Count</span>
            <span style={valueStyle}>{utxoCount}</span>
          </div>
          <div style={{ ...row, borderBottom: 'none' }}>
            <span style={keyStyle}>Active Wallet</span>
            <span style={valueStyle}>{wallet === activeAddress ? 'yes' : 'no'}</span>
          </div>
        </div>

        <div style={panel}>
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(143,212,229,.10)' }}>
            <div style={{ ...mono, fontSize: '.65rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Lookup</div>
          </div>
          <div style={row}>
            <span style={keyStyle}>Queried Address</span>
            <span style={valueStyle}>{wallet ? 'yes' : 'no'}</span>
          </div>
          <div style={row}>
            <span style={keyStyle}>RPC Connected</span>
            <span style={valueStyle}>{connected ? 'yes' : 'no'}</span>
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
          {loading && <div style={{ ...mono, fontSize: '.64rem', color: 'var(--muted-soft)' }}>Loading wallet data…</div>}
          {!loading && error && <div style={{ ...mono, fontSize: '.64rem', color: 'var(--danger)' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
