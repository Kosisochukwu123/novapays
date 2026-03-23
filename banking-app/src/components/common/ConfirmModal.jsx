import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, variant = 'danger' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-banking-card border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
          variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
        }`}>
          <AlertTriangle size={22} className={variant === 'danger' ? 'text-banking-danger' : 'text-amber-400'} />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-banking-muted text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} fullWidth>{t('common.cancel')}</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} fullWidth>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}