import { useState, useEffect, useCallback } from 'react';
import {
  Search, ArrowUpRight, ArrowDownLeft, Edit2,
  CheckCircle2, Clock, XCircle, RefreshCw, X, Save, AlertCircle
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const TYPE_ICON = {
  transfer:   { Icon: ArrowUpRight,  bg: 'rgba(14,165,233,0.12)',  color: '#38bdf8'  },
  deposit:    { Icon: ArrowDownLeft, bg: 'rgba(34,197,94,0.12)',   color: '#22c55e'  },
  fund:       { Icon: ArrowDownLeft, bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24'  },
  debit:      { Icon: ArrowUpRight,  bg: 'rgba(239,68,68,0.12)',   color: '#ef4444'  },
  withdrawal: { Icon: ArrowUpRight,  bg: 'rgba(239,68,68,0.12)',   color: '#ef4444'  },
};

const STATUS_CFG = {
  completed: { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  Icon: CheckCircle2 },
  pending:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', Icon: Clock        },
  failed:    { color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  Icon: XCircle      },
};

const card = {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
  overflow: 'hidden',
};

const modalCard = {
  backgroundColor: '#1e293b',
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.1)',
  padding: 28,
  width: '100%',
  maxWidth: 480,
};

const inputStyle = (focus) => ({
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
  resize: 'vertical',
});

export default function AdminTransactions() {
  const [transactions,  setTransactions]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [editing,       setEditing]       = useState(null);
  const [editForm,      setEditForm]      = useState({ description: '', status: '', note: '' });
  const [saveLoading,   setSaveLoading]   = useState(false);
  const [saveError,     setSaveError]     = useState('');
  const [lastUpdated,   setLastUpdated]   = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/admin/transactions', { params: { ...params, limit: 100 } });
      setTransactions(res.data.transactions || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // ── Client-side search filter ─────────────────────────────────────────
  const filtered = transactions.filter(tx => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      tx.description?.toLowerCase().includes(q) ||
      tx.reference?.toLowerCase().includes(q)   ||
      tx.fromUser?.fullName?.toLowerCase().includes(q) ||
      tx.toUser?.fullName?.toLowerCase().includes(q)   ||
      tx.fromUser?.email?.toLowerCase().includes(q)    ||
      tx.toUser?.email?.toLowerCase().includes(q)
    );
  });

  // ── Open edit modal ───────────────────────────────────────────────────
  const openEdit = (tx) => {
    setEditing(tx);
    setEditForm({
      description: tx.description || '',
      status:      tx.status      || 'pending',
      note:        tx.note        || '',
    });
    setSaveError('');
  };

  // ── Save edits ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editForm.description.trim()) {
      setSaveError('Description cannot be empty');
      return;
    }
    setSaveLoading(true);
    setSaveError('');
    try {
      const res = await api.put(`/admin/transactions/${editing._id}`, editForm);
      const updated = res.data.transaction;

      // Update in local state
      setTransactions(prev =>
        prev.map(tx => tx._id === updated._id ? updated : tx)
      );
      setEditing(null);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Counts ────────────────────────────────────────────────────────────
  const counts = {
    all:       transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending:   transactions.filter(t => t.status === 'pending').length,
    failed:    transactions.filter(t => t.status === 'failed').length,
  };

  const totalVolume = transactions
    .filter(t => t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ width: 220, height: 28, borderRadius: 8, backgroundColor: '#1e293b', marginBottom: 8 }} />
          <div style={{ width: 300, height: 14, borderRadius: 6, backgroundColor: '#1e293b', marginBottom: 24 }} />
          <div style={card}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#0f172a', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ width: 180, height: 13, borderRadius: 4, backgroundColor: '#0f172a' }} />
                  <div style={{ width: 120, height: 11, borderRadius: 4, backgroundColor: '#0f172a' }} />
                </div>
                <div style={{ width: 70, height: 13, borderRadius: 4, backgroundColor: '#0f172a' }} />
                <div style={{ width: 70, height: 22, borderRadius: 20, backgroundColor: '#0f172a' }} />
                <div style={{ width: 50, height: 28, borderRadius: 8, backgroundColor: '#0f172a' }} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', padding: 24, color: '#334155', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading transactions...
          </div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </AdminLayout>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              Transactions
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              Monitor and manage all platform transactions
              {lastUpdated && (
                <span style={{ color: '#334155', marginLeft: 8 }}>
                  · Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchTransactions(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: '#94a3b8', fontSize: 13, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Volume',  value: `$${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#f1f5f9' },
            { label: 'Completed',     value: counts.completed, color: '#4ade80' },
            { label: 'Pending',       value: counts.pending,   color: '#fbbf24' },
            { label: 'Failed',        value: counts.failed,    color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by description, user, or reference..."
              style={{
                ...inputStyle(),
                paddingLeft: 34, borderRadius: 12, resize: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => e.target.style.borderColor = '#f59e0b'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          {['all', 'completed', 'pending', 'failed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: '1px solid',
                cursor: 'pointer', fontSize: 12, fontWeight: 500,
                textTransform: 'capitalize', fontFamily: "'DM Sans', sans-serif",
                backgroundColor: statusFilter === s ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor:     statusFilter === s ? '#f59e0b'               : 'rgba(255,255,255,0.08)',
                color:           statusFilter === s ? '#f59e0b'               : '#94a3b8',
              }}>
              {s} {s !== 'all' && `(${counts[s]})`}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
            <button onClick={() => fetchTransactions()} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {/* Table */}
        <div style={card}>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr 1fr 0.6fr', gap: 10, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Description</span>
            <span>From</span>
            <span>To</span>
            <span>Amount</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'center' }}>Edit</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              No transactions found
            </div>
          ) : (
            filtered.map((tx, i) => {
              const typeCfg  = TYPE_ICON[tx.type]   || TYPE_ICON.transfer;
              const statusCfg = STATUS_CFG[tx.status] || STATUS_CFG.pending;
              const TypeIcon   = typeCfg.Icon;
              const StatusIcon = statusCfg.Icon;

              return (
                <div
                  key={tx._id}
                  style={{
                    display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr 1fr 0.6fr',
                    gap: 10, padding: '14px 20px', alignItems: 'center',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Description */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: typeCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TypeIcon size={14} color={typeCfg.color} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.description || '—'}
                      </p>
                      <p style={{ color: '#334155', fontSize: 11, marginTop: 1 }}>
                        {tx.reference || '—'}
                      </p>
                    </div>
                  </div>

                  {/* From */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.fromUser?.fullName || 'System'}
                    </p>
                    <p style={{ color: '#334155', fontSize: 11, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.fromUser?.email || '—'}
                    </p>
                  </div>

                  {/* To */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: '#94a3b8', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.toUser?.fullName || 'System'}
                    </p>
                    <p style={{ color: '#334155', fontSize: 11, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.toUser?.email || '—'}
                    </p>
                  </div>

                  {/* Amount */}
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                    ${tx.amount?.toFixed(2)}
                  </p>

                  {/* Status badge */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 11, padding: '4px 10px', borderRadius: 20,
                      backgroundColor: statusCfg.bg, color: statusCfg.color,
                      border: `1px solid ${statusCfg.border}`,
                      textTransform: 'capitalize',
                    }}>
                      <StatusIcon size={11} /> {tx.status}
                    </span>
                  </div>

                  {/* Edit button */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => openEdit(tx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                        backgroundColor: 'rgba(56,189,248,0.1)',
                        border: '1px solid rgba(56,189,248,0.2)',
                        color: '#38bdf8', fontSize: 11,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p style={{ color: '#334155', fontSize: 12, marginTop: 10, textAlign: 'right' }}>
          {filtered.length} of {transactions.length} transactions
        </p>
      </div>

      {/* ── Edit Modal ── */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <div style={modalCard}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Edit Transaction</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
                  {editing.reference || editing._id}
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Current transaction info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 22 }}>
              <div>
                <p style={{ color: '#64748b', fontSize: 11 }}>Amount</p>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>${editing.amount?.toFixed(2)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#64748b', fontSize: 11 }}>Type</p>
                <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{editing.type}</p>
              </div>
            </div>

            {/* Description field */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                Transaction Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <p style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
                This is what the user sees in their transaction history and dashboard
              </p>
              <textarea
                value={editForm.description}
                onChange={e => { setEditForm(p => ({ ...p, description: e.target.value })); setSaveError(''); }}
                placeholder="e.g. Monthly salary deposit, Wire transfer from John..."
                rows={3}
                style={inputStyle()}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Status field */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 8 }}>
                Transaction Status
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {['completed', 'pending', 'failed'].map(s => {
                  const cfg = STATUS_CFG[s];
                  const Icon = cfg.Icon;
                  const isSelected = editForm.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setEditForm(p => ({ ...p, status: s }))}
                      style={{
                        padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        fontFamily: "'DM Sans', sans-serif",
                        backgroundColor: isSelected ? cfg.bg  : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isSelected ? cfg.border : 'rgba(255,255,255,0.08)'}`,
                        color: isSelected ? cfg.color : '#64748b',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={16} />
                      <span style={{ fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin note */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                Admin Note
              </label>
              <p style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
                Internal note — not visible to the user
              </p>
              <textarea
                value={editForm.note}
                onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))}
                placeholder="Optional internal note..."
                rows={2}
                style={inputStyle()}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Error */}
            {saveError && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} /> {saveError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setEditing(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8', fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12, cursor: saveLoading ? 'not-allowed' : 'pointer',
                  backgroundColor: saveLoading ? '#0e7490' : '#f59e0b',
                  border: 'none', color: '#0f172a',
                  fontWeight: 700, fontSize: 14, opacity: saveLoading ? 0.7 : 1,
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Save size={15} />
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}