import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  Send,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import UserLayout from "../../components/layout/UserLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const TX_CONFIG = {
  transfer: {
    bg: "rgba(14,165,233,0.12)",
    color: "#38bdf8",
    Icon: ArrowUpRight,
  },
  income: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", Icon: ArrowDownLeft },
  purchase: {
    bg: "rgba(239,68,68,0.12)",
    color: "#ef4444",
    Icon: ShoppingCart,
  },
  deposit: {
    bg: "rgba(34,197,94,0.12)",
    color: "#22c55e",
    Icon: ArrowDownLeft,
  },
  fund: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", Icon: ArrowDownLeft },
  debit: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", Icon: ArrowUpRight },
  withdrawal: {
    bg: "rgba(239,68,68,0.12)",
    color: "#ef4444",
    Icon: ArrowUpRight,
  },
};

const isMobile = window.innerWidth < 640;

const card = {
  backgroundColor: "#1e293b",
  borderRadius: 16,
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.06)",
  display: isMobile ? "flex" : "block",
  flexDirection: isMobile ? "column" : "row",
  // border: "10px solid rgba(255,255,255,0.06)",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13,
      }}
    >
      <p style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// Build last 6 months chart labels
const buildChartMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("en-US", { month: "short" }));
  }
  return months;
};

// Turn raw transactions into chart data
const buildChartData = (transactions, userId) => {
  const months = buildChartMonths();
  const now = new Date();

  return months.map((month, i) => {
    const targetMonth = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - i),
      1,
    ).getMonth();
    const targetYear = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - i),
      1,
    ).getFullYear();

    const monthTxs = transactions.filter((tx) => {
      const d = new Date(tx.createdAt);
      return (
        d.getMonth() === targetMonth &&
        d.getFullYear() === targetYear &&
        tx.status === "completed"
      );
    });

    const income = monthTxs
      .filter((tx) => tx.toUser?._id === userId || tx.toUser === userId)
      .reduce((s, tx) => s + tx.amount, 0);

    const expenses = monthTxs
      .filter((tx) => tx.fromUser?._id === userId || tx.fromUser === userId)
      .reduce((s, tx) => s + tx.amount, 0);

    return { month, income, expenses };
  });
};

