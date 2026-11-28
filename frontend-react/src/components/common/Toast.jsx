import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const TONES = { success: 'text-emerald-600', error: 'text-red-500', info: 'text-sky-600' };

export default function Toast({ toast, type: propType, message: propMessage, onDismiss, onClose }) {
  const dismissFn = onDismiss || onClose;
  const actualType = toast?.type || propType || 'info';
  const actualMessage = toast?.message || propMessage || '';

  useEffect(() => {
    if (!toast && !propMessage) return undefined;
    const t = setTimeout(() => {
      dismissFn?.();
    }, 4500);
    return () => clearTimeout(t);
  }, [toast, propMessage, dismissFn]);

  if (!toast && !propMessage) return null;
  const Icon = ICONS[actualType] || Info;
  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl md:bottom-6">
      <Icon size={20} className={TONES[actualType] || TONES.info} />
      <p className="max-w-xs text-sm font-medium text-slate-700">{actualMessage}</p>
      <button onClick={dismissFn} className="text-slate-300 hover:text-slate-500"><X size={16} /></button>
    </div>
  );
}
