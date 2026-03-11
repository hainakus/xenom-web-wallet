import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { sompiToXenom } from '../sdk.js';

const mono = { fontFamily: 'Share Tech Mono,monospace' };
const page = { display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 8.5rem)' };
const panel = { background: '#060f0a', border: '1px solid #0f2a1a', overflow: 'hidden' };
const row = { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '.8rem 1rem', borderBottom: '1px solid rgba(15,42,26,.5)' };
const keyStyle = { ...mono, fontSize: '.6rem', color: '#3a5040', textTransform: 'uppercase', letterSpacing: '.08em' };
const valueStyle = { ...mono, fontSize: '.68rem', color: '#d7e6de', textAlign: 'right', wordBreak: 'break-all' };

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
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #0f2a1a', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
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
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(15,42,26,.5)' }}>
            <div style={{ ...mono, fontSize: '.65rem', color: '#7ab090', textTransform: 'uppercase', letterSpacing: '.08em' }}>Lookup</div>
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
            <span style={{ ...valueStyle, color: loading ? '#ffcc00' : error ? '#ff3366' : '#7ab090' }}>
              {loading ? 'loading' : error ? 'error' : 'ready'}
            </span>
          </div>
        </div>
      </div>

      {(loading || error) && (
        <div style={{ ...panel, padding: '1rem 1.2rem' }}>
          {loading && <div style={{ ...mono, fontSize: '.64rem', color: '#3a5040' }}>Loading wallet data…</div>}
          {!loading && error && <div style={{ ...mono, fontSize: '.64rem', color: '#ff3366' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