const buildBalanceHistory = (transactions, currentBalance, userId) => {
  const months = buildChartMonths();
  const now = new Date();
  let runningBalance = currentBalance;
  const result = [];

  for (let i = 0; i < 6; i++) {
    const targetMonth = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1,
    ).getMonth();
    const targetYear = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1,
    ).getFullYear();

    const monthTxs = transactions.filter((tx) => {
      const d = new Date(tx.createdAt);
      return (
        d.getMonth() === targetMonth &&
        d.getFullYear() === targetYear &&
        tx.status === "completed"
      );
    });

    result.unshift({
      month: months[5 - i],
      balance: Math.max(0, runningBalance),
    });

    const income = monthTxs
      .filter((tx) => tx.toUser?._id === userId || tx.toUser === userId)
      .reduce((s, tx) => s + tx.amount, 0);
    const expenses = monthTxs
      .filter((tx) => tx.fromUser?._id === userId || tx.fromUser === userId)
      .reduce((s, tx) => s + tx.amount, 0);
    runningBalance = runningBalance - income + expenses;
  }

  return result;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [recentTx, setRecentTx] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { t } = useTranslation();
  const isMobile = window.innerWidth < 640;

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashRes, txRes] = await Promise.all([
        api.get("/user/dashboard"),
        api.get("/user/transactions", { params: { limit: 50 } }),
      ]);

      const dash = dashRes.data;
      const allTx = txRes.data.transactions || [];

      setBalance(dash.balance ?? 0);
      setIncome(dash.income ?? 0);
      setExpenses(dash.expenses ?? 0);
      setRecentTx(allTx.slice(0, 5));

      const uid = user?._id || user?.id;
      setChartData(buildChartData(allTx, uid));
      setBalanceHistory(buildBalanceHistory(allTx, dash.balance ?? 0, uid));
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greeting_morning");
    if (h < 17) return t("dashboard.greeting_afternoon");
    return t("dashboard.greeting_evening");
  };

  const balanceChange = 0;
  const incomeChange = 0;
  const expensesChange = 0;

  const stats = [
    {
      label: t("dashboard.balance"),
      value: balance,
      change: balanceChange,
      icon: Wallet,
      iconBg: "rgba(14,165,233,0.12)",
      iconColor: "#38bdf8",
      sub: t("dashboard.currentBalance"),
    },
    {
      label: t("dashboard.income"),
      value: income,
      change: incomeChange,
      icon: TrendingUp,
      iconBg: "rgba(34,197,94,0.12)",
      iconColor: "#22c55e",
      sub: t("dashboard.allTimeReceived"),
    },
    {
      label: t("dashboard.expenses"),
      value: expenses,
      change: expensesChange,
      icon: TrendingDown,
      iconBg: "rgba(239,68,68,0.12)",
      iconColor: "#ef4444",
      sub: t("dashboard.allTimeSent"),
    },
  ];

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <UserLayout>
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {/* Header skeleton */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div>
              <div
                style={{
                  width: 240,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "#1e293b",
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: 180,
                  height: 16,
                  borderRadius: 6,
                  backgroundColor: "#1e293b",
                }}
              />
            </div>
            <div
              style={{
                width: 130,
                height: 42,
                borderRadius: 12,
                backgroundColor: "#1e293b",
              }}
            />
          </div>

          {/* Stat cards skeleton */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ ...card }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 14,
                      borderRadius: 4,
                      backgroundColor: "#0f172a",
                    }}
                  />
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: "#0f172a",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 120,
                    height: 28,
                    borderRadius: 6,
                    backgroundColor: "#0f172a",
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    width: 100,
                    height: 12,
                    borderRadius: 4,
                    backgroundColor: "#0f172a",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Chart skeleton */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 2fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ ...card, height: 260 }}>
              <div
                style={{
                  width: 140,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: "#0f172a",
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 8,
                  backgroundColor: "#0f172a",
                }}
              />
            </div>
            <div style={{ ...card, height: 260 }}>
              <div
                style={{
                  width: 120,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: "#0f172a",
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 8,
                  backgroundColor: "#0f172a",
                }}
              />
            </div>
          </div>

          <div style={{ textAlign: "center", padding: 20 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#64748b",
                fontSize: 13,
              }}
            >
              <RefreshCw
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Loading your dashboard...
            </div>
          </div>

          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </UserLayout>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <UserLayout>
        <div
          style={{
            maxWidth: 400,
            margin: "60px auto",
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ ...card, padding: 36 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <p
              style={{
                color: "#f1f5f9",
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              Failed to load dashboard
            </p>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
              {error}
            </p>
            <button
              onClick={fetchDashboard}
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "none",
                backgroundColor: "#38bdf8",
                color: "#0f172a",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────
  return (
    <UserLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#fff",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              {greeting()},{" "}
              <span style={{ color: "#38bdf8" }}>
                {user?.fullName?.split(" ")[0]}
              </span>{" "}
              👋
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {lastUpdated && (
              <p
                style={{
                  color: "#334155",
                  fontSize: 11,
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <RefreshCw size={10} />
                Updated
                {lastUpdated.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <button
            onClick={() => navigate("/transfer")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#38bdf8",
              color: "#0f172a",
              fontWeight: 700,
              fontSize: "10px",
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              marginTop: isMobile ? 16 : 0,
            }}
          >
            <Send size={15} /> {t("dashboard.sendMoney")}
          </button>
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",

            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>
                    {s.label}
                  </span>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: s.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={17} color={s.iconColor} />
                  </div>
                </div>
                <p style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>
                  $
                  {s.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p style={{ fontSize: 12, marginTop: 6, color: s.subColor }}>
                  {s.sub}
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "3fr 2fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Balance Area Chart */}
          <div style={card}>
            <p style={{ fontWeight: 600, color: "#fff", marginBottom: 16 }}>
              {t("dashboard.balanceOverview")}
            </p>

            {balanceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                <AreaChart data={balanceHistory}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: isMobile ? 10 : 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fill: "#64748b", fontSize: isMobile ? 10 : 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#balGrad)"
                    name="Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: isMobile ? 180 : 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#334155",
                  fontSize: 13,
                  textAlign: "center",
                  padding: isMobile ? "0 10px" : 0,
                }}
              >
                {t("dashboard.noBalanceHistory")}
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div style={card}>
            <p style={{ fontWeight: 600, color: "#fff", marginBottom: 6 }}>
              {t("dashboard.incomeVsExpenses")}
            </p>

            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 12,
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: "#22c55e",
                  }}
                />
                Income
              </span>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: "#38bdf8",
                  }}
                />
                Expenses
              </span>
            </div>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 170 : 185}>
                <BarChart
                  data={chartData}
                  barSize={isMobile ? 6 : 8}
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: isMobile ? 10 : 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fill: "#64748b", fontSize: isMobile ? 10 : 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="income"
                    fill="#22c55e"
                    radius={[3, 3, 0, 0]}
                    name="Income"
                  />

                  <Bar
                    dataKey="expenses"
                    fill="#38bdf8"
                    radius={[3, 3, 0, 0]}
                    name="Expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: isMobile ? 170 : 185,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#334155",
                  fontSize: 13,
                  textAlign: "center",
                  padding: isMobile ? "0 10px" : 0,
                }}
              >
                {t("dashboard.noTransactions")}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ ...card, padding: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p style={{ fontWeight: 600, color: "#fff" }}>
              {t("dashboard.recentTransactions")}
            </p>
            <button
              onClick={() => navigate("/history")}
              style={{
                background: "none",
                border: "none",
                color: "#38bdf8",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t("dashboard.viewAll")}
            </button>
          </div>

          {recentTx.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#334155",
                fontSize: 13,
              }}
            >
              {t("dashboard.noTransactions")}
            </div>
          ) : (
            recentTx.map((tx, i) => {
              const type = tx.type || "transfer";
              const cfg = TX_CONFIG[type] || TX_CONFIG.transfer;
              const Icon = cfg.Icon;

              const isIncoming =
                tx.toUser?._id === (user?._id || user?.id) ||
                tx.toUser === (user?._id || user?.id);
              const displayAmount = isIncoming ? tx.amount : -tx.amount;

              const description =
                tx.description ||
                (isIncoming
                  ? `Received from ${tx.fromUser?.fullName || "someone"}`
                  : `Sent to ${tx.toUser?.fullName || "someone"}`);

              const dateStr = new Date(tx.createdAt).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );

              return (
                <div
                  key={tx._id || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    borderBottom:
                      i < recentTx.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: cfg.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color={cfg.color} />
                    </div>
                    <div>
                      <p
                        style={{
                          color: "#f1f5f9",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {description}
                      </p>
                      <p
                        style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}
                      >
                        {dateStr}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: displayAmount >= 0 ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {displayAmount >= 0 ? "+" : ""}$
                      {Math.abs(displayAmount).toFixed(2)}
                    </p>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 20,
                        backgroundColor:
                          tx.status === "completed"
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(245,158,11,0.1)",
                        color:
                          tx.status === "completed" ? "#4ade80" : "#fbbf24",
                      }}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </UserLayout>
  );
}
