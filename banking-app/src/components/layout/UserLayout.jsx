import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Send,
  History,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  ArrowDownCircle,
  TrendingUp,
  Landmark,
  PiggyBank,
  ArrowDownToLine,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppSettings } from "../../context/AppContext";
import LanguageSwitcher from "../common/LanguageSwitcher";
import PlatformLogo from "../common/PlatformLogo";
import NotificationBell from '../common/NotificationBell';
import ChatWidget from '../common/ChatWidget';


const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { to: "/transfer", icon: Send, labelKey: "nav.transfer" },
  { to: "/deposit", icon: ArrowDownToLine, labelKey: "nav.deposit" },
  { to: "/trading", icon: TrendingUp, labelKey: "nav.trading" },
  { to: "/loans", icon: Landmark, labelKey: "nav.loans" },
  { to: "/investment", icon: PiggyBank, labelKey: "nav.investment" },
  { to: "/withdrawal", icon: ArrowDownCircle, labelKey: "nav.withdrawal" },
  { to: "/history", icon: History, labelKey: "nav.history" },
  { to: "/profile", icon: User, labelKey: "nav.profile" },
];

export default function UserLayout({ children }) {
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const SidebarContent = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#1e293b",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Logo — driven by AppContext ── */}
      <div
        style={{
          padding: "20px 20px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <PlatformLogo size="md" />
      </div>

      {/* ── User badge ── */}
      <div
        style={{
          margin: "14px 12px 8px",
          padding: "12px",
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              backgroundColor: "#38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f172a",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                margin: 0,
              }}
            >
              {user?.fullName}
            </p>
            <p
              style={{
                color: "#64748b",
                fontSize: 11,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                margin: 0,
              }}
            >
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav
        style={{
          flex: 1,
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              transition: "all 0.15s",
              backgroundColor: isActive
                ? "rgba(56,189,248,0.1)"
                : "transparent",
              color: isActive ? "#38bdf8" : "#94a3b8",
              border: `1px solid ${isActive ? "rgba(56,189,248,0.2)" : "transparent"}`,
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} color={isActive ? "#38bdf8" : "#64748b"} />
                <span style={{ flex: 1 }}>{t(labelKey)}</span>
                {isActive && <ChevronRight size={14} color="#38bdf8" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom: language + logout ── */}
      <div
        style={{
          padding: "12px 10px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ padding: "4px 8px", }}>
          <LanguageSwitcher  style={{left: 5 }}/>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            width: "100%",
            background: "none",
            border: "1px solid transparent",
            color: "#94a3b8",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#94a3b8";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <LogOut size={17} />
          {t("nav.logout")}
        </button>

      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#0f172a",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Desktop sidebar ── */}
      <div
        style={{ width: 240, flexShrink: 0, height: "100vh", display: "none" }}
        className="desktop-sidebar"
      >
        <SidebarContent />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}
        >
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
          />
          <div
            style={{
              position: "relative",
              width: 260,
              height: "100%",
              zIndex: 1,
            }}
          >
            <SidebarContent />
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 2,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              padding: 6,
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* ── Main area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "#0f172a",
            flexShrink: 0,
          }}
        >
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn"
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: 4,
              display: "none",
            }}
          >
            <Menu size={22} />
          </button>

          {/* Mobile: show platform name in topbar */}
          <div className="mobile-topbar-logo" style={{ display: "none" }}>
            <PlatformLogo size="sm" />
          </div>

          {/* Desktop spacer */}
          <div className="desktop-spacer" />

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

            <NotificationBell />

            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f172a",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {initials}
            </div>

          </div>

        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
          {children}
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar    { display: block !important; }
          .mobile-menu-btn    { display: none  !important; }
          .desktop-spacer     { display: block !important; }
          .mobile-topbar-logo { display: none  !important; }
        }
        @media (max-width: 1023px) {
          .desktop-sidebar    { display: none  !important; }
          .mobile-menu-btn    { display: flex  !important; }
          .desktop-spacer     { display: none  !important; }
          .mobile-topbar-logo { display: flex  !important; }
        }
      `}</style>

      <ChatWidget/>
      
    </div>
  );
}
