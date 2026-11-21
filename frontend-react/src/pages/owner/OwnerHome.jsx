import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, ListChecks, CalendarClock, ShieldAlert, Wallet, Star } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import Footer from '../../components/common/Footer';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import OwnerFaceLivenessModal from '../../components/ai/OwnerFaceLivenessModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function OwnerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    api.get('/properties/owner/my-listings').then(({ data }) => setListings(data.listings || [])).catch(() => {});
    api.get('/visits/owner-requests').then(({ data }) => setRequests(data.requests || [])).catch(() => {});
  }, []);

  const isVerified = user?.verification_status === 'VERIFIED';
  const pendingRequests = requests.filter((r) => r.status === 'REQUESTED').length;

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-5">
        {!isVerified && (
          <div className="mb-4 flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
            <ShieldAlert className="shrink-0 text-amber-500" size={28} />
            <div className="flex-1">
              <p className="font-bold text-amber-800">Get verified to stand out</p>
              <p className="text-xs text-amber-700">Complete the face + Govt ID check. Verified owner badges get 3× more visit requests and enable verified listings.</p>
            </div>
            <Button className="!bg-amber-500 hover:!bg-amber-600" onClick={() => setShowVerify(true)}>Verify now</Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: ListChecks, label: 'My Listings', value: listings.length, to: '/owner/listings', tone: 'text-forest bg-forest/15' },
            { icon: CalendarClock, label: 'Pending Requests', value: pendingRequests, to: '/owner/requests', tone: 'text-navy bg-navy/10' },
            { icon: Wallet, label: 'Booked', value: listings.filter((l) => l.booking_status === 'BOOKED').length, to: '/owner/listings', tone: 'text-orange bg-orange/15' },
            { icon: Star, label: 'Avg Rating', value: user?.average_rating ? Number(user.average_rating).toFixed(1) : '—', to: '/owner/profile', tone: 'text-amber-600 bg-amber-50' },
          ].map(({ icon: Icon, label, value, to, tone }) => (
            <Link key={label} to={to} className="glass-card bg-beige border border-beige-border p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></span>
              <p className="mt-2 text-2xl font-black text-navy">{value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">{label}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-navy">Quick actions</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button onClick={() => navigate('/owner/add-property')} className="glass-card bg-beige border border-beige-border flex items-center gap-4 p-5 text-left transition hover:border-forest hover:shadow-lg">
            <PlusCircle size={30} className="text-forest" />
            <span><span className="block font-extrabold text-navy">Add Property</span><span className="text-xs text-slate-600">Room, PG or Flat — with timestamped photos</span></span>
          </button>
          <button onClick={() => navigate('/owner/requests')} className="glass-card bg-beige border border-beige-border flex items-center gap-4 p-5 text-left transition hover:border-forest hover:shadow-lg">
            <CalendarClock size={30} className="text-navy" />
            <span><span className="block font-extrabold text-navy">Visit Requests</span><span className="text-xs text-slate-600">{pendingRequests} awaiting your confirmation</span></span>
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-800">My listings</h2>
            <Link to="/owner/listings" className="text-xs font-bold text-trust hover:underline">View all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.slice(0, 3).map((l) => (
              <Link key={l.id} to="/owner/listings" className="glass-card overflow-hidden transition hover:shadow-lg">
                {l.cover_url && <img src={l.cover_url} alt={l.title} className="h-32 w-full object-cover" loading="lazy" />}
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-slate-800">{l.property_code} · {l.title}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    <Badge tone={l.booking_status === 'BOOKED' ? 'red' : 'green'}>{l.booking_status}</Badge>
                    <Badge tone={l.verification_status === 'VERIFIED' ? 'green' : 'amber'}>{l.verification_status}</Badge>
                  </div>
                </div>
              </Link>
            ))}
            {listings.length === 0 && <p className="text-sm text-slate-400">No listings yet — add your first property.</p>}
          </div>
        </div>
      </main>
      {showVerify && <OwnerFaceLivenessModal onClose={() => setShowVerify(false)} />}
      <Footer />
      <BottomNav />
    </div>
  );
}
