import { useState, useEffect, useCallback } from 'react';
import { Edit2, CheckCircle2, XCircle, Clock, RefreshCw, X, Save, AlertCircle, Copy, Eye } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const card = { backgroundColor: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' };
const inputStyle = { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' };
const modalCard  = { backgroundColor: '#1e293b', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: 28, width: '100%', maxWidth: 500 };

const STATUS_CFG = {
  pending:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  Icon: Clock        },
  confirmed: { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   Icon: CheckCircle2 },
  rejected:  { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   Icon: XCircle      },
};

export default function AdminDeposits() {
  const [tab,            setTab]            = useState('wallets'); // wallets | deposits
  const [wallets,        setWallets]        = useState([]);
  const [deposits,       setDeposits]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [editingWallet,  setEditingWallet]  = useState(null);
  const [walletForm,     setWalletForm]     = useState({});
  const [walletSaving,   setWalletSaving]   = useState(false);
  const [walletError,    setWalletError]    = useState('');
  const [walletSuccess,  setWalletSuccess]  = useState('');
  const [depositFilter,  setDepositFilter]  = useState('all');
  const [reviewDeposit,  setReviewDeposit]  = useState(null);
  const [reviewForm,     setReviewForm]     = useState({ amount: '', adminNote: '' });
  const [reviewLoading,  setReviewLoading]  = useState(false);
  const [reviewError,    setReviewError]    = useState('');
  const [copiedId,       setCopiedId]       = useState(null);
  const [lastUpdated,    setLastUpdated]    = useState(null);

  const isMobile = window.innerWidth < 590;

  const fetchAll = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [wRes, dRes] = await Promise.all([
        api.get('/admin/wallets'),
        api.get('/admin/deposits'),
      ]);
      setWallets(wRes.data.wallets || []);
      setDeposits(dRes.data.deposits || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Wallet edit ────────────────────────────────────────────────────────
  const openEditWallet = (wallet) => {
    setEditingWallet(wallet);
    setWalletForm({
      address:      wallet.address,
      label:        wallet.label,
      network_tag:  wallet.network_tag,
      isActive:     wallet.isActive,
      minDeposit:   wallet.minDeposit,
      confirmations: wallet.confirmations,
    });
    setWalletError('');
    setWalletSuccess('');
  };

  const saveWallet = async () => {
    if (!walletForm.address?.trim()) { setWalletError('Wallet address is required'); return; }
    setWalletSaving(true);
    setWalletError('');
    try {
      const res = await api.put(`/admin/wallets/${editingWallet._id}`, walletForm);
      setWallets(prev => prev.map(w => w._id === editingWallet._id ? res.data.wallet : w));
      setWalletSuccess('Wallet updated successfully!');
      setTimeout(() => { setEditingWallet(null); setWalletSuccess(''); }, 1500);
    } catch (err) {
      setWalletError(err.response?.data?.message || 'Failed to update wallet');
    } finally {
      setWalletSaving(false);
    }
  };

  const copyAddress = async (id, address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  };

  // ── Deposit review ─────────────────────────────────────────────────────
  const openReview = (dep) => {
    setReviewDeposit(dep);
    setReviewForm({ amount: dep.amount || '', adminNote: '' });
    setReviewError('');
  };

  const handleConfirm = async () => {
    if (!reviewForm.amount || parseFloat(reviewForm.amount) <= 0) {
      setReviewError('Enter the amount to credit'); return;
    }
    setReviewLoading(true);
    try {
      const res = await api.put(`/admin/deposits/${reviewDeposit._id}/confirm`, reviewForm);
      setDeposits(prev => prev.map(d => d._id === res.data.deposit._id ? res.data.deposit : d));
      setReviewDeposit(null);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to confirm');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReject = async () => {
    setReviewLoading(true);
    try {
      const res = await api.put(`/admin/deposits/${reviewDeposit._id}/reject`, { adminNote: reviewForm.adminNote });
      setDeposits(prev => prev.map(d => d._id === res.data.deposit._id ? res.data.deposit : d));
      setReviewDeposit(null);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Counts ─────────────────────────────────────────────────────────────
  const counts = {
    all:       deposits.length,
    pending:   deposits.filter(d => d.status === 'pending').length,
    confirmed: deposits.filter(d => d.status === 'confirmed').length,
    rejected:  deposits.filter(d => d.status === 'rejected').length,
  };

  const filteredDeposits = deposits.filter(d => depositFilter === 'all' || d.status === depositFilter);

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              Deposits & Wallets
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              Manage wallet addresses and review user deposits
              {lastUpdated && <span style={{ color: '#334155', marginLeft: 8 }}>· {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
            </p>
          </div>
          <button onClick={() => fetchAll(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Deposits', value: counts.all,       color: '#f1f5f9' },
            { label: 'Pending',        value: counts.pending,   color: '#fbbf24' },
            { label: 'Confirmed',      value: counts.confirmed, color: '#4ade80' },
            { label: 'Rejected',       value: counts.rejected,  color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {[
            { key: 'wallets',  label: `Wallet Addresses (${wallets.length})` },
            { key: 'deposits', label: `Deposit Requests (${counts.pending} pending)` },
          ].map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, backgroundColor: tab === tb.key ? '#1e293b' : 'transparent', color: tab === tb.key ? '#fff' : '#64748b' }}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* ══ WALLETS TAB ══════════════════════════════════════════════════ */}
        {tab === 'wallets' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1,1fr)' : 'repeat(2,1fr)', gap: 14 }}>
            {wallets.map(wallet => (
              <div key={wallet._id} style={{ ...card, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${wallet.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: wallet.color, fontSize: 12, fontWeight: 700 }}>{wallet.symbol}</span>
                    </div>
                    <div>
                      <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>{wallet.label}</p>
                      <p style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>{wallet.network_tag}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, backgroundColor: wallet.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: wallet.isActive ? '#4ade80' : '#f87171' }}>
                      {wallet.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => openEditWallet(wallet)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                      <Edit2 size={12} /> Edit
                    </button>
                  </div>
                </div>

                {/* Address */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code style={{ flex: 1, color: '#94a3b8', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {wallet.address}
                  </code>
                  <button onClick={() => copyAddress(wallet._id, wallet.address)}
                    style={{ padding: '4px 8px', borderRadius: 6, cursor: 'pointer', backgroundColor: copiedId === wallet._id ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)', border: 'none', color: copiedId === wallet._id ? '#4ade80' : '#94a3b8', fontSize: 11, flexShrink: 0 }}>
                    {copiedId === wallet._id ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' }}>
                    <p style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>Min. Deposit</p>
                    <p style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600 }}>{wallet.minDeposit} {wallet.symbol}</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' }}>
                    <p style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>Confirmations</p>
                    <p style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600 }}>{wallet.confirmations} blocks</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' }}>
                    <p style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>Last Updated</p>
                    <p style={{ color: '#f1f5f9', fontSize: 11 }}>
                      {new Date(wallet.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ DEPOSITS TAB ═════════════════════════════════════════════════ */}
        {tab === 'deposits' && (
          <>
            {/* Filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {['all', 'pending', 'confirmed', 'rejected'].map(f => (
                <button key={f} onClick={() => setDepositFilter(f)}
                  style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 500, textTransform: 'capitalize', fontFamily: "'DM Sans', sans-serif",
                    backgroundColor: depositFilter === f ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor:     depositFilter === f ? '#f59e0b'               : 'rgba(255,255,255,0.08)',
                    color:           depositFilter === f ? '#f59e0b'               : '#94a3b8',
                  }}>
                  {f} {f !== 'all' && `(${counts[f]})`}
                </button>
              ))}
            </div>

            <div style={card}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.2fr 1fr', gap: 10, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>User</span>
                <span>Network</span>
                <span>Amount</span>
                <span>Date</span>
                <span style={{ textAlign: 'center' }}>Status</span>
                <span style={{ textAlign: 'center' }}>Action</span>
              </div>

              {filteredDeposits.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No deposits found
                </div>
              ) : (
                filteredDeposits.map((dep, i) => {
                  const wallet    = wallets.find(w => w.network === dep.network);
                  const color     = wallet?.color || '#94a3b8';
                  const statusCfg = STATUS_CFG[dep.status] || STATUS_CFG.pending;
                  const SIcon     = statusCfg.Icon;
                  const isClosed  = dep.status !== 'pending';

                  return (
                    <div key={dep._id} style={{
                      display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.2fr 1fr',
                      gap: 10, padding: '14px 20px', alignItems: 'center',
                      borderBottom: i < filteredDeposits.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{dep.user?.fullName}</p>
                        <p style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>{dep.user?.email}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color, fontSize: 8, fontWeight: 700 }}>{dep.symbol}</span>
                        </div>
                        <div>
                          <p style={{ color: '#94a3b8', fontSize: 12 }}>{dep.symbol}</p>
                          <p style={{ color: '#334155', fontSize: 10 }}>{dep.network}</p>
                        </div>
                      </div>
                      <span style={{ color: dep.amount > 0 ? '#fff' : '#64748b', fontSize: 13, fontWeight: 600 }}>
                        {dep.amount > 0 ? `${dep.amount}` : 'TBD'}
                      </span>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        {new Date(dep.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
                          <SIcon size={11} /> {dep.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {isClosed ? (
                          <span style={{ fontSize: 11, color: '#334155', padding: '4px 10px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            Closed
                          </span>
                        ) : (
                          <button onClick={() => openReview(dep)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                            <Eye size={12} /> Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* ══ Edit Wallet Modal ═════════════════════════════════════════════ */}
      {editingWallet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div style={modalCard}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: "'Playfair Display', serif" }}>
                  Edit Wallet — {editingWallet.label}
                </h3>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{editingWallet.network_tag} · {editingWallet.symbol}</p>
              </div>
              <button onClick={() => setEditingWallet(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                  Wallet Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={walletForm.address || ''}
                  onChange={e => setWalletForm(p => ({ ...p, address: e.target.value }))}
                  rows={3}
                  placeholder="Enter the full wallet address..."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Label</label>
                  <input type="text" value={walletForm.label || ''} onChange={e => setWalletForm(p => ({ ...p, label: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Network Tag</label>
                  <input type="text" value={walletForm.network_tag || ''} onChange={e => setWalletForm(p => ({ ...p, network_tag: e.target.value }))}
                    style={inputStyle} placeholder="e.g. ERC20, TRC20"
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Min. Deposit</label>
                  <input type="number" value={walletForm.minDeposit || ''} onChange={e => setWalletForm(p => ({ ...p, minDeposit: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Confirmations</label>
                  <input type="number" value={walletForm.confirmations || ''} onChange={e => setWalletForm(p => ({ ...p, confirmations: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>Show to Users</p>
                  <p style={{ color: '#64748b', fontSize: 12 }}>When off, this network won't appear on the deposit page</p>
                </div>
                <button
                  onClick={() => setWalletForm(p => ({ ...p, isActive: !p.isActive }))}
                  style={{ position: 'relative', width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', backgroundColor: walletForm.isActive ? '#f59e0b' : 'rgba(255,255,255,0.1)', transition: 'background 0.2s' }}
                >
                  <span style={{ position: 'absolute', top: 3, left: walletForm.isActive ? 23 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>

              {walletError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> {walletError}
                </div>
              )}
              {walletSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={14} /> {walletSuccess}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setEditingWallet(null)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={saveWallet} disabled={walletSaving}
                style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', cursor: walletSaving ? 'not-allowed' : 'pointer', backgroundColor: walletSaving ? '#334155' : '#f59e0b', color: '#0f172a', fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Save size={15} />
                {walletSaving ? 'Saving...' : 'Save Wallet Address'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══ Review Deposit Modal ══════════════════════════════════════════ */}
      {reviewDeposit && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div style={{ ...modalCard, maxWidth: 480 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: "'Playfair Display', serif" }}>Review Deposit</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                  {reviewDeposit.user?.fullName} · {reviewDeposit.symbol} · {reviewDeposit.network}
                </p>
              </div>
              <button onClick={() => setReviewDeposit(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Deposit details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'User',    value: reviewDeposit.user?.fullName },
                { label: 'Email',   value: reviewDeposit.user?.email    },
                { label: 'Network', value: reviewDeposit.network        },
                { label: 'Symbol',  value: reviewDeposit.symbol         },
                { label: 'Date',    value: new Date(reviewDeposit.createdAt).toLocaleDateString() },
                { label: 'Tx Hash', value: reviewDeposit.txHash ? `${reviewDeposit.txHash.slice(0,16)}...` : 'Not provided' },
              ].map(item => (
                <div key={item.label} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ color: '#64748b', fontSize: 10, marginBottom: 3 }}>{item.label}</p>
                  <p style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Tx hash full */}
            {reviewDeposit.txHash && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>Full Transaction Hash</p>
                <code style={{ color: '#94a3b8', fontSize: 11, wordBreak: 'break-all', fontFamily: 'monospace' }}>{reviewDeposit.txHash}</code>
              </div>
            )}

            {/* Amount to credit */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                Amount to Credit (USD) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <p style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
                This USD amount will be added to the user's balance upon confirmation.
              </p>
              <input
                type="number"
                value={reviewForm.amount}
                onChange={e => { setReviewForm(p => ({ ...p, amount: e.target.value })); setReviewError(''); }}
                placeholder="e.g. 150.00"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#22c55e'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                <span style={{ color: '#334155', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={reviewForm.adminNote}
                onChange={e => setReviewForm(p => ({ ...p, adminNote: e.target.value }))}
                placeholder="Internal note..."
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {reviewError && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} /> {reviewError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReviewDeposit(null)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={reviewLoading}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', cursor: reviewLoading ? 'not-allowed' : 'pointer', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", opacity: reviewLoading ? 0.6 : 1 }}>
                Reject
              </button>
              <button onClick={handleConfirm} disabled={reviewLoading}
                style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', cursor: reviewLoading ? 'not-allowed' : 'pointer', backgroundColor: reviewLoading ? '#334155' : '#22c55e', color: '#0f172a', fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: reviewLoading ? 0.6 : 1 }}>
                <CheckCircle2 size={15} />
                {reviewLoading ? 'Processing...' : `Confirm & Credit $${parseFloat(reviewForm.amount || 0).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}