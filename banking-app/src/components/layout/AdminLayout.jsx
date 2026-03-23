import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, Activity, DollarSign,
  Settings, LogOut, Menu, X, Shield, Bell,
  ChevronRight, ArrowDownCircle, TrendingUp,
  ArrowDownToLine, MessageCircle,
} from 'lucide-react';
import { useAuth }        from '../../context/AuthContext';
import { useAppSettings } from '../../context/AppContext';
import LanguageSwitcher   from '../common/LanguageSwitcher';
import PlatformLogo       from '../common/PlatformLogo';
import api from '../../services/api';

const NAV_ITEMS = [
  { to: '/admin',              icon: LayoutDashboard, label: 'admin.dashboard',    exact: true },
  { to: '/admin/users',        icon: Users,           label: 'admin.users'                     },
  { to: '/admin/trades',       icon: TrendingUp,      label: 'admin.trades'                    },
  { to: '/admin/deposits',     icon: ArrowDownToLine, label: 'admin.deposits'                  },
  { to: '/admin/chats',        icon: MessageCircle,   label: 'Support Chats',      chat: true  },
  { to: '/admin/transactions', icon: Activity,        label: 'admin.transactions'              },
  { to: '/admin/withdrawals',  icon: ArrowDownCircle, label: 'admin.withdrawals'               },
  { to: '/admin/fund',         icon: DollarSign,      label: 'admin.fund'                      },
  { to: '/admin/settings',     icon: Settings,        label: 'admin.settings'                  },
];

