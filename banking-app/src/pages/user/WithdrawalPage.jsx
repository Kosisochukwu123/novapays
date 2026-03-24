import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, User, Building, FileText, Upload, AlertTriangle, Clock, CheckCircle2, X } from 'lucide-react';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STEP = { FORM: 'form', UNVERIFIED: 'unverified', VERIFY: 'verify', SUCCESS: 'success' };

const inputStyle = (error) => ({
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 12,
  padding: '13px 14px 13px 40px',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
});

const labelStyle = {
  fontSize: 13,
  fontWeight: 500,
  color: '#cbd5e1',
  display: 'block',
  marginBottom: 6,
};

const Field = ({ label, name, type = 'text', value, onChange, placeholder, error, Icon, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={labelStyle}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />}
      <input
        type={type} name={name} value={value}
        onChange={onChange} placeholder={placeholder}
        style={inputStyle(error)}
        onFocus={e => e.target.style.borderColor = '#38bdf8'}
        onBlur={e => e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)'}
      />
    </div>
    {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{error}</p>}
  </div>
);

const TextArea = ({ label, name, value, onChange, placeholder, error, required, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={labelStyle}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
    {hint && <p style={{ color: '#64748b', fontSize: 12, marginTop: -2, marginBottom: 4 }}>{hint}</p>}
    <textarea
      name={name} value={value} onChange={onChange}
      placeholder={placeholder} rows={4}
      style={{
        width: '100%', backgroundColor: 'rgba(255,255,255,0.05)',
        border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12, padding: '12px 14px',
        color: '#f1f5f9', fontSize: 14, outline: 'none',
        resize: 'vertical', fontFamily: "'DM Sans', sans-serif",
        boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = '#38bdf8'}
      onBlur={e => e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)'}
    />
    {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{error}</p>}
  </div>
);

const ImageUpload = ({ label, name, value, onChange, error, required, hint }) => {
  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max file size is 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(name, reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {hint && <p style={{ color: '#64748b', fontSize: 12, marginTop: -2, marginBottom: 4 }}>{hint}</p>}
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 8, padding: value ? '12px' : '28px 16px',
        border: `2px dashed ${error ? '#ef4444' : value ? '#38bdf8' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 12, cursor: 'pointer',
        backgroundColor: value ? 'rgba(56,189,248,0.04)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s',
      }}>
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        {value ? (
          <>
            <img src={value} alt="preview" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />
            <p style={{ color: '#38bdf8', fontSize: 12 }}>✓ Uploaded — click to change</p>
          </>
        ) : (
          <>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={18} color="#64748b" />
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Click to upload</p>
            <p style={{ color: '#64748b', fontSize: 11 }}>PNG, JPG — max 5MB</p>
          </>
        )}
      </label>
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{error}</p>}
    </div>
  );
};

const card = {
  backgroundColor: '#1e293b',
  borderRadius: 18,
  padding: 28,
  border: '1px solid rgba(255,255,255,0.06)',
};

export default function WithdrawalPage() {
  const { user } = useAuth();

  const blankBasic = { fullName: user?.fullName || '', bankName: '', accountNumber: '', amount: '' };
  const blankVerify = { reason: '', additionalNotes: '', proofImage1: '', proofImage2: '' };

  const [step,         setStep]         = useState(STEP.FORM);
  const [basic,        setBasic]        = useState(blankBasic);
  const [verify,       setVerify]       = useState(blankVerify);
  const [basicErrors,  setBasicErrors]  = useState({});
  const [verifyErrors, setVerifyErrors] = useState({});
  const [loading,      setLoading]      = useState(false);
  const [serverError,  setServerError]  = useState('');
  const { t } = useTranslation();

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleBasic = e => {
    setBasic(p => ({ ...p, [e.target.name]: e.target.value }));
    setBasicErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const handleVerify = e => {
    setVerify(p => ({ ...p, [e.target.name]: e.target.value }));
    setVerifyErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const handleImage = (name, value) => {
    setVerify(p => ({ ...p, [name]: value }));
    setVerifyErrors(p => ({ ...p, [name]: '' }));
  };

  // ── Step 1 submit — show "not verified" ───────────────────────────────
  const handleBasicSubmit = e => {
    e.preventDefault();
    const errs = {};
    if (!basic.fullName.trim())      errs.fullName      = 'Account holder name is required';
    if (!basic.bankName.trim())      errs.bankName      = 'Bank name is required';
    if (!basic.accountNumber.trim()) errs.accountNumber = 'Account number is required';
    if (!basic.amount)               errs.amount        = 'Amount is required';
    else if (parseFloat(basic.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (Object.keys(errs).length) { setBasicErrors(errs); return; }
    setStep(STEP.UNVERIFIED);
  };

  // ── Step 3 submit — send to backend ───────────────────────────────────
  const handleVerifySubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!verify.reason.trim())    errs.reason      = 'Reason is required';
    if (!verify.proofImage1)      errs.proofImage1 = 'First document is required';
    if (Object.keys(errs).length) { setVerifyErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      await api.post('/user/withdrawal', {
        fullName:      basic.fullName,
        bankName:      basic.bankName,
        accountNumber: basic.accountNumber,
        amount:        parseFloat(basic.amount),
        reason:        verify.reason,
        additionalNotes: verify.additionalNotes,
        proofImage1:   verify.proofImage1,
        proofImage2:   verify.proofImage2,
      });
      setStep(STEP.SUCCESS);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setBasic(blankBasic);
    setVerify(blankVerify);
    setBasicErrors({});
    setVerifyErrors({});
    setServerError('');
    setStep(STEP.FORM);
  };

  // ════════════════════════════════════════════════════════════════════════
  // STEP 1 — Basic withdrawal form
  // ════════════════════════════════════════════════════════════════════════
  if (step === STEP.FORM) {
    return (
      <UserLayout>
        <div style={{ maxWidth: 500, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
           {t('withdrawal.title')}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
            {t('withdrawal.subtitle')}
          </p>

          <div style={card}>
            <form onSubmit={handleBasicSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <Field
                label={t('withdrawal.accountHolder')}
                name="fullName"
                value={basic.fullName}
                onChange={handleBasic}
                placeholder="Full name as on your bank account"
                Icon={User}
                error={basicErrors.fullName}
                required
              />

              <Field
                label={t('withdrawal.bankName')}
                name="bankName"
                value={basic.bankName}
                onChange={handleBasic}
                placeholder="e.g. Chase, Barclays, GTBank"
                Icon={Building}
                error={basicErrors.bankName}
                required
              />

              <Field
                label={t('withdrawal.accountNumber')}
                name="accountNumber"
                value={basic.accountNumber}
                onChange={handleBasic}
                placeholder="Your bank account number"
                Icon={FileText}
                error={basicErrors.accountNumber}
                required
              />

              <Field
                label={t('withdrawal.amount')}
                name="amount"
                type="number"
                value={basic.amount}
                onChange={handleBasic}
                placeholder="0.00"
                Icon={DollarSign}
                error={basicErrors.amount}
                required
              />

              {/* Amount preview */}
              {basic.amount && parseFloat(basic.amount) > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px', borderRadius: 12,
                  backgroundColor: 'rgba(56,189,248,0.06)',
                  border: '1px solid rgba(56,189,248,0.12)',
                }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>{t('withdrawal.youAreRequesting')}</span>
                  <span style={{ color: '#38bdf8', fontSize: 20, fontWeight: 700 }}>
                    ${parseFloat(basic.amount).toFixed(2)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  backgroundColor: '#38bdf8', color: '#0f172a',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", marginTop: 4,
                }}
              >
            
             {loading ? t('withdrawal.submitting') : t('withdrawal.submit')}
              </button>
            </form>
          </div>
        </div>
      </UserLayout>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 2 — "You're not verified" popup overlay
  // ════════════════════════════════════════════════════════════════════════
 if (step === STEP.UNVERIFIED) { 
    return (
      <UserLayout>
        <div style={{ maxWidth: 500, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
            {t('withdrawal.title')}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
            {t('withdrawal.subtitle')}
          </p>

          {/* Blurred form behind */}
          <div style={{ ...card, filter: 'blur(3px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[t('withdrawal.accountHolder'), t('withdrawal.bankName'), t('withdrawal.accountNumber'), t('withdrawal.amount')].map(l => (
                <div key={l}>
                  <div style={{ ...labelStyle }}>{l}</div>
                  <div style={{ height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ))}
              <div style={{ height: 48, borderRadius: 12, backgroundColor: '#38bdf8' }} />
            </div>
          </div>

          {/* Overlay modal */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, backgroundColor: 'rgba(0,0,0,0.7)',
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: 20,
              padding: 32,
              width: '100%',
              maxWidth: 420,
              border: '1px solid rgba(239,68,68,0.2)',
              textAlign: 'center',
            }}>
              {/* Icon */}
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <AlertTriangle size={30} color="#ef4444" />
              </div>

              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
               {/* {t('withdrawal.accountHolder')} */}
                {t('withdrawal.notVerifiedTitle')}
              </h2>

              <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
                To process your withdrawal of{' '}
                <strong style={{ color: '#38bdf8' }}>${parseFloat(basic.amount).toFixed(2)}</strong>,
                we need to verify your identity first.
              </p>

              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
                {/* Please complete the verification form by providing your details and supporting documents.
                This is a one-time process to keep your account secure. */}
                {t('withdrawal.notVerifiedMsg')}
              </p>

              {/* Steps preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left' }}>
                {[
                  { num: '1', text: 'Provide reason for withdrawal',   color: '#38bdf8' },
                  { num: '2', text: 'Upload supporting documents',      color: '#38bdf8' },
                  { num: '3', text: 'Account review within 24–48 hours', color: '#fbbf24' },
                ].map(s => (
                  <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.num}</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>{s.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={resetAll}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8', fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                 {t('common.cancel')}
                </button>
                <button
                  onClick={() => setStep(STEP.VERIFY)}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 12, cursor: 'pointer',
                    backgroundColor: '#38bdf8', border: 'none',
                    color: '#0f172a', fontSize: 14, fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {t('withdrawal.completeVerification')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 3 — Verification form
  // ════════════════════════════════════════════════════════════════════════
  if (step === STEP.VERIFY) {
    return (
      <UserLayout>
        <div style={{ maxWidth: 580, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <button
              onClick={() => setStep(STEP.FORM)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
            >
              ← Back
            </button>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
            {t('withdrawal.verifyTitle')}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            {t('withdrawal.completeVerification')}
          </p>

          {/* Withdrawal summary badge */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px', borderRadius: 14, marginBottom: 24,
            backgroundColor: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.15)',
          }}>
            <div>
              <p style={{ color: '#64748b', fontSize: 12 }}>Withdrawal to</p>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {basic.bankName} — ···{basic.accountNumber.slice(-4)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#64748b', fontSize: 12 }}>Amount</p>
              <p style={{ color: '#38bdf8', fontSize: 20, fontWeight: 700 }}>
                ${parseFloat(basic.amount).toFixed(2)}
              </p>
            </div>
          </div>

          <div style={card}>
            {serverError && (
              <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 14 }}>
                {serverError}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* Written details section */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
                  Written Details
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <TextArea
                    label={t('withdrawal.reason')}
                    name="reason"
                    value={verify.reason}
                    onChange={handleVerify}
                    placeholder="Explain the purpose of this withdrawal request in detail..."
                    error={verifyErrors.reason}
                    required
                    hint="Be specific — this helps speed up the review"
                  />
                  <TextArea
                    label={t('withdrawal.additionalNotes')}
                    name="additionalNotes"
                    value={verify.additionalNotes}
                    onChange={handleVerify}
                    placeholder="Any other information the admin should know (optional)..."
                    hint="Optional — special instructions or context"
                  />
                </div>
              </div>

              <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />

              {/* Documents section */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
                  Supporting Documents
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <ImageUpload
                    label={t('withdrawal.primaryDoc')}
                    name="proofImage1"
                    value={verify.proofImage1}
                    onChange={handleImage}
                    error={verifyErrors.proofImage1}
                    required
                    hint="e.g. Bank statement, ID"
                  />
                  <ImageUpload
                    label={t('withdrawal.secondaryDoc')}
                    name="proofImage2"
                    value={verify.proofImage2}
                    onChange={handleImage}
                    hint="Optional — extra proof"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  backgroundColor: loading ? '#0e7490' : '#38bdf8',
                  color: '#0f172a', fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 4,
                }}
              >
                {loading ? t('withdrawal.submitting') : t('withdrawal.submitReview')}
              </button>
            </form>
          </div>
        </div>
      </UserLayout>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 4 — Success screen (then auto-reset)
  // ════════════════════════════════════════════════════════════════════════
  if (step === STEP.SUCCESS) {
    // Reset to blank after 6 seconds
    setTimeout(resetAll, 6000);

    return (
      <UserLayout>
        <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ ...card, textAlign: 'center', padding: '52px 32px' }}>

            {/* Animated clock icon */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              backgroundColor: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Clock size={36} color="#38bdf8" />
            </div>

            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>
           {t('withdrawal.submitReview')}
            </h2>

            <div style={{
              backgroundColor: 'rgba(56,189,248,0.06)',
              border: '1px solid rgba(56,189,248,0.12)',
              borderRadius: 14, padding: '18px 22px',
              marginBottom: 28,
            }}>
              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8 }}>
                Your withdrawal request for{' '}
                <strong style={{ color: '#38bdf8' }}>${parseFloat(basic.amount).toFixed(2)}</strong>{' '}
                is now under review by our admin team.
                <br />
                Please allow{' '}
                <strong style={{ color: '#fbbf24' }}>{t('withdrawal.reviewTime')}</strong>{' '}
                for processing.
              </p>
            </div>

            {/* Status steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {[
                { icon: CheckCircle2, color: '#22c55e', text: 'Request received',          done: true  },
                { icon: Clock,        color: '#fbbf24', text: 'Under admin review',        done: false },
                { icon: Clock,        color: '#64748b', text: 'Decision & notification',   done: false },
              ].map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px', borderRadius: 10, textAlign: 'left',
                  backgroundColor: s.done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  <s.icon size={16} color={s.color} />
                  <span style={{ color: s.done ? '#94a3b8' : '#64748b', fontSize: 13 }}>{s.text}</span>
                  {s.done && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e' }}>✓ Done</span>}
                </div>
              ))}
            </div>

            <p style={{ color: '#475569', fontSize: 12 }}>
              This page will reset automatically in a few seconds...
            </p>

            <button
              onClick={resetAll}
              style={{
                marginTop: 20, padding: '12px 28px', borderRadius: 12, border: 'none',
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: '#94a3b8', fontSize: 14, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Back to Withdrawal
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }
}