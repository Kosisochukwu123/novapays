import { useState, useEffect, useCallback } from 'react';
import { Search, DollarSign, CheckCircle2, AlertCircle, RefreshCw, User } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const card = {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
  padding: 24,
};

const AVATAR_BG = [
  { bg: 'rgba(14,165,233,0.2)',  color: '#38bdf8'  },
  { bg: 'rgba(168,85,247,0.2)',  color: '#c084fc'  },
  { bg: 'rgba(239,68,68,0.2)',   color: '#f87171'  },
  { bg: 'rgba(245,158,11,0.2)',  color: '#fbbf24'  },
  { bg: 'rgba(34,197,94,0.2)',   color: '#4ade80'  },
];

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

export default function AdminFund() {
  const [users,        setUsers]        = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError,   setUsersError]   = useState('');
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState(null);
  const [amount,       setAmount]       = useState('');
  const [type,         setType]         = useState('credit');
  const [note,         setNote]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [fundError,    setFundError]    = useState('');
  const [recentFunds,  setRecentFunds]  = useState([]);

  const isMobile = window.innerWidth < 590;

  // ── Fetch users ───────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const res = await api.get('/admin/users', { params: { limit: 100 } });
      setUsers(res.data.users || []);
    } catch (err) {
      setUsersError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Search filter (debounced) ─────────────────────────────────────────
  const filtered = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  // ── Select user ───────────────────────────────────────────────────────
  const handleSelect = (u) => {
    setSelected(u);
    setAmount('');
    setNote('');
    setFundError('');
    setResult(null);
  };

  // ── Execute fund ──────────────────────────────────────────────────────
  const handleFund = async () => {
    if (!selected || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFundError('Please enter a valid amount greater than zero');
      return;
    }

    if (type === 'debit' && parsedAmount > selected.balance) {
      setFundError(`Cannot debit more than current balance ($${selected.balance?.toFixed(2)})`);
      return;
    }

    setLoading(true);
    setFundError('');
    setResult(null);

    try {
      const res = await api.post(`/admin/users/${selected._id || selected.id}/fund`, {
        amount: parsedAmount,
        type,
        note: note.trim(),
      });

      const updatedUser = res.data.user;

      // Update user balance in list
      setUsers(prev => prev.map(u =>
        (u._id || u.id) === (selected._id || selected.id)
          ? { ...u, balance: updatedUser.balance }
          : u
      ));

      // Update selected user balance
      setSelected(prev => ({ ...prev, balance: updatedUser.balance }));

      const successMsg = `Successfully ${type === 'credit' ? 'credited' : 'debited'} $${parsedAmount.toFixed(2)} ${type === 'credit' ? 'to' : 'from'} ${selected.fullName}`;

      setResult({ ok: true, msg: successMsg });

      // Add to recent history
      setRecentFunds(prev => [{
        id:       Date.now(),
        user:     selected.fullName,
        type,
        amount:   parsedAmount,
        note:     note.trim() || 'No note',
        time:     new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }, ...prev].slice(0, 5));

      setAmount('');
      setNote('');
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      setFundError(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // ── Skeleton loader ───────────────────────────────────────────────────
  const UserSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#0f172a', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ width: 120, height: 12, borderRadius: 4, backgroundColor: '#0f172a' }} />
            <div style={{ width: 160, height: 10, borderRadius: 4, backgroundColor: '#0f172a' }} />
          </div>
          <div style={{ width: 60, height: 12, borderRadius: 4, backgroundColor: '#0f172a' }} />
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              Fund Account
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              Manually credit or debit any user account
            </p>
          </div>
          <button
            onClick={fetchUsers}
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

        {/* Success / Error global banner */}
        {result && (
          <div style={{
            marginBottom: 20, padding: '14px 18px', borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14,
            backgroundColor: result.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${result.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: result.ok ? '#4ade80' : '#f87171',
          }}>
            {result.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {result.msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>

          {/* ── Left: User selector ─────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Select User</p>
              <span style={{ color: '#64748b', fontSize: 12 }}>{filtered.length} users</span>
            </div>

            {/* Search input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                style={{ ...inputStyle, paddingLeft: 34 }}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Users list */}
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {usersLoading ? (
                <UserSkeleton />
              ) : usersError ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <AlertCircle size={22} color="#ef4444" style={{ marginBottom: 8 }} />
                  <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{usersError}</p>
                  <button onClick={fetchUsers} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', backgroundColor: '#f59e0b', color: '#0f172a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Retry
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 13 }}>
                  No users found
                </div>
              ) : (
                filtered.map((u, i) => {
                  const av  = AVATAR_BG[i % AVATAR_BG.length];
                  const uid = u._id || u.id;
                  const sid = selected?._id || selected?.id;
                  const isSelected = sid === uid;

                  return (
                    <button
                      key={uid}
                      onClick={() => handleSelect(u)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                        border: `1px solid ${isSelected ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.05)'}`,
                        backgroundColor: isSelected ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
                        textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {initials(u.fullName)}
                        </div>
                        <div>
                          <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{u.fullName}</p>
                          <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{u.email}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ color: isSelected ? '#fbbf24' : '#fff', fontSize: 13, fontWeight: 600 }}>
                          ${(u.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p style={{ color: '#334155', fontSize: 10, marginTop: 1, textTransform: 'capitalize' }}>{u.status}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right: Fund form ─────────────────────────────────────── */}
          <div style={card}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
              Transaction Details
            </p>

            {/* Selected user badge */}
            {selected ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 12, marginBottom: 20,
                backgroundColor: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {initials(selected.fullName)}
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{selected.fullName}</p>
                  <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                    Current balance:{' '}
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                      ${(selected.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => { setSelected(null); setAmount(''); setNote(''); setFundError(''); }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '24px', borderRadius: 12, marginBottom: 20,
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                gap: 8,
              }}>
                <User size={22} color="#334155" />
                <p style={{ color: '#64748b', fontSize: 13 }}>Select a user from the left</p>
              </div>
            )}

            {/* Credit / Debit toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['credit', 'debit'].map(t => (
                <button key={t} onClick={() => { setType(t); setFundError(''); }}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, border: '1px solid',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                    backgroundColor: type === t
                      ? (t === 'credit' ? 'rgba(34,197,94,0.15)'  : 'rgba(239,68,68,0.15)')
                      : 'rgba(255,255,255,0.04)',
                    borderColor: type === t
                      ? (t === 'credit' ? 'rgba(34,197,94,0.4)'   : 'rgba(239,68,68,0.4)')
                      : 'rgba(255,255,255,0.08)',
                    color: type === t
                      ? (t === 'credit' ? '#4ade80' : '#f87171')
                      : '#64748b',
                  }}>
                  {t === 'credit' ? '+ Credit' : '− Debit'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                Amount (USD)
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="number"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setFundError(''); }}
                  placeholder="0.00"
                  disabled={!selected}
                  style={{
                    ...inputStyle,
                    paddingLeft: 34,
                    opacity: selected ? 1 : 0.5,
                    cursor: selected ? 'text' : 'not-allowed',
                  }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {[100, 500, 1000, 5000, 10000].map(a => (
                <button key={a}
                  onClick={() => { if (selected) { setAmount(String(a)); setFundError(''); } }}
                  disabled={!selected}
                  style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 8,
                    cursor: selected ? 'pointer' : 'not-allowed',
                    border: '1px solid', fontFamily: "'DM Sans', sans-serif",
                    opacity: selected ? 1 : 0.4,
                    backgroundColor: amount === String(a) ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor:     amount === String(a) ? '#f59e0b'               : 'rgba(255,255,255,0.08)',
                    color:           amount === String(a) ? '#f59e0b'               : '#94a3b8',
                  }}>
                  ${a.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Note */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                Admin Note <span style={{ color: '#334155', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Reason for this transaction..."
                rows={3}
                disabled={!selected}
                style={{
                  ...inputStyle,
                  resize: 'none',
                  opacity: selected ? 1 : 0.5,
                  cursor: selected ? 'text' : 'not-allowed',
                }}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Amount preview */}
            {selected && amount && parseFloat(amount) > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                backgroundColor: type === 'credit' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${type === 'credit' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`,
              }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: 11 }}>
                    {type === 'credit' ? 'New balance after credit' : 'New balance after debit'}
                  </p>
                  <p style={{ color: type === 'credit' ? '#4ade80' : '#f87171', fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                    ${Math.max(0, (selected.balance ?? 0) + (type === 'credit' ? 1 : -1) * parseFloat(amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#64748b', fontSize: 11 }}>Transaction</p>
                  <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                    {type === 'credit' ? '+' : '-'}${parseFloat(amount).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Fund error */}
            {fundError && (
              <div style={{
                marginBottom: 14, padding: '10px 14px', borderRadius: 10,
                backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertCircle size={14} /> {fundError}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleFund}
              disabled={!selected || !amount || loading || parseFloat(amount) <= 0}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                backgroundColor: (!selected || !amount || loading) ? '#334155' : '#f59e0b',
                color: '#0f172a',
                fontWeight: 700, fontSize: 15,
                cursor: (!selected || !amount || loading) ? 'not-allowed' : 'pointer',
                opacity: (!selected || !amount || loading) ? 0.5 : 1,
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Processing...' : `${type === 'credit' ? 'Credit' : 'Debit'} Account`}
            </button>
          </div>
        </div>

        {/* ── Recent fund activity ──────────────────────────────────────── */}
        {recentFunds.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
              Recent Activity This Session
            </p>
            <div style={{ backgroundColor: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr', gap: 10, padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>User</span>
                <span>Type</span>
                <span>Amount</span>
                <span>Note</span>
                <span style={{ textAlign: 'right' }}>Time</span>
              </div>
              {recentFunds.map(f => (
                <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr', gap: 10, padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                  <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{f.user}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', width: 'fit-content', fontSize: 11, padding: '3px 10px', borderRadius: 20, backgroundColor: f.type === 'credit' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: f.type === 'credit' ? '#4ade80' : '#f87171', border: `1px solid ${f.type === 'credit' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    {f.type === 'credit' ? '+' : '−'} {f.type}
                  </span>
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>${f.amount.toFixed(2)}</p>
                  <p style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.note}</p>
                  <p style={{ color: '#334155', fontSize: 12, textAlign: 'right' }}>{f.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </AdminLayout>
  );
}