import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext.jsx';
import Dashboard from './Dashboard.jsx';
import Send from './Send.jsx';
import Receive from './Receive.jsx';
import History from './History.jsx';
import Settings from './Settings.jsx';

const NAV = [
  { to: '/wallet/dashboard',     icon: <GridIcon />,    label: 'Dashboard'     },
  { to: '/wallet/send',          icon: <SendIcon />,    label: 'Send XENOM'    },
  { to: '/wallet/receive',       icon: <ReceiveIcon />, label: 'Receive'       },
  { to: '/wallet/history',       icon: <ListIcon />,    label: 'Transactions'  },
];

const SYS = [
  { to: '/wallet/settings', icon: <SettingsIcon />, label: 'Settings' },
];

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-item ${isActive ? 'active' : ''}`
      }
    >
      <span className="w-4 h-4 shrink-0">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function Wallet() {
  const { address, connected, nodeUrl, logout, refreshBalance } = useWallet();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  const shortAddr = address
    ? `${address.slice(0, 12)}…${address.slice(-8)}`
    : '';

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#020408'}}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-52 shrink-0 border-r border-border flex flex-col" style={{background:'#060f0a'}}>

        {/* Logo */}
        <div className="px-4 py-[14px] border-b border-border">
          <span style={{fontFamily:'Orbitron,sans-serif',fontSize:'.95rem',fontWeight:900,letterSpacing:'.2em',color:'#00ff88',textShadow:'0 0 20px rgba(0,255,136,0.4)'}}>
            ⬡ XENOM
          </span>
          <span style={{fontFamily:'Orbitron,sans-serif',fontSize:'.95rem',fontWeight:400,letterSpacing:'.15em',color:'#3a5040',marginLeft:'.4rem'}}>
            WALLET
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-2 overflow-y-auto">
          <div className="section-label mt-3">Navigation</div>
          <div className="space-y-0.5">
            {NAV.map(n => <SidebarLink key={n.to} {...n} />)}
          </div>

          <div className="section-label">System</div>
          <div className="space-y-0.5">
            {SYS.map(n => <SidebarLink key={n.to} {...n} />)}
          </div>
        </nav>

        {/* Active address + lock */}
        <div className="px-3 py-3 border-t border-border space-y-2">
          <div className="section-label" style={{paddingLeft:0,marginTop:0}}>Active Address</div>
          <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.6rem',color:'#3a5040',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{shortAddr}</div>
          <button
            onClick={handleLogout}
            className="btn-ghost w-full justify-start text-text-secondary hover:text-status-error text-xs"
          >
            <LockIcon /> Lock wallet
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-10 shrink-0 border-b border-border flex items-center justify-between px-5" style={{background:'#060f0a'}}>
          <div /> {/* spacer */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span style={{width:7,height:7,borderRadius:'50%',background:connected?'#00ff88':'#ff3366',boxShadow:connected?'0 0 8px #00ff88':'0 0 8px #ff3366',display:'inline-block',flexShrink:0}} />
              <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:'.62rem',color:connected?'#00ff88':'#ff3366',letterSpacing:'.08em'}}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={refreshBalance} style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',color:'#3a5040',cursor:'pointer',fontFamily:'Share Tech Mono,monospace',fontSize:'.8rem'}} title="Refresh">⟳</button>
              <span style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',color:'#3a5040',fontFamily:'Share Tech Mono,monospace',fontSize:'.75rem',cursor:'default'}}>−</span>
              <span style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',color:'#3a5040',fontFamily:'Share Tech Mono,monospace',fontSize:'.7rem',cursor:'default'}}>□</span>
              <button onClick={handleLogout} style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',color:'#3a5040',cursor:'pointer',fontFamily:'Share Tech Mono,monospace',fontSize:'.75rem'}} title="Close">✕</button>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto grid-bg">
          <div className="p-6 min-h-full">
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="send"      element={<Send />} />
              <Route path="receive"   element={<Receive />} />
              <Route path="history"   element={<History />} />
              <Route path="settings"  element={<Settings />} />
              <Route path="*"         element={<Navigate to="dashboard" replace />} />
            </Routes>
          </div>
        </main>

      </div>
    </div>
  );
}

/* ── Inline SVG icons ──────────────────────────────────── */
function GridIcon() {
  return <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>;
}
function SendIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M2 14L14 2M14 2H6M14 2v8"/></svg>;
}
function ReceiveIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M8 2v9m0 0l-3-3m3 3l3-3M2 13h12"/></svg>;
}
function ListIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M3 4h10M3 8h10M3 12h6"/></svg>;
}
function SettingsIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.42M11.54 4.46l1.41-1.41"/></svg>;
}
function LockIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><rect x="3" y="7" width="10" height="8" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>;
}
