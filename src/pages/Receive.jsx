import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext.jsx';
import { copyTextToClipboard } from '../clipboard.js';

export default function Receive() {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ok = await copyTextToClipboard(address);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const P = {background:'var(--panel)',border:'1px solid var(--border)',padding:'1.4rem',backdropFilter:'blur(20px)',boxShadow:'var(--shadow)',borderRadius:'24px'};
  const mono = {fontFamily:'Share Tech Mono,monospace'};

  return (
    <div style={{maxWidth:520}}>
      <div style={{marginBottom:'1.75rem',paddingBottom:'1rem',borderBottom:'1px solid var(--border)'}}>
        <div className="pg-title">Receive XENOM</div>
        <div className="pg-sub">Share your address to receive funds</div>
      </div>

      <div style={{...P,display:'flex',flexDirection:'column',alignItems:'center',gap:'1.5rem',paddingTop:'2rem',paddingBottom:'2rem'}}>
        <div style={{padding:12,background:'rgba(255,255,255,.94)',border:'2px solid rgba(126,232,255,.22)',boxShadow:'0 18px 42px rgba(0,0,0,.22)',borderRadius:'22px'}}>
          {address ? (
            <QRCodeSVG value={address} size={180} bgColor="#f6fbff" fgColor="#05070c" level="M" includeMargin={false} />
          ) : (
            <div style={{width:180,height:180,background:'rgba(4,7,12,.54)'}} />
          )}
        </div>

        <div style={{width:'100%',textAlign:'center'}}>
          <div className="label" style={{marginBottom:'.5rem'}}>Your Xenom Address</div>
          <div style={{...mono,fontSize:'.62rem',color:'var(--text)',wordBreak:'break-all',background:'rgba(4,7,12,.54)',border:'1px solid var(--border)',padding:'.65rem .85rem',lineHeight:1.6,borderRadius:'14px'}}>
            {address}
          </div>
        </div>

        <button onClick={copy} className="btn-primary" style={{justifyContent:'center',minWidth:200}}>
          {copied ? '✓ COPIED!' : '⎘ COPY ADDRESS'}
        </button>
      </div>

      <div style={{...P,marginTop:'1rem'}}>
        <div style={{...mono,fontSize:'.62rem',color:'var(--muted-soft)',lineHeight:1.8}}>
          <span style={{color:'var(--accent)'}}>ℹ</span>{' '}
          Deterministic address — BIP44 path{' '}
          <span style={{color:'var(--text)'}}>m/44'/111111'/0'/0/0</span>.
          Funds sent here appear in your balance after confirmation.
        </div>
      </div>
    </div>
  );
}
