import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Phone, Mail, MessageCircle, BedDouble, Bath, Zap, Droplets, CalendarClock, Flag, Undo2, CheckCircle2, Utensils, Ruler, Home as HomeIcon } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import TimestampGallery from '../../components/property/TimestampGallery';
import LockedLocationCard from '../../components/property/LockedLocationCard';
import RatingStars from '../../components/ui/RatingStars';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/common/Toast';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../services/api';
import { formatINR } from '../../utils/currencyFormatter';
import { SAMPLE_PROPERTIES } from '../../data/sampleProperties';
import { useAuth } from '../../context/AuthContext';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuspended = user?.account_status === 'SUSPENDED';
  const isBlocked = user?.account_status === 'BLOCKED';

  const [property, setProperty] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    setLoading(true);
    const unlockedLocal = (() => {
      try {
        return JSON.parse(localStorage.getItem('prent_unlocked_properties') || '[]');
      } catch {
        return [];
      }
    })();
    const isLocallyUnlocked = unlockedLocal.includes(String(id));

    api.get(`/properties/${id}`)
      .then(({ data }) => {
        setProperty(data.property);
        setUnlocked(Boolean(data.unlocked || isLocallyUnlocked));
      })
      .catch(() => {
        // Fallback for sample properties so clicking cards from demo works
        const sample = SAMPLE_PROPERTIES.find((s) => String(s.id) === String(id));
        if (sample) {
          setProperty({
            id: sample.id,
            title: sample.title,
            locality: sample.location,
            city: sample.city || 'Kolkata',
            category: sample.type?.toUpperCase() || 'FLAT',
            sub_type: sample.subtype || sample.type,
            rent_amount: sample.price,
            advance_amount: sample.deposit || sample.price * 2,
            contract_months: sample.stay || 6,
            size_sqft: sample.roomSize ? parseInt(sample.roomSize) : 400,
            water_bill_included: true,
            electricity_bill_included: false,
            food_included: sample.food === 'Included',
            bathroom_type: (sample.bathroom || '').toUpperCase() === 'PRIVATE' ? 'PRIVATE' : 'COMMON',
            kitchen_available: sample.kitchen !== "Don't need",
            roof_floor_type: sample.floor || '1st floor',
            room_materials: ['Bed', 'Table', 'Chair', 'Light', 'Fan'],
            rules_and_regulations: Array.isArray(sample.rules) ? sample.rules.join('. ') : 'Standard quiet hours.',
            allow_parents_friends: true,
            verification_status: 'VERIFIED',
            booking_status: 'AVAILABLE',
            average_rating: 4.8,
            owner_name: sample.owner || 'Verified Landlord',
            owner_phone: sample.contact || '+91 98300 12345',
            owner_whatsapp: sample.contact || '+91 98300 12345',
            owner_email: 'landlord@pointkey.in',
            owner_verification_status: 'ID_VERIFIED',
            exact_address: `${sample.location}, West Bengal`,
            media: [
              { url: sample.image, category: 'PHOTO_TOUR', created_at: new Date().toISOString() },
              { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=90', category: 'ROOM', created_at: new Date().toISOString() },
              { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=90', category: 'INTERIOR', created_at: new Date().toISOString() },
            ],
            nearby_landmarks: {
              metro: '1.2 km away',
              market: '0.3 km away',
              hospital: '1.0 km away',
              transport: ['Auto', 'Toto', 'Bus', 'Cab'],
            },
          });
          setUnlocked(isLocallyUnlocked);
        } else if (String(id).startsWith('prop-') || String(id).startsWith('dynamic-')) {
          const parts = String(id).split('-');
          const rawCity = parts.length > 2 ? parts[1] : 'Area';
          const cityName = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);
          setProperty({
            id: id,
            title: `2 BHK Verified Premium Home in ${cityName}`,
            locality: `${cityName} Central`,
            city: cityName,
            category: 'FLAT',
            sub_type: '2 BHK',
            rent_amount: 8500,
            advance_amount: 17000,
            contract_months: 6,
            size_sqft: 750,
            water_bill_included: true,
            electricity_bill_included: false,
            food_included: false,
            bathroom_type: 'PRIVATE',
            kitchen_available: true,
            roof_floor_type: '2nd floor',
            room_materials: ['Bed', 'Table', 'Chair', 'Light', 'Fan', 'Wardrobe'],
            rules_and_regulations: 'Standard building quiet hours. Keep common areas clean.',
            allow_parents_friends: true,
            verification_status: 'VERIFIED',
            booking_status: 'AVAILABLE',
            average_rating: 4.9,
            owner_name: 'Verified Landlord',
            owner_phone: '+91 98300 12345',
            owner_whatsapp: '+91 98300 12345',
            owner_email: 'landlord@pointkey.in',
            owner_verification_status: 'ID_VERIFIED',
            exact_address: `Central Road, ${cityName}, West Bengal`,
            media: [
              { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=90', category: 'PHOTO_TOUR', created_at: new Date().toISOString() },
              { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=90', category: 'ROOM', created_at: new Date().toISOString() },
            ],
            nearby_landmarks: {
              metro: '0.8 km to transit station',
              market: '0.3 km to main market',
              hospital: '0.6 km to hospital',
              transport: ['Toto', 'Auto', 'Bus'],
            },
          });
          setUnlocked(isLocallyUnlocked);
        } else {
          setToast({ type: 'error', message: 'Could not load this property' });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const submitRating = async (score) => {
    setRating(score);
    try {
      await api.post('/ratings', { score, target_property_id: id });
      setToast({ type: 'success', message: 'Thanks for rating this property!' });
    } catch {
      setToast({ type: 'error', message: 'Could not submit rating' });
    }
  };

  const reportScam = async () => {
    const description = window.prompt('Describe the issue / suspected scam:');
    if (!description) return;
    try {
      await api.post('/reports', { type: 'SCAM', description, target_property_id: id });
      setToast({ type: 'success', message: 'Report submitted to pRent Admin. Thank you.' });
    } catch {
      setToast({ type: 'error', message: 'Could not submit report' });
    }
  };

  const requestRefund = async () => {
    try {
      const receipts = await api.get('/payments/receipts');
      const match = (receipts.data.receipts || []).find((r) => r.property_id === id && r.status === 'SUCCESS');
      if (!match) return setToast({ type: 'info', message: 'No successful payment found for this property.' });
      const reason = window.prompt('Why are you requesting a 100% refund?') || 'Room not confirmed';
      await api.post(`/payments/${match.id}/refund`, { reason });
      setToast({ type: 'success', message: '100% refund requested. Track it under My Refunds.' });
    } catch {
      setToast({ type: 'error', message: 'Could not process refund request' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="mx-auto max-w-4xl space-y-4 p-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <p className="p-10 text-center text-slate-400">Property not found.</p>
      </div>
    );
  }

  const p = property;
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const coords = p.location && typeof p.location.lat === 'number' ? p.location : null;
  const mapQuery = coords
    ? `${coords.lat},${coords.lng}`
    : p.exact_address || `${p.locality || ''}, ${p.city || 'Kolkata'}`;

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0">
      <Navbar />
      {isSuspended && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-xs text-amber-950">
            <p className="font-bold text-sm text-amber-900">⚠️ Account Suspended by Admin (Strike 1 of 2)</p>
            <p className="mt-1">Reason: {user?.block_reason || 'PointKey platform rules violation'}. Advance payment and visit booking are restricted. Please submit an unblock appeal via NestAI chatbot.</p>
          </div>
        </div>
      )}
      {isBlocked && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 p-4 text-xs text-rose-950">
            <p className="font-bold text-sm text-rose-900">⛔ Account Permanently Blocked (Strike 2)</p>
            <p className="mt-1">Reason: {user?.block_reason || 'Repeated rule violations'}. All platform interactions are permanently terminated.</p>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl gap-6 px-4 py-5 lg:grid lg:grid-cols-5">
        {/* Left column — gallery + details */}
        <div className="space-y-5 lg:col-span-3">
          <TimestampGallery media={p.media} />

          <div className="glass-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              {p.verification_status === 'VERIFIED' && (
                <Badge tone="green"><ShieldCheck size={12} /> Verified listing</Badge>
              )}
              <Badge tone="slate">{p.category} · {String(p.sub_type || '').replace('_', ' ')}</Badge>
              <Badge tone={p.booking_status === 'BOOKED' ? 'red' : 'green'}>{p.booking_status}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-800">{p.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={14} /> {p.locality}, {p.city}
              {!unlocked && <span className="text-slate-300"> — exact address locked</span>}
            </p>
            <div className="mt-2"><RatingStars value={Number(p.average_rating || 0)} /></div>

            {/* Financials */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
              <div>
                <p className="label">Rent</p>
                <p className="font-extrabold text-trust">{formatINR(p.rent_amount)}<span className="text-[10px] font-medium text-slate-400">/mo</span></p>
              </div>
              <div>
                <p className="label">Advance</p>
                <p className="font-bold text-slate-700">{formatINR(p.advance_amount)}</p>
              </div>
              <div>
                <p className="label"><CalendarClock size={12} className="inline" /> Contract</p>
                <p className="font-bold text-slate-700">{p.contract_months} mo</p>
              </div>
              <div>
                <p className="label"><Ruler size={12} className="inline" /> Size</p>
                <p className="font-bold text-slate-700">{p.size_sqft || '—'} sqft</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <Droplets size={12} /> Water bill {p.water_bill_included ? 'incl.' : 'extra'}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <Zap size={12} /> Electricity {p.electricity_bill_included ? 'incl.' : 'extra'}
              </span>
              {p.food_included ? (
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Utensils size={12} /> Food included
                </span>
              ) : null}
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <Bath size={12} /> {p.bathroom_type === 'PRIVATE' ? 'Private' : 'Common'} bathroom
              </span>
              {p.kitchen_available ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">Kitchen available</span>
              ) : null}
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <HomeIcon size={12} /> {p.roof_floor_type || '—'}
              </span>
            </div>

            {/* Room inventory & rules */}
            {Array.isArray(p.room_materials) && p.room_materials.length > 0 && (
              <div className="mt-4">
                <p className="label"><BedDouble size={12} className="inline" /> Room inventory</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.room_materials.map((m) => (
                    <span key={m} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {p.rules_and_regulations && (
              <div className="mt-3">
                <p className="label">House rules</p>
                <p className="text-sm text-slate-600">{p.rules_and_regulations}</p>
                <p className="mt-1 text-[11px] text-slate-400">Parents/friends allowed: {p.allow_parents_friends ? 'Yes' : 'No'}</p>
              </div>
            )}

            {/* Nearby connectivity */}
            {p.nearby_landmarks && (
              <div className="mt-4">
                <p className="label">Nearby connectivity</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {Object.entries(p.nearby_landmarks).filter(([k]) => k !== 'transport').map(([k, v]) => (
                    <span key={k} className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700">{k.replace('_', ' ')}: {String(v)}</span>
                  ))}
                  {Array.isArray(p.nearby_landmarks.transport) && p.nearby_landmarks.transport.map((t) => (
                    <span key={t} className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column — privacy gate / unlocked owner card */}
        <div className="mt-5 space-y-5 lg:col-span-2 lg:mt-0">
          {!unlocked ? (
            <LockedLocationCard propertyId={id} />
          ) : (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={18} />
                <p className="text-xs font-bold uppercase tracking-widest">Property Unlocked</p>
              </div>
              <h3 className="mt-2 text-lg font-extrabold text-slate-800">{p.owner_name}</h3>
              <p className="text-xs text-slate-500">Verified owner · {p.owner_verification_status}</p>
              {p.exact_address && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  {p.exact_address}
                </p>
              )}
              {(coords || p.exact_address) && (
                <div className="mt-3">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-slate-100">
                    <iframe
                      title="Google Maps Location"
                      width="100%"
                      height="220"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={
                        mapsKey
                          ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${encodeURIComponent(mapQuery)}&zoom=15`
                          : `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                      }
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between px-1 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 size={13} /> Exact location unlocked
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#4F7A63] hover:underline"
                    >
                      Open in Google Maps ↗
                    </a>
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2">
                {p.owner_phone && (
                  <a href={`tel:${p.owner_phone}`} className="btn-primary w-full">
                    <Phone size={16} /> Call {p.owner_phone}
                  </a>
                )}
                {p.owner_whatsapp && (
                  <a href={`https://wa.me/${p.owner_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-outline w-full">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
                {p.owner_email && (
                  <a href={`mailto:${p.owner_email}`} className="btn-outline w-full">
                    <Mail size={16} /> Email owner
                  </a>
                )}
              </div>
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                <Link to={`/tenant/property/${id}/visit`} className="btn-outline flex-1 text-center text-xs">
                  Book in-person visit
                </Link>
                <button onClick={requestRefund} className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600">
                  <Undo2 size={14} /> Request refund
                </button>
              </div>
            </div>
          )}

          <div className="glass-card p-5">
            <p className="label">Rate this property</p>
            <div className="mt-2 flex items-center justify-between">
              <RatingStars value={rating} interactive onChange={submitRating} />
              <button onClick={reportScam} className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline">
                <Flag size={12} /> Report scam
              </button>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
