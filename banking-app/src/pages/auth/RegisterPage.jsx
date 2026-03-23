import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
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
        {Icon && <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />}
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          name={name} value={value} onChange={onChange} placeholder={placeholder}
          style={{
            width: '100%', backgroundColor: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12, padding: '11px 14px', paddingLeft: Icon ? 38 : 14,
            paddingRight: isPassword ? 40 : 14,
            color: '#f1f5f9', fontSize: 14, outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onFocus={e => e.target.style.borderColor = '#38bdf8'}
          onBlur={e => e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)'}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}
    </div>
  );
};

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { t } = useTranslation();

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const data = await authService.register(payload);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = form.password.length >= 12 ? 4 : form.password.length >= 8 ? 3 : form.password.length >= 5 ? 2 : form.password.length > 0 ? 1 : 0;
  const strengthColor = ['transparent','#ef4444','#f59e0b','#38bdf8','#22c55e'][pwStrength];

  return (
    <AuthLayout>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>
          {t('auth.createAccount')}
        </h2>
        <p style={{ color: '#64748b', fontSize: 15 }}>{t('auth.joinText')}</p>
      </div>

      {serverError && (
        <div style={{ marginBottom: 18, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 14 }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InputField label={t('auth.fullName')}     name="fullName" value={form.fullName} onChange={handleChange} placeholder="John Doe"     icon={User}  error={errors.fullName} required />
          <InputField label={t('auth.phone')}        name="phone"    value={form.phone}    onChange={handleChange} placeholder="+1 555 0100" icon={Phone} error={errors.phone}    required />
        </div>
        <InputField label={t('auth.email')} type="email"    name="email"    value={form.email}    onChange={handleChange} placeholder="you@example.com" icon={Mail} error={errors.email}    required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InputField label={t('auth.password')}        type="password" name="password"        value={form.password}        onChange={handleChange} placeholder="••••••••" icon={Lock} error={errors.password}        required />
          <InputField label={t('auth.confirmPassword')} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" icon={Lock} error={errors.confirmPassword} required />
        </div>

        {/* Password strength */}
        {form.password.length > 0 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= pwStrength ? strengthColor : 'rgba(255,255,255,0.1)', transition: 'background-color 0.3s' }} />
            ))}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 12, marginTop: 4,
            backgroundColor: loading ? '#0e7490' : '#38bdf8',
            color: '#0f172a', fontWeight: 700, fontSize: 15,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
         {loading ? t('auth.creatingAccount') : t('auth.signUp')}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
       {t('auth.hasAccount')}
        <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>{ t('auth.signIn')}</Link>
      </p>
    </AuthLayout>
  );
}