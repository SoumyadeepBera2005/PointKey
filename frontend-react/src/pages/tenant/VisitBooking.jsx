import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarDays, Loader2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import SlotPicker from '../../components/property/SlotPicker';
import Button from '../../components/ui/Button';
import Toast from '../../components/common/Toast';
import api from '../../services/api';

export default function VisitBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  const submit = async () => {
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
          <label className="label mt-5" htmlFor="visit-date">Visit date</label>
          <input id="visit-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          <div className="mt-4"><SlotPicker value={slot} onChange={setSlot} /></div>
          <Button className="mt-6 w-full" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : 'Request Visit'}
          </Button>
        </div>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
