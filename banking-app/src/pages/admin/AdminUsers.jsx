import { useState, useEffect, useCallback } from 'react';
import { Search, UserX, UserCheck, Trash2, DollarSign, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const STATUS_STYLE = {
  active:    { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80', border: 'rgba(34,197,94,0.2)'   },
  suspended: { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.2)'   },
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: 'rgba(245,158,11,0.2)'  },
};

const AVATAR_BG = [
  { bg: 'rgba(14,165,233,0.2)',  color: '#38bdf8'  },
  { bg: 'rgba(168,85,247,0.2)',  color: '#c084fc'  },
  { bg: 'rgba(239,68,68,0.2)',   color: '#f87171'  },
  { bg: 'rgba(245,158,11,0.2)',  color: '#fbbf24'  },
  { bg: 'rgba(34,197,94,0.2)',   color: '#4ade80'  },
];

const btn = (bg, color, border) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  fontSize: 11, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
  backgroundColor: bg, color, border: `1px solid ${border}`,
  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
});

const inputStyle = {
  backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '10px 14px 10px 36px',
  color: '#f1f5f9', fontSize: 13, outline: 'none',
  fontFamily: "'DM Sans', sans-serif", width: '100%',
};

const modalCard = {
  backgroundColor: '#1e293b', borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.1)',
  padding: 28, width: '100%', maxWidth: 400,
};

