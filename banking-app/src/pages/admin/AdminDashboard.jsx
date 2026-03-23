import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, DollarSign, Activity, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AdminLayout from '../../components/layout/AdminLayout';

const MOCK = {
  totalUsers: 2841, newUsersWeek: 14,
  totalDeposits: 8300000, depositsChange: 6.2,
  activeAccounts: 2614, activeRate: 92,
  flagged: 7,
  registrationData: [
    { month: 'Oct', users: 210 }, { month: 'Nov', users: 280 }, { month: 'Dec', users: 320 },
    { month: 'Jan', users: 410 }, { month: 'Feb', users: 390 }, { month: 'Mar', users: 520 },
  ],
  volumeData: [
    { month: 'Oct', volume: 980000 }, { month: 'Nov', volume: 1200000 }, { month: 'Dec', volume: 1500000 },
    { month: 'Jan', volume: 1350000 }, { month: 'Feb', volume: 1600000 }, { month: 'Mar', volume: 1870000 },
  ],
  accountStatus: [
    { name: 'Active',    value: 2614, color: '#22c55e' },
    { name: 'Suspended', value: 180,  color: '#ef4444' },
    { name: 'Pending',   value: 47,   color: '#f59e0b' },
  ],
  recentActivity: [
    { id: 1, type: 'register', user: 'Sara Rossi',   detail: 'New registration',      time: '2 min ago'  },
    { id: 2, type: 'transfer', user: 'John Doe',     detail: 'Sent $250 to Alice',    time: '14 min ago' },
    { id: 3, type: 'flag',     user: 'Unknown IP',   detail: 'Suspicious login attempt', time: '1 hr ago' },
    { id: 4, type: 'fund',     user: 'Admin',        detail: 'Funded Bob +$1,000',    time: '3 hrs ago'  },
  ],
};

const StatCard = ({ label, value, sub, subColor, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-banking-card rounded-2xl p-5 border border-white/5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-banking-muted text-sm">{label}</span>
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon size={17} className={iconColor} />
      </div>
    </div>
    <p className="text-white text-2xl font-semibold">{value}</p>
    <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-banking-card border border-white/10 rounded-xl p-3 text-sm">
      <p className="text-banking-muted mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 10000
            ? `$${(p.value / 1000000).toFixed(2)}M`
            : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const ACTIVITY_ICON = {
  register: { bg: 'bg-sky-500/10',   color: 'text-sky-400',   icon: Users        },
  transfer: { bg: 'bg-green-500/10', color: 'text-green-400', icon: ArrowUpRight  },
  flag:     { bg: 'bg-red-500/10',   color: 'text-red-400',   icon: AlertTriangle },
  fund:     { bg: 'bg-amber-500/10', color: 'text-amber-400', icon: DollarSign   },
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [data] = useState(MOCK);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-white text-2xl font-display font-bold">{t('admin.dashboard')}</h1>
        <p className="text-banking-muted text-sm mt-1">Platform overview — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('admin.totalUsers')}      value={data.totalUsers.toLocaleString()}           sub={`▲ ${data.newUsersWeek} this week`}     subColor="text-banking-success" icon={Users}         iconBg="bg-sky-500/10"    iconColor="text-sky-400"   />
        <StatCard label={t('admin.totalDeposits')}   value={`$${(data.totalDeposits/1e6).toFixed(1)}M`} sub={`▲ ${data.depositsChange}% MoM`}         subColor="text-banking-success" icon={DollarSign}    iconBg="bg-green-500/10"  iconColor="text-green-400" />
        <StatCard label={t('admin.activeAccounts')}  value={data.activeAccounts.toLocaleString()}       sub={`● ${data.activeRate}% of all accounts`} subColor="text-amber-400"       icon={Activity}      iconBg="bg-amber-500/10"  iconColor="text-amber-400" />
        <StatCard label="Flagged Activity"           value={data.flagged}                               sub="● Needs review"                          subColor="text-banking-danger"  icon={AlertTriangle} iconBg="bg-red-500/10"    iconColor="text-red-400"   />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Registrations */}
        <div className="lg:col-span-1 bg-banking-card rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-medium mb-4">New Registrations</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.registrationData}>
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="users" stroke="#38bdf8" strokeWidth={2} fill="url(#regGrad)" name="Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Volume */}
        <div className="lg:col-span-1 bg-banking-card rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-medium mb-4">Transaction Volume</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.volumeData}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1e6).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="volume" stroke="#22c55e" strokeWidth={2} fill="url(#volGrad)" name="Volume" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div className="lg:col-span-1 bg-banking-card rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-medium mb-2">Account Status</h2>
          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie data={data.accountStatus} cx={75} cy={75} innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                {data.accountStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
            </PieChart>
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            {data.accountStatus.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-banking-muted">
                  <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="text-white font-medium">{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-banking-card rounded-2xl border border-white/5">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-medium">Recent Activity</h2>
        </div>
        <div className="divide-y divide-white/5">
          {data.recentActivity.map(item => {
            const cfg = ACTIVITY_ICON[item.type];
            const Icon = cfg.icon;
            return (
              <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{item.user}</p>
                    <p className="text-banking-muted text-xs">{item.detail}</p>
                  </div>
                </div>
                <span className="text-banking-muted text-xs">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}