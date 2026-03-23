import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  AlertCircle,
  Shield,
  Landmark,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";

// ── Type config ───────────────────────────────────────────────────────────
const TYPE_CFG = {
  transfer: {
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.12)",
    Icon: ArrowUpRight,
  },
  deposit: {
    color: "#4ade80",
    bg: "rgba(34,197,94,0.12)",
    Icon: ArrowDownLeft,
  },
  withdrawal: {
    color: "#f87171",
    bg: "rgba(239,68,68,0.12)",
    Icon: ArrowUpRight,
  },
  trade: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", Icon: TrendingUp },
  loan: { color: "#c084fc", bg: "rgba(192,132,252,0.12)", Icon: Landmark },
  security: { color: "#f87171", bg: "rgba(239,68,68,0.12)", Icon: Shield },
  system: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", Icon: AlertCircle },
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return Math.floor(seconds / 86400) + "d ago";
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("all"); // all | unread
  const dropdownRef = useRef(null);
  const fetchedRef = useRef(false);

  const isMobile = window.innerWidth < 600

  // ── Fetch notifications ─────────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/user/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch when opening
  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) fetchNotifications(true);
  };

  // ── Actions ──────────────────────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.put(`/user/notifications/${id}/read`);
    } catch {}
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.put("/user/notifications/read-all");
    } catch {}
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    const wasUnread = notifications.find((n) => n._id === id)?.read === false;
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.delete(`/user/notifications/${id}`);
    } catch {}
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await api.delete("/user/notifications");
    } catch {}
  };

  const handleNotifClick = (notif) => {
    if (!notif.read) markRead(notif._id);
    if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  };

  const displayed =
    tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* ── Bell button ── */}
      <button
        onClick={handleOpen}
        style={{
          position: "relative",
          background: open ? "rgba(255,255,255,0.08)" : "none",
          border:
            "1px solid " + (open ? "rgba(255,255,255,0.12)" : "transparent"),
          borderRadius: 10,
          cursor: "pointer",
          color: open ? "#f1f5f9" : "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          transition: "all 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "#f1f5f9";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "#94a3b8";
          }
        }}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              borderRadius: 99,
              backgroundColor: "#ef4444",
              border: "2px solid #0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
              padding: "0 3px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: isMobile ? -30 : 0,
            width: 360,
            maxHeight: 480,
            backgroundColor: "#1e293b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 7px",
                      borderRadius: 20,
                      backgroundColor: "rgba(239,68,68,0.15)",
                      color: "#f87171",
                      fontWeight: 600,
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => fetchNotifications(true)}
                  title="Refresh"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 5,
                    borderRadius: 7,
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <RefreshCw size={13} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 5,
                      borderRadius: 7,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 5,
                      borderRadius: 7,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(239,68,68,0.1)";
                      e.currentTarget.style.color = "#f87171";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#64748b";
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 4,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderRadius: 10,
                padding: 3,
              }}
            >
              {["all", "unread"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: "capitalize",
                    backgroundColor: tab === t ? "#0f172a" : "transparent",
                    color: tab === t ? "#f1f5f9" : "#64748b",
                    transition: "all 0.15s",
                  }}
                >
                  {t === "all"
                    ? `All (${notifications.length})`
                    : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Notification list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div
                style={{
                  padding: "24px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px 18px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: "#0f172a",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: "60%",
                          height: 12,
                          borderRadius: 4,
                          backgroundColor: "#0f172a",
                        }}
                      />
                      <div
                        style={{
                          width: "90%",
                          height: 10,
                          borderRadius: 4,
                          backgroundColor: "#0f172a",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <Bell size={32} color="#334155" style={{ marginBottom: 12 }} />
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                  {tab === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              displayed.map((notif, i) => {
                const cfg = TYPE_CFG[notif.type] || TYPE_CFG.system;
                const Icon = cfg.Icon;
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotifClick(notif)}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "13px 18px",
                      cursor: notif.link ? "pointer" : "default",
                      borderBottom:
                        i < displayed.length - 1
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
                      backgroundColor: notif.read
                        ? "transparent"
                        : "rgba(56,189,248,0.04)",
                      transition: "background 0.15s",
                      alignItems: "flex-start",
                      position: "relative",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = notif.read
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(56,189,248,0.07)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = notif.read
                        ? "transparent"
                        : "rgba(56,189,248,0.04)")
                    }
                  >
                    {/* Unread dot */}
                    {!notif.read && (
                      <div
                        style={{
                          position: "absolute",
                          left: 6,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          backgroundColor: "#38bdf8",
                        }}
                      />
                    )}

                    {/* Icon */}
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
                        marginTop: 1,
                      }}
                    >
                      <Icon size={16} color={cfg.color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <p
                          style={{
                            color: notif.read ? "#94a3b8" : "#f1f5f9",
                            fontSize: 13,
                            fontWeight: notif.read ? 400 : 600,
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          {notif.title}
                        </p>
                        <span
                          style={{
                            color: "#334155",
                            fontSize: 10,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          margin: "3px 0 0",
                          lineHeight: 1.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        display: "flex",
                        gap: 2,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(notif._id);
                          }}
                          title="Mark as read"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: 4,
                            borderRadius: 6,
                            display: "flex",
                            alignItems: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(56,189,248,0.1)";
                            e.currentTarget.style.color = "#38bdf8";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = "#64748b";
                          }}
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteOne(e, notif._id)}
                        title="Delete"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#64748b",
                          cursor: "pointer",
                          padding: 4,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(239,68,68,0.1)";
                          e.currentTarget.style.color = "#f87171";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#64748b";
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "10px 18px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
                textAlign: "center",
              }}
            >
              <button
                onClick={() => {
                  navigate("/history");
                  setOpen(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#38bdf8",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                }}
              >
                View transaction history →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
