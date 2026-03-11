import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import { sompiToXenom } from '../sdk.js';

const mono = { fontFamily: 'Share Tech Mono,monospace' };
const panel = { background: '#060f0a', border: '1px solid #0f2a1a' };
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
    <div>
      <div style={{ marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid #0f2a1a', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <div className="pg-title">Wallet Detail</div>
          <div className="pg-sub">Inspect wallet address</div>
        </div>
        <Link to="/wallet/receive" className="btn-secondary">← Back</Link>
      </div>

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

      {(loading || error) && (
        <div style={{ ...panel, marginTop: '1rem', padding: '1rem 1.2rem' }}>
          {loading && <div style={{ ...mono, fontSize: '.64rem', color: '#3a5040' }}>Loading wallet data…</div>}
          {!loading && error && <div style={{ ...mono, fontSize: '.64rem', color: '#ff3366' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
