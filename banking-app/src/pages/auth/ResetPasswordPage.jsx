import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import api from '../../services/api';

const inputStyle = {
  width: '100%', backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
  padding: '13px 42px 13px 42px', color: '#f1f5f9', fontSize: 14,
  outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
};

export default function ResetPasswordPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token');
  const email      = params.get('email');

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);
  const [error,           setError]           = useState('');

  const strength = newPassword.length < 5 ? 1
                 : newPassword.length < 8 ? 2
                 : newPassword.length < 12 ? 3 : 4;
  const strengthColors = ['#ef4444','#f59e0b','#38bdf8','#22c55e'];
  const strengthLabels = ['Too short','Weak','Good','Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!token || !email) { setError('Invalid reset link. Please request a new one.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, email, newPassword });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
          <AlertCircle size={40} color="#f87171" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Invalid Reset Link</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>This link is missing required information. Please request a new password reset.</p>
          <Link to="/forgot-password" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 12, backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 700, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
            Request New Link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, textDecoration: 'none', marginBottom: 28 }}
          onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <ArrowLeft size={15} /> Back to login
        </Link>

        {!done ? (
          <>
            <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
              Set New Password
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
              Resetting password for <span style={{ color: '#38bdf8' }}>{email}</span>
            </p>

            {error && (
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* New password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="At least 8 characters" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#38bdf8'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button type="button" onClick={() => setShowNew(s => !s)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= strength ? strengthColors[strength - 1] : 'rgba(255,255,255,0.1)', transition: 'background-color 0.3s' }} />
                      ))}
                    </div>
                    <p style={{ color: strengthColors[strength - 1], fontSize: 11, margin: 0 }}>{strengthLabels[strength - 1]}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Repeat your new password" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#38bdf8'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ color: '#f87171', fontSize: 11, margin: 0 }}>Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p style={{ color: '#4ade80', fontSize: 11, margin: 0 }}>✓ Passwords match</p>
                )}
              </div>

              <button type="submit" disabled={loading || !newPassword || !confirmPassword}
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', marginTop: 4, cursor: (loading || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer', backgroundColor: (loading || !newPassword || !confirmPassword) ? '#0e7490' : '#38bdf8', color: '#0f172a', fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif", opacity: (loading || !newPassword || !confirmPassword) ? 0.7 : 1 }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={30} color="#4ade80" />
            </div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 10 }}>
              Password Reset!
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Your password has been updated successfully. You can now log in with your new password.
            </p>
            <button onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
              Go to Login
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}