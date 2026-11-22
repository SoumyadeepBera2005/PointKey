import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarDays, Loader2, AlertTriangle, Ban } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import SlotPicker from '../../components/property/SlotPicker';
import Button from '../../components/ui/Button';
import Toast from '../../components/common/Toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function VisitBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuspended = user?.account_status === 'SUSPENDED';
  const isBlocked = user?.account_status === 'BLOCKED';

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  const submit = async () => {
    if (isSuspended) {
      setToast({ type: 'error', message: '⚠️ Visit requests are disabled: Your account is suspended (Strike 1). Appeal via chatbot.' });
      return;
    }
    if (isBlocked) {
      setToast({ type: 'error', message: '⛔ Account permanently blocked (Strike 2).' });
      return;
    }
    if (!date || !slot) { setToast({ type: 'error', message: 'Pick a date and a time slot' }); return; }
    setBusy(true);
    try {
      await api.post('/visits/request', { property_id: id, visit_date: date, time_slot: slot });
      setToast({ type: 'success', message: 'Visit requested — the owner will confirm shortly.' });
      setTimeout(() => navigate(`/tenant/property/${id}`), 1500);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Could not book this slot' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="glass-card p-6">
          <CalendarDays size={28} className="text-trust" />
          <h1 className="mt-2 text-xl font-black text-slate-800">Book a Visit</h1>
          <p className="text-xs text-slate-500">Choose a date and preferred time window. The owner will confirm or propose a reschedule.</p>

          {isSuspended && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="block font-bold">Visit Booking Disabled (Strike 1)</strong>
                <span>Your account is suspended: &quot;{user.block_reason || 'Rule violation'}&quot;. Open the NestAI chatbot to submit an unblock appeal.</span>
              </div>
            </div>
          )}

          {isBlocked && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-900">
              <Ban size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="block font-bold">Account Permanently Blocked (Strike 2)</strong>
                <span>Multiple rule violations. Booking visits is forbidden.</span>
              </div>
            </div>
          )}

          <label className="label mt-5" htmlFor="visit-date">Visit date</label>
          <input id="visit-date" type="date" min={today} disabled={isSuspended || isBlocked} value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          <div className="mt-4"><SlotPicker value={slot} onChange={setSlot} /></div>
          <Button className={`mt-6 w-full ${isSuspended || isBlocked ? '!bg-slate-400 !cursor-not-allowed hover:!bg-slate-400' : ''}`} onClick={submit} disabled={busy || isSuspended || isBlocked}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : isSuspended ? 'Booking Disabled (Suspended)' : isBlocked ? 'Permanently Blocked' : 'Request Visit'}
          </Button>
        </div>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
