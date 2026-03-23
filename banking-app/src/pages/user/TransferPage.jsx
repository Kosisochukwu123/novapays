import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Send,
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import UserLayout from "../../components/layout/UserLayout";
import { userService } from "../../services/userService";

const card = {
  backgroundColor: "#1e293b",
  borderRadius: 16,
  padding: 24,
  border: "1px solid rgba(255,255,255,0.06)",
};

const InputField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  required,
}) => (
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
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.05)",
          border: `1px solid ${error ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 12,
          padding: "12px 14px",
          paddingLeft: Icon ? 38 : 14,
          color: "#f1f5f9",
          fontSize: 14,
          outline: "none",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#38bdf8")}
        onBlur={(e) =>
          (e.target.style.borderColor = error
            ? "#ef4444"
            : "rgba(255,255,255,0.1)")
        }
      />
    </div>
    {error && <p style={{ fontSize: 12, color: "#ef4444" }}>{error}</p>}
  </div>
);

const QUICK = [50, 100, 250, 500, 1000];

export default function TransferPage() {
  const [form, setForm] = useState({
    recipientEmail: "",
    amount: "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { t } = useTranslation();


  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
    setResult(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.recipientEmail)
      errs.recipientEmail = "Recipient email is required";
    else if (!/\S+@\S+\.\S+/.test(form.recipientEmail))
      errs.recipientEmail = "Invalid email";
    if (!form.amount) errs.amount = "Amount is required";
    else if (isNaN(form.amount) || parseFloat(form.amount) <= 0)
      errs.amount = "Enter a valid amount";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await userService.transfer({ ...form, amount: parseFloat(form.amount) });
      setResult({ ok: true, msg: "Transfer successful!" });
      setForm({ recipientEmail: "", amount: "", note: "" });
    } catch (err) {
      setResult({
        ok: false,
        msg:
          err.response?.data?.message || "Transfer failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "'Playfair Display', serif",
            marginBottom: 6,
          }}
        >
          {t('transfer.title')}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
         {t('transfer.subtitle')}
        </p>

        {result && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              backgroundColor: result.ok
                ? "rgba(34,197,94,0.1)"
                : "rgba(239,68,68,0.1)",
              border: `1px solid ${result.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              color: result.ok ? "#4ade80" : "#f87171",
            }}
          >
            {result.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {result.msg}
          </div>
        )}

        <div style={card}>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <InputField
              label={t('transfer.recipient')}
              type="email"
              name="recipientEmail"
              value={form.recipientEmail}
              onChange={handleChange}
              placeholder="recipient@example.com"
              icon={User}
              error={errors.recipientEmail}
              required
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <InputField
                label={t('transfer.amount')}
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                icon={DollarSign}
                error={errors.amount}
                required
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {QUICK.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, amount: String(amt) }))
                    }
                    style={{
                      fontSize: 12,
                      padding: "6px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: "1px solid",
                      backgroundColor:
                        form.amount === String(amt)
                          ? "rgba(56,189,248,0.2)"
                          : "rgba(255,255,255,0.05)",
                      borderColor:
                        form.amount === String(amt)
                          ? "#38bdf8"
                          : "rgba(255,255,255,0.1)",
                      color:
                        form.amount === String(amt) ? "#38bdf8" : "#94a3b8",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <InputField
              label={t('transfer.note')}
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder={t('transfer.whatFor')}
              icon={FileText}
            />

            {form.amount && parseFloat(form.amount) > 0 && (
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: 14 }}>
                 {t('transfer.youAreSending')}
                </span>
                <span style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>
                  ${parseFloat(form.amount).toFixed(2)}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: loading ? "#0e7490" : "#38bdf8",
                color: "#0f172a",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Send size={16} /> {loading ? t('transfer.sending') : t('transfer.send')}
            </button>
          </form>
        </div>
      </div>
    </UserLayout>
  );
}
