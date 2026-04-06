import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  DollarSign,
  XCircle,
} from "lucide-react";
import UserLayout from "../../components/layout/UserLayout";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import KYCSection from "../../components/common/KYCSection";
import UserAvatar from "../../components/common/UserAvatar";
import { useRef } from "react";

const card = {
  backgroundColor: "#1e293b",
  borderRadius: 16,
  padding: 24,
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: 16,
};

const InputField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  icon: Icon,
  error,
  required,
}) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#cbd5e1" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
            }}
          />
        )}
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={onChange}
          style={{
            width: "100%",
            backgroundColor: "rgba(255,255,255,0.05)",
            border: `1px solid ${error ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12,
            padding: "11px 14px",
            paddingLeft: Icon ? 38 : 14,
            paddingRight: isPassword ? 40 : 14,
            color: "#f1f5f9",
            fontSize: 14,
            outline: "none",
            fontFamily: "'DM Sans', sans-serif",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#38bdf8")}
          onBlur={(e) =>
            (e.target.style.borderColor = error
              ? "#ef4444"
              : "rgba(255,255,255,0.1)")
          }
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
            }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>{error}</p>
      )}
    </div>
  );
};

const Alert = ({ msg, ok }) =>
  msg ? (
    <div
      style={{
        marginBottom: 16,
        padding: "12px 16px",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14,
        backgroundColor: ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        color: ok ? "#4ade80" : "#f87171",
      }}
    >
      <CheckCircle2 size={16} /> {msg}
    </div>
  ) : null;

export default function ProfilePage() {
  const { user, login } = useAuth();
  const { t, i18n } = useTranslation();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef(null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setPhotoError("Photo must be under 3MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file");
      return;
    }

    setUploadingPhoto(true);
    setPhotoError("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        const res = await api.put("/user/profile", { profileImage: base64 });
        login(res.data.user, localStorage.getItem("token"));
      };
      reader.readAsDataURL(file);
    } catch {
      setPhotoError("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    setUploadingPhoto(true);
    try {
      const res = await api.put("/user/profile", { profileImage: "" });
      login(res.data.user, localStorage.getItem("token"));
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setPhotoError("Failed to remove photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [pwErrors, setPwErrors] = useState({});
  const [profileMsg, setProfileMsg] = useState("");
  const [profileMsgOk, setProfileMsgOk] = useState(true);
  const [pwMsg, setPwMsg] = useState("");
  const [pwMsgOk, setPwMsgOk] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [langSaved, setLangSaved] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleProfileChange = (e) =>
    setProfileForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePwChange = (e) => {
    setPwForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setPwErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2500);
  };

  // ── Save profile ──────────────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg("");
    try {
      const res = await api.put("/user/profile", profileForm);
      // Refresh auth context with updated user
      login(res.data.user, localStorage.getItem("token"));
      setProfileMsgOk(true);
      setProfileMsg(t("profile.profileUpdated"));
    } catch (err) {
      setProfileMsgOk(false);
      setProfileMsg(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMsg(""), 4000);
    }
  };

  // ── Change password ───────────────────────────────────────────────────
  const savePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = t("common.error");
    if (!pwForm.newPassword || pwForm.newPassword.length < 8)
      errs.newPassword = "At least 8 characters";
    if (pwForm.newPassword !== pwForm.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length) {
      setPwErrors(errs);
      return;
    }

    setPwLoading(true);
    setPwMsg("");
    try {
      await api.put("/user/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsgOk(true);
      setPwMsg(t("profile.passwordChanged"));
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMsgOk(false);
      setPwMsg(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
      setTimeout(() => setPwMsg(""), 4000);
    }
  };

  const LANGUAGES = [
    { code: "en", label: "English", native: "English", flag: "🇬🇧" },
    { code: "fr", label: "French", native: "Français", flag: "🇫🇷" },
    { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
    { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
    { code: "de", label: "German", native: "Deutsch", flag: "🇩🇪" },
    { code: "zh", label: "Chinese", native: "中文", flag: "🇨🇳" },
    { code: "it", label: "Italian", native: "Italiano", flag: "🇮🇹" },
    { code: "pt", label: "Portuguese", native: "Português", flag: "🇧🇷" },
  ];

  return (
    <UserLayout>
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Page title */}
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "'Playfair Display', serif",
            marginBottom: 6,
          }}
        >
          {t("profile.title")}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
          {t("profile.subtitle")}
        </p>

        {/* ── Avatar card ── */}
        <div
          style={{
            ...card,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Avatar with upload overlay */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <UserAvatar size={68} radius={18} fontSize={22} showBorder />

              {/* Camera overlay */}
              <label
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 18,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                title="Upload profile photo"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
                {uploadingPhoto ? (
                  <RefreshCw
                    size={18}
                    color="#fff"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </label>
            </div>

            <div>
              <p
                style={{
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                  margin: 0,
                }}
              >
                {user?.fullName}
              </p>
              <p
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  marginTop: 2,
                  marginBottom: 6,
                }}
              >
                {user?.email}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    padding: "2px 10px",
                    borderRadius: 20,
                    backgroundColor: "rgba(56,189,248,0.1)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56,189,248,0.2)",
                  }}
                >
                  {user?.role || "user"}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    padding: "2px 10px",
                    borderRadius: 20,
                    backgroundColor:
                      user?.status === "active"
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(245,158,11,0.1)",
                    color: user?.status === "active" ? "#4ade80" : "#fbbf24",
                    border: `1px solid ${user?.status === "active" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}
                >
                  {user?.status || "active"}
                </span>

                {/* Upload / Remove buttons */}
                <label
                  style={{
                    fontSize: 12,
                    padding: "2px 10px",
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: "#94a3b8",
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                  />
                  {uploadingPhoto
                    ? "Uploading..."
                    : user?.profileImage
                      ? "Change Photo"
                      : "+ Add Photo"}
                </label>

                {user?.profileImage && (
                  <button
                    onClick={removePhoto}
                    style={{
                      fontSize: 12,
                      padding: "2px 10px",
                      borderRadius: 20,
                      backgroundColor: "rgba(239,68,68,0.1)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.2)",
                      cursor: "pointer",
                      background: "none",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {photoError && (
                <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>
                  {photoError}
                </p>
              )}
            </div>
          </div>

          {/* Balance badge */}
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>
              Account Balance
            </p>
            <p style={{ color: "#38bdf8", fontSize: 22, fontWeight: 700 }}>
              $
              {(user?.balance ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* ── Personal information ── */}
        <div style={card}>
          <p
            style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              marginBottom: 20,
            }}
          >
            {t("profile.personalInfo")}
          </p>
          <Alert msg={profileMsg} ok={profileMsgOk} />
          <form
            onSubmit={saveProfile}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <InputField
              label={t("auth.fullName")}
              name="fullName"
              value={profileForm.fullName}
              onChange={handleProfileChange}
              icon={User}
              required
            />
            <InputField
              label={t("auth.email")}
              type="email"
              name="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              icon={Mail}
              required
            />
            <InputField
              label={t("auth.phone")}
              name="phone"
              value={profileForm.phone}
              onChange={handleProfileChange}
              icon={Phone}
            />
            <div>
              <button
                type="submit"
                disabled={profileLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 22px",
                  borderRadius: 12,
                  border: "none",
                  cursor: profileLoading ? "not-allowed" : "pointer",
                  backgroundColor: profileLoading ? "#0e7490" : "#38bdf8",
                  color: "#0f172a",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: profileLoading ? 0.7 : 1,
                }}
              >
                <Save size={15} />
                {profileLoading ? t("profile.saving") : t("profile.save")}
              </button>
            </div>
          </form>
        </div>

        <KYCSection defaultOpen={false} />

        {/* ── Language selector ── */}
        <div style={card}>
          <p
            style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              marginBottom: 4,
            }}
          >
            {t("profile.language")}
          </p>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
            {t("profile.languageSubtitle")}
          </p>

          {langSaved && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                borderRadius: 10,
                backgroundColor: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)",
                color: "#4ade80",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={15} /> {t("profile.languageSaved")}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {LANGUAGES.map((lang) => {
              const isActive =
                i18n.language === lang.code ||
                i18n.language?.startsWith(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 10px",
                    borderRadius: 12,
                    cursor: "pointer",
                    border: `1px solid ${isActive ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.06)"}`,
                    backgroundColor: isActive
                      ? "rgba(56,189,248,0.1)"
                      : "rgba(255,255,255,0.03)",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.03)";
                  }}
                >
                  <span style={{ fontSize: 22 }}>{lang.flag}</span>
                  <span
                    style={{
                      color: isActive ? "#38bdf8" : "#f1f5f9",
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {lang.native}
                  </span>
                  <span style={{ color: "#64748b", fontSize: 10 }}>
                    {lang.label}
                  </span>
                  {isActive && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#38bdf8",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Change password ── */}
        <div style={card}>
          <p
            style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              marginBottom: 20,
            }}
          >
            {t("profile.changePassword")}
          </p>
          <Alert msg={pwMsg} ok={pwMsgOk} />
          <form
            onSubmit={savePassword}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <InputField
              label={t("profile.currentPassword")}
              type="password"
              name="currentPassword"
              value={pwForm.currentPassword}
              onChange={handlePwChange}
              icon={Lock}
              error={pwErrors.currentPassword}
              required
            />
            <InputField
              label={t("profile.newPassword")}
              type="password"
              name="newPassword"
              value={pwForm.newPassword}
              onChange={handlePwChange}
              icon={Lock}
              error={pwErrors.newPassword}
              required
            />
            <InputField
              label={t("profile.confirmNewPassword")}
              type="password"
              name="confirmPassword"
              value={pwForm.confirmPassword}
              onChange={handlePwChange}
              icon={Lock}
              error={pwErrors.confirmPassword}
              required
            />

            {/* Password strength */}
            {pwForm.newPassword.length > 0 && (
              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map((i) => {
                    const strength =
                      pwForm.newPassword.length >= 12
                        ? 4
                        : pwForm.newPassword.length >= 8
                          ? 3
                          : pwForm.newPassword.length >= 5
                            ? 2
                            : 1;
                    const colors = ["#ef4444", "#f59e0b", "#38bdf8", "#22c55e"];
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor:
                            i <= strength
                              ? colors[strength - 1]
                              : "rgba(255,255,255,0.1)",
                          transition: "background-color 0.3s",
                        }}
                      />
                    );
                  })}
                </div>
                <p style={{ color: "#64748b", fontSize: 11 }}>
                  {pwForm.newPassword.length < 5
                    ? "Too short"
                    : pwForm.newPassword.length < 8
                      ? "Weak"
                      : pwForm.newPassword.length < 12
                        ? "Good"
                        : "Strong"}
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={pwLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 22px",
                  borderRadius: 12,
                  border: "none",
                  cursor: pwLoading ? "not-allowed" : "pointer",
                  backgroundColor: pwLoading
                    ? "#334155"
                    : "rgba(255,255,255,0.08)",
                  color: "#f1f5f9",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: pwLoading ? 0.7 : 1,
                }}
              >
                <Lock size={15} />
                {pwLoading
                  ? t("profile.updating")
                  : t("profile.updatePassword")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </UserLayout>
  );
}
