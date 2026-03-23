import { useState } from 'react';
import {
  PiggyBank, TrendingUp, Shield, BarChart2,
  CheckCircle2, ChevronRight, Star,
  Wallet, Clock, Zap
} from 'lucide-react';
import UserLayout from '../../components/layout/UserLayout';
import IneligibleOverlay from '../../components/common/IneligibleOverlay';

const card = {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
};

const INVESTMENT_PRODUCTS = [
  {
    id: 'fixed',
    name: 'Fixed Deposit',
    icon: '🔒',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.2)',
    returns: '5.5% – 8.0% p.a.',
    min: '$500',
    term: '3 – 36 months',
    risk: 'Low',
    riskColor: '#22c55e',
    description: 'Lock in your money at a guaranteed rate. Perfect for risk-averse investors seeking stable returns.',
    features: ['Guaranteed returns', 'Capital protection', 'Auto-renewal option', 'Interest paid monthly'],
    badge: 'Lowest Risk',
    badgeColor: '#22c55e',
  },
  {
    id: 'mutual',
    name: 'Mutual Funds',
    icon: '📊',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.1)',
    border: 'rgba(192,132,252,0.2)',
    returns: '10% – 18% p.a.',
    min: '$250',
    term: '1 – 10 years',
    risk: 'Medium',
    riskColor: '#fbbf24',
    description: 'Diversified portfolios managed by professionals. Exposure to equities, bonds and global markets.',
    features: ['Professional management', 'Diversified exposure', 'Liquidity on request', 'Dividend reinvestment'],
    badge: 'Most Popular',
    badgeColor: '#c084fc',
  },
  {
    id: 'savings',
    name: 'Savings Plan',
    icon: '💰',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.2)',
    returns: '3.5% – 5.0% p.a.',
    min: '$50/month',
    term: 'Flexible',
    risk: 'Very Low',
    riskColor: '#4ade80',
    description: 'Build wealth gradually with automatic monthly contributions. Start small and grow over time.',
    features: ['Start from $50/month', 'Flexible contributions', 'No lock-in period', 'Compound interest'],
    badge: 'Best for Beginners',
    badgeColor: '#22c55e',
  },
];

const RISK_PROFILES = [
  { level: 'Conservative',  desc: 'Capital preservation, minimal risk',          color: '#22c55e', products: ['Fixed Deposit', 'Savings Plan']                  },
  { level: 'Balanced',      desc: 'Mix of growth and stability',                  color: '#f59e0b', products: ['Mutual Funds', 'Fixed Deposit']                  },
  { level: 'Aggressive',    desc: 'Maximum growth, higher risk tolerance',        color: '#ef4444', products: ['Mutual Funds', 'Crypto Trading']                  },
];

const STATS = [
  { value: '$2.4B+', label: 'Assets Under Management', icon: BarChart2  },
  { value: '14.2%',  label: 'Average Annual Return',   icon: TrendingUp },
  { value: '50K+',   label: 'Active Investors',        icon: Wallet     },
  { value: '99.9%',  label: 'Platform Uptime',         icon: Shield     },
];

const FAQS = [
  { q: 'What is the minimum investment amount?',      a: 'Minimum varies by product — Fixed Deposits start at $500, Mutual Funds at $250, and Savings Plans from just $50/month.' },
  { q: 'Can I withdraw my investment early?',         a: 'Savings Plans are fully flexible. Fixed Deposits may incur a small early withdrawal penalty. Mutual Funds can be liquidated within 3–5 business days.' },
  { q: 'Are my investments insured?',                 a: 'Fixed Deposits are capital-protected. Mutual Funds are market-linked and subject to market risk, though diversification minimizes exposure.' },
  { q: 'How are returns taxed?',                      a: 'Investment returns may be subject to applicable taxes in your jurisdiction. We recommend consulting a tax advisor for your specific situation.' },
];