export default function AdminLayout({ children }) {
  const { t }            = useTranslation();
  const { user, logout } = useAuth();
  const { settings }     = useAppSettings();
  const navigate         = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  const handleLogout = () => { logout(); navigate('/login'); };

  const adminInitials = user?.fullName
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  // ── Fetch chat unread count every 15s ─────────────────────────────────
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res   = await api.get('/admin/chats');
        const total = (res.data.chats || []).reduce(
          (s, c) => s + (c.unreadByAdmin || 0), 0
        );
        setChatUnread(total);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Sidebar content ───────────────────────────────────────────────────
  const SidebarContent = () => (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      height:          '100%',
      backgroundColor: '#1e293b',
      borderRight:     '1px solid rgba(255,255,255,0.06)',
      fontFamily:      "'DM Sans', sans-serif",
    }}>

      {/* Logo — driven by AppContext */}
      <div style={{
        padding:      '18px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <PlatformLogo
          size="md"
          iconStyle={{ backgroundColor: '#f59e0b' }}
        />
        <p style={{ color: '#f59e0b', fontSize: 11, marginTop: 4, marginBottom: 0, paddingLeft: 2 }}>
          Admin Panel
        </p>
      </div>

      {/* Admin badge */}
      <div style={{
        margin:          '14px 12px 8px',
        padding:         '12px',
        borderRadius:    12,
        backgroundColor: 'rgba(245,158,11,0.06)',
        border:          '1px solid rgba(245,158,11,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width:           34,
            height:          34,
            borderRadius:    '50%',
            backgroundColor: '#f59e0b',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            color:           '#0f172a',
            fontSize:        12,
            fontWeight:      700,
            flexShrink:      0,
          }}>
            {adminInitials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName}
            </p>
            <p style={{ color: 'rgba(245,158,11,0.7)', fontSize: 11, margin: 0 }}>
              Administrator
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact, chat }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display:         'flex',
              alignItems:      'center',
              gap:             10,
              padding:         '10px 12px',
              borderRadius:    10,
              textDecoration:  'none',
              fontSize:        14,
              fontWeight:      500,
              transition:      'all 0.15s',
              backgroundColor: isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
              color:           isActive ? '#f59e0b'               : '#94a3b8',
              border:          `1px solid ${isActive ? 'rgba(245,158,11,0.2)' : 'transparent'}`,
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} color={isActive ? '#f59e0b' : '#64748b'} />
                <span style={{ flex: 1 }}>
                  {/* Support Chats label is hardcoded, rest uses t() */}
                  {label === 'Support Chats' ? 'Support Chats' : t(label)}
                </span>

                {/* Chat unread badge */}
                {chat && chatUnread > 0 && (
                  <span style={{
                    minWidth:        16,
                    height:          16,
                    borderRadius:    99,
                    backgroundColor: '#ef4444',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    fontSize:        9,
                    fontWeight:      700,
                    color:           '#fff',
                    padding:         '0 4px',
                    flexShrink:      0,
                  }}>
                    {chatUnread > 99 ? '99+' : chatUnread}
                  </span>
                )}

                {isActive && !chat && (
                  <ChevronRight size={14} color="#f59e0b" />
                )}
                {isActive && chat && chatUnread === 0 && (
                  <ChevronRight size={14} color="#f59e0b" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: language + logout */}
      <div style={{
        padding:      '12px 10px 16px',
        borderTop:    '1px solid rgba(255,255,255,0.06)',
        display:      'flex',
        flexDirection: 'column',
        gap:          6,
      }}>
        <div style={{ padding: '4px 8px' }}>
          <LanguageSwitcher />
        </div>
        <button
          onClick={handleLogout}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             10,
            padding:         '10px 12px',
            borderRadius:    10,
            width:           '100%',
            background:      'none',
            border:          '1px solid transparent',
            color:           '#94a3b8',
            fontSize:        14,
            fontWeight:      500,
            cursor:          'pointer',
            fontFamily:      "'DM Sans', sans-serif",
            transition:      'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color           = '#ef4444';
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color           = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={17} />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      display:         'flex',
      height:          '100vh',
      width:           '100vw',
      backgroundColor: '#0f172a',
      overflow:        'hidden',
      fontFamily:      "'DM Sans', sans-serif",
    }}>

      {/* ── Desktop sidebar ── */}
      <div
        className="admin-desktop-sidebar"
        style={{ width: 240, flexShrink: 0, height: '100vh', display: 'none' }}
      >
        <SidebarContent />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)' }}
          />
          <div style={{ position: 'relative', width: 260, height: '100%', zIndex: 1 }}>
            <SidebarContent />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 2, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         '14px 24px',
          borderBottom:    '1px solid rgba(255,255,255,0.06)',
          backgroundColor: '#0f172a',
          flexShrink:      0,
        }}>
          {/* Left side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hamburger — mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="admin-mobile-menu-btn"
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, display: 'none' }}
            >
              <Menu size={22} />
            </button>

            {/* Admin mode badge — desktop */}
            <div
              className="admin-mode-badge"
              style={{ display: 'none', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <Shield size={13} color="#f59e0b" />
              <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>Admin Mode</span>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

            {/* Chat unread shortcut */}
            {chatUnread > 0 && (
              <button
                onClick={() => navigate('/admin/chats')}
                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)' }}
                title={`${chatUnread} unread messages`}
              >
                <MessageCircle size={19} />
                <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 99, backgroundColor: '#ef4444', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 3px' }}>
                  {chatUnread > 99 ? '99+' : chatUnread}
                </span>
              </button>
            )}

            {/* Bell */}
            <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10 }}>
              <Bell size={19} />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b', border: '1.5px solid #0f172a' }} />
            </button>

            {/* Avatar */}
            <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontSize: 12, fontWeight: 700 }}>
              {adminInitials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          {children}
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 1024px) {
          .admin-desktop-sidebar  { display: block !important; }
          .admin-mobile-menu-btn  { display: none  !important; }
          .admin-mode-badge       { display: flex  !important; }
        }
        @media (max-width: 1023px) {
          .admin-desktop-sidebar  { display: none  !important; }
          .admin-mobile-menu-btn  { display: flex  !important; }
          .admin-mode-badge       { display: none  !important; }
        }
      `}</style>
    </div>
  );
}
