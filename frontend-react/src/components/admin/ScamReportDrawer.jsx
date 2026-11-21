import { useState } from 'react';
import Modal from '../common/Modal';
import Badge from '../ui/Badge';
import api from '../../services/api';
import { timeAgo } from '../../utils/dateTimestampHelper';

const TONE = { OPEN: 'red', IN_REVIEW: 'amber', RESOLVED: 'green', BLOCKED: 'slate' };

export default function ScamReportDrawer({ items = [], onClose, onUpdated }) {
  const [busy, setBusy] = useState(null);

  const setStatus = async (id, status) => {
    const admin_notes = window.prompt('Admin notes (optional)?') || undefined;
    setBusy(id);
    try {
      await api.patch(`/admin/reports/${id}`, { status, admin_notes });
      onUpdated?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal title="Scam Alerts & Report Queue" onClose={onClose} maxWidth="max-w-2xl">
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No open reports — all clear.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-800">{r.type.replace('_', ' ')} <span className="font-medium text-slate-400">by {r.reporter_name}</span></p>
                <Badge tone={TONE[r.status] || 'slate'}>{r.status}</Badge>
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{r.description}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{timeAgo(r.created_at)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['IN_REVIEW', 'RESOLVED', 'BLOCKED'].map((s) => (
                  <button key={s} disabled={busy === r.id} onClick={() => setStatus(r.id, s)} className="rounded-lg border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-trust hover:text-trust">
                    Mark {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
