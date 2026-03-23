import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, ArrowUpRight, ArrowDownLeft,
  ShoppingCart, ChevronDown, RefreshCw,
  AlertCircle, BarChart2
} from 'lucide-react';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TYPE_CFG = {
  transfer:   { Icon: ArrowUpRight,  bg: 'rgba(14,165,233,0.12)',  color: '#38bdf8' },
  income:     { Icon: ArrowDownLeft, bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  purchase:   { Icon: ShoppingCart,  bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  deposit:    { Icon: ArrowDownLeft, bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  fund:       { Icon: ArrowDownLeft, bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  debit:      { Icon: ArrowUpRight,  bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  withdrawal: { Icon: ArrowUpRight,  bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
};

const STATUS_STYLE = {
  completed: { bg: 'rgba(34,197,94,0.1)',  color: '#4ade80' },
  pending:   { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
  failed:    { bg: 'rgba(239,68,68,0.1)',  color: '#f87171' },
};

const card = {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
  overflow: 'hidden',
};

const inputBase = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '10px 14px',
  color: '#f1f5f9',
  fontSize: 13,
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  width: '100%',
};

// Skeleton row
const SkeletonRow = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#0f172a', flexShrink: 0 }} />
      <div style={{ width: 140, height: 13, borderRadius: 4, backgroundColor: '#0f172a' }} />
    </div>
    <div style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: '#0f172a' }} />
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 60, height: 20, borderRadius: 20, backgroundColor: '#0f172a' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: 70, height: 13, borderRadius: 4, backgroundColor: '#0f172a' }} />
    </div>
  </div>
);

export default function HistoryPage() {
  const { t }    = useTranslation();
  const { user } = useAuth();

  const [transactions,  setTransactions]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [filter,        setFilter]        = useState('all');
  const [sortDir,       setSortDir]       = useState('desc');
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalCount,    setTotalCount]    = useState(0);
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const LIMIT = 15;
  const isMobile = window.innerWidth < 640;

  // ── Fetch from backend ────────────────────────────────────────────────
  const fetchTransactions = useCallback(async (showLoader = true, p = page) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const params = { page: p, limit: LIMIT };
      if (filter !== 'all') params.type = filter;

      const res = await api.get('/user/transactions', { params });
      const data = res.data;

      setTransactions(data.transactions || []);
      setTotalPages(data.pages || 1);
      setTotalCount(data.total || 0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ── Client-side search + sort (on already-fetched page) ───────────────
  const displayed = transactions
    .filter(tx => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        tx.description?.toLowerCase().includes(q) ||
        tx.fromUser?.fullName?.toLowerCase().includes(q) ||
        tx.toUser?.fullName?.toLowerCase().includes(q) ||
        tx.reference?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) =>
      sortDir === 'desc'
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );

  // ── Helpers ───────────────────────────────────────────────────────────
  const uid = user?._id || user?.id;

  const getDisplayAmount = (tx) => {
    const isIncoming =
      tx.toUser?._id === uid ||
      tx.toUser === uid ||
      tx.type === 'fund' ||
      tx.type === 'deposit';
    return isIncoming ? tx.amount : -tx.amount;
  };

  const getDescription = (tx) => {
    if (tx.description) return tx.description;
    const isIncoming = tx.toUser?._id === uid || tx.toUser === uid;
    return isIncoming
      ? `Received from ${tx.fromUser?.fullName || 'System'}`
      : `Sent to ${tx.toUser?.fullName || 'Unknown'}`;
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });

  // ── Summary stats ─────────────────────────────────────────────────────
  const totalIn  = transactions.filter(tx => getDisplayAmount(tx) > 0).reduce((s, tx) => s + tx.amount, 0);
  const totalOut = transactions.filter(tx => getDisplayAmount(tx) < 0).reduce((s, tx) => s + tx.amount, 0);

  // ── Filter button helper ──────────────────────────────────────────────
  const FilterBtn = ({ val, label }) => (
    <button
      onClick={() => setFilter(val)}
      style={{
        fontSize: 12, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
        border: '1px solid', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
        backgroundColor: filter === val ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
        borderColor:     filter === val ? '#38bdf8'               : 'rgba(255,255,255,0.08)',
        color:           filter === val ? '#38bdf8'               : '#94a3b8',
      }}
    >
      {label}
    </button>
  );

  return (
    <UserLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              {t('history.title')}
            </h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              {t('history.subtitle')}
              {lastUpdated && (
                <span style={{ color: '#334155', marginLeft: 8 }}>
                  · {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchTransactions(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8', fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <RefreshCw size={13} /> {t('common.refresh')}
          </button>
        </div>

        {/* Summary cards */}
        {!loading && transactions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
            {[
              { label: t('history.all'),    value: totalCount,  color: '#f1f5f9' },
              { label: t('history.income'), value: `+$${totalIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,  color: '#4ade80' },
              { label: t('history.transfers'), value: `-$${totalOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#f87171' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: 18, fontWeight: 700 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
            <button onClick={() => fetchTransactions()} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('history.search')}
              style={{ ...inputBase, paddingLeft: 36 }}
              onFocus={e => e.target.style.borderColor = '#38bdf8'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Type filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <FilterBtn val="all"      label={t('history.all')}       />
            <FilterBtn val="income"   label={t('history.income')}    />
            <FilterBtn val="transfer" label={t('history.transfers')} />
            <FilterBtn val="fund"     label="Fund"                   />
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            style={{ ...inputBase, width: 'auto', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', cursor: 'pointer', padding: '8px 14px' }}
          >
            {sortDir === 'desc' ? t('history.newestFirst') : t('history.oldestFirst')}
            <ChevronDown size={13} style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
        </div>

        {/* Table */}
        <div style={card}>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>{t('history.description')}</span>
            <span>{t('history.date')}</span>
            <span style={{ textAlign: 'center' }}>{t('history.status')}</span>
            <span style={{ textAlign: 'right' }}>{t('history.amount')}</span>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <>
              {[1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            </>
          )}

          {/* Empty state */}
          {!loading && displayed.length === 0 && (
            <div style={{ padding: '56px 20px', textAlign: 'center' }}>
              <BarChart2 size={36} color="#334155" style={{ marginBottom: 12 }} />
              <p style={{ color: '#64748b', fontSize: 14 }}>{t('history.noData')}</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{ marginTop: 12, padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {/* Transaction rows */}
          {!loading && displayed.map((tx, i) => {
            const type          = tx.type || 'transfer';
            const cfg           = TYPE_CFG[type] || TYPE_CFG.transfer;
            const Icon          = cfg.Icon;
            const displayAmount = getDisplayAmount(tx);
            const description   = getDescription(tx);
            const statusStyle   = STATUS_STYLE[tx.status] || STATUS_STYLE.pending;

            return (
              <div
                key={tx._id || i}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
                  gap: 12, padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < displayed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.1s' 
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Description */}
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: 12, height : isMobile ? 100 : "", width: isMobile ? 100 : ""}}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={cfg.color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 500, whiteSpace: isMobile ? 'normal' : 'nowrap', overflow: 'hidden', padding: isMobile ? '4px' : '0', width: 140, textAlign: isMobile ? 'center' : 'left' }}>
                      {description}
                    </p>
                    {tx.reference && (
                      <p style={{ color: '#334155', fontSize: 8, marginTop: 1, textAlign: isMobile ? 'center' : 'left' }}>
                        {tx.reference}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <p style={{ color: '#94a3b8', fontSize: 11 }}>{formatDate(tx.createdAt)}</p>
                  <p style={{ color: '#334155', fontSize: 11, marginTop: 1 }}>{formatTime(tx.createdAt)}</p>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                    backgroundColor: statusStyle.bg, color: statusStyle.color,
                    textTransform: 'capitalize',
                  }}>
                    {tx.status}
                  </span>
                </div>

                {/* Amount */}
                <span style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: displayAmount >= 0 ? '#22c55e' : '#ef4444' }}>
                  {displayAmount >= 0 ? '+' : ''}${Math.abs(displayAmount).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer: count + pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <p style={{ color: '#64748b', fontSize: 12 }}>
            {displayed.length} of {totalCount} transactions
          </p>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 14px', borderRadius: 8, cursor: page === 1 ? 'not-allowed' : 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: page === 1 ? '#334155' : '#94a3b8', fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif", opacity: page === 1 ? 0.5 : 1,
                }}
              >
                ← Prev
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                      backgroundColor: page === p ? '#38bdf8' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${page === p ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                      color: page === p ? '#0f172a' : '#94a3b8',
                      fontSize: 12, fontWeight: page === p ? 700 : 400,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 14px', borderRadius: 8, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: page === totalPages ? '#334155' : '#94a3b8', fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif", opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}