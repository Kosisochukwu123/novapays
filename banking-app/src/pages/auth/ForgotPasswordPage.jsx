import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import api from '../../services/api';

const inputStyle = {
  width:           '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border:          '1px solid rgba(255,255,255,0.1)',
  borderRadius:    12,
  padding:         '13px 14px 13px 42px',
  color:           '#f1f5f9',
  fontSize:        14,
  outline:         'none',
  fontFamily:      "'DM Sans', sans-serif",
  boxSizing:       'border-box',
  transition:      'border-color 0.15s',
};

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        <Link
          to="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, textDecoration: 'none', marginBottom: 28 }}
          onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <ArrowLeft size={15} /> Back to login
        </Link>

        {!sent ? (
          <>
            <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
              Forgot your password?
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    autoFocus
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#38bdf8'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  width:           '100%',
                  padding:         '13px',
                  borderRadius:    12,
                  border:          'none',
                  marginTop:       4,
                  cursor:          (loading || !email.trim()) ? 'not-allowed' : 'pointer',
                  backgroundColor: (loading || !email.trim()) ? '#0e7490' : '#38bdf8',
                  color:           '#0f172a',
                  fontWeight:      700,
                  fontSize:        15,
                  fontFamily:      "'DM Sans', sans-serif",
                  opacity:         (loading || !email.trim()) ? 0.7 : 1,
                  transition:      'all 0.2s',
                }}
              >
                {loading ? 'Sending reset link...' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
              Remember your password?{' '}
              <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={30} color="#4ade80" />
            </div>

            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 10 }}>
              Check your inbox
            </h2>

            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
              We've sent a password reset link to
            </p>
            <p style={{ color: '#38bdf8', fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
              {email}
            </p>

            <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
              Didn't receive it? Check your spam folder or wait a few minutes.
              If it still doesn't arrive, you can try again below.
            </p>

            <button
              onClick={() => { setSent(false); setEmail(''); setError(''); }}
              style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: 12, boxSizing: 'border-box' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
            >
              Try a different email
            </button>

            <Link
              to="/login"
              style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 12, border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
