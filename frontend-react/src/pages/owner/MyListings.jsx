import { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/common/Toast';
import { formatINR } from '../../utils/currencyFormatter';
import api from '../../services/api';
import { Trash2, Lock } from 'lucide-react';

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [toast, setToast] = useState(null);

  const load = () => api.get('/properties/owner/my-listings').then(({ data }) => setListings(data.listings || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggleBooking = async (listing) => {
    const next = listing.booking_status === 'BOOKED' ? 'UNBOOKED' : 'BOOKED';
    try {
      await api.patch(`/properties/${listing.id}/booking-status`, { booking_status: next });
      setToast({ type: 'success', message: `${listing.property_code} marked ${next.toLowerCase()}` });
      load();
    } catch {
      setToast({ type: 'error', message: 'Could not update booking status' });
    }
  };

  const remove = async (listing) => {
    if (!window.confirm(`Delete ${listing.property_code}? Verified listings can only be deleted by Administration.`)) return;
    try {
      await api.delete(`/properties/${listing.id}`);
      setToast({ type: 'success', message: 'Listing deleted' });
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Delete failed' });
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-5">
        <h1 className="text-xl font-extrabold text-slate-800">My Listings</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const verifiedLocked = l.verification_status === 'VERIFIED';
            return (
              <div key={l.id} className="glass-card overflow-hidden">
                {l.cover_url && <img src={l.cover_url} alt={l.title} className="h-36 w-full object-cover" loading="lazy" />}
                <div className="p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{l.property_code}</p>
                  <p className="truncate font-bold text-slate-800">{l.title}</p>
                  <p className="mt-1 text-sm font-extrabold text-trust">{formatINR(l.rent_amount)}<span className="text-[10px] font-medium text-slate-400">/mo</span></p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={l.booking_status === 'BOOKED' ? 'red' : 'green'}>{l.booking_status}</Badge>
                    <Badge tone={verifiedLocked ? 'green' : 'amber'}>{l.verification_status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button onClick={() => toggleBooking(l)} className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:border-trust hover:text-trust">
                      Mark {l.booking_status === 'BOOKED' ? 'Unbooked' : 'Booked'}
                    </button>
                    <button onClick={() => remove(l)} title={verifiedLocked ? 'Verified — admin-only deletion' : 'Delete listing'} className={`rounded-xl p-2 transition ${verifiedLocked ? 'cursor-not-allowed text-slate-300' : 'text-red-400 hover:bg-red-50 hover:text-red-600'}`}>
                      {verifiedLocked ? <Lock size={18} /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {listings.length === 0 && <p className="text-sm text-slate-400">No listings yet.</p>}
        </div>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <BottomNav />
    </div>
  );
}
