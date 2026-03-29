import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppSettings } from '../../context/AppContext';

const REWARD_AMOUNT = 10; // default reward in USD

export default function AirdropClaimPage() {
  const { settings }    = useAppSettings();
  const [params]        = useSearchParams();
  const [counted, setCounted] = useState(0);
  const [particles, setParticles] = useState([]);

  const platformName = settings.platformName || 'NovaPay';
  const reward       = parseFloat(params.get('amount') || REWARD_AMOUNT);

  // Count-up animation for the reward amount
  useEffect(() => {
    let start   = 0;
    const end   = reward;
    const steps = 60;
    const step  = end / steps;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCounted(end); clearInterval(timer); }
      else setCounted(parseFloat(start.toFixed(2)));
    }, 20);
    return () => clearInterval(timer);
  }, [reward]);

  // Generate floating particles
  useEffect(() => {
    const p = Array.from({ length: 18 }, (_, i) => ({
      id:       i,
      left:     Math.random() * 100,
      delay:    Math.random() * 3,
      duration: 3 + Math.random() * 4,
      size:     4 + Math.random() * 6,
      color:    ['#38bdf8','#22c55e','#f59e0b','#c084fc'][Math.floor(Math.random() * 4)],
    }));
    setParticles(p);
  }, []);

  const logoText = settings.logoText || platformName.slice(0, 2).toUpperCase();

  return (
    <div style={{
      minHeight:       '100vh',
      width:           '100%',
      backgroundColor: '#0f172a',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      fontFamily:      "'DM Sans', sans-serif",
      position:        'relative',
      overflow:        'hidden',
      padding:         '24px 16px',
    }}>

      {/* Grid background */}
      <div style={{
        position:        'absolute',
        inset:           0,
        opacity:         0.04,
        backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
        backgroundSize:  '52px 52px',
        pointerEvents:   'none',
      }} />

      {/* Glow orb */}
      <div style={{
        position:     'absolute',
        top:          '30%',
        left:         '50%',
        transform:    'translate(-50%, -50%)',
        width:        420,
        height:       420,
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      {/* Floating particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position:  'absolute',
          left:      `${p.left}%`,
          bottom:    '-20px',
          width:     p.size,
          height:    p.size,
          borderRadius: '50%',
          backgroundColor: p.color,
          opacity:   0.6,
          animation: `floatUp ${p.duration}s ${p.delay}s infinite ease-in`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Main card */}
      <div style={{
        position:        'relative',
        width:           '100%',
        maxWidth:        460,
        backgroundColor: '#1e293b',
        borderRadius:    28,
        border:          '1px solid rgba(255,255,255,0.08)',
        padding:         '48px 40px',
        textAlign:       'center',
        animation:       'slideUp 0.6s ease forwards',
        boxShadow:       '0 32px 80px rgba(0,0,0,0.4)',
      }}>

        {/* Confetti burst ring */}
        <div style={{
          position:     'absolute',
          top:          -1,
          left:         -1,
          right:        -1,
          bottom:       -1,
          borderRadius: 28,
          background:   'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(34,197,94,0.08), rgba(245,158,11,0.08))',
          pointerEvents:'none',
        }} />

        {/* Platform logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={platformName}
              style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width:           56,
              height:          56,
              borderRadius:    16,
              backgroundColor: '#38bdf8',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              color:           '#0f172a',
              fontSize:        20,
              fontWeight:      800,
            }}>
              {logoText}
            </div>
          )}
        </div>

        {/* Trophy / checkmark badge */}
        <div style={{
          width:           80,
          height:          80,
          borderRadius:    '50%',
          backgroundColor: 'rgba(34,197,94,0.12)',
          border:          '2px solid rgba(34,197,94,0.25)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          margin:          '0 auto 24px',
          animation:       'popIn 0.5s 0.3s ease both',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Headline */}
        <h1 style={{
          color:      '#fff',
          fontSize:   20,
          fontWeight: 800,
          fontFamily: "'Playfair Display', serif",
          margin:     '0 0 8px',
          lineHeight: 1.2,
        }}>
          Airdrop Claimed! 🎉
        </h1>

        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 32px', lineHeight: 1.6 }}>
          Congratulations! Your {platformName} airdrop reward has been reserved and is ready to claim.
        </p>

        {/* Reward display */}
        <div style={{
          background:   'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(34,197,94,0.08))',
          border:       '1px solid rgba(56,189,248,0.2)',
          borderRadius: 20,
          padding:      '24px 20px',
          marginBottom: 32,
        }}>
          <p style={{ color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>
            Your Reward
          </p>
          <p style={{
            color:      '#fff',
            fontSize:   32,
            fontWeight: 500,
            fontFamily: "'Playfair Display', serif",
            margin:     '0 0 4px',
            lineHeight: 1,
            background: 'linear-gradient(135deg, #38bdf8, #22c55e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            ${counted.toFixed(2)}
          </p>
          <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>USD · Credited on signup</p>
        </div>

        {/* How it works */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, textAlign: 'left' }}>
          {[
            { step: '1', text: 'Create your free account',           color: '#38bdf8' },
            { step: '2', text: `$${reward} is credited`,   color: '#22c55e' },
            { step: '3', text: 'Start trading, saving & investing',  color: '#f59e0b' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: `${item.color}18`, border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: item.color, fontSize: 12, fontWeight: 700 }}>{item.step}</span>
              </div>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTA — Register */}
        <Link
          to="/register"
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            gap:             8,
            width:           '100%',
            padding:         '15px',
            borderRadius:    14,
            border:          'none',
            background:      'linear-gradient(135deg, #38bdf8, #0ea5e9)',
            color:           '#0f172a',
            fontWeight:      800,
            fontSize:        16,
            textDecoration:  'none',
            boxSizing:       'border-box',
            transition:      'opacity 0.2s, transform 0.2s',
            marginBottom:    12,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Claim ${reward} — Create Account
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>

        {/* Already have account */}
        <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>

        {/* Fine print */}
        <p style={{ color: '#334155', fontSize: 11, marginTop: 20, lineHeight: 1.6 }}>
          Reward is credited to your account after email verification. Terms apply.
        </p>
      </div>

      {/* Platform name footer */}
      <p style={{ color: '#334155', fontSize: 12, marginTop: 24, position: 'relative' }}>
        © {new Date().getFullYear()} {platformName} · First AI Decentralized Wallet
      </p>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0)     scale(1);   opacity: 0.6; }
          80%  { opacity: 0.4; }
          100% { transform: translateY(-110vh) scale(0.5); opacity: 0;   }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
