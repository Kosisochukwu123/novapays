import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const InputField = ({ label, type = 'text', name, value, onChange, placeholder, error, icon: Icon, required }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon size={15} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#64748b',
          }} />
        )}
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12,
            padding: isPassword ? '12px 40px 12px 38px' : '12px 16px 12px 38px',
            paddingLeft: Icon ? 38 : 14,
            color: '#f1f5f9',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.2s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onFocus={e => e.target.style.borderColor = '#38bdf8'}
          onBlur={e => e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)'}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', display: 'flex', alignItems: 'center',
            }}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>{error}</p>}
    </div>
  );
};

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const data = await authService.login(form);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Heading */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 30, fontWeight: 700, color: '#ffffff',
          marginBottom: 8, fontFamily: "'Playfair Display', serif",
        }}>
          {t('auth.welcome')}
        </h2>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          {t('auth.continueText')}
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <div style={{
          marginBottom: 20, padding: '12px 16px', borderRadius: 12,
          backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontSize: 14,
        }}>
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <InputField
          label={t('auth.email')}
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email}
          required
        />
        <InputField
          label={t('auth.password')}
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          icon={Lock}
          error={errors.password}
          required
        />

        {/* Remember + forgot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 15, height: 15, accentColor: '#38bdf8' }} />
           {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password" style={{ fontSize: 13, color: '#38bdf8', textDecoration: 'none' }}>
           {t('auth.forgotPassword')}
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 12,
            backgroundColor: loading ? '#0e7490' : '#38bdf8',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            fontFamily: "'DM Sans', sans-serif",
            marginTop: 4,
          }}
        >
         {loading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      {/* Register link */}
      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
       {t('auth.noAccount')}
        <Link to="/register" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
          {t('auth.signUp')}
        </Link>
      </p>
    </AuthLayout>
  );
}