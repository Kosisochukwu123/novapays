import { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const inputStyle = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: "11px 14px",
  color: "#f1f5f9",
  fontSize: 14,
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
};

const ImageUpload = ({ label, hint, name, value, onChange, error }) => {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max file size is 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(name, reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 500, margin: 0 }}>
        {label}
      </p>
      {hint && (
        <p style={{ color: "#64748b", fontSize: 11, margin: "2px 0 4px" }}>
          {hint}
        </p>
      )}
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: value ? 12 : "24px 16px",
          border: `2px dashed ${error ? "#ef4444" : value ? "#38bdf8" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 12,
          cursor: "pointer",
          backgroundColor: value
            ? "rgba(56,189,248,0.04)"
            : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
        }}
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        {value ? (
          <div style={{ width: "100%", position: "relative" }}>
            <img
              src={value}
              alt="preview"
              style={{
                width: "100%",
                maxHeight: 120,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
            <p
              style={{
                color: "#38bdf8",
                fontSize: 11,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              ✓ Uploaded — click to change
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Upload size={16} color="#64748b" />
            </div>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
              Click to upload
            </p>
            <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>
              PNG, JPG, PDF — max 5MB
            </p>
          </>
        )}
      </label>
      {error && (
        <p style={{ color: "#ef4444", fontSize: 12, margin: "2px 0 0" }}>
          {error}
        </p>
      )}
    </div>
  );
};

const STATUS_CFG = {
  not_started: {
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    Icon: ShieldAlert,
    label: "Not Started",
  },
  pending: {
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.1)",
    Icon: Clock,
    label: "Under Review",
  },
  verified: {
    color: "#4ade80",
    bg: "rgba(34,197,94,0.1)",
    Icon: ShieldCheck,
    label: "Verified",
  },
  rejected: {
    color: "#f87171",
    bg: "rgba(239,68,68,0.1)",
    Icon: XCircle,
    label: "Rejected",
  },
};

export default function KYCSection({ defaultOpen = false }) {
  const { user, login } = useAuth();

  const kycStatus = user?.kycStatus || "not_started";
  const statusCfg = STATUS_CFG[kycStatus] || STATUS_CFG.not_started;
  const StatusIcon = statusCfg.icon;

  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const isMobile = window.innerWidth < 590;

  const [form, setForm] = useState({
    idType: "",
    idNumber: "",
    fullName: user?.fullName || "",
    dateOfBirth: "",
    address: "",
    idFront: "",
    idBack: "",
    selfie: "",
  });

  // Auto-open if navigated here with ?tab=kyc
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "kyc") setOpen(true);
  }, []);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleImage = (name, value) =>
    setForm((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.idType) errs.idType = "Select ID type";
    if (!form.idNumber.trim()) errs.idNumber = "ID number is required";
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
    if (!form.address.trim()) errs.address = "Address is required";
    if (!form.idFront) errs.idFront = "Front of ID is required";
    if (!form.selfie) errs.selfie = "Selfie photo is required";
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.post("/user/kyc", form);
      // Update auth context with new kycStatus
      login(res.data.user, localStorage.getItem("token"));
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Submission failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 16,
        border: `1px solid ${kycStatus === "verified" ? "rgba(34,197,94,0.2)" : kycStatus === "pending" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      {/* Header row — always visible */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          cursor: kycStatus === "verified" ? "default" : "pointer",
        }}
        onClick={() => {
          if (kycStatus !== "verified") setOpen((o) => !o);
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: statusCfg.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <StatusIcon size={20} color={statusCfg.color} />
          </div>
          <div>
            <p
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                margin: 0,
              }}
            >
              KYC Verification
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Status badge */}
          <span
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 20,
              backgroundColor: statusCfg.bg,
              color: statusCfg.color,
              fontWeight: 600,
            }}
          >
            {statusCfg.label}
          </span>

          {/* Complete KYC button — only when not started or rejected */}
          {(kycStatus === "not_started" || kycStatus === "rejected") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) => !o);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                backgroundColor: "#38BDF8",
                color: "#0f172a",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {kycStatus === "rejected" ? "Resubmit KYC" : "Complete KYC"}
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {kycStatus === "verified" && (
            <CheckCircle2 size={20} color="#4ade80" />
          )}
          {kycStatus === "pending" && <Clock size={20} color="#38BDF8" />}
        </div>
      </div>

      {/* ── Verified state ── */}
      {kycStatus === "verified" && (
        <div style={{ padding: "0 24px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 16px",
              borderRadius: 12,
              backgroundColor: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.15)",
            }}
          >
            <ShieldCheck size={18} color="#4ade80" />
            <p style={{ color: "#4ade80", fontSize: 13, margin: 0 }}>
              Your identity has been verified. You can now make withdrawals.
            </p>
          </div>
        </div>
      )}

      {/* ── Pending state ── */}
      {kycStatus === "pending" && (
        <div style={{ padding: "0 24px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 16px",
              borderRadius: 12,
              backgroundColor: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.15)",
            }}
          >
            <Clock size={18} color="#fbbf24" />
            <p style={{ color: "#fbbf24", fontSize: 13, margin: 0 }}>
              Your KYC documents are under review. We'll notify you within 24
              hours.
            </p>
          </div>
        </div>
      )}

      {/* ── Rejected reason ── */}
      {/* ── Show rejection reason if present even though status is not_started ── */}
      {kycStatus === "not_started" && user?.kycRejectionReason && (
        <div style={{ padding: "0 24px 16px" }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "14px 16px",
              borderRadius: 12,
              backgroundColor: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <AlertCircle
              size={16}
              color="#f87171"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <p
                style={{
                  color: "#f87171",
                  fontSize: 13,
                  fontWeight: 600,
                  margin: "0 0 4px",
                }}
              >
                Previous Submission Rejected
              </p>
              <p
                style={{
                  color: "#f87171",
                  fontSize: 12,
                  margin: 0,
                  lineHeight: 1.5,
                  opacity: 0.85,
                }}
              >
                {user.kycRejectionReason}
              </p>
              <p style={{ color: "#64748b", fontSize: 12, margin: "6px 0 0" }}>
                Please fix the issue above and resubmit your KYC below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── KYC Form ── */}
      {(kycStatus === "not_started" || kycStatus === "rejected") && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            backgroundColor: "#f59e0b",
            color: "#0f172a",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Show "Resubmit" if they were previously rejected */}
          {user?.kycRejectionReason ? "Resubmit KYC" : "Complete KYC"}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
    </div>
  );
}
