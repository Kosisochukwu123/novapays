import { useState, useEffect, useCallback } from 'react';
import {
  Copy, CheckCircle2, AlertTriangle, RefreshCw,
  ArrowDownToLine, Clock, XCircle, AlertCircle
} from 'lucide-react';
import UserLayout from '../../components/layout/UserLayout';
import api from '../../services/api';

// ── Styles ────────────────────────────────────────────────────────────────
const card = {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
};

const inputBase = {
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '11px 14px',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
};

// ── Network icon SVGs ─────────────────────────────────────────────────────
const NetworkIcon = ({ symbol, color, size = 20 }) => {
  const s = { width: size, height: size };

  if (symbol === 'BTC') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 7h4a2 2 0 0 1 0 4H9v4h4a2 2 0 0 1 0 4H9" />
      <line x1="9" y1="12" x2="13" y2="12" />
      <line x1="11" y1="5" x2="11" y2="7" />
      <line x1="11" y1="17" x2="11" y2="19" />
    </svg>
  );

  if (symbol === 'ETH') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <polyline points="2 8.5 12 13.5 22 8.5" />
    </svg>
  );

  if (symbol === 'USDT') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="12" y1="8" x2="12" y2="12" />
    </svg>
  );

  if (symbol === 'BNB') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M12 2l3 3-3 3-3-3 3-3z" />
      <path d="M2 12l3-3 3 3-3 3-3-3z" />
      <path d="M22 12l-3-3-3 3 3 3 3-3z" />
      <path d="M12 22l-3-3 3-3 3 3-3 3z" />
    </svg>
  );

  if (symbol === 'SOL') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );

  if (symbol === 'TRX') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polygon points="12 2 22 20 2 20" />
      <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
  );

  if (symbol === 'LTC') return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="7" y1="16" x2="17" y2="16" />
      <path d="M10 8l-2 8" />
      <path d="M8 13l5-2" />
    </svg>
  );

  // Default
  return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
};

// ── Status config ─────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  Icon: Clock        },
  confirmed: { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   Icon: CheckCircle2 },
  rejected:  { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   Icon: XCircle      },
};

// ── Skeleton card ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{ ...card, padding: 16, textAlign: 'center' }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#0f172a', margin: '0 auto 10px' }} />
    <div style={{ width: 40, height: 12, borderRadius: 4, backgroundColor: '#0f172a', margin: '0 auto 6px' }} />
    <div style={{ width: 30, height: 10, borderRadius: 4, backgroundColor: '#0f172a', margin: '0 auto' }} />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────
