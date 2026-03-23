import { useState } from 'react';
import {
  Landmark, Shield, Clock, TrendingDown,
  CheckCircle2, ChevronRight, Calculator, Star
} from 'lucide-react';
import UserLayout from '../../components/layout/UserLayout';
import IneligibleOverlay from '../../components/common/IneligibleOverlay';

const card = {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
};

const LOAN_PRODUCTS = [
  {
    id: 'personal',
    name: 'Personal Loan',
    icon: '👤',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.2)',
    range: '$1,000 – $50,000',
    rate: 'From 8.9% APR',
    term: '12 – 60 months',
    description: 'Fund personal goals, emergencies, or major purchases with flexible repayment terms.',
    features: ['No collateral required', 'Fixed monthly payments', 'Early repayment allowed', 'Instant decision'],
    badge: 'Most Popular',
    badgeColor: '#38bdf8',
  },
  {
    id: 'business',
    name: 'Business Loan',
    icon: '🏢',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.2)',
    range: '$5,000 – $500,000',
    rate: 'From 6.5% APR',
    term: '6 – 84 months',
    description: 'Scale your business with capital for equipment, inventory, expansion or working capital.',
    features: ['Competitive rates', 'Flexible use of funds', 'Dedicated account manager', 'Tax-deductible interest'],
    badge: 'Best Value',
    badgeColor: '#22c55e',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Apply Online',     desc: 'Fill out a simple application form in minutes', color: '#38bdf8'  },
  { step: '02', title: 'Get Reviewed',     desc: 'Our team reviews your application within 24 hrs', color: '#f59e0b' },
  { step: '03', title: 'Receive Funds',    desc: 'Approved funds deposited directly to your account', color: '#22c55e' },
  { step: '04', title: 'Repay Easily',     desc: 'Automated monthly repayments from your balance', color: '#c084fc'  },
];

const FAQS = [
  { q: 'What credit score do I need?',         a: 'We consider multiple factors beyond credit score, including your account activity and transaction history on NovaPay.' },
  { q: 'How fast can I get approved?',         a: 'Personal loan decisions are typically made within 24–48 hours of submitting a complete application.' },
  { q: 'Can I repay early without penalty?',   a: 'Yes — all NovaPay loans allow early repayment with no additional fees or penalties.' },
  { q: 'Is collateral required?',              a: 'Personal loans are unsecured — no collateral needed. Business loans over $50,000 may require collateral.' },
];

