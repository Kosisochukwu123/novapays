import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Eye,
  EyeOff,
  Send,
  ArrowDownLeft,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import UserLayout from "../../components/layout/UserLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// ── Chart tooltip ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: "#0f172a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 12,
      }}
    >
      <p style={{ color: "#64748b", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#38bdf8", fontWeight: 700 }}>
        $
        {payload[0]?.value?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}
      </p>
    </div>
  );
};

// ── Build chart data from transactions ────────────────────────────────────
const buildChartData = (transactions, userId, period) => {
  const now = new Date();
  const uid = userId;
  const points = [];

  if (period === "1D") {
    for (let h = 0; h < 24; h += 4) {
      const label = `${h.toString().padStart(2, "0")}:00`;
      const txs = transactions.filter((tx) => {
        const d = new Date(tx.createdAt);
        return (
          d.toDateString() === now.toDateString() &&
          d.getHours() >= h &&
          d.getHours() < h + 4
        );
      });
      const val = txs.reduce(
        (s, tx) =>
          s + (tx.toUser?._id === uid || tx.toUser === uid ? tx.amount : 0),
        0,
      );
      points.push({ label, value: val });
    }
  } else if (period === "1W") {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(now.getDate() - d);
      const label = date.toLocaleDateString("en-US", { weekday: "short" });
      const txs = transactions.filter(
        (tx) => new Date(tx.createdAt).toDateString() === date.toDateString(),
      );
      const val = txs.reduce(
        (s, tx) =>
          s + (tx.toUser?._id === uid || tx.toUser === uid ? tx.amount : 0),
        0,
      );
      points.push({ label, value: val });
    }
  } else if (period === "1M") {
    for (let d = 29; d >= 0; d -= 5) {
      const date = new Date(now);
      date.setDate(now.getDate() - d);
      const label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const cutoff = new Date(date);
      cutoff.setDate(date.getDate() + 5);
      const txs = transactions.filter((tx) => {
        const cd = new Date(tx.createdAt);
        return cd >= date && cd < cutoff;
      });
      const val = txs.reduce(
        (s, tx) =>
          s + (tx.toUser?._id === uid || tx.toUser === uid ? tx.amount : 0),
        0,
      );
      points.push({ label, value: val });
    }
  } else {
    const months = period === "3M" ? 3 : period === "1Y" ? 12 : 6;
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleDateString("en-US", { month: "short" });
      const txs = transactions.filter((tx) => {
        const d = new Date(tx.createdAt);
        return (
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      });
      const val = txs.reduce(
        (s, tx) =>
          s + (tx.toUser?._id === uid || tx.toUser === uid ? tx.amount : 0),
        0,
      );
      points.push({ label, value: val });
    }
  }

  return points;
};

const PERIODS = ["1D", "1W", "1M", "3M", "1Y", "All"];

