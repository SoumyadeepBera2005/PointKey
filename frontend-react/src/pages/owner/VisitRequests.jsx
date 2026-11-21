import { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/common/Toast';
import { formatDate } from '../../utils/dateTimestampHelper';
import api from '../../services/api';
import { CheckCircle2, CalendarClock, RotateCcw, History, Loader2 } from 'lucide-react';

const TONE = { REQUESTED: 'amber', CONFIRMED: 'green', RESCHEDULED: 'blue', COMPLETED: 'slate', CANCELLED: 'red' };

export default function VisitRequests() {
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => api.get('/visits/owner-requests').then(({ data }) => setRequests(data.requests || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const act = async (id, status, extra = {}) => {
    setBusy(id + status);
    try {
      await api.patch(`/visits/${id}/status`, { status, ...extra });
      setToast({ type: 'success', message: `Visit ${status.toLowerCase()}` });
      load();
    } catch {
      setToast({ type: 'error', message: 'Action failed' });
    } finally {
      setBusy(null);
    }
  };

  const reschedule = (id) => {
    const visit_date = window.prompt('New date (YYYY-MM-DD)?');
    if (!visit_date) return;
    const time_slot = window.prompt('New slot? e.g. 10:00-11:00 AM');
    if (!time_slot) return;
    act(id, 'RESCHEDULED', { visit_date, time_slot });
  };

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-5">
        <h1 className="text-xl font-extrabold text-slate-800">Visit Requests</h1>
        <p className="text-xs text-slate-400">Confirm, confirm &amp; collect platform fee, reschedule, or review history per property.</p>
        <ul className="mt-4 space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="glass-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-800">{r.property_code} · {r.property_title}</p>
                  <p className="text-xs text-slate-500">Tenant: <b>{r.tenant_name}</b> ({r.tenant_phone}) · Rating {Number(r.tenant_rating || 0).toFixed(1)} ★</p>
                  <p className="mt-1 text-xs text-slate-500"><CalendarClock size={12} className="inline" /> {formatDate(r.visit_date)} · <b>{r.time_slot}</b> · created {formatDate(r.created_at)}</p>
                </div>
                <Badge tone={TONE[r.status] || 'slate'}>{r.status}</Badge>
              </div>
              {r.status === 'REQUESTED' || r.status === 'RESCHEDULED' ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button disabled={busy} onClick={() => act(r.id, 'CONFIRMED')} className="btn-primary !px-4 !py-2 text-xs">{busy === r.id + 'CONFIRMED' ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Confirm Request</button>
                  <button disabled={busy} onClick={() => act(r.id, 'CONFIRMED')} className="rounded-xl border border-violet-300 px-4 py-2 text-xs font-bold text-violet-600 transition hover:bg-violet-50">Confirm &amp; Pay Fee</button>
                  <button disabled={busy} onClick={() => reschedule(r.id)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-trust hover:text-trust"><RotateCcw size={14} className="inline" /> Reschedule</button>
                </div>
              ) : null}
            </li>
          ))}
          {requests.length === 0 && <li className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">No visit requests yet.</li>}
        </ul>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <BottomNav />
    </div>
  );
}
