import { ShieldX, Lock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function IneligibleOverlay({ type = 'loans' }) {
  const navigate = useNavigate();

  const config = {
    loans: {
      title:    'Not Eligible for Loans',
      subtitle: 'Your account does not currently meet the requirements to access loan products.',
      color:    '#f87171',
      bg:       'rgba(239,68,68,0.08)',
      border:   'rgba(239,68,68,0.15)',
      reasons: [
        'Account must be active for at least 6 months',
        'Minimum account balance of $500 required',
        'No pending or failed transactions in last 30 days',
        'Identity verification must be completed',
      ],
    },
    investment: {
      title:    'Not Eligible for Investments',
      subtitle: 'Your account does not currently qualify for investment products.',
      color:    '#c084fc',
      bg:       'rgba(192,132,252,0.08)',
      border:   'rgba(192,132,252,0.15)',
      reasons: [
        'Account must be verified and in good standing',
        'Minimum balance of $1,000 required to invest',
        'Must have completed at least 5 transactions',
        'Risk assessment profile not yet completed',
      ],
    },
  };

  const cfg = config[type];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: 24,
        border: `1px solid ${cfg.border}`,
        padding: '40px 36px',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          backgroundColor: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <ShieldX size={36} color={cfg.color} />
        </div>

        {/* Title */}
        <h2 style={{
          color: '#fff', fontSize: 22, fontWeight: 700,
          fontFamily: "'Playfair Display', serif", marginBottom: 10,
        }}>
          {cfg.title}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          {cfg.subtitle}
        </p>

        {/* Eligibility requirements */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '18px 20px',
          marginBottom: 28, textAlign: 'left',
        }}>
          <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
            Eligibility Requirements
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cfg.reasons.map((reason, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Lock size={9} color="#f87171" />
                </div>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info note */}
        <div style={{
          display: 'flex', gap: 10, padding: '12px 16px',
          backgroundColor: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: 12, marginBottom: 28, textAlign: 'left',
        }}>
          <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
            Eligibility is reviewed periodically. Continue using your account and you may qualify in the future.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/profile')}
            style={{
              flex: 1, padding: '12px', borderRadius: 12, border: 'none',
              backgroundColor: cfg.color,
              color: type === 'investment' ? '#0f172a' : '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}