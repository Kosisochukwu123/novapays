import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Eye, X, DollarSign } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const card = { backgroundColor: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' };

const STATUS_CFG = {
  pending:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  icon: Clock        },
  approved: { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   icon: CheckCircle2 },
  rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   icon: XCircle      },
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loaded,      setLoaded]      = useState(false);
  const [filter,      setFilter]      = useState('all');
  const [selected,    setSelected]    = useState(null);
  const [adminNote,   setAdminNote]   = useState('');
  const [loading,     setLoading]     = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/admin/withdrawals');
      setWithdrawals(res.data.withdrawals);
      setLoaded(true);
    } catch { setLoaded(true); }
  };

  if (!loaded) { load(); }

  const filtered = withdrawals.filter(w => filter === 'all' || w.status === filter);

  const handleAction = async (id, action) => {
    setLoading(id + action);
    try {
      await api.put(`/admin/withdrawals/${id}/${action}`, { adminNote });
      setWithdrawals(prev => prev.map(w => w._id !== id ? w : { ...w, status: action === 'approve' ? 'approved' : 'rejected', adminNote }));
      setSelected(null);
      setAdminNote('');
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(null);
    }
  };

  const counts = {
    all:      withdrawals.length,
    pending:  withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
  };

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
          Withdrawal Requests
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Review and action all user withdrawal requests</p>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total',    value: counts.all,      color: '#fff'     },
            { label: 'Pending',  value: counts.pending,  color: '#fbbf24'  },
            { label: 'Approved', value: counts.approved, color: '#4ade80'  },
            { label: 'Rejected', value: counts.rejected, color: '#f87171'  },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 24, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '8px 18px', borderRadius: 10, border: '1px solid', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, capitalize: true,
                backgroundColor: filter === f ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: filter === f ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                color: filter === f ? '#f59e0b' : '#94a3b8',
                textTransform: 'capitalize',
              }}>
              {f} {f !== 'all' && `(${counts[f]})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>User</span><span>Bank / Account</span><span>Amount</span><span style={{ textAlign: 'center' }}>Status</span><span style={{ textAlign: 'center' }}>Actions</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>No withdrawal requests found</div>
          ) : (
            filtered.map(w => {
              const cfg = STATUS_CFG[w.status];
              const Icon = cfg.icon;
              return (
                <div key={w._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>{w.user?.fullName || w.fullName}</p>
                    <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{w.user?.email || ''}</p>
                  </div>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>{w.bankName}</p>
                    <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>···{w.accountNumber?.slice(-4)}</p>
                  </div>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>${parseFloat(w.amount).toFixed(2)}</span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color }}>
                      <Icon size={12} /> {w.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                    <button onClick={() => { setSelected(w); setAdminNote(w.adminNote || ''); }}
                      style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.3)', backgroundColor: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={12} /> View
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Withdrawal Request</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
                  {new Date(selected.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Amount hero */}
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 20 }}>
              <p style={{ color: '#64748b', fontSize: 13 }}>Requested Amount</p>
              <p style={{ color: '#fff', fontSize: 36, fontWeight: 700, marginTop: 4 }}>${parseFloat(selected.amount).toFixed(2)}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, padding: '4px 12px', borderRadius: 20, backgroundColor: STATUS_CFG[selected.status].bg, color: STATUS_CFG[selected.status].color }}>
                {selected.status}
              </span>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Account Holder', value: selected.fullName      },
                { label: 'Bank Name',      value: selected.bankName      },
                { label: 'Account No.',    value: selected.accountNumber },
                { label: 'Submitted',      value: new Date(selected.createdAt).toLocaleDateString() },
              ].map(item => (
                <div key={item.label} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ color: '#64748b', fontSize: 11 }}>{item.label}</p>
                  <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500, marginTop: 3 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Reason */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Reason</p>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{selected.reason}</p>
            </div>

            {/* Proof images */}
            {(selected.proofImage1 || selected.proofImage2) && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supporting Documents</p>
                <div style={{ display: 'grid', gridTemplateColumns: selected.proofImage2 ? '1fr 1fr' : '1fr', gap: 10 }}>
                  {selected.proofImage1 && (
                    <img src={selected.proofImage1} alt="Proof 1" style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }} />
                  )}
                  {selected.proofImage2 && (
                    <img src={selected.proofImage2} alt="Proof 2" style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }} />
                  )}
                </div>
              </div>
            )}

            {/* Admin note */}
            {selected.status === 'pending' && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Admin Note (optional)</label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Add a note for the user..."
                  rows={3}
                  style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 13, outline: 'none', resize: 'none', fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
            )}

            {/* Action buttons */}
            {selected.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleAction(selected._id, 'reject')}
                  disabled={!!loading}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {loading === selected._id + 'reject' ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleAction(selected._id, 'approve')}
                  disabled={!!loading}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', backgroundColor: '#22c55e', color: '#0f172a', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {loading === selected._id + 'approve' ? 'Approving...' : 'Approve'}
                </button>
              </div>
            )}

            {selected.status !== 'pending' && selected.adminNote && (
              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Admin Note</p>
                <p style={{ color: '#94a3b8', fontSize: 13 }}>{selected.adminNote}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}