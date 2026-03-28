import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Save,
  CheckCircle2,
  Globe,
  DollarSign,
  Shield,
  Bell,
  RefreshCw,
  AlertCircle,
  Upload,
  X,
  Eye,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { useAppSettings } from "../../context/AppContext";
import api from "../../services/api";

// ── Shared styles ─────────────────────────────────────────────────────────
const card = {
  backgroundColor: "#1e293b",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.06)",
  padding: 24,
  marginBottom: 16,
};

const inputStyle = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "9px 12px",
  color: "#f1f5f9",
  fontSize: 14,
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
};

const Section = ({ icon: Icon, title, children }) => (
  <div style={card}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: "rgba(245,158,11,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color="#f59e0b" />
      </div>
      <h2 style={{ color: "#fff", fontWeight: 600, fontSize: 15, margin: 0 }}>
        {title}
      </h2>
    </div>
    <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

const Field = ({ label, hint, children, last = false }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: "14px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)",
      flexWrap: "wrap",
    }}
  >
    <div style={{ flex: 1, minWidth: 200 }}>
      <p style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 500, margin: 0 }}>
        {label}
      </p>
      {hint && (
        <p
          style={{
            color: "#64748b",
            fontSize: 12,
            marginTop: 3,
            marginBottom: 0,
          }}
        >
          {hint}
        </p>
      )}
    </div>
    <div style={{ width: 220, flexShrink: 0 }}>{children}</div>
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      position: "relative",
      width: 44,
      height: 24,
      borderRadius: 99,
      border: "none",
      cursor: "pointer",
      backgroundColor: value ? "#f59e0b" : "rgba(255,255,255,0.12)",
      transition: "background-color 0.2s",
      flexShrink: 0,
    }}
  >
    <span
      style={{
        position: "absolute",
        top: 3,
        left: value ? 23 : 3,
        width: 18,
        height: 18,
        borderRadius: "50%",
        backgroundColor: "#fff",
        transition: "left 0.2s",
      }}
    />
  </button>
);

