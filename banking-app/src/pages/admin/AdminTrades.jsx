import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw,
  Trophy, XCircle, Clock, Eye,
  X, Save, AlertCircle, DollarSign,
  CheckCircle2, BarChart2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const card = {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
  overflow: 'scroll',
};

const OUTCOME_CFG = {
  pending: { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  Icon: Clock    },
  win:     { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   Icon: Trophy   },
  loss:    { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   Icon: XCircle  },
};

const ASSET_COLOR = {
  crypto:    '#f59e0b',
  forex:     '#38bdf8',
  stock:     '#22c55e',
  commodity: '#c084fc',
};

const modalCard = {
  backgroundColor: '#1e293b',
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.1)',
  padding: 32,
  width: '100%',
  maxWidth: 520,
};

const inputStyle = {
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

export default function AdminTrades() {
  const [trades,       setTrades]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [selected,     setSelected]     = useState(null);
  const [outcomeFilter,setOutcomeFilter]= useState('all');
  const [assetFilter,  setAssetFilter]  = useState('all');
  const [search,       setSearch]       = useState('');
  const [resolveForm,  setResolveForm]  = useState({ outcome: 'win', returnAmount: '', adminNote: '' });
  const [resolveError, setResolveError] = useState('');
  const [saveLoading,  setSaveLoading]  = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  const isMobile = window.innerWidth < 590;

  // ── Fetch all trades ──────────────────────────────────────────────────
  const fetchTrades = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/trades');
      setTrades(res.data.trades || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  // ── Open resolve modal ────────────────────────────────────────────────
  const openResolve = (trade) => {
    setSelected(trade);
    setResolveForm({
      outcome:      'win',
      returnAmount: (trade.total * 1.2).toFixed(2), // default: 20% profit suggestion
      adminNote:    '',
    });
    setResolveError('');
  };

  // ── Submit resolution ─────────────────────────────────────────────────
  const handleResolve = async () => {
    if (!resolveForm.outcome) { setResolveError('Select an outcome'); return; }

    if (resolveForm.outcome === 'win') {
      const ret = parseFloat(resolveForm.returnAmount);
      if (!ret || isNaN(ret) || ret <= 0) {
        setResolveError('Enter a valid return amount for a win');
        return;
      }
    }

    setSaveLoading(true);
    setResolveError('');
    try {
      const res = await api.put(`/admin/trades/${selected._id}/resolve`, {
        outcome:      resolveForm.outcome,
        returnAmount: resolveForm.outcome === 'win' ? parseFloat(resolveForm.returnAmount) : 0,
        adminNote:    resolveForm.adminNote,
      });

      const updated = res.data.trade;

      // Update in local state
      setTrades(prev => prev.map(t => t._id === updated._id ? updated : t));
      setSelected(null);
    } catch (err) {
      setResolveError(err.response?.data?.message || 'Failed to resolve trade');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Filter & search ───────────────────────────────────────────────────
  const filtered = trades
    .filter(t => outcomeFilter === 'all' || t.outcome === outcomeFilter)
    .filter(t => assetFilter   === 'all' || t.assetType === assetFilter)
    .filter(t => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.symbol?.toLowerCase().includes(q) ||
        t.user?.fullName?.toLowerCase().includes(q) ||
        t.user?.email?.toLowerCase().includes(q)
      );
    });

  // ── Counts ────────────────────────────────────────────────────────────
  const counts = {
    all:     trades.length,
    pending: trades.filter(t => t.outcome === 'pending').length,
    win:     trades.filter(t => t.outcome === 'win').length,
    loss:    trades.filter(t => t.outcome === 'loss').length,
  };

  const totalVolume = trades.reduce((s, t) => s + (t.total || 0), 0);
  const totalReturned = trades.filter(t => t.outcome === 'win').reduce((s, t) => s + (t.returnAmount || 0), 0);

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ width: 200, height: 28, borderRadius: 8, backgroundColor: '#1e293b', marginBottom: 8 }} />
          <div style={{ width: 280, height: 14, borderRadius: 6, backgroundColor: '#1e293b', marginBottom: 24 }} />
          <div style={card}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#0f172a', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ width: 140, height: 13, borderRadius: 4, backgroundColor: '#0f172a' }} />
                  <div style={{ width: 100, height: 11, borderRadius: 4, backgroundColor: '#0f172a' }} />
                </div>
                <div style={{ width: 70, height: 13, borderRadius: 4, backgroundColor: '#0f172a' }} />
                <div style={{ width: 70, height: 22, borderRadius: 20, backgroundColor: '#0f172a' }} />
                <div style={{ width: 80, height: 28, borderRadius: 8, backgroundColor: '#0f172a' }} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', padding: 24, color: '#334155', fontSize: 13 }}>Loading trades...</div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              Trade Manager
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              Review and resolve all user trades
              {lastUpdated && (
                <span style={{ color: '#334155', marginLeft: 8 }}>
                  · Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button onClick={() => fetchTrades(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Trades',    value: counts.all,                          color: '#f1f5f9' },
            { label: 'Pending',         value: counts.pending,                      color: '#fbbf24' },
            { label: 'Won',             value: counts.win,                          color: '#4ade80' },
            { label: 'Lost',            value: counts.loss,                         color: '#f87171' },
            { label: 'Total Volume',    value: `$${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#38bdf8' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 18, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
            <button onClick={() => fetchTrades()} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by symbol, user name or email..."
              style={{ ...inputStyle, paddingLeft: 34, borderRadius: 12 }}
              onFocus={e => e.target.style.borderColor = '#f59e0b'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Outcome filter */}
          {['all', 'pending', 'win', 'loss'].map(f => (
            <button key={f} onClick={() => setOutcomeFilter(f)}
              style={{
                padding: '8px 14px', borderRadius: 10, border: '1px solid', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, textTransform: 'capitalize',
                fontFamily: "'DM Sans', sans-serif",
                backgroundColor: outcomeFilter === f ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor:     outcomeFilter === f ? '#f59e0b'               : 'rgba(255,255,255,0.08)',
                color:           outcomeFilter === f ? '#f59e0b'               : '#94a3b8',
              }}>
              {f} {f !== 'all' && `(${counts[f]})`}
            </button>
          ))}

          {/* Asset filter */}
          {['all', 'crypto', 'forex', 'stock', 'commodity'].map(f => (
            <button key={f} onClick={() => setAssetFilter(f)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid', cursor: 'pointer',
                fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
                fontFamily: "'DM Sans', sans-serif",
                backgroundColor: assetFilter === f ? `${ASSET_COLOR[f] || '#94a3b8'}20` : 'rgba(255,255,255,0.03)',
                borderColor:     assetFilter === f ? (ASSET_COLOR[f] || '#94a3b8')       : 'rgba(255,255,255,0.06)',
                color:           assetFilter === f ? (ASSET_COLOR[f] || '#94a3b8')       : '#64748b',
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={card}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr', gap: 10, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Asset / User</span>
            <span>Type</span>
            <span>Qty</span>
            <span>Price</span>
            <span>Total</span>
            <span style={{ textAlign: 'center' }}>Outcome</span>
            <span style={{ textAlign: 'center' }}>Action</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <BarChart2 size={32} color="#334155" style={{ marginBottom: 12 }} />
              <p style={{ color: '#64748b', fontSize: 13 }}>No trades found</p>
            </div>
          ) : (
            filtered.map((trade, i) => {
              const outCfg    = OUTCOME_CFG[trade.outcome] || OUTCOME_CFG.pending;
              const OutIcon   = outCfg.Icon;
              const assetColor = ASSET_COLOR[trade.assetType] || '#94a3b8';
              const isClosed  = trade.status === 'closed';

              return (
                <div key={trade._id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
                  gap: 10, padding: '15px 20px', alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Asset + User */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${assetColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: assetColor, fontSize: 11, fontWeight: 700 }}>{trade.symbol?.slice(0,3)}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>{trade.symbol}</p>
                      <p style={{ color: '#64748b', fontSize: 11, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trade.user?.fullName || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Action + Asset type */}
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: trade.action === 'buy' ? '#4ade80' : '#f87171' }}>
                      {trade.action === 'buy' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {trade.action}
                    </span>
                    <p style={{ color: '#334155', fontSize: 10, marginTop: 2, textTransform: 'capitalize' }}>{trade.assetType}</p>
                  </div>

                  {/* Quantity */}
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{trade.quantity}</span>

                  {/* Price */}
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>
                    ${trade.priceAtTrade?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>

                  {/* Total invested */}
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                    ${trade.total?.toFixed(2)}
                  </span>

                  {/* Outcome badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: outCfg.bg, color: outCfg.color, border: `1px solid ${outCfg.border}`, textTransform: 'capitalize' }}>
                      <OutIcon size={11} /> {trade.outcome}
                    </span>
                    {isClosed && trade.outcome === 'win' && (
                      <span style={{ fontSize: 10, color: '#4ade80' }}>
                        +${(trade.returnAmount - trade.total)?.toFixed(2)}
                      </span>
                    )}
                    {isClosed && trade.outcome === 'loss' && (
                      <span style={{ fontSize: 10, color: '#f87171' }}>
                        -${trade.total?.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Action button */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {isClosed ? (
                      <span style={{ fontSize: 11, color: '#334155', padding: '5px 10px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        Resolved
                      </span>
                    ) : (
                      <button onClick={() => openResolve(trade)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24', fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                        <Trophy size={12} /> Resolve
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        <p style={{ color: '#334155', fontSize: 12, marginTop: 10, textAlign: 'right' }}>
          {filtered.length} of {trades.length} trades
        </p>
      </div>

      {/* ══ Resolve Modal ══════════════════════════════════════════════════ */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div style={modalCard}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 20, fontFamily: "'Playfair Display', serif" }}>
                  Resolve Trade
                </h3>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                  {selected.user?.fullName} · {selected.symbol} · {selected.action}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Trade summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Symbol',    value: selected.symbol,                                                    color: ASSET_COLOR[selected.assetType] || '#94a3b8' },
                { label: 'Invested',  value: `$${selected.total?.toFixed(2)}`,                                   color: '#fff'    },
                { label: 'Qty',       value: selected.quantity,                                                  color: '#94a3b8' },
                { label: 'Buy Price', value: `$${selected.priceAtTrade?.toLocaleString()}`,                      color: '#94a3b8' },
                { label: 'User',      value: selected.user?.fullName,                                            color: '#f1f5f9' },
                { label: 'Asset',     value: selected.assetType,                                                 color: ASSET_COLOR[selected.assetType] || '#94a3b8' },
              ].map(item => (
                <div key={item.label} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ color: '#64748b', fontSize: 10, marginBottom: 3, textTransform: 'capitalize' }}>{item.label}</p>
                  <p style={{ color: item.color, fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Outcome selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1', display: 'block', marginBottom: 10 }}>
                Trade Outcome <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  {
                    key: 'win',
                    label: 'Mark as Win',
                    desc: 'User receives return amount',
                    color: '#4ade80',
                    bg: 'rgba(34,197,94,0.1)',
                    border: 'rgba(34,197,94,0.3)',
                    Icon: Trophy,
                  },
                  {
                    key: 'loss',
                    label: 'Mark as Loss',
                    desc: 'User loses invested amount',
                    color: '#f87171',
                    bg: 'rgba(239,68,68,0.1)',
                    border: 'rgba(239,68,68,0.3)',
                    Icon: XCircle,
                  },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setResolveForm(p => ({ ...p, outcome: opt.key })); setResolveError(''); }}
                    style={{
                      padding: '16px 14px', borderRadius: 14, cursor: 'pointer',
                      border: `2px solid ${resolveForm.outcome === opt.key ? opt.border : 'rgba(255,255,255,0.06)'}`,
                      backgroundColor: resolveForm.outcome === opt.key ? opt.bg : 'rgba(255,255,255,0.03)',
                      textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <opt.Icon size={18} color={resolveForm.outcome === opt.key ? opt.color : '#64748b'} />
                      <span style={{ color: resolveForm.outcome === opt.key ? opt.color : '#94a3b8', fontSize: 14, fontWeight: 700 }}>
                        {opt.label}
                      </span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 12 }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Return amount (only for win) */}
            {resolveForm.outcome === 'win' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1', display: 'block', marginBottom: 4 }}>
                  Return Amount (USD) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
                  Amount to credit back to the user. Must be greater than $0.
                  Originally invested: <strong style={{ color: '#fbbf24' }}>${selected.total?.toFixed(2)}</strong>
                </p>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="number"
                    value={resolveForm.returnAmount}
                    onChange={e => { setResolveForm(p => ({ ...p, returnAmount: e.target.value })); setResolveError(''); }}
                    placeholder="0.00"
                    style={{ ...inputStyle, paddingLeft: 34 }}
                    onFocus={e => e.target.style.borderColor = '#22c55e'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>

                {/* Quick return presets */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Break even',  mult: 1.0  },
                    { label: '+10%',        mult: 1.1  },
                    { label: '+20%',        mult: 1.2  },
                    { label: '+50%',        mult: 1.5  },
                    { label: '2× profit',   mult: 2.0  },
                  ].map(p => (
                    <button
                      key={p.label}
                      onClick={() => setResolveForm(prev => ({ ...prev, returnAmount: (selected.total * p.mult).toFixed(2) }))}
                      style={{
                        fontSize: 11, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                        border: '1px solid', fontFamily: "'DM Sans', sans-serif",
                        backgroundColor: resolveForm.returnAmount === (selected.total * p.mult).toFixed(2) ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                        borderColor:     resolveForm.returnAmount === (selected.total * p.mult).toFixed(2) ? 'rgba(34,197,94,0.4)'  : 'rgba(255,255,255,0.08)',
                        color:           resolveForm.returnAmount === (selected.total * p.mult).toFixed(2) ? '#4ade80'              : '#94a3b8',
                      }}
                    >
                      {p.label} (${(selected.total * p.mult).toFixed(2)})
                    </button>
                  ))}
                </div>

                {/* Profit preview */}
                {resolveForm.returnAmount && parseFloat(resolveForm.returnAmount) > 0 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>User profit/loss</span>
                    <span style={{ color: parseFloat(resolveForm.returnAmount) >= selected.total ? '#4ade80' : '#f87171', fontSize: 15, fontWeight: 700 }}>
                      {parseFloat(resolveForm.returnAmount) >= selected.total ? '+' : ''}
                      ${(parseFloat(resolveForm.returnAmount) - selected.total).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Loss warning */}
            {resolveForm.outcome === 'loss' && (
              <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', gap: 10 }}>
                <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ color: '#f87171', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Loss Confirmation</p>
                  <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
                    The user will lose their invested amount of{' '}
                    <strong style={{ color: '#f87171' }}>${selected.total?.toFixed(2)}</strong>.
                    No funds will be returned to their account.
                  </p>
                </div>
              </div>
            )}

            {/* Admin note */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1', display: 'block', marginBottom: 4 }}>
                  <span style={{ color: '#334155' }}>(optional)</span>
              </label>
              <textarea
                value={resolveForm.adminNote}
                onChange={e => setResolveForm(p => ({ ...p, adminNote: e.target.value }))}
                placeholder="Internal note about this resolution..."
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Error */}
            {resolveError && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} /> {resolveError}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={saveLoading}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  backgroundColor: saveLoading ? '#334155'
                    : resolveForm.outcome === 'win' ? '#22c55e' : '#ef4444',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  opacity: saveLoading ? 0.6 : 1,
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                {saveLoading ? 'Processing...' : resolveForm.outcome === 'win'
                  ? `✓ Confirm Win — Return $${parseFloat(resolveForm.returnAmount || 0).toFixed(2)}`
                  : `✗ Confirm Loss — $${selected.total?.toFixed(2)} Forfeited`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}