export default function AdminUsers() {
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirm,       setConfirm]       = useState(null);
  const [fundModal,     setFundModal]     = useState(null);
  const [fundAmount,    setFundAmount]    = useState('');
  const [fundType,      setFundType]      = useState('credit');
  const [fundError,     setFundError]     = useState('');
  const [lastUpdated,   setLastUpdated]   = useState(null);

  // ── Fetch users from backend ─────────────────────────────────────────
  const fetchUsers = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchUsers(), search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  // ── Actions ──────────────────────────────────────────────────────────
  const performAction = async (type, userId) => {
    setActionLoading(userId + type);
    try {
      if (type === 'suspend') await api.put(`/admin/users/${userId}/suspend`);
      if (type === 'restore') await api.put(`/admin/users/${userId}/restore`);
      if (type === 'approve') await api.put(`/admin/users/${userId}/approve`);
      if (type === 'delete')  await api.delete(`/admin/users/${userId}`);

      setUsers(prev => {
        if (type === 'delete') return prev.filter(u => (u._id || u.id) !== userId);
        return prev.map(u => {
          if ((u._id || u.id) !== userId) return u;
          if (type === 'suspend') return { ...u, status: 'suspended' };
          if (type === 'restore') return { ...u, status: 'active'    };
          if (type === 'approve') return { ...u, status: 'active'    };
          return u;
        });
      });
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${type} user`);
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const handleFund = async () => {
    if (!fundAmount || isNaN(fundAmount) || parseFloat(fundAmount) <= 0) {
      setFundError('Enter a valid amount');
      return;
    }
    setActionLoading(fundModal.userId + 'fund');
    setFundError('');
    try {
      const res = await api.post(`/admin/users/${fundModal.userId}/fund`, {
        amount: parseFloat(fundAmount),
        type:   fundType,
      });
      // Update balance in local state from server response
      const updatedBalance = res.data.user?.balance;
      setUsers(prev => prev.map(u =>
        (u._id || u.id) !== fundModal.userId ? u : { ...u, balance: updatedBalance ?? u.balance }
      ));
      setFundModal(null);
      setFundAmount('');
      setFundType('credit');
    } catch (err) {
      setFundError(err.response?.data?.message || 'Fund operation failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Counts ───────────────────────────────────────────────────────────
  const counts = {
    all:       users.length,
    active:    users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    pending:   users.filter(u => u.status === 'pending').length,
  };

  // ── Skeleton loader ──────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: 200, height: 28, borderRadius: 8, backgroundColor: '#1e293b', marginBottom: 8 }} />
            <div style={{ width: 280, height: 14, borderRadius: 6, backgroundColor: '#1e293b' }} />
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#0f172a', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ width: 140, height: 13, borderRadius: 4, backgroundColor: '#0f172a' }} />
                  <div style={{ width: 100, height: 11, borderRadius: 4, backgroundColor: '#0f172a' }} />
                </div>
                <div style={{ width: 80, height: 13, borderRadius: 4, backgroundColor: '#0f172a' }} />
                <div style={{ width: 60, height: 22, borderRadius: 20, backgroundColor: '#0f172a' }} />
                <div style={{ width: 160, height: 28, borderRadius: 8, backgroundColor: '#0f172a' }} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', padding: 24, color: '#334155', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading users...
          </div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </AdminLayout>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────
  if (error && users.length === 0) {
    return (
      <AdminLayout>
        <div style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 36, border: '1px solid rgba(255,255,255,0.06)' }}>
            <AlertCircle size={36} color="#ef4444" style={{ marginBottom: 16 }} />
            <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Failed to load users</p>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>{error}</p>
            <button onClick={() => fetchUsers()} style={{
              padding: '10px 24px', borderRadius: 12, border: 'none',
              backgroundColor: '#f59e0b', color: '#0f172a',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              User Management
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              Manage all registered users on the platform
              {lastUpdated && (
                <span style={{ color: '#334155', marginLeft: 8 }}>
                  · Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchUsers(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8',
              fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Status summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total',     value: counts.all,       color: '#f1f5f9' },
            { label: 'Active',    value: counts.active,    color: '#4ade80' },
            { label: 'Suspended', value: counts.suspended, color: '#f87171' },
            { label: 'Pending',   value: counts.pending,   color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#f59e0b'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          {['all', 'active', 'suspended', 'pending'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: '1px solid', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, textTransform: 'capitalize',
                fontFamily: "'DM Sans', sans-serif",
                backgroundColor: statusFilter === s ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor:     statusFilter === s ? '#f59e0b'               : 'rgba(255,255,255,0.08)',
                color:           statusFilter === s ? '#f59e0b'               : '#94a3b8',
              }}>
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'scroll' }}>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 1.2fr 1fr 1.8fr', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>User</span>
            <span>Email / Phone</span>
            <span>Balance</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {users.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              No users found
            </div>
          ) : (
            users.map((user, i) => {
              const uid    = user._id || user.id;
              const av     = AVATAR_BG[i % AVATAR_BG.length];
              const ss     = STATUS_STYLE[user.status] || STATUS_STYLE.pending;
              const initials = user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
              const joinDate = user.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : user.joinDate || '—';

              return (
                <div key={uid} style={{
                  display: 'grid', gridTemplateColumns: '2.5fr 2fr 1.2fr 1fr 1.8fr',
                  gap: 12, padding: '16px 20px', alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* User */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>{user.fullName}</p>
                      <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Joined {joinDate}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>{user.email}</p>
                    <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{user.phone || '—'}</p>
                  </div>

                  {/* Balance */}
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                    ${(user.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>

                  {/* Status */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'capitalize' }}>
                      {user.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {/* Fund */}
                    <button
                      onClick={() => { setFundModal({ userId: uid, userName: user.fullName }); setFundError(''); }}
                      style={btn('rgba(245,158,11,0.1)', '#fbbf24', 'rgba(245,158,11,0.2)')}
                    >
                      <DollarSign size={11} /> Fund
                    </button>

                    {/* Suspend / Restore / Approve */}
                    {user.status === 'active' && (
                      <button
                        onClick={() => setConfirm({ type: 'suspend', userId: uid, userName: user.fullName })}
                        disabled={!!actionLoading}
                        style={{ ...btn('rgba(245,158,11,0.1)', '#fbbf24', 'rgba(245,158,11,0.2)'), opacity: actionLoading ? 0.5 : 1 }}
                      >
                        <UserX size={11} /> Suspend
                      </button>
                    )}
                    {user.status === 'suspended' && (
                      <button
                        onClick={() => performAction('restore', uid)}
                        disabled={!!actionLoading}
                        style={{ ...btn('rgba(34,197,94,0.1)', '#4ade80', 'rgba(34,197,94,0.2)'), opacity: actionLoading ? 0.5 : 1 }}
                      >
                        <UserCheck size={11} /> Restore
                      </button>
                    )}
                    {user.status === 'pending' && (
                      <button
                        onClick={() => performAction('approve', uid)}
                        disabled={!!actionLoading}
                        style={{ ...btn('rgba(14,165,233,0.1)', '#38bdf8', 'rgba(14,165,233,0.2)'), opacity: actionLoading ? 0.5 : 1 }}
                      >
                        <ShieldCheck size={11} /> Approve
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => setConfirm({ type: 'delete', userId: uid, userName: user.fullName })}
                      disabled={!!actionLoading}
                      style={{ ...btn('rgba(239,68,68,0.1)', '#f87171', 'rgba(239,68,68,0.2)'), opacity: actionLoading ? 0.5 : 1 }}
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p style={{ color: '#334155', fontSize: 12, marginTop: 10, textAlign: 'right' }}>
          Showing {users.length} user{users.length !== 1 ? 's' : ''}
        </p>

        {/* ── Confirm Modal ── */}
        {confirm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div style={modalCard}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 18,
                backgroundColor: confirm.type === 'delete' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {confirm.type === 'delete'
                  ? <Trash2 size={22} color="#ef4444" />
                  : <UserX  size={22} color="#f59e0b" />
                }
              </div>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8, textTransform: 'capitalize' }}>
                {confirm.type} User
              </h3>
              <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Are you sure you want to {confirm.type}{' '}
                <strong style={{ color: '#fff' }}>{confirm.userName}</strong>?
                {confirm.type === 'delete' && ' This action cannot be undone.'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirm(null)}
                  style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Cancel
                </button>
                <button
                  onClick={() => performAction(confirm.type, confirm.userId)}
                  disabled={!!actionLoading}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                    backgroundColor: confirm.type === 'delete' ? '#ef4444' : '#f59e0b',
                    color: confirm.type === 'delete' ? '#fff' : '#0f172a',
                    fontWeight: 700, fontSize: 14, cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif",
                  }}>
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Fund Modal ── */}
        {fundModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div style={modalCard}>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <DollarSign size={22} color="#f59e0b" />
              </div>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Fund Account</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                Adjusting balance for <strong style={{ color: '#f1f5f9' }}>{fundModal.userName}</strong>
              </p>

              {/* Credit / Debit toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['credit', 'debit'].map(t => (
                  <button key={t} onClick={() => setFundType(t)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                      border: '1px solid', transition: 'all 0.15s',
                      backgroundColor: fundType === t
                        ? (t === 'credit' ? 'rgba(34,197,94,0.15)'  : 'rgba(239,68,68,0.15)')
                        : 'rgba(255,255,255,0.04)',
                      borderColor: fundType === t
                        ? (t === 'credit' ? 'rgba(34,197,94,0.4)'   : 'rgba(239,68,68,0.4)')
                        : 'rgba(255,255,255,0.08)',
                      color: fundType === t
                        ? (t === 'credit' ? '#4ade80' : '#f87171')
                        : '#94a3b8',
                    }}>
                    {t === 'credit' ? '+ Credit' : '− Debit'}
                  </button>
                ))}
              </div>

              {/* Amount input */}
              <div style={{ position: 'relative', marginBottom: fundError ? 6 : 20 }}>
                <DollarSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="number"
                  placeholder="Enter amount (USD)"
                  value={fundAmount}
                  onChange={e => { setFundAmount(e.target.value); setFundError(''); }}
                  style={{
                    width: '100%', backgroundColor: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${fundError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12, padding: '12px 14px 12px 34px',
                    color: '#f1f5f9', fontSize: 14, outline: 'none',
                    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = fundError ? '#ef4444' : 'rgba(255,255,255,0.1)'}
                />
              </div>
              {fundError && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 16 }}>{fundError}</p>}

              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {[100, 500, 1000, 5000].map(a => (
                  <button key={a} onClick={() => { setFundAmount(String(a)); setFundError(''); }}
                    style={{
                      fontSize: 12, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                      border: '1px solid', fontFamily: "'DM Sans', sans-serif",
                      backgroundColor: fundAmount === String(a) ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                      borderColor:     fundAmount === String(a) ? '#f59e0b'               : 'rgba(255,255,255,0.08)',
                      color:           fundAmount === String(a) ? '#f59e0b'               : '#94a3b8',
                    }}>
                    ${a.toLocaleString()}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setFundModal(null); setFundAmount(''); setFundType('credit'); setFundError(''); }}
                  style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Cancel
                </button>
                <button
                  onClick={handleFund}
                  disabled={!!actionLoading || !fundAmount}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                    backgroundColor: '#f59e0b', color: '#0f172a',
                    fontWeight: 700, fontSize: 14,
                    cursor: (actionLoading || !fundAmount) ? 'not-allowed' : 'pointer',
                    opacity: (actionLoading || !fundAmount) ? 0.5 : 1,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                  {actionLoading ? 'Processing...' : `${fundType === 'credit' ? 'Credit' : 'Debit'} Account`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}