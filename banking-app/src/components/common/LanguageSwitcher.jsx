import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronDown } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷" },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸" },
  {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    flag: "🇸🇦",
    rtl: true,
  },
  { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪" },
  { code: "zh", label: "Chinese", nativeLabel: "中文", flag: "🇨🇳" },
  { code: "it", label: "Italian", nativeLabel: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇧🇷" },
];

export default function LanguageSwitcher({ className = "", style }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isMobile = window.innerWidth < 590;

  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language) ||
    LANGUAGES.find((l) => i18n.language?.startsWith(l.code)) ||
    LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-block" }}
      className={className}
    >
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          borderRadius: 10,
          cursor: "pointer",
          backgroundColor: open
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
          color: "#94a3b8",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
        }}
        onMouseLeave={(e) => {
          if (!open)
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
        }}
      >
        <Globe size={14} color="#64748b" />
        <span style={{ fontSize: 15 }}>{currentLang.flag}</span>
        <span style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 500 }}>
          {currentLang.nativeLabel}
        </span>
        <ChevronDown
          size={13}
          color="#64748b"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            zIndex: 999,
            backgroundColor: "#1e293b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: "6px",
            minWidth: 200,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            left: isMobile ? -100 : 0,

            ...(typeof window !== "undefined" &&
            ref.current &&
            ref.current.getBoundingClientRect().bottom + 280 >
              window.innerHeight
              ? { bottom: "calc(100% + 6px)", top: "auto" }
              : {}),

              ...style
          }}
        >
          {/* Section label */}
          <p
            style={{
              fontSize: 10,
              color: "#334155",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              padding: "4px 8px 8px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Select Language
          </p>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
          >
            {LANGUAGES.map((lang) => {
              const isActive = currentLang.code === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleChange(lang.code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 10px",
                    borderRadius: 10,
                    cursor: "pointer",
                    backgroundColor: isActive
                      ? "rgba(56,189,248,0.12)"
                      : "transparent",
                    border: `1px solid ${isActive ? "rgba(56,189,248,0.2)" : "transparent"}`,
                    textAlign: "left",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.1s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>
                    {lang.flag}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        color: isActive ? "#38bdf8" : "#f1f5f9",
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                        margin: 0,
                      }}
                    >
                      {lang.nativeLabel}
                    </p>
                    <p style={{ color: "#64748b", fontSize: 10, margin: 0 }}>
                      {lang.label}
                    </p>
                  </div>
                  {isActive && (
                    <Check
                      size={13}
                      color="#38bdf8"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