export default function InvestmentPage() {
  const [showOverlay,    setShowOverlay]    = useState(false);
  const [openFaq,        setOpenFaq]        = useState(null);
  const [selectedRisk,   setSelectedRisk]   = useState(null);

  return (
    <UserLayout>
      {showOverlay && <IneligibleOverlay type="investment" />}

      <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#f1f5f9', maxWidth: 900, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{
          ...card,
          padding: '40px 36px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a1035 0%, #1e293b 100%)',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', backgroundColor: 'rgba(192,132,252,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -50, right: 80, width: 160, height: 160, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.05)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(192,132,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PiggyBank size={22} color="#c084fc" />
              </div>
              <span style={{ fontSize: 13, color: '#c084fc', fontWeight: 600, backgroundColor: 'rgba(192,132,252,0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(192,132,252,0.2)' }}>
                NovaPay Investments
              </span>
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 12, lineHeight: 1.2 }}>
              Grow Your Wealth<br />
              <span style={{ color: '#c084fc' }}>Smarter Every Day</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7, maxWidth: 500, marginBottom: 28 }}>
              Access institutional-grade investment products. Fixed returns, mutual funds, and automated savings — all in one place.
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { icon: TrendingUp, label: 'Returns up to 18% p.a.'   },
                { icon: Shield,     label: 'Capital-protected options' },
                { icon: Zap,        label: 'Start from just $50'       },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <f.icon size={15} color="#c084fc" />
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ ...card, padding: '18px 16px', textAlign: 'center' }}>
              <s.icon size={18} color="#c084fc" style={{ marginBottom: 10 }} />
              <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{s.value}</p>
              <p style={{ color: '#64748b', fontSize: 11 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Investment Products */}
        <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
          Investment Products
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {INVESTMENT_PRODUCTS.map(product => (
            <div key={product.id} style={{ ...card, padding: 22, position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* Badge */}
              {product.badge && (
                <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, backgroundColor: `${product.badgeColor}18`, color: product.badgeColor, border: `1px solid ${product.badgeColor}30` }}>
                  {product.badge}
                </div>
              )}

              {/* Icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: product.bg, border: `1px solid ${product.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {product.icon}
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{product.name}</p>
                  <p style={{ color: product.color, fontSize: 11, marginTop: 1, fontWeight: 600 }}>{product.returns}</p>
                </div>
              </div>

              <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6, marginBottom: 14, flex: 1 }}>{product.description}</p>

              {/* Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                {[
                  { label: 'Min.',  value: product.min  },
                  { label: 'Term',  value: product.term  },
                  { label: 'Risk',  value: product.risk, valueColor: product.riskColor },
                ].map(m => (
                  <div key={m.label} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                    <p style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>{m.label}</p>
                    <p style={{ color: m.valueColor || '#f1f5f9', fontSize: 12, fontWeight: 600 }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div style={{ marginBottom: 18 }}>
                {product.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 5 }}>
                    <CheckCircle2 size={12} color={product.color} />
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowOverlay(true)}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  backgroundColor: product.bg, color: product.color,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  border: `1px solid ${product.border}`,
                }}
              >
                Invest Now <ChevronRight size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Risk Profile Selector */}
        <div style={{ ...card, padding: 28, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <BarChart2 size={18} color="#c084fc" />
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Find Your Risk Profile</p>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            Choose the investment style that matches your goals
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {RISK_PROFILES.map((profile, i) => (
              <button
                key={i}
                onClick={() => setSelectedRisk(selectedRisk === i ? null : i)}
                style={{
                  padding: '18px 16px', borderRadius: 14, cursor: 'pointer',
                  border: `1px solid ${selectedRisk === i ? profile.color : 'rgba(255,255,255,0.08)'}`,
                  backgroundColor: selectedRisk === i ? `${profile.color}10` : 'rgba(255,255,255,0.03)',
                  textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: profile.color, marginBottom: 10 }} />
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{profile.level}</p>
                <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>{profile.desc}</p>
                {selectedRisk === i && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>Recommended:</p>
                    {profile.products.map(p => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <ChevronRight size={11} color={profile.color} />
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
          {selectedRisk !== null && (
            <button
              onClick={() => setShowOverlay(true)}
              style={{
                marginTop: 16, width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                backgroundColor: '#c084fc', color: '#0f172a',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Start Investing with {RISK_PROFILES[selectedRisk].level} Profile
            </button>
          )}
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
        <div style={{ ...card, padding: '32px 28px', textAlign: 'center', background: 'linear-gradient(135deg, #1a1035 0%, #1e293b 100%)' }}>
          <Star size={22} color="#fbbf24" style={{ marginBottom: 12 }} />
          <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>
            Ready to Grow Your Wealth?
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
            Complete your profile and meet eligibility requirements to start investing today.
          </p>
          <button
            onClick={() => setShowOverlay(true)}
            style={{
              padding: '13px 36px', borderRadius: 12, border: 'none',
              backgroundColor: '#c084fc', color: '#0f172a',
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