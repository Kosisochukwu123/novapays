import LanguageSwitcher from "../common/LanguageSwitcher";
import PlatformLogo from "../common/PlatformLogo";
import { useAppSettings } from "../../context/AppContext";

export default function AuthLayout({ children }) {
  const { settings } = useAppSettings();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        backgroundColor: "#0f172a",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Left branding panel (hidden on mobile) ── */}
      <div
        style={{
          display: "none",
          width: "50%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          backgroundColor: "#0f172a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
        className="lg-panel"
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              "linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "33%",
            width: 256,
            height: 256,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(56,189,248,0.2), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "25%",
            right: "25%",
            width: 192,
            height: 192,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(129,140,248,0.15), transparent)",
          }}
        />

        {/* Logo — uses PlatformLogo so it updates when admin changes name/logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <PlatformLogo size="lg" />
        </div>

        {/* Center hero */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              marginBottom: 16,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Banking made
            <br />
            <span style={{ color: "#38bdf8" }}>brilliantly simple</span>
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 18,
              lineHeight: 1.7,
              maxWidth: 360,
            }}
          >
            Manage your finances, transfer money, and track your spending — all
            in one secure place.
          </p>

          {/* Stats */}
          <div
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {[
              { value: "2M+", label: "Customers" },
              { value: "$8B+", label: "Transferred" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label}>
                <p style={{ fontSize: 28, fontWeight: 700, color: "#ffffff" }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            position: "relative",
            zIndex: 1,
            color: "#334155",
            fontSize: 13,
          }}
        >
          © {new Date().getFullYear()} {settings.platformName || "NovaPay"}. All
          rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 24px",
          position: "relative",
          backgroundColor: "#0f172a",
        }}
      >
        {/* Language switcher top-right */}
        <div style={{ position: "absolute", top: 24, right: 24 }}>
          <LanguageSwitcher />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Mobile logo — uses PlatformLogo */}
          <div style={{ marginBottom: 32 }}>
            <PlatformLogo size="md" />
          </div>

          {children}
        </div>
      </div>

      {/* Responsive: show left panel on large screens */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
