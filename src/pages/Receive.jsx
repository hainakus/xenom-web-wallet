import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext.jsx';

export default function Receive() {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const P = {background:'#060f0a',border:'1px solid #0f2a1a',padding:'1.4rem'};
  const mono = {fontFamily:'Share Tech Mono,monospace'};

  return (
    <div style={{maxWidth:520}}>
      <div style={{marginBottom:'1.75rem',paddingBottom:'1rem',borderBottom:'1px solid #0f2a1a'}}>
        <div className="pg-title">Receive XENOM</div>
        <div className="pg-sub">Share your address to receive funds</div>
      </div>

      <div style={{...P,display:'flex',flexDirection:'column',alignItems:'center',gap:'1.5rem',paddingTop:'2rem',paddingBottom:'2rem'}}>
        {/* QR with green border glow */}
        <div style={{padding:12,background:'#fff',border:'2px solid #0f2a1a',boxShadow:'0 0 24px rgba(0,255,136,0.15)'}}>
          {address ? (
            <QRCodeSVG value={address} size={180} bgColor="#ffffff" fgColor="#020408" level="M" includeMargin={false} />
          ) : (
            <div style={{width:180,height:180,background:'#0d1f15'}} />
          )}
        </div>

        <div style={{width:'100%',textAlign:'center'}}>
          <div className="label" style={{marginBottom:'.5rem'}}>Your Xenom Address</div>
          <div style={{...mono,fontSize:'.62rem',color:'#7ab090',wordBreak:'break-all',background:'#020408',border:'1px solid #0f2a1a',padding:'.65rem .85rem',lineHeight:1.6}}>
            {address}
          </div>
        </div>

        <button onClick={copy} className="btn-primary" style={{justifyContent:'center',minWidth:200}}>
          {copied ? '✓ COPIED!' : '⎘ COPY ADDRESS'}
        </button>
      </div>

      <div style={{...P,marginTop:'1rem'}}>
        <div style={{...mono,fontSize:'.62rem',color:'#3a5040',lineHeight:1.8}}>
          <span style={{color:'#00e5ff'}}>ℹ</span>{' '}
          Deterministic address — BIP44 path{' '}
          <span style={{color:'#7ab090'}}>m/44'/111111'/0'/0/0</span>.
          Funds sent here appear in your balance after confirmation.
        </div>
      </div>
    </div>
  );
}
