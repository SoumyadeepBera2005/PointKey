import { useState } from 'react';
import { CheckCircle2, XCircle, ScanFace } from 'lucide-react';
import api from '../../services/api';
import Badge from '../ui/Badge';

export default function VerificationQueue({ items = [], onReviewed }) {
  const [busyId, setBusyId] = useState(null);

  const review = async (id, decision) => {
    const reason = decision === 'REJECTED' ? window.prompt('Rejection reason?') || 'Not specified' : undefined;
    setBusyId(id);
    try {
      await api.post(`/admin/owner-verifications/${id}/review`, { decision, rejection_reason: reason });
      onReviewed?.();
    } finally {
      setBusyId(null);
    }
  };

  if (!items.length) {
    return <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No pending owner verifications 🎉</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((v) => (
        <li key={v.id} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><ScanFace size={26} /></div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-800">{v.full_name} <span className="ml-1 text-xs font-medium text-slate-400">({v.id_card_type})</span></p>
            <p className="text-xs text-slate-500">{v.email} · {v.phone}</p>
            <p className="mt-1 text-xs">
              AI match: <b>{v.ai_match_score ?? '—'}</b> · Liveness: <Badge tone={v.liveness_passed ? 'green' : 'red'}>{v.liveness_passed ? 'PASSED' : 'FAILED'}</Badge>
            </p>
            <div className="mt-2 flex gap-3 text-xs text-emerald-700">
              <a href={v.id_card_image_url} target="_blank" rel="noreferrer" className="underline">View ID card</a>
              <a href={v.live_selfie_url} target="_blank" rel="noreferrer" className="underline">View selfie</a>
            </div>
          </div>
          <div className="flex gap-2">
            <button disabled={busyId === v.id} onClick={() => review(v.id, 'VERIFIED')} className="btn-primary !px-4 !py-2 text-xs"><CheckCircle2 size={16} /> Approve</button>
            <button disabled={busyId === v.id} onClick={() => review(v.id, 'REJECTED')} className="btn-outline !border-red-300 !px-4 !py-2 text-xs !text-red-500 hover:!bg-red-50"><XCircle size={16} /> Reject</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