const TX_CONFIG = {
  transfer: {
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.12)",
    label: "Transfer",
  },
  income: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Income" },
  deposit: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Deposit" },
  fund: { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", label: "Fund" },
  withdrawal: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    label: "Withdrawal",
  },
  debit: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Debit" },
  purchase: {
    color: "#c084fc",
    bg: "rgba(192,132,252,0.12)",
    label: "Purchase",
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [recentTx, setRecentTx] = useState([]);
  const [allTx, setAllTx] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState("1W");
  const [balanceVisible, setBalanceVisible] = useState(() => {
    const saved = localStorage.getItem("balanceVisible");
    return saved === null ? true : JSON.parse(saved);
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  const uid = user?._id || user?.id;

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashRes, txRes] = await Promise.all([
        api.get("/user/dashboard"),
        api.get("/user/transactions", { params: { limit: 100 } }),
      ]);
      const dash = dashRes.data;
      const txns = txRes.data.transactions || [];
      setBalance(dash.balance ?? 0);
      setIncome(dash.income ?? 0);
      setExpenses(dash.expenses ?? 0);
      setRecentTx(txns.slice(0, 6));
      setAllTx(txns);
      setChartData(buildChartData(txns, uid, period));
      setLastUpdated(new Date());
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Rebuild chart when period changes
  useEffect(() => {
    if (allTx.length > 0 || !loading) {
      setChartData(buildChartData(allTx, uid, period));
    }
  }, [period, allTx, uid]);

  // Auto-refresh every 60s
  useEffect(() => {
    const iv = setInterval(() => fetchDashboard(), 60000);
    return () => clearInterval(iv);
  }, [fetchDashboard]);

  // handles saving balance visibility preference to localStorage
  useEffect(() => {
    localStorage.setItem("balanceVisible", JSON.stringify(balanceVisible));
  }, [balanceVisible]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greeting_morning");
    if (h < 17) return t("dashboard.greeting_afternoon");
    return t("dashboard.greeting_evening");
  };

  const firstName = user?.fullName?.split(" ")[0] || "there";

  const chartColor = "#38bdf8";
  const chartUp =
    chartData.length > 1 &&
    chartData[chartData.length - 1]?.value >= chartData[0]?.value;

  // Quick action buttons
  const ACTIONS = [
    {
      label: "Transfer",
      Icon: Send,
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.15)",
      path: "/transfer",
    },
    {
      label: "Deposit",
      Icon: ArrowDownLeft,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.15)",
      path: "/deposit",
    },
    {
      label: "Withdraw",
      Icon: ArrowUpRight,
      color: "#f87171",
      bg: "rgba(239,68,68,0.15)",
      path: "/withdrawal",
    },
    {
      label: "Trade",
      Icon: TrendingUp,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
      path: "/trading",
    },
  ];

  if (loading)
    return (
      <UserLayout>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          {/* Skeleton */}
          <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
            <div
              style={{
                width: 140,
                height: 14,
                borderRadius: 6,
                backgroundColor: "#1e293b",
                margin: "0 auto 16px",
              }}
            />
            <div
              style={{
                width: 240,
                height: 48,
                borderRadius: 8,
                backgroundColor: "#1e293b",
                margin: "0 auto 20px",
              }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    backgroundColor: "#1e293b",
                  }}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              height: 200,
              borderRadius: 16,
              backgroundColor: "#1e293b",
              marginBottom: 16,
            }}
          />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 60,
                borderRadius: 12,
                backgroundColor: "#1e293b",
                marginBottom: 10,
              }}
            />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        </div>
      </UserLayout>
    );

  return (
    <UserLayout>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          maxWidth: 680,
          margin: "0 auto",
          color: "#f1f5f9",
        }}
      >
        {/* ── Hero balance section ── */}
        <div style={{ textAlign: "center", padding: "8px 0 28px" }}>
          {/* Greeting + avatar row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div style={{ textAlign: "left" }}>
              <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
                Welcome
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {firstName}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {lastUpdated && (
                <p style={{ color: "#334155", fontSize: 11 }}>
                  {lastUpdated.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <button
                onClick={fetchDashboard}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                <RefreshCw size={14} />
              </button>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0f172a",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {user?.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "U"}
              </div>
            </div>
          </div>

          {/* Balance label */}
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 8 }}>
            Your Active Balance
          </p>

          {/* Balance amount */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <h1
              style={{
                color: "#fff",
                fontSize: 42,
                fontWeight: 800,
                fontFamily: "'Playfair Display', serif",
                margin: 0,
                letterSpacing: "-1px",
              }}
            >
              {balanceVisible
                ? `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                : "$ ••••••••"}
            </h1>
            <button
              onClick={() => setBalanceVisible((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                padding: 4,
              }}
            >
              {balanceVisible ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* Income / Expense summary pills */}
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 14px",
                borderRadius: 20,
                backgroundColor: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              <TrendingUp size={13} color="#22c55e" />
              <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>
                {balanceVisible
                  ? `+$${income.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  : "+$ ••••••"}{" "}
              </span>
              <span style={{ color: "#334155", fontSize: 11 }}>In</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 14px",
                borderRadius: 20,
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <TrendingDown size={13} color="#f87171" />
              <span style={{ color: "#f87171", fontSize: 13, fontWeight: 600 }}>
                {balanceVisible
                  ? `-$${expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  : "-$ ••••••"}
              </span>
              <span style={{ color: "#334155", fontSize: 11 }}>Out</span>
            </div>
          </div>

          {/* Quick actions */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "16px 8px",
                  borderRadius: 18,
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${action.bg}`;
                  e.currentTarget.style.borderColor = `${action.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1e293b";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: action.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <action.Icon size={20} color={action.color} />
                </div>
                <span
                  style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                >
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Spending Chart ── */}
        <div
          style={{
            backgroundColor: "#1e293b",
            borderRadius: 20,
            padding: "20px",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 16,
          }}
        >
          {/* Chart header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <div>
              <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
                Spending
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 700,
                  margin: "4px 0 0",
                }}
              >
                {balanceVisible
                  ? `$${expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  : "$ ••••••"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {chartUp ? (
                <TrendingUp size={14} color="#22c55e" />
              ) : (
                <TrendingDown size={14} color="#f87171" />
              )}
              <span
                style={{
                  fontSize: 12,
                  color: chartUp ? "#22c55e" : "#f87171",
                  fontWeight: 600,
                }}
              >
                {chartUp ? "Up" : "Down"}
              </span>
            </div>
          </div>

          {/* Period selector */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 16,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              padding: 3,
            }}
          >
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: period === p ? "#38bdf8" : "transparent",
                  color: period === p ? "#0f172a" : "#64748b",
                  transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#475569", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#475569", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v > 0 ? `$${(v / 1000).toFixed(0)}k` : "0"
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2.5}
                fill="url(#spendGrad)"
                dot={false}
                activeDot={{ r: 5, fill: chartColor }}
                name="Amount"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Savings summary cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            {
              label: "Total Income",
              value: income,
              color: "#22c55e",
              bg: "rgba(34,197,94,0.08)",
              border: "rgba(34,197,94,0.15)",
              Icon: ArrowDownRight,
              path: "/history",
            },
            {
              label: "Total Expenses",
              value: expenses,
              color: "#f87171",
              bg: "rgba(239,68,68,0.08)",
              border: "rgba(239,68,68,0.15)",
              Icon: ArrowUpRight,
              path: "/history",
            },
          ].map((item) => (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                backgroundColor: "#1e293b",
                borderRadius: 18,
                padding: "18px 20px",
                border: `1px solid rgba(255,255,255,0.06)`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = item.bg;
                e.currentTarget.style.borderColor = item.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1e293b";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${item.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <item.Icon size={17} color={item.color} />
                </div>
                <ChevronRight size={14} color="#334155" />
              </div>
              <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 4px" }}>
                {item.label}
              </p>
              <p
                style={{
                  color: item.color,
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {balanceVisible
                  ? `$${item.value.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}`
                  : "$ ••••••"}
              </p>
            </div>
          ))}
        </div>

        {/* ── Recent Transactions ── */}
        <div
          style={{
            backgroundColor: "#1e293b",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div>
              <p
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  margin: 0,
                }}
              >
                Recent Transactions
              </p>
              <p style={{ color: "#64748b", fontSize: 12, margin: "3px 0 0" }}>
                Show your transaction history
              </p>
            </div>
            <button
              onClick={() => navigate("/history")}
              style={{
                background: "none",
                border: "none",
                color: "#38bdf8",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Details <ChevronRight size={14} />
            </button>
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              gap: 0,
              padding: "12px 20px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            {["All"].map((tab, idx) => {
              const isActive = idx === 0;
              return (
                <button
                  key={tab}
                  style={{
                    padding: "8px 18px",
                    border: "none",
                    borderBottom: isActive
                      ? "2px solid #38bdf8"
                      : "2px solid transparent",
                    backgroundColor: "transparent",
                    color: isActive ? "#38bdf8" : "#64748b",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Transaction rows */}
          {recentTx.length === 0 ? (
            <div
              style={{
                padding: "48px 20px",
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
              const isIncoming = tx.toUser?._id === uid || tx.toUser === uid;
              const displayAmt = isIncoming ? tx.amount : -tx.amount;
              const description =
                tx.description ||
                (isIncoming
                  ? `From ${tx.fromUser?.fullName || "someone"}`
                  : `To ${tx.toUser?.fullName || "someone"}`);
              const initials =
                description.split(" ").slice(-1)[0]?.charAt(0)?.toUpperCase() ||
                "J";
              const dateStr = new Date(tx.createdAt).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
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
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    {/* Avatar with initials */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        backgroundColor: cfg.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          color: cfg.color,
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {initials}
                      </span>
                    </div>
                    <div>
                      <p
                        style={{
                          color: "#f1f5f9",
                          fontSize: 14,
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        {description}
                      </p>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: 11,
                          margin: "3px 0 0",
                        }}
                      >
                        {cfg.label} · {dateStr}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: displayAmt >= 0 ? "#22c55e" : "#f87171",
                        margin: 0,
                      }}
                    >
                      {displayAmt >= 0 ? "+" : ""}$
                      {Math.abs(displayAmt).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 20,
                        backgroundColor:
                          tx.status === "completed"
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(245,158,11,0.1)",
                        color:
                          tx.status === "completed" ? "#4ade80" : "#fbbf24",
                        marginTop: 3,
                        display: "inline-block",
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

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </UserLayout>
  );
}
