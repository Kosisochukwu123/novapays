import { Loader2 } from 'lucide-react';

export default function Button({
  children, onClick, type = 'button', variant = 'primary',
  loading = false, disabled = false, className = '', fullWidth = false
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-banking-dark disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3';

  const variants = {
    primary: 'bg-banking-accent text-banking-dark hover:bg-sky-400 focus:ring-banking-accent active:scale-[0.98]',
    secondary: 'bg-white/10 text-white hover:bg-white/15 focus:ring-white/20 border border-white/10',
    danger: 'bg-banking-danger text-white hover:bg-red-600 focus:ring-banking-danger',
    ghost: 'text-banking-muted hover:text-white hover:bg-white/5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}