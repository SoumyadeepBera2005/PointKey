import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const TONES = { success: 'text-emerald-600', error: 'text-red-500', info: 'text-sky-600' };

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const Icon = ICONS[toast.type] || Info;
  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl md:bottom-6">
      <Icon size={20} className={TONES[toast.type] || TONES.info} />
      <p className="max-w-xs text-sm font-medium text-slate-700">{toast.message}</p>
      <button onClick={onDismiss} className="text-slate-300 hover:text-slate-500"><X size={16} /></button>
    </div>
  );
}
