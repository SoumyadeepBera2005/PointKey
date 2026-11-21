import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Undo2, History, MapPin, Heart, Star, Receipt, Settings, ShieldCheck, LifeBuoy, Info, FileText, LogOut, CalendarClock, Loader2,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/common/Toast';
import RatingStars from '../../components/ui/RatingStars';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatINR } from '../../utils/currencyFormatter';
import { formatDate } from '../../utils/dateTimestampHelper';

export default function TenantProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'refunds' | 'history' | 'visits' | 'ratings' | 'receipts' | 'settings' | 'support' | 'about' | 'terms'
  const [refunds, setRefunds] = useState([]);
  const [visits, setVisits] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = async (key) => {
    setModal(key);
    try {
      if (key === 'refunds') setRefunds((await api.get('/payments/my-refunds')).data.payments || []);
      if (key === 'visits') setVisits((await api.get('/visits/mine')).data.visits || []);
      if (key === 'receipts') setReceipts((await api.get('/payments/receipts')).data.receipts || []);
    } catch { /* ignore */ }
  };

  const MENU = [
    { key: 'refunds', label: 'My Refunds', sub: '100% refund tracker', icon: Undo2, tone: 'text-emerald-600 bg-emerald-50' },
    { key: 'visits', label: 'My Bookings', sub: 'Visit slots & status', icon: CalendarClock, tone: 'text-sky-600 bg-sky-50' },
    { key: 'receipts', label: 'Payment Receipts', sub: 'All Razorpay receipts', icon: Receipt, tone: 'text-violet-600 bg-violet-50' },
    { key: 'ratings', label: 'My Ratings', sub: 'Rate owners & properties', icon: Star, tone: 'text-amber-600 bg-amber-50' },
    { key: 'settings', label: 'Settings — Edit Details', sub: 'Name, WhatsApp, gender, occupation', icon: Settings, tone: 'text-slate-600 bg-slate-100' },
    { key: 'privacy', label: 'Privacy Center', sub: 'How pRent handles your data', icon: ShieldCheck, tone: 'text-emerald-700 bg-emerald-50' },
    { key: 'support', label: 'Help & Support', sub: 'FAQs, contact, report scam', icon: LifeBuoy, tone: 'text-blue-600 bg-blue-50' },
    { key: 'about', label: 'About Us', sub: 'Our mission & team', icon: Info, tone: 'text-slate-600 bg-slate-100' },
    { key: 'terms', label: 'Terms & Conditions', sub: 'Rental & refund terms', icon: FileText, tone: 'text-slate-600 bg-slate-100' },
  ];

  const settingsSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.target);
    try {
      await api.patch('/auth/profile', {
        full_name: form.get('full_name'),
        whatsapp_number: form.get('whatsapp_number'),
        tenant_gender: form.get('tenant_gender'),
        tenant_occupation: form.get('tenant_occupation'),
      });
      setToast({ type: 'success', message: 'Profile updated. Please login again to refresh.' });
      setModal(null);
    } catch {
      setToast({ type: 'error', message: 'Update failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="glass-card flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-trust text-2xl font-black text-white">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold text-slate-800">{user?.full_name}</h1>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-500">{user?.phone}</p>
            <div className="mt-1 flex gap-1.5">
              {user?.verification_status === 'VERIFIED' && <Badge tone="green">Verified</Badge>}
              <Badge tone="slate">{user?.tenant_gender || 'TENANT'}</Badge>
              {user?.tenant_occupation && <Badge tone="blue">{String(user.tenant_occupation).replace('_', ' ')}</Badge>}
            </div>
          </div>
        </div>

        <div className="glass-card mt-4 divide-y divide-slate-100 overflow-hidden">
          {MENU.map(({ key, label, sub, icon: Icon, tone }) => (
            <button key={key} onClick={() => open(key)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-800">{label}</span>
                <span className="block truncate text-[11px] text-slate-400">{sub}</span>
              </span>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          ))}
        </div>

        <button onClick={() => { logout(); navigate('/role-selection'); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-500 transition hover:bg-red-100">
          <LogOut size={18} /> Logout
        </button>
      </main>

      {/* Modals */}
      {modal === 'refunds' && (
        <Modal title="My Refunds" onClose={() => setModal(null)}>
          {refunds.length === 0 ? <p className="text-sm text-slate-400">No refund activity yet. If a room isn&apos;t confirmed, request a refund from the property page.</p> : (
            <ul className="space-y-2">{refunds.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                <span><b>{r.property_title}</b><span className="block text-xs text-slate-400">{formatDate(r.created_at)} · {formatINR(r.amount)}</span></span>
                <Badge tone={r.status === 'REFUNDED' ? 'green' : 'amber'}>{r.status.replace('_', ' ')}</Badge>
              </li>
            ))}</ul>
          )}
        </Modal>
      )}
      {modal === 'visits' && (
        <Modal title="My Bookings & Visits" onClose={() => setModal(null)}>
          {visits.length === 0 ? <p className="text-sm text-slate-400">No visit requests yet. Unlock a property to book a slot.</p> : (
            <ul className="space-y-2">{visits.map((v) => (
              <li key={v.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                <div className="flex items-center justify-between"><b>{v.property_title}</b><Badge tone={v.status === 'CONFIRMED' ? 'green' : v.status === 'CANCELLED' ? 'red' : 'amber'}>{v.status}</Badge></div>
                <p className="mt-1 text-xs text-slate-500">{formatDate(v.visit_date)} · {v.time_slot}</p>
              </li>
            ))}</ul>
          )}
        </Modal>
      )}
      {modal === 'receipts' && (
        <Modal title="Payment Receipts" onClose={() => setModal(null)}>
          {receipts.length === 0 ? <p className="text-sm text-slate-400">No payments yet.</p> : (
            <ul className="space-y-2">{receipts.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                <span><b>{r.property_title}</b><span className="block text-xs text-slate-400">{formatDate(r.created_at)} · {r.payment_method} · {r.gateway_txn_id}</span></span>
                <b className="text-trust">{formatINR(r.amount)}</b>
              </li>
            ))}</ul>
          )}
        </Modal>
      )}
      {modal === 'ratings' && (
        <Modal title="My Ratings" onClose={() => setModal(null)}>
          <p className="text-sm text-slate-500">Rate a property after your visit from its details page — your feedback keeps pRent trusted. Received ratings appear on your public profile.</p>
          <div className="mt-4"><RatingStars value={0} onChange={() => setToast({ type: 'info', message: 'Open a property page to rate it.' })} /></div>
        </Modal>
      )}
      {modal === 'settings' && (
        <Modal title="Settings — Edit Details" onClose={() => setModal(null)}>
          <form onSubmit={settingsSave} className="space-y-3">
            <label className="block"><span className="label">Full name</span><input name="full_name" defaultValue={user?.full_name} className="input" /></label>
            <label className="block"><span className="label">WhatsApp number</span><input name="whatsapp_number" defaultValue={user?.whatsapp_number || ''} className="input" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="label">Gender</span>
                <select name="tenant_gender" defaultValue={user?.tenant_gender || ''} className="input"><option value="">—</option><option>MALE</option><option>FEMALE</option><option>FAMILY</option></select>
              </label>
              <label className="block"><span className="label">Occupation</span>
                <select name="tenant_occupation" defaultValue={user?.tenant_occupation || ''} className="input"><option value="">—</option><option>STUDENT</option><option>WORKING_PROFESSIONAL</option><option>FAMILY</option></select>
              </label>
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? <Loader2 className="animate-spin" size={18} /> : 'Save changes'}</button>
          </form>
        </Modal>
      )}
      {modal === 'privacy' && (
        <Modal title="Privacy Center" onClose={() => setModal(null)}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Your phone/email are shared with an owner only after you unlock a property.</li>
            <li>Exact addresses and owner contacts are stripped from API responses until payment (privacyGuard).</li>
            <li>Verification images are used solely for ownership checks.</li>
            <li>You can request account deletion anytime via Help &amp; Support.</li>
          </ul>
        </Modal>
      )}
      {modal === 'support' && (
        <Modal title="Help & Support" onClose={() => setModal(null)}>
          <p className="text-sm text-slate-600">Email <b>care@prent.in</b> or call <b>+91 90000 00000</b> (9 AM–9 PM). To report a scam, use the <b>Report a scam</b> button on any property page — it goes straight to pRent Admin&apos;s scam queue.</p>
        </Modal>
      )}
      {modal === 'about' && (
        <Modal title="About Us" onClose={() => setModal(null)}>
          <p className="text-sm text-slate-600">pRent exists to make renting safe: AI-verified owners, privacy-gated details, timestamped photos and a 100% refund guarantee if your room isn&apos;t confirmed.</p>
        </Modal>
      )}
      {modal === 'terms' && (
        <Modal title="Terms & Conditions" onClose={() => setModal(null)}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Unlock payments are refundable in full if the room is not confirmed.</li>
            <li>Verified listings may be removed only by pRent Administration.</li>
            <li>Misuse (fake reports, payment fraud) leads to permanent blocking.</li>
            <li>pRent is a marketplace; rental agreements are between tenant and owner.</li>
          </ul>
        </Modal>
      )}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <BottomNav />
    </div>
  );
}
