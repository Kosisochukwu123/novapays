import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Clock, Eye, X,
  RefreshCw, ShieldCheck, ShieldAlert, AlertCircle,
  User, FileText,
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

// ── Shared styles ─────────────────────────────────────────────────────────
const card = {
  backgroundColor: '#1e293b',
  borderRadius:    16,
  border:          '1px solid rgba(255,255,255,0.06)',
  overflow:        'scroll',
};

const modalCard = {
  backgroundColor: '#1e293b',
  borderRadius:    20,
  border:          '1px solid rgba(255,255,255,0.1)',
  width:           '100%',
  maxWidth:        580,
  maxHeight:       '90vh',
  overflowY:       'auto',
  padding:         28,
};

const textareaStyle = {
  width:           '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border:          '1px solid rgba(255,255,255,0.1)',
  borderRadius:    10,
  padding:         '10px 14px',
  color:           '#f1f5f9',
  fontSize:        13,
  outline:         'none',
  resize:          'none',
  fontFamily:      "'DM Sans', sans-serif",
  boxSizing:       'border-box',
};

// ── Status configs ────────────────────────────────────────────────────────
const W_STATUS = {
  pending:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  Icon: Clock        },
  approved: { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   Icon: CheckCircle2 },
  rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   Icon: XCircle      },
};

const K_STATUS = {
  not_started: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', Icon: ShieldAlert,  label: 'Not Started' },
  pending:     { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  Icon: Clock,        label: 'Pending'     },
  verified:    { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   Icon: ShieldCheck,  label: 'Verified'    },
  rejected:    { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   Icon: XCircle,      label: 'Rejected'    },
};

// ── Skeleton row ──────────────────────────────────────────────────────────
const SkeletonRow = ({ cols }) => (
  <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
    {[1,2,3,4,5].map(i => (
      <div key={i} style={{ height: 12, borderRadius: 4, backgroundColor: '#0f172a' }} />
    ))}
  </div>
);