// ── Loan calculator ────────────────────────────────────────────────────────
const calcMonthly = (principal, rate, months) => {
  const r = rate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

export default function LoansPage() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [openFaq,     setOpenFaq]     = useState(null);
  const [calcAmount,  setCalcAmount]  = useState('10000');
  const [calcRate,    setCalcRate]    = useState('8.9');
  const [calcMonths,  setCalcMonths]  = useState('24');

  const monthly = calcMonthly(
    parseFloat(calcAmount) || 0,
    parseFloat(calcRate)   || 0,
    parseInt(calcMonths)   || 1
  );
  const totalRepay = monthly * (parseInt(calcMonths) || 1);
  const totalInterest = totalRepay - (parseFloat(calcAmount) || 0);

  return (
    <UserLayout>
      {/* Ineligible overlay */}
      {showOverlay && <IneligibleOverlay type="loans" />}

      <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#f1f5f9', maxWidth: 900, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{
          ...card,
          padding: '40px 36px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f2137 100%)',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(56,189,248,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -60, right: 100, width: 150, height: 150, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.05)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Landmark size={22} color="#38bdf8" />
              </div>
              <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600, backgroundColor: 'rgba(56,189,248,0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(56,189,248,0.2)' }}>
                NovaPay Loans
              </span>
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 12, lineHeight: 1.2 }}>
              Flexible Loans<br />
              <span style={{ color: '#38bdf8' }}>Built for You</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7, maxWidth: 500, marginBottom: 28 }}>
              Get the funds you need quickly and affordably. Transparent rates, no hidden fees, and repayment that fits your life.
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { icon: TrendingDown, label: 'Rates from 6.5% APR'      },
                { icon: Clock,        label: 'Decisions in 24–48 hrs'    },
                { icon: Shield,       label: 'No hidden fees'            },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <f.icon size={15} color="#38bdf8" />
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loan Products */}
        <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
          Loan Products
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          {LOAN_PRODUCTS.map(loan => (
            <div key={loan.id} style={{ ...card, padding: 24, position: 'relative', overflow: 'hidden' }}>
              {/* Badge */}
              {loan.badge && (
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: `${loan.badgeColor}18`, color: loan.badgeColor, border: `1px solid ${loan.badgeColor}30` }}>
                  {loan.badge}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: loan.bg, border: `1px solid ${loan.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {loan.icon}
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{loan.name}</p>
                  <p style={{ color: loan.color, fontSize: 12, marginTop: 2, fontWeight: 600 }}>{loan.rate}</p>
                </div>
              </div>

              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{loan.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Loan Range', value: loan.range },
                  { label: 'Term',       value: loan.term  },
                ].map(info => (
                  <div key={info.label} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                    <p style={{ color: '#64748b', fontSize: 11, marginBottom: 3 }}>{info.label}</p>
                    <p style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600 }}>{info.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                {loan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6 }}>
                    <CheckCircle2 size={13} color={loan.color} />
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowOverlay(true)}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                  backgroundColor: loan.bg, color: loan.color,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  border: `1px solid ${loan.border}`,
                }}
              >
                Apply Now <ChevronRight size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* Loan Calculator */}
        <div style={{ ...card, padding: 28, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <Calculator size={18} color="#38bdf8" />
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Loan Calculator</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Loan Amount ($)',   value: calcAmount,  set: setCalcAmount,  min: 1000,  max: 500000, step: 1000  },
              { label: 'Interest Rate (%)', value: calcRate,    set: setCalcRate,    min: 1,     max: 30,     step: 0.1   },
              { label: 'Term (months)',     value: calcMonths,  set: setCalcMonths,  min: 6,     max: 84,     step: 6     },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input
                  type="number"
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  min={f.min} max={f.max} step={f.step}
                  style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif', boxSizing: 'border-box" }}
                  onFocus={e => e.target.style.borderColor = '#38bdf8'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { label: 'Monthly Payment',  value: `$${isNaN(monthly)     ? '0.00' : monthly.toFixed(2)}`,       color: '#38bdf8' },
              { label: 'Total Repayment',  value: `$${isNaN(totalRepay)  ? '0.00' : totalRepay.toFixed(2)}`,    color: '#f1f5f9' },
              { label: 'Total Interest',   value: `$${isNaN(totalInterest)? '0.00' : totalInterest.toFixed(2)}`, color: '#f87171' },
            ].map(r => (
              <div key={r.label} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>{r.label}</p>
                <p style={{ color: r.color, fontSize: 20, fontWeight: 700 }}>{r.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
          How It Works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{ ...card, padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: step.color, opacity: 0.4, marginBottom: 10, fontFamily: "'Playfair Display', serif" }}>
                {step.step}
              </div>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{step.title}</p>
              <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
          Frequently Asked Questions
        </p>
        <div style={{ ...card, overflow: 'hidden', marginBottom: 28 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>{faq.q}</span>
                <ChevronRight size={16} color="#64748b" style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 22px 18px' }}>
                  <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ ...card, padding: '32px 28px', textAlign: 'center', background: 'linear-gradient(135deg, #1e293b 0%, #0f2137 100%)' }}>
          <Star size={22} color="#fbbf24" style={{ marginBottom: 12 }} />
          <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
            Ready to Apply?
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
            Complete your profile to unlock loan eligibility and get started.
          </p>
          <button
            onClick={() => setShowOverlay(true)}
            style={{
              padding: '13px 36px', borderRadius: 12, border: 'none',
              backgroundColor: '#38bdf8', color: '#0f172a',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Check My Eligibility
          </button>
        </div>
      </div>
    </UserLayout>
  );
}