export default function DepositPage() {
  const [wallets,        setWallets]        = useState([]);
  const [deposits,       setDeposits]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selected,       setSelected]       = useState(null);
  const [copied,         setCopied]         = useState(false);
  const [tab,            setTab]            = useState('deposit');
  const [notifyForm,     setNotifyForm]     = useState({ amount: '', txHash: '' });
  const [notifyLoading,  setNotifyLoading]  = useState(false);
  const [notifyMsg,      setNotifyMsg]      = useState(null);
  const [error,          setError]          = useState('');

  // ── Fetch wallets + deposit history ──────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [walletsRes, depositsRes] = await Promise.all([
        api.get('/user/deposit/wallets'),
        api.get('/user/deposits'),
      ]);
      const w = walletsRes.data.wallets || [];
      setWallets(w);
      if (w.length > 0) setSelected(prev => prev || w[0]);
      setDeposits(depositsRes.data.deposits || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load deposit information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Copy address ──────────────────────────────────────────────────────
  const copyAddress = async () => {
    if (!selected?.address) return;
    try {
      await navigator.clipboard.writeText(selected.address);
    } catch {
      const el = document.createElement('textarea');
      el.value = selected.address;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Notify deposit ────────────────────────────────────────────────────
  const handleNotify = async (e) => {
    e.preventDefault();
    if (!selected || !notifyForm.amount) return;
    setNotifyLoading(true);
    setNotifyMsg(null);
    try {
      await api.post('/user/deposit/notify', {
        network:       selected.network,
        symbol:        selected.symbol,
        walletAddress: selected.address,
        amount:        parseFloat(notifyForm.amount) || 0,
        txHash:        notifyForm.txHash.trim(),
      });
      setNotifyMsg({
        ok:  true,
        msg: 'Deposit notification sent! Our team will confirm within 24 hours.',
      });
      setNotifyForm({ amount: '', txHash: '' });
      fetchData();
    } catch (err) {
      setNotifyMsg({
        ok:  false,
        msg: err.response?.data?.message || 'Failed to submit notification',
      });
    } finally {
      setNotifyLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <UserLayout>
      <div style={{ maxWidth: 740, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              Deposit Funds
            </h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Send crypto to your NovaPay account
            </p>
          </div>
          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {[
            { key: 'deposit', label: 'Make a Deposit'  },
            { key: 'history', label: 'Deposit History' },
          ].map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                backgroundColor: tab === tb.key ? '#1e293b' : 'transparent',
                color:           tab === tb.key ? '#fff'    : '#64748b',
              }}
            >
              {tb.label}
              {tb.key === 'history' && deposits.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, backgroundColor: '#38bdf8', color: '#0f172a', borderRadius: 20, padding: '1px 6px', fontWeight: 700 }}>
                  {deposits.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Global error */}
        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
            <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
              Retry
            </button>
          </div>
        )}

        {/* ══ DEPOSIT TAB ════════════════════════════════════════════════ */}
        {tab === 'deposit' && (
          <>
            {/* Step 1 — select network */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
                Step 1 — Select Network
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {loading
                  ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
                  : wallets.map(wallet => {
                    const isActive = selected?.network === wallet.network;
                    return (
                      <button
                        key={wallet.network}
                        onClick={() => { setSelected(wallet); setNotifyMsg(null); setNotifyForm({ amount: '', txHash: '' }); }}
                        style={{
                          ...card,
                          padding: '16px 12px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          border: isActive
                            ? '2px solid ' + wallet.color
                            : '1px solid rgba(255,255,255,0.06)',
                          backgroundColor: isActive ? wallet.color + '12' : '#1e293b',
                          fontFamily: "'DM Sans', sans-serif",
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: wallet.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                          <NetworkIcon symbol={wallet.symbol} color={wallet.color} size={22} />
                        </div>
                        <p style={{ color: isActive ? wallet.color : '#f1f5f9', fontSize: 13, fontWeight: 700, margin: '0 0 3px' }}>
                          {wallet.symbol}
                        </p>
                        <p style={{ color: '#64748b', fontSize: 10, margin: '0 0 6px' }}>
                          {wallet.network_tag}
                        </p>
                        {isActive && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, backgroundColor: wallet.color + '20', color: wallet.color }}>
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })
                }
              </div>
            </div>

            {/* Step 2 — wallet address */}
            {selected && !loading && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
                  Step 2 — Send to This Address
                </p>

                <div style={{ ...card, padding: 24 }}>

                  {/* Network info bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, backgroundColor: selected.color + '08', border: '1px solid ' + selected.color + '20', marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: selected.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <NetworkIcon symbol={selected.symbol} color={selected.color} size={18} />
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>{selected.label}</p>
                      <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                        Min. deposit:{' '}
                        <span style={{ color: selected.color }}>{selected.minDeposit} {selected.symbol}</span>
                        {' · '}
                        {selected.confirmations} confirmations required
                      </p>
                    </div>
                  </div>

                  {/* Address display + copy */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                      {selected.label} Deposit Address
                    </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                      <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px' }}>
                        <code style={{ color: '#f1f5f9', fontSize: 12, wordBreak: 'break-all', lineHeight: 1.6, fontFamily: 'monospace' }}>
                          {selected.address}
                        </code>
                      </div>
                      <button
                        onClick={copyAddress}
                        style={{
                          padding: '12px 18px',
                          borderRadius: 12,
                          cursor: 'pointer',
                          flexShrink: 0,
                          backgroundColor: copied ? 'rgba(34,197,94,0.15)' : selected.color + '15',
                          border:          '1px solid ' + (copied ? 'rgba(34,197,94,0.3)' : selected.color + '30'),
                          color:           copied ? '#4ade80' : selected.color,
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize:        13,
                          fontWeight:      600,
                          display:         'flex',
                          alignItems:      'center',
                          gap:             6,
                          transition:      'all 0.2s',
                        }}
                      >
                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Warning banner */}
                  <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 24 }}>
                    <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                      Only send{' '}
                      <strong style={{ color: '#fbbf24' }}>{selected.symbol} on {selected.network_tag}</strong>
                      {' '}to this address. Sending any other asset or using a different network may result in permanent loss of funds.
                    </p>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

                  {/* Step 3 — notify */}
                  <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                    Step 3 — Notify Us After Sending
                  </p>
                  <p style={{ color: '#475569', fontSize: 12, marginBottom: 16 }}>
                    Optional but speeds up confirmation. Let us know how much you sent.
                  </p>

                  {/* Notify feedback */}
                  {notifyMsg && (
                    <div style={{
                      marginBottom: 16, padding: '12px 16px', borderRadius: 12,
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                      backgroundColor: notifyMsg.ok ? 'rgba(34,197,94,0.1)'  : 'rgba(239,68,68,0.1)',
                      border:          notifyMsg.ok ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)',
                      color:           notifyMsg.ok ? '#4ade80' : '#f87171',
                    }}>
                      {notifyMsg.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {notifyMsg.msg}
                    </div>
                  )}

                  <form onSubmit={handleNotify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Amount field */}
                    <div>
                      <label style={{ fontSize: 13, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                        Amount Sent ({selected.symbol}) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={notifyForm.amount}
                        onChange={e => setNotifyForm(p => ({ ...p, amount: e.target.value }))}
                        placeholder={'e.g. 0.005'}
                        style={inputBase}
                        onFocus={e => e.target.style.borderColor = selected.color}
                        onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    {/* Tx hash field */}
                    <div>
                      <label style={{ fontSize: 13, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                        Transaction Hash{' '}
                        <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={notifyForm.txHash}
                        onChange={e => setNotifyForm(p => ({ ...p, txHash: e.target.value }))}
                        placeholder="Paste your transaction hash..."
                        style={{ ...inputBase, fontFamily: 'monospace' }}
                        onFocus={e => e.target.style.borderColor = selected.color}
                        onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={notifyLoading || !notifyForm.amount}
                      style={{
                        width:           '100%',
                        padding:         '13px',
                        borderRadius:    12,
                        border:          'none',
                        backgroundColor: (notifyLoading || !notifyForm.amount) ? '#334155' : selected.color,
                        color:           '#0f172a',
                        fontWeight:      700,
                        fontSize:        15,
                        cursor:          (notifyLoading || !notifyForm.amount) ? 'not-allowed' : 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        opacity:         (notifyLoading || !notifyForm.amount) ? 0.5 : 1,
                        display:         'flex',
                        alignItems:      'center',
                        justifyContent:  'center',
                        gap:             8,
                        transition:      'all 0.2s',
                      }}
                    >
                      <ArrowDownToLine size={16} />
                      {notifyLoading ? 'Submitting...' : "I've Sent the Funds"}
                    </button>
                  </form>
                </div>

                {/* Info cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                  {[
                    {
                      Icon:  Clock,
                      color: '#fbbf24',
                      title: 'Confirmation Time',
                      desc:  selected.confirmations + ' block confirmations required',
                    },
                    {
                      Icon:  CheckCircle2,
                      color: '#4ade80',
                      title: 'Auto Credit',
                      desc:  'Balance updated once admin confirms',
                    },
                    {
                      Icon:  AlertTriangle,
                      color: '#f87171',
                      title: 'Correct Network',
                      desc:  'Always use ' + selected.network_tag + ' network only',
                    },
                  ].map(item => (
                    <div key={item.title} style={{ ...card, padding: '14px 16px' }}>
                      <item.Icon size={16} color={item.color} style={{ marginBottom: 8 }} />
                      <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 0 }}>
                        {item.title}
                      </p>
                      <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ HISTORY TAB ════════════════════════════════════════════════ */}
        {tab === 'history' && (
          <div>
            {deposits.length === 0 ? (
              <div style={{ ...card, padding: '56px 24px', textAlign: 'center' }}>
                <ArrowDownToLine size={40} color="#334155" style={{ marginBottom: 16 }} />
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
                  No deposit history yet
                </p>
                <button
                  onClick={() => setTab('deposit')}
                  style={{ padding: '10px 24px', borderRadius: 12, border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Make a Deposit
                </button>
              </div>
            ) : (
              <div style={{ ...card }}>

                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr 1fr', gap: 10, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <span>Network</span>
                  <span>Amount</span>
                  <span>Tx Hash</span>
                  <span>Date</span>
                  <span style={{ textAlign: 'center' }}>Status</span>
                </div>

                {deposits.map((dep, i) => {
                  const wallet     = wallets.find(w => w.network === dep.network);
                  const color      = wallet ? wallet.color : '#94a3b8';
                  const statusCfg  = STATUS_CFG[dep.status] || STATUS_CFG.pending;
                  const SIcon      = statusCfg.Icon;
                  const isLast     = i === deposits.length - 1;

                  return (
                    <div
                      key={dep._id}
                      style={{
                        display:             'grid',
                        gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr 1fr',
                        gap:                 10,
                        padding:             '14px 20px',
                        alignItems:          'center',
                        borderBottom:        isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        transition:          'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Network */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <NetworkIcon symbol={dep.symbol} color={color} size={16} />
                        </div>
                        <div>
                          <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500, margin: 0 }}>
                            {dep.symbol}
                          </p>
                          <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>
                            {dep.network}
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <span style={{ color: dep.amount > 0 ? '#fff' : '#64748b', fontSize: 13, fontWeight: 600 }}>
                        {dep.amount > 0 ? dep.amount + ' ' + dep.symbol : '—'}
                      </span>

                      {/* Tx hash */}
                      <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dep.txHash ? dep.txHash.slice(0, 12) + '...' : '—'}
                      </span>

                      {/* Date */}
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        {new Date(dep.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>

                      {/* Status */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{
                          display:         'inline-flex',
                          alignItems:      'center',
                          gap:             4,
                          fontSize:        11,
                          padding:         '4px 10px',
                          borderRadius:    20,
                          backgroundColor: statusCfg.bg,
                          color:           statusCfg.color,
                          border:          '1px solid ' + statusCfg.border,
                          textTransform:   'capitalize',
                        }}>
                          <SIcon size={11} /> {dep.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
