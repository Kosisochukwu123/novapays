import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Activity,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  Shield,
  Bell,
  ChevronRight,
  ArrowDownCircle,
  TrendingUp,
  ArrowDownToLine,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../common/LanguageSwitcher";

const NAV_ITEMS = [
  {
    to: "/admin",
    icon: LayoutDashboard,
    label: "admin.dashboard",
    exact: true,
  },
  { to: "/admin/users", icon: Users, label: "admin.users" },
  { to: "/admin/trades", icon: TrendingUp, label: "admin.trades" },
    { to: '/admin/deposits',     icon: ArrowDownToLine, label: 'admin.deposits'                  },


  { to: "/admin/transactions", icon: Activity, label: "admin.transactions" },
  { to: "/admin/fund", icon: DollarSign, label: "admin.fund" },
  { to: "/admin/settings", icon: Settings, label: "admin.settings" },
  {
    to: "/admin/withdrawals",
    icon: ArrowDownCircle,
    label: "admin.withdrawals",
  },
];

export default function AdminLayout({ children }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-banking-card border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
          <Shield size={18} color="#0f172a" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">
            NovaPay
          </p>
          <p className="text-amber-400 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Admin badge */}
      <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-banking-dark text-xs font-bold flex-shrink-0">
            {user?.fullName
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "AD"}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.fullName}
            </p>
            <p className="text-amber-400/70 text-xs">Administrator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
               ${
                 isActive
                   ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                   : "text-banking-muted hover:text-white hover:bg-white/5 border border-transparent"
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={
                    isActive
                      ? "text-amber-400"
                      : "text-banking-muted group-hover:text-white"
                  }
                />
                {t(label)}
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-amber-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex flex-col gap-2 border-t border-white/5 pt-3">
        <LanguageSwitcher />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-banking-muted hover:text-banking-danger hover:bg-banking-danger/5 transition-all border border-transparent w-full"
        >
          <LogOut size={17} />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-banking-dark overflow-hidden">
      <div className="hidden lg:flex lg:w-60 lg:flex-shrink-0">
        <div className="w-full">
          <Sidebar />
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 flex flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-banking-muted hover:text-white"
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <Shield size={14} className="text-amber-400" />
            <span className="text-amber-400/80 text-xs font-medium">
              Admin Mode
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-banking-muted hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-banking-dark text-xs font-bold">
              {user?.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "AD"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