export default function AdminWithdrawals() {
  const [tab,          setTab]          = useState('withdrawals'); // withdrawals | kyc
  const [withdrawals,  setWithdrawals]  = useState([]);
  const [kycUsers,     setKycUsers]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [actionLoading,setActionLoading]= useState(null);
  const [error,        setError]        = useState('');
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [wFilter,      setWFilter]      = useState('all');
  const [kFilter,      setKFilter]      = useState('pending');
  const [selectedW,    setSelectedW]    = useState(null);
  const [selectedK,    setSelectedK]    = useState(null);
  const [adminNote,    setAdminNote]    = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // ── Fetch all data ────────────────────────────────────────────────────
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [wRes, uRes] = await Promise.all([
        api.get('/admin/withdrawals'),
        api.get('/admin/users'),
      ]);
      setWithdrawals(wRes.data.withdrawals || []);
      // Filter users who have submitted KYC (status !== not_started)
      const kycSubmitted = (uRes.data.users || []).filter(
        u => u.kycStatus && u.kycStatus !== 'not_started'
      );
      setKycUsers(kycSubmitted);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Withdrawal actions ────────────────────────────────────────────────
  const handleWithdrawalAction = async (id, action) => {
    setActionLoading(id + action);
    try {
      await api.put(`/admin/withdrawals/${id}/${action}`, { adminNote });
      setWithdrawals(prev => prev.map(w =>
        w._id !== id ? w : {
          ...w,
          status:    action === 'approve' ? 'approved' : 'rejected',
          adminNote,
        }
      ));
      setSelectedW(null);
      setAdminNote('');
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── KYC actions ───────────────────────────────────────────────────────
  const handleKYCAction = async (userId, status) => {
    setActionLoading(userId + status);
    try {
      await api.put(`/admin/users/${userId}/kyc`, {
        status,
        rejectionReason: rejectReason,
      });
      setKycUsers(prev => prev.map(u =>
        u._id !== userId ? u : {
          ...u,
          kycStatus:          status,
          kycVerified:        status === 'verified',
          kycRejectionReason: rejectReason,
        }
      ));
      setSelectedK(null);
      setRejectReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'KYC action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Counts ────────────────────────────────────────────────────────────
  const wCounts = {
    all:      withdrawals.length,
    pending:  withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
  };

  const kCounts = {
    all:      kycUsers.length,
    pending:  kycUsers.filter(u => u.kycStatus === 'pending').length,
    verified: kycUsers.filter(u => u.kycStatus === 'verified').length,
    rejected: kycUsers.filter(u => u.kycStatus === 'rejected').length,
  };

  const filteredW = withdrawals.filter(w => wFilter === 'all' || w.status === wFilter);
  const filteredK = kycUsers.filter(u =>
    kFilter === 'all' ? true : u.kycStatus === kFilter
  );

  const W_COLS = '2fr 1.5fr 1fr 1fr 1fr';
  const K_COLS = '2fr 1.2fr 1fr 1fr 1fr';

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              Withdrawals & KYC
            </h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
              Review withdrawal requests and verify user identities
              {lastUpdated && (
                <span style={{ color: '#334155', marginLeft: 8 }}>
                  · {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchAll(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Pending Withdrawals', value: wCounts.pending,  color: '#fbbf24' },
            { label: 'Approved Withdrawals',value: wCounts.approved, color: '#4ade80' },
            { label: 'Pending KYC',          value: kCounts.pending,  color: '#fbbf24' },
            { label: 'Verified KYC',          value: kCounts.verified, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 18, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Page tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {[
            { key: 'withdrawals', label: `Withdrawals (${wCounts.pending} pending)` },
            { key: 'kyc',         label: `KYC Reviews (${kCounts.pending} pending)` },
          ].map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, backgroundColor: tab === tb.key ? '#1e293b' : 'transparent', color: tab === tb.key ? '#fff' : '#64748b' }}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* ══ WITHDRAWALS TAB ════════════════════════════════════════════ */}
        {tab === 'withdrawals' && (
          <>
            {/* Filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {['all','pending','approved','rejected'].map(f => (
                <button key={f} onClick={() => setWFilter(f)}
                  style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                    backgroundColor: wFilter === f ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor:     wFilter === f ? '#f59e0b'               : 'rgba(255,255,255,0.08)',
                    color:           wFilter === f ? '#f59e0b'               : '#94a3b8',
                  }}>
                  {f} {f !== 'all' && `(${wCounts[f]})`}
                </button>
              ))}
            </div>

            <div style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: W_COLS, gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>User</span><span>Bank / Account</span><span>Amount</span><span style={{ textAlign: 'center' }}>Status</span><span style={{ textAlign: 'center' }}>Action</span>
              </div>

              {loading ? (
                [1,2,3,4].map(i => <SkeletonRow key={i} cols={W_COLS} />)
              ) : filteredW.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No withdrawal requests found
                </div>
              ) : (
                filteredW.map((w, i) => {
                  const cfg  = W_STATUS[w.status] || W_STATUS.pending;
                  const Icon = cfg.Icon;
                  return (
                    <div
                      key={w._id}
                      style={{ display: 'grid', gridTemplateColumns: W_COLS, gap: 12, padding: '14px 20px', borderBottom: i < filteredW.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500, margin: 0 }}>{w.user?.fullName || w.fullName}</p>
                        <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{w.user?.email || ''}</p>
                      </div>
                      <div>
                        <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{w.bankName}</p>
                        <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>···{w.accountNumber?.slice(-4)}</p>
                      </div>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                        ${parseFloat(w.amount || 0).toFixed(2)}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          <Icon size={11} /> {w.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={() => { setSelectedW(w); setAdminNote(w.adminNote || ''); }}
                          style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.3)', backgroundColor: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <Eye size={12} /> View
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ══ KYC TAB ════════════════════════════════════════════════════ */}
        {tab === 'kyc' && (
          <>
            {/* Filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {['all','pending','verified','rejected'].map(f => (
                <button key={f} onClick={() => setKFilter(f)}
                  style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                    backgroundColor: kFilter === f ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor:     kFilter === f ? '#38bdf8'               : 'rgba(255,255,255,0.08)',
                    color:           kFilter === f ? '#38bdf8'               : '#94a3b8',
                  }}>
                  {f} {f !== 'all' && `(${kCounts[f] ?? 0})`}
                </button>
              ))}
            </div>

            <div style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: K_COLS, gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>User</span><span>Submitted</span><span>ID Type</span><span style={{ textAlign: 'center' }}>Status</span><span style={{ textAlign: 'center' }}>Action</span>
              </div>

              {loading ? (
                [1,2,3].map(i => <SkeletonRow key={i} cols={K_COLS} />)
              ) : filteredK.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No KYC submissions found
                </div>
              ) : (
                filteredK.map((u, i) => {
                  const cfg  = K_STATUS[u.kycStatus] || K_STATUS.pending;
                  const Icon = cfg.Icon;
                  return (
                    <div
                      key={u._id}
                      style={{ display: 'grid', gridTemplateColumns: K_COLS, gap: 12, padding: '14px 20px', borderBottom: i < filteredK.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700 }}>
                            {u.fullName?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName}</p>
                          <p style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>{u.email}</p>
                        </div>
                      </div>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        {u.kycSubmittedAt
                          ? new Date(u.kycSubmittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>
                        {u.kycData?.idType || '—'}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={() => { setSelectedK(u); setRejectReason(''); }}
                          style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <Eye size={12} /> Review
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* ══ WITHDRAWAL DETAIL MODAL ════════════════════════════════════ */}
      {selectedW && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>Withdrawal Request</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                  {new Date(selectedW.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelectedW(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <X size={22} />
              </button>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 18 }}>
              <p style={{ color: '#64748b', fontSize: 13 }}>Requested Amount</p>
              <p style={{ color: '#fff', fontSize: 36, fontWeight: 700, marginTop: 4 }}>
                ${parseFloat(selectedW.amount || 0).toFixed(2)}
              </p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, padding: '4px 12px', borderRadius: 20, backgroundColor: W_STATUS[selectedW.status]?.bg, color: W_STATUS[selectedW.status]?.color, textTransform: 'capitalize' }}>
                {selectedW.status}
              </span>
            </div>

            {/* Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Account Holder', value: selectedW.fullName      },
                { label: 'Bank Name',      value: selectedW.bankName      },
                { label: 'Account No.',    value: selectedW.accountNumber },
                { label: 'Date',           value: new Date(selectedW.createdAt).toLocaleDateString() },
              ].map(item => (
                <div key={item.label} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{item.label}</p>
                  <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500, marginTop: 4 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Reason */}
            {selectedW.reason && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Reason</p>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{selectedW.reason}</p>
              </div>
            )}

            {/* Proof images */}
            {(selectedW.proofImage1 || selectedW.proofImage2) && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supporting Documents</p>
                <div style={{ display: 'grid', gridTemplateColumns: selectedW.proofImage2 ? '1fr 1fr' : '1fr', gap: 10 }}>
                  {selectedW.proofImage1 && <img src={selectedW.proofImage1} alt="Proof 1" style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }} />}
                  {selectedW.proofImage2 && <img src={selectedW.proofImage2} alt="Proof 2" style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }} />}
                </div>
              </div>
            )}

            {/* Admin note input */}
            {selectedW.status === 'pending' && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Admin Note (optional)</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add a note for the user..." rows={3} style={textareaStyle}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            )}

            {/* Existing admin note (read-only) */}
            {selectedW.status !== 'pending' && selectedW.adminNote && (
              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Admin Note</p>
                <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{selectedW.adminNote}</p>
              </div>
            )}

            {/* Action buttons */}
            {selectedW.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleWithdrawalAction(selectedW._id, 'reject')}
                  disabled={!!actionLoading}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600, fontSize: 14, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: actionLoading ? 0.7 : 1 }}
                >
                  {actionLoading === selectedW._id + 'reject' ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleWithdrawalAction(selectedW._id, 'approve')}
                  disabled={!!actionLoading}
                  style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', backgroundColor: '#22c55e', color: '#0f172a', fontWeight: 700, fontSize: 14, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: actionLoading ? 0.7 : 1 }}
                >
                  {actionLoading === selectedW._id + 'approve' ? 'Approving...' : 'Approve Withdrawal'}
                </button>
              </div>
            )}

            {selectedW.status !== 'pending' && (
              <button onClick={() => setSelectedW(null)}
                style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══ KYC REVIEW MODAL ══════════════════════════════════════════ */}
      {selectedK && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div style={{ ...modalCard, maxWidth: 620 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>KYC Review</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{selectedK.fullName} · {selectedK.email}</p>
              </div>
              <button onClick={() => setSelectedK(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <X size={22} />
              </button>
            </div>

            {/* Status badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              {(() => {
                const cfg  = K_STATUS[selectedK.kycStatus] || K_STATUS.pending;
                const Icon = cfg.Icon;
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 13, fontWeight: 600 }}>
                    <Icon size={15} /> {cfg.label}
                  </span>
                );
              })()}
            </div>

            {/* Personal info */}
            <p style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
              Personal Information
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Full Name',    value: selectedK.kycData?.fullName    || selectedK.fullName },
                { label: 'Date of Birth',value: selectedK.kycData?.dateOfBirth || '—'               },
                { label: 'ID Type',      value: selectedK.kycData?.idType      || '—'               },
                { label: 'ID Number',    value: selectedK.kycData?.idNumber    || '—'               },
                { label: 'Email',        value: selectedK.email                                      },
                { label: 'Submitted',    value: selectedK.kycSubmittedAt ? new Date(selectedK.kycSubmittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
              ].map(item => (
                <div key={item.label} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{item.label}</p>
                  <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500, marginTop: 4 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Address */}
            {selectedK.kycData?.address && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Residential Address</p>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{selectedK.kycData.address}</p>
              </div>
            )}

            {/* Document images */}
            {(selectedK.kycData?.idFront || selectedK.kycData?.idBack || selectedK.kycData?.selfie) && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                  Submitted Documents
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { label: 'ID Front',      src: selectedK.kycData?.idFront },
                    { label: 'ID Back',       src: selectedK.kycData?.idBack  },
                    { label: 'Selfie with ID',src: selectedK.kycData?.selfie  },
                  ].map(doc => doc.src ? (
                    <div key={doc.label}>
                      <p style={{ color: '#64748b', fontSize: 10, marginBottom: 6, textAlign: 'center' }}>{doc.label}</p>
                      <img src={doc.src} alt={doc.label} style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', maxHeight: 140, objectFit: 'cover' }} />
                    </div>
                  ) : null)}
                </div>
              </div>
            )}

            {/* Previous rejection reason */}
            {selectedK.kycStatus === 'rejected' && selectedK.kycRejectionReason && (
              <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 16 }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Previous Rejection Reason</p>
                <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{selectedK.kycRejectionReason}</p>
              </div>
            )}

            {/* Rejection reason input */}
            {selectedK.kycStatus === 'pending' && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                  Rejection Reason <span style={{ color: '#64748b', fontWeight: 400 }}>(required if rejecting)</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Explain why this KYC is being rejected so the user can resubmit..."
                  rows={3}
                  style={textareaStyle}
                  onFocus={e => e.target.style.borderColor = '#38bdf8'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            )}

            {/* Action buttons */}
            {selectedK.kycStatus === 'pending' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    if (!rejectReason.trim()) { alert('Please provide a rejection reason'); return; }
                    handleKYCAction(selectedK._id, 'rejected');
                  }}
                  disabled={!!actionLoading}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600, fontSize: 14, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: actionLoading ? 0.7 : 1 }}
                >
                  {actionLoading === selectedK._id + 'rejected' ? 'Rejecting...' : 'Reject KYC'}
                </button>
                <button
                  onClick={() => handleKYCAction(selectedK._id, 'verified')}
                  disabled={!!actionLoading}
                  style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', backgroundColor: '#22c55e', color: '#0f172a', fontWeight: 700, fontSize: 14, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: actionLoading ? 0.7 : 1 }}
                >
                  <ShieldCheck size={16} />
                  {actionLoading === selectedK._id + 'verified' ? 'Verifying...' : 'Approve & Verify KYC'}
                </button>
              </div>
            )}

            {selectedK.kycStatus !== 'pending' && (
              <button onClick={() => setSelectedK(null)}
                style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
