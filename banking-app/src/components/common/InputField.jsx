import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function InputField({
  label, type = 'text', name, value, onChange,
  placeholder, error, icon: Icon, required = false
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-banking-muted">
            <Icon size={16} />
          </div>
        )}
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-banking-muted text-sm
            focus:outline-none focus:ring-2 focus:ring-banking-accent/50 focus:border-banking-accent
            transition-all duration-200
            ${Icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${error ? 'border-banking-danger' : 'border-white/10 hover:border-white/20'}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-banking-muted hover:text-white transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-banking-danger">{error}</p>}
    </div>
  );
}