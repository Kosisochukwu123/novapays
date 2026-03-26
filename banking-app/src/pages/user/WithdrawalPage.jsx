import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, User, Building, FileText,
  Clock, CheckCircle2, ShieldAlert, ArrowRight,
} from 'lucide-react';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';



const inputStyle = (error) => ({
  width:           '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border:          `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
  borderRadius:    12,
  padding:         '13px 14px 13px 42px',
  color:           '#f1f5f9',
  fontSize:        14,
  outline:         'none',
  fontFamily:      "'DM Sans', sans-serif",
  boxSizing:       'border-box',
});

const labelStyle = {
  fontSize: 13, fontWeight: 500,
  color: '#cbd5e1', display: 'block', marginBottom: 6,
};

const card = {
  backgroundColor: '#1e293b',
  borderRadius:    18,
  padding:         28,
  border:          '1px solid rgba(255,255,255,0.06)',
};

const Field = ({ label, name, type = 'text', value, onChange, placeholder, error, Icon, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={labelStyle}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <div style={{ position: 'relative' }}>
      {Icon && (
        <Icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
      )}
      <input
        type={type} name={name} value={value}
        onChange={onChange} placeholder={placeholder}
        style={inputStyle(error)}
        onFocus={e => e.target.style.borderColor = '#38bdf8'}
        onBlur={e  => e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)'}
      />
    </div>
    {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{error}</p>}
  </div>
);

const STEP = { FORM: 'form', KYC_POPUP: 'kyc_popup', SUCCESS: 'success' };

export default function WithdrawalPage() {
  const { user }   = useAuth();
  const { t }      = useTranslation();
  const navigate   = useNavigate();

  const blank = {
    fullName:      user?.fullName || '',
    bankName:      '',
    accountNumber: '',
    amount:        '',
  };

  const [step,        setStep]        = useState(STEP.FORM);
  const [form,        setForm]        = useState(blank);
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    setServerError('');
  };

  const handleSubmit = e => {
    e.preventDefault();
    const errs = {};
    if (!form.fullName.trim())      errs.fullName      = 'Account holder name is required';
    if (!form.bankName.trim())      errs.bankName      = 'Bank name is required';
    if (!form.accountNumber.trim()) errs.accountNumber = 'Account number is required';
    if (!form.amount)               errs.amount        = 'Amount is required';
    else if (parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Check if user has completed KYC — if not, show popup
    if (!user?.kycVerified) {
      setStep(STEP.KYC_POPUP);
      return;
    }

    // KYC verified — submit directly
    submitWithdrawal();
  };

  const submitWithdrawal = async () => {
    setLoading(true);
    setServerError('');
    try {
      await api.post('/user/withdrawal', {
        fullName:      form.fullName,
        bankName:      form.bankName,
        accountNumber: form.accountNumber,
        amount:        parseFloat(form.amount),
      });
      setStep(STEP.SUCCESS);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setForm(blank);
    setErrors({});
    setServerError('');
    setStep(STEP.FORM);
  };

  // ── Success ────────────────────────────────────────────────────────────
  if (step === STEP.SUCCESS) {
    setTimeout(resetAll, 6000);
    return (
      <UserLayout>
        <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ ...card, textAlign: 'center', padding: '52px 32px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Clock size={36} color="#38bdf8" />
            </div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>
              Request Submitted!
            </h2>
            <div style={{ backgroundColor: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', borderRadius: 14, padding: '18px 22px', marginBottom: 28 }}>
              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8 }}>
                Your withdrawal request for{' '}
                <strong style={{ color: '#38bdf8' }}>${parseFloat(form.amount).toFixed(2)}</strong>{' '}
                is now under review.
                <br />
                Please allow <strong style={{ color: '#fbbf24' }}>24–48 hours</strong> for processing.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {[
                { icon: CheckCircle2, color: '#22c55e', text: 'Request received', done: true  },
                { icon: Clock,        color: '#fbbf24', text: 'Under admin review', done: false },
                { icon: Clock,        color: '#64748b', text: 'Decision & notification', done: false },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 10, textAlign: 'left', backgroundColor: s.done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)'}` }}>
                  <s.icon size={16} color={s.color} />
                  <span style={{ color: s.done ? '#94a3b8' : '#64748b', fontSize: 13 }}>{s.text}</span>
                  {s.done && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e' }}>✓ Done</span>}
                </div>
              ))}
            </div>
            <p style={{ color: '#475569', fontSize: 12, marginBottom: 20 }}>
              This page will reset automatically in a few seconds...
            </p>
            <button onClick={resetAll}
              style={{ padding: '12px 28px', borderRadius: 12, border: 'none', backgroundColor: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              New Withdrawal
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div style={{ maxWidth: 500, margin: '0 auto', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>

        {/* Page title */}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
          {t('withdrawal.title')}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
          {t('withdrawal.subtitle')}
        </p>

        {/* Withdrawal form */}
        <div style={{ ...card, filter: step === STEP.KYC_POPUP ? 'blur(3px)' : 'none', pointerEvents: step === STEP.KYC_POPUP ? 'none' : 'auto', transition: 'filter 0.2s' }}>
          {serverError && (
            <div style={{ marginBottom: 18, padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13 }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label={t('withdrawal.accountHolder')} name="fullName"      value={form.fullName}      onChange={handleChange} placeholder="Full name as on your bank account" Icon={User}       error={errors.fullName}      required />
            <Field label={t('withdrawal.bankName')}      name="bankName"      value={form.bankName}      onChange={handleChange} placeholder="e.g. Chase, Barclays, GTBank"    Icon={Building}   error={errors.bankName}      required />
            <Field label={t('withdrawal.accountNumber')} name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="Your bank account number"          Icon={FileText}   error={errors.accountNumber} required />
            <Field label={t('withdrawal.amount')}        name="amount"        value={form.amount}        onChange={handleChange} placeholder="0.00" type="number"                Icon={DollarSign} error={errors.amount}        required />

            {/* Amount preview */}
            {form.amount && parseFloat(form.amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: 12, backgroundColor: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)' }}>
                <span style={{ color: '#64748b', fontSize: 13 }}>{t('withdrawal.youAreRequesting')}</span>
                <span style={{ color: '#38bdf8', fontSize: 20, fontWeight: 700 }}>
                  ${parseFloat(form.amount).toFixed(2)}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', backgroundColor: loading ? '#0e7490' : '#38bdf8', color: '#0f172a', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t('withdrawal.submitting') : t('withdrawal.submit')}
            </button>
          </form>
        </div>

        {/* ── KYC Popup ── */}
        {step === STEP.KYC_POPUP && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: 22, padding: 36, width: '100%', maxWidth: 420, border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>

              {/* Icon */}
              <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
                <ShieldAlert size={32} color="#f59e0b" />
              </div>

              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 10, fontFamily: "'Playfair Display', serif" }}>
                KYC Not Complete
              </h2>

              <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
                To withdraw funds, you need to complete your{' '}
                <strong style={{ color: '#f59e0b' }}>Know Your Customer (KYC)</strong>{' '}
                verification first.
              </p>

              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
                This is a one-time process that keeps your account secure and enables withdrawals.
                It only takes a few minutes to complete.
              </p>

              {/* Info pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left' }}>
                {[
                  { emoji: '🪪', text: 'Government-issued ID' },
                  { emoji: '📸', text: 'Photo or document upload' },
                  { emoji: '⏱',  text: 'Reviewed within 24 hours' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 16 }}>{item.emoji}</span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => navigate('/profile?tab=kyc')}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: '#f59e0b', color: '#0f172a', fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  Complete KYC in Settings <ArrowRight size={16} />
                </button>
                <button
                  onClick={resetAll}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