// ── Branding section ──────────────────────────────────────────────────────
const BrandingSection = ({ settings, update }) => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(settings.logoUrl || "");
  const [logoText, setLogoText] = useState(
    settings.logoText ||
      settings.platformName?.slice(0, 2).toUpperCase() ||
      "NP",
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setPreview(base64);
      update("logoUrl", base64);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setPreview("");
    update("logoUrl", "");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    update("platformName", val);
    if (!settings.logoUrl) {
      const newText = val.slice(0, 2).toUpperCase();
      setLogoText(newText);
      update("logoText", newText);
    }
  };

  const handleLogoTextChange = (e) => {
    const val = e.target.value.slice(0, 3).toUpperCase();
    setLogoText(val);
    update("logoText", val);
  };

  // Live preview logo
  const PreviewLogo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {preview ? (
        <img
          src={preview}
          alt="logo"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: "#38bdf8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0f172a",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {logoText || "NP"}
        </div>
      )}
      <span
        style={{
          color: "#fff",
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "'Playfair Display', serif",
        }}
      >
        {settings.platformName || "NovaPay"}
      </span>
    </div>
  );

  return (
    <div style={card}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: "rgba(56,189,248,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Eye size={16} color="#38bdf8" />
        </div>
        <h2 style={{ color: "#fff", fontWeight: 600, fontSize: 15, margin: 0 }}>
          Branding
        </h2>
      </div>

      {/* Live preview */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 22,
        }}
      >
        <p
          style={{
            color: "#64748b",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            marginBottom: 12,
          }}
        >
          Live Preview
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          {/* Dark bg preview */}
          <div
            style={{
              backgroundColor: "#0f172a",
              padding: "12px 20px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <p
              style={{
                color: "#64748b",
                fontSize: 10,
                marginRight: 8,
                flexShrink: 0,
              }}
            >
              Sidebar:
            </p>
            <PreviewLogo />
          </div>
          {/* Card bg preview */}
          <div
            style={{
              backgroundColor: "#1e293b",
              padding: "12px 20px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p
              style={{
                color: "#64748b",
                fontSize: 10,
                marginRight: 8,
                flexShrink: 0,
              }}
            >
              Card:
            </p>
            <PreviewLogo />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Platform name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "14px 0",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <p
              style={{
                color: "#f1f5f9",
                fontSize: 14,
                fontWeight: 500,
                margin: 0,
              }}
            >
              Platform Name
            </p>
            <p
              style={{
                color: "#64748b",
                fontSize: 12,
                marginTop: 3,
                marginBottom: 0,
              }}
            >
              Shown in the sidebar, auth pages, and browser title
            </p>
          </div>
          <div style={{ width: 220, flexShrink: 0 }}>
            <input
              value={settings.platformName || ""}
              onChange={handleNameChange}
              placeholder="e.g. NovaPay"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#38bdf8")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
          </div>
        </div>

        {/* Logo text fallback */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "14px 0",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <p
              style={{
                color: "#f1f5f9",
                fontSize: 14,
                fontWeight: 500,
                margin: 0,
              }}
            >
              Logo Initials
            </p>
            <p
              style={{
                color: "#64748b",
                fontSize: 12,
                marginTop: 3,
                marginBottom: 0,
              }}
            >
              Shown inside the icon when no logo image is uploaded (max 3 chars)
            </p>
          </div>
          <div style={{ width: 220, flexShrink: 0 }}>
            <input
              value={logoText}
              onChange={handleLogoTextChange}
              placeholder="e.g. NP"
              maxLength={3}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#38bdf8")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
          </div>
        </div>

        {/* Logo upload */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            padding: "14px 0",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <p
              style={{
                color: "#f1f5f9",
                fontSize: 14,
                fontWeight: 500,
                margin: 0,
              }}
            >
              Logo Image
            </p>
            <p
              style={{
                color: "#64748b",
                fontSize: 12,
                marginTop: 3,
                marginBottom: 0,
              }}
            >
              Upload a square PNG or JPG. Max 2MB. Replaces the initials icon.
            </p>
          </div>
          <div
            style={{
              width: 220,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Current logo preview */}
            {preview && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={preview}
                  alt="Current logo"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    objectFit: "cover",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <button
                  onClick={removeLogo}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(239,68,68,0.3)",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    color: "#f87171",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <X size={12} /> Remove
                </button>
              </div>
            )}

            {/* Upload button */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 14px",
                borderRadius: 10,
                border: "1px dashed rgba(56,189,248,0.3)",
                backgroundColor: "rgba(56,189,248,0.06)",
                color: "#38bdf8",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <Upload size={15} />
              {preview ? "Change Logo" : "Upload Logo"}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────
export default function AdminSettings() {
  const { t } = useTranslation();
  const { settings: appSettings, updateSettings: updateAppSettings } =
    useAppSettings();

  const [settings, setSettings] = useState(appSettings);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync local state when appSettings change
  useEffect(() => {
    setSettings(appSettings);
  }, [appSettings]);

  // Load from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        const merged = { ...appSettings, ...res.data };
        setSettings(merged);
        // Don't call updateAppSettings here — only update context on SAVE
      } catch {
        // Use context defaults silently
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []); // ← empty deps, run once only

  const update = (key, val) => setSettings((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.put("/admin/settings", settings);
      // Only update context AFTER backend confirms the save
      updateAppSettings(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save settings. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const SaveBtn = ({ bottom = false }) => (
    <button
      onClick={handleSave}
      disabled={saving}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: bottom ? "12px 32px" : "10px 20px",
        borderRadius: 12,
        border: "none",
        cursor: saving ? "not-allowed" : "pointer",
        backgroundColor: saved ? "#22c55e" : saving ? "#b45309" : "#f59e0b",
        color: "#0f172a",
        fontWeight: 700,
        fontSize: bottom ? 15 : 14,
        fontFamily: "'DM Sans', sans-serif",
        opacity: saving ? 0.8 : 1,
        transition: "all 0.2s",
      }}
    >
      {saving ? (
        <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
      ) : saved ? (
        <CheckCircle2 size={16} />
      ) : (
        <Save size={16} />
      )}
      {saving
        ? "Saving..."
        : saved
          ? bottom
            ? "All Changes Saved!"
            : "Saved!"
          : bottom
            ? "Save All Settings"
            : "Save Changes"}
    </button>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div
            style={{
              width: 180,
              height: 28,
              borderRadius: 8,
              backgroundColor: "#1e293b",
              marginBottom: 8,
            }}
          />
          <div
            style={{
              width: 280,
              height: 14,
              borderRadius: 6,
              backgroundColor: "#1e293b",
              marginBottom: 28,
            }}
          />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ ...card, marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: "#0f172a",
                  }}
                />
                <div
                  style={{
                    width: 100,
                    height: 14,
                    borderRadius: 4,
                    backgroundColor: "#0f172a",
                  }}
                />
              </div>
              {[1, 2].map((j) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "14px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: 160,
                      height: 13,
                      borderRadius: 4,
                      backgroundColor: "#0f172a",
                    }}
                  />
                  <div
                    style={{
                      width: 220,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: "#0f172a",
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#fff",
                fontFamily: "'Playfair Display', serif",
                marginBottom: 4,
              }}
            >
              {t("admin.settings")}
            </h1>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
              Configure platform branding, limits and behaviour
            </p>
          </div>
          <SaveBtn />
        </div>

        {/* Banners */}
        {saved && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 18px",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              backgroundColor: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              color: "#4ade80",
            }}
          >
            <CheckCircle2 size={18} /> Settings saved — all pages updated
            instantly.
          </div>
        )}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 18px",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
            }}
          >
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Branding section */}
        <BrandingSection settings={settings} update={update} />

        {/* General */}
        <Section icon={Globe} title="General">
          <Field label="Support Email">
            <input
              type="email"
              value={settings.supportEmail || ""}
              onChange={(e) => update("supportEmail", e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
          </Field>
          <Field label="Default Currency">
            <select
              value={settings.defaultCurrency || "USD"}
              onChange={(e) => update("defaultCurrency", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            >
              {["USD", "EUR", "GBP", "NGN", "CNY", "AED", "JPY"].map((c) => (
                <option
                  key={c}
                  value={c}
                  style={{ backgroundColor: "#1e293b", color: "#f1f5f9" }}
                >
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Allow New Registrations"
            hint="Disable to pause sign-ups"
          >
            <Toggle
              value={!!settings.allowRegistration}
              onChange={(v) => update("allowRegistration", v)}
            />
          </Field>
          <Field
            label="Maintenance Mode"
            hint="Blocks all non-admin access"
            last
          >
            <Toggle
              value={!!settings.maintenanceMode}
              onChange={(v) => update("maintenanceMode", v)}
            />
          </Field>
        </Section>

        {/* Transaction Limits */}
        <Section icon={DollarSign} title="Transaction Limits">
          <Field
            label="Max Single Transfer (USD)"
            hint="Per-transaction hard limit"
          >
            <input
              type="number"
              value={settings.transferLimit || ""}
              onChange={(e) => update("transferLimit", e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
          </Field>
          <Field label="Daily Transfer Cap (USD)">
            <input
              type="number"
              value={settings.maxTransferPerDay || ""}
              onChange={(e) => update("maxTransferPerDay", e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
          </Field>
          <Field
            label="Minimum Balance (USD)"
            hint="Users cannot go below this"
            last
          >
            <input
              type="number"
              value={settings.minBalance || ""}
              onChange={(e) => update("minBalance", e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
          </Field>
        </Section>

        {/* Security */}
        <Section icon={Shield} title="Security">
          <Field
            label="Require Admin Approval"
            hint="New accounts need manual approval before first login"
          >
            <Toggle
              value={!!settings.requireApproval}
              onChange={(v) => update("requireApproval", v)}
            />
          </Field>
          <Field
            label="2FA for Admins"
            hint="Enforce two-factor authentication for admin logins"
            last
          >
            <Toggle
              value={!!settings.twoFactorAdmin}
              onChange={(v) => update("twoFactorAdmin", v)}
            />
          </Field>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <Field
            label="Email Notifications"
            hint="Send transaction confirmations and alerts via email"
          >
            <Toggle
              value={!!settings.emailNotifications}
              onChange={(v) => update("emailNotifications", v)}
            />
          </Field>
          <Field
            label="SMS Notifications"
            hint="Send critical alerts via SMS"
            last
          >
            <Toggle
              value={!!settings.smsNotifications}
              onChange={(v) => update("smsNotifications", v)}
            />
          </Field>
        </Section>

        {/* Bottom save */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingBottom: 32,
          }}
        >
          <SaveBtn bottom />
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </AdminLayout>
  );
}
