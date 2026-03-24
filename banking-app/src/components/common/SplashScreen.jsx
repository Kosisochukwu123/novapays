import { useState, useEffect } from 'react';
import { useAppSettings } from '../../context/AppContext';

export default function SplashScreen({ onComplete }) {
  const { settings } = useAppSettings();
  const [phase, setPhase] = useState('show'); // show | swipe

  useEffect(() => {
    // Hold the splash for 1.8s then trigger swipe-up
    const showTimer = setTimeout(() => setPhase('swipe'), 1800);
    // After swipe animation finishes (0.6s), call onComplete
    const doneTimer = setTimeout(() => onComplete(), 2400);
    return () => { clearTimeout(showTimer); clearTimeout(doneTimer); };
  }, [onComplete]);

  const logoText = settings.logoText ||
    (settings.platformName ? settings.platformName.slice(0, 2).toUpperCase() : 'NP');

  return (
    <div style={{
      position:        'fixed',
      inset:           0,
      zIndex:          9999,
      backgroundColor: '#0f172a',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      transform:       phase === 'swipe' ? 'translateY(-100%)' : 'translateY(0)',
      transition:      phase === 'swipe' ? 'transform 0.65s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
      userSelect:      'none',
    }}>

      {/* Grid background */}
      <div style={{
        position:        'absolute',
        inset:           0,
        opacity:         0.04,
        backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
        backgroundSize:  '52px 52px',
      }} />

      {/* Glow behind logo */}
      <div style={{
        position:        'absolute',
        width:           280,
        height:          280,
        borderRadius:    '50%',
        background:      'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)',
        animation:       'pulse 2s ease-in-out infinite',
      }} />

      {/* Logo + name */}
      <div style={{
        position:   'relative',
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap:        24,
        animation:  'fadeUp 0.6s ease forwards',
      }}>

        {/* Logo icon */}
        <div style={{ position: 'relative' }}>
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.platformName}
              style={{
                width:        80,
                height:       80,
                borderRadius: 22,
                objectFit:    'cover',
                animation:    'shine 1.6s ease 0.3s forwards',
              }}
            />
          ) : (
            <div style={{
              width:           80,
              height:          80,
              borderRadius:    22,
              backgroundColor: '#38bdf8',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        28,
              fontWeight:      800,
              color:           '#0f172a',
              fontFamily:      "'DM Sans', sans-serif",
              position:        'relative',
              overflow:        'hidden',
            }}>
              {logoText}
              {/* Shine sweep */}
              <div style={{
                position:   'absolute',
                top:        0,
                left:       '-100%',
                width:      '60%',
                height:     '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                animation:  'sweep 1.6s ease 0.3s forwards',
              }} />
            </div>
          )}

          {/* Outer ring pulse */}
          <div style={{
            position:     'absolute',
            inset:        -6,
            borderRadius: 28,
            border:       '2px solid rgba(56,189,248,0.3)',
            animation:    'ringPulse 1.6s ease 0.2s forwards',
          }} />
        </div>

        {/* Platform name */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            color:       '#ffffff',
            fontSize:    32,
            fontWeight:  700,
            fontFamily:  "'Playfair Display', serif",
            margin:      0,
            letterSpacing: '-0.5px',
            position:    'relative',
            overflow:    'hidden',
            display:     'inline-block',
          }}>
            {settings.platformName || 'NovaPay'}
            {/* Text shine */}
            <span style={{
              position:   'absolute',
              top:        0,
              left:       '-100%',
              width:      '60%',
              height:     '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
              animation:  'sweep 1.6s ease 0.6s forwards',
            }} />
          </h1>
          <p style={{
            color:      '#38bdf8',
            fontSize:   13,
            fontFamily: "'DM Sans', sans-serif",
            margin:     '8px 0 0',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 500,
            animation:  'fadeIn 0.8s ease 0.5s both',
          }}>
            Secure Banking
          </p>
        </div>
      </div>

      {/* Loading dots */}
      <div style={{
        position:   'absolute',
        bottom:     60,
        display:    'flex',
        gap:        8,
        animation:  'fadeIn 0.5s ease 0.8s both',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width:           7,
            height:          7,
            borderRadius:    '50%',
            backgroundColor: '#38bdf8',
            animation:       `dotBounce 1s ease ${0.8 + i * 0.15}s infinite`,
            opacity:         0.4,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sweep {
          0%   { left: -100%; }
          100% { left:  200%; }
        }
        @keyframes shine {
          0%   { filter: brightness(1);    }
          50%  { filter: brightness(1.35); }
          100% { filter: brightness(1);    }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1);    opacity: 0.8; }
          50%       { transform: scale(1.15); opacity: 1;   }
        }
        @keyframes ringPulse {
          0%   { opacity: 0; transform: scale(0.85); }
          50%  { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.4; transform: scale(1);  }
        }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0);   opacity: 0.4; }
          50%       { transform: translateY(-6px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
