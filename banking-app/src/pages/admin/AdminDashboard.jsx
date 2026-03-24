import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, DollarSign, Activity, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, RefreshCw,
  TrendingUp, Wallet, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

// ── Shared styles ─────────────────────────────────────────────────────────
const card = {
  backgroundColor: '#1e293b',
  borderRadius:    16,
  border:          '1px solid rgba(255,255,255,0.06)',
};

// ── Custom chart tooltip ──────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: '#64748b', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: 0 }}>
          {p.name}:{' '}
          {typeof p.value === 'number' && p.value > 10000
            ? `$${(p.value / 1e6).toFixed(2)}M`
            : p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, subColor, icon: Icon, iconBg, iconColor, loading }) => (
  <div style={{ ...card, padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ color: '#64748b', fontSize: 13 }}>{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={17} color={iconColor} />
      </div>
    </div>
    {loading ? (
      <>
        <div style={{ width: 100, height: 24, borderRadius: 6, backgroundColor: '#0f172a', marginBottom: 6 }} />
        <div style={{ width: 140, height: 12, borderRadius: 4, backgroundColor: '#0f172a' }} />
      </>
    ) : (
      <>
        <p style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>{value}</p>
        <p style={{ color: subColor, fontSize: 12, marginTop: 4, marginBottom: 0 }}>{sub}</p>
      </>
    )}
  </div>
);

// ── Activity type config ──────────────────────────────────────────────────
const ACTIVITY_CFG = {
  transfer:   { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80',  Icon: ArrowUpRight  },
  deposit:    { bg: 'rgba(56,189,248,0.1)',  color: '#38bdf8',  Icon: ArrowDownLeft },
  fund:       { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24',  Icon: DollarSign    },
  withdrawal: { bg: 'rgba(239,68,68,0.1)',  color: '#f87171',  Icon: ArrowUpRight  },
  register:   { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8',  Icon: Users         },
  trade:      { bg: 'rgba(192,132,252,0.1)',color: '#c084fc',  Icon: TrendingUp    },
  default:    { bg: 'rgba(148,163,184,0.1)',color: '#94a3b8',  Icon: Activity      },
};

const ACCOUNT_STATUS_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#94a3b8'];

// ── Skeleton row ──────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#0f172a', flexShrink: 0 }} />
      <div>
        <div style={{ width: 120, height: 12, borderRadius: 4, backgroundColor: '#0f172a', marginBottom: 6 }} />
        <div style={{ width: 180, height: 10, borderRadius: 4, backgroundColor: '#0f172a' }} />
      </div>
    </div>
    <div style={{ width: 60, height: 10, borderRadius: 4, backgroundColor: '#0f172a' }} />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { t } = useTranslation();

  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [txns,       setTxns]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdated,setLastUpdated]= useState(null);
  const [error,      setError]      = useState('');

  const isMobile = innerWidth < 590

  // ── Fetch all dashboard data ──────────────────────────────────────────
  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [dashRes, usersRes, txnsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/transactions'),
      ]);

      setStats(dashRes.data);
      setUsers(usersRes.data.users   || []);
      setTxns(txnsRes.data.transactions || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchDashboard(true), 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // ── Derived metrics ───────────────────────────────────────────────────
  const totalUsers     = users.length;
  const activeUsers    = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const pendingUsers   = users.filter(u => u.status === 'pending').length;
  const activeRate     = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const totalVolume    = txns.reduce((s, t) => s + (t.amount || 0), 0);
  const totalBalance   = users.reduce((s, u) => s + (u.balance || 0), 0);

  const pendingTxns    = txns.filter(t => t.status === 'pending').length;
  const failedTxns     = txns.filter(t => t.status === 'failed').length;

  // New users this week
  const oneWeekAgo     = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersWeek   = users.filter(u => new Date(u.createdAt) > oneWeekAgo).length;

  // Account status donut data
  const accountStatus = [
    { name: 'Active',    value: activeUsers    },
    { name: 'Suspended', value: suspendedUsers },
    { name: 'Pending',   value: pendingUsers   },
  ].filter(s => s.value > 0);

  // Registration trend — group users by month
  const regByMonth = {};
  users.forEach(u => {
    const key = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short' });
    regByMonth[key] = (regByMonth[key] || 0) + 1;
  });
  const registrationData = Object.entries(regByMonth).slice(-6).map(([month, users]) => ({ month, users }));

  // Volume trend — group transactions by month
  const volByMonth = {};
  txns.forEach(t => {
    const key = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short' });
    volByMonth[key] = (volByMonth[key] || 0) + (t.amount || 0);
  });
  const volumeData = Object.entries(volByMonth).slice(-6).map(([month, volume]) => ({ month, volume }));

  // Recent activity — last 8 transactions as activity feed
  const recentActivity = txns.slice(0, 8).map(t => ({
    _id:    t._id,
    type:   t.type || 'transfer',
    user:   t.fromUser?.fullName || t.toUser?.fullName || 'System',
    detail: t.description || `${t.type} — $${(t.amount || 0).toFixed(2)}`,
    time:   new Date(t.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: t.status,
  }));

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              {t('admin.dashboard')}
            </h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
              Platform overview — {today}
              {lastUpdated && (
                <span style={{ color: '#334155', marginLeft: 8 }}>
                  · Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchDashboard(false)}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1 }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard
            loading={loading}
            label={t('admin.totalUsers')}
            value={totalUsers.toLocaleString()}
            sub={`▲ ${newUsersWeek} new this week`}
            subColor="#4ade80"
            icon={Users}
            iconBg="rgba(56,189,248,0.12)"
            iconColor="#38bdf8"
          />
          <StatCard
            loading={loading}
            label="Total Balance Held"
            value={`$${totalBalance >= 1e6 ? (totalBalance / 1e6).toFixed(2) + 'M' : totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
            sub={`Across ${activeUsers} active accounts`}
            subColor="#4ade80"
            icon={Wallet}
            iconBg="rgba(34,197,94,0.12)"
            iconColor="#22c55e"
          />
          <StatCard
            loading={loading}
            label={t('admin.activeAccounts')}
            value={activeUsers.toLocaleString()}
            sub={`● ${activeRate}% of all accounts`}
            subColor="#fbbf24"
            icon={Activity}
            iconBg="rgba(245,158,11,0.12)"
            iconColor="#f59e0b"
          />
          <StatCard
            loading={loading}
            label="Pending / Failed Txns"
            value={pendingTxns + failedTxns}
            sub={`${pendingTxns} pending · ${failedTxns} failed`}
            subColor="#f87171"
            icon={AlertTriangle}
            iconBg="rgba(239,68,68,0.12)"
            iconColor="#ef4444"
          />
        </div>

        {/* ── Charts row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 340px', gap: 14, marginBottom: 14 }}>

          {/* Registration trend */}
          <div style={{ ...card, padding: 20 }}>
            <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 16, marginTop: 0 }}>
              New Registrations
            </h2>
            {loading ? (
              <div style={{ height: 180, backgroundColor: '#0f172a', borderRadius: 10 }} />
            ) : registrationData.length === 0 ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 13 }}>
                No registration data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={registrationData}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="users" stroke="#38bdf8" strokeWidth={2} fill="url(#regGrad)" name="Users" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Transaction volume */}
          <div style={{ ...card, padding: 20 }}>
            <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 16, marginTop: 0 }}>
              Transaction Volume
            </h2>
            {loading ? (
              <div style={{ height: 180, backgroundColor: '#0f172a', borderRadius: 10 }} />
            ) : volumeData.length === 0 ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 13 }}>
                No transaction data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1e3).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="volume" stroke="#22c55e" strokeWidth={2} fill="url(#volGrad)" name="Volume" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Account status donut */}
          <div style={{ ...card, padding: 20 }}>
            <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 8, marginTop: 0 }}>
              Account Status
            </h2>
            {loading ? (
              <div style={{ height: 160, backgroundColor: '#0f172a', borderRadius: 10, marginBottom: 16 }} />
            ) : accountStatus.length === 0 ? (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 13 }}>
                No users yet
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={160} height={160}>
                  <Pie
                    data={accountStatus}
                    cx={75} cy={75}
                    innerRadius={45} outerRadius={72}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {accountStatus.map((_, i) => (
                      <Cell key={i} fill={ACCOUNT_STATUS_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
                </PieChart>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {accountStatus.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: ACCOUNT_STATUS_COLORS[i], display: 'inline-block' }} />
                    {s.name}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{s.value.toLocaleString()}</span>
                </div>
              ))}
              {/* Total */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
                <span style={{ color: '#64748b' }}>Total</span>
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{totalUsers.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
          {[
            {
              label: 'Total Transactions',
              value: txns.length.toLocaleString(),
              sub:   `$${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total volume`,
              color: '#38bdf8',
              icon:  Activity,
              bg:    'rgba(56,189,248,0.1)',
            },
            {
              label: 'Suspended Accounts',
              value: suspendedUsers.toLocaleString(),
              sub:   suspendedUsers > 0 ? 'Requires admin review' : 'No suspended accounts',
              color: suspendedUsers > 0 ? '#f87171' : '#4ade80',
              icon:  AlertTriangle,
              bg:    'rgba(239,68,68,0.1)',
            },
            {
              label: 'Pending Approvals',
              value: pendingUsers.toLocaleString(),
              sub:   pendingUsers > 0 ? 'Awaiting manual approval' : 'All users approved',
              color: pendingUsers > 0 ? '#fbbf24' : '#4ade80',
              icon:  Clock,
              bg:    'rgba(245,158,11,0.1)',
            },
          ].map(item => (
            <div key={item.label} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={18} color={item.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 4px' }}>{item.label}</p>
                {loading ? (
                  <div style={{ width: 60, height: 18, borderRadius: 4, backgroundColor: '#0f172a' }} />
                ) : (
                  <>
                    <p style={{ color: item.color, fontSize: 20, fontWeight: 700, margin: 0 }}>{item.value}</p>
                    <p style={{ color: '#475569', fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent Activity ── */}
        <div style={card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>Recent Activity</h2>
            <span style={{ color: '#334155', fontSize: 12 }}>
              Last {recentActivity.length} transactions
            </span>
          </div>

          {loading ? (
            <>{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</>
          ) : recentActivity.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              No transactions yet
            </div>
          ) : (
            recentActivity.map((item, i) => {
              const cfg  = ACTIVITY_CFG[item.type] || ACTIVITY_CFG.default;
              const Icon = cfg.Icon;
              return (
                <div
                  key={item._id || i}
                  style={{
                    display:       'flex',
                    alignItems:    'center',
                    justifyContent:'space-between',
                    padding:       '13px 20px',
                    borderBottom:  i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition:    'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={cfg.color} />
                    </div>
                    <div>
                      <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500, margin: 0 }}>{item.user}</p>
                      <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0' }}>{item.detail}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ color: '#475569', fontSize: 11, display: 'block' }}>{item.time}</span>
                    <span style={{
                      fontSize:        10,
                      padding:         '2px 8px',
                      borderRadius:    20,
                      marginTop:       4,
                      display:         'inline-block',
                      backgroundColor: item.status === 'completed' ? 'rgba(34,197,94,0.1)'
                                    : item.status === 'pending'   ? 'rgba(245,158,11,0.1)'
                                    :                               'rgba(239,68,68,0.1)',
                      color:           item.status === 'completed' ? '#4ade80'
                                    : item.status === 'pending'   ? '#fbbf24'
                                    :                               '#f87171',
                    }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
