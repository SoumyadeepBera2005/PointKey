import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MessageCircle, 
  BedDouble, 
  Bath, 
  Zap, 
  Droplets, 
  CalendarClock, 
  Flag, 
  Undo2, 
  CheckCircle2, 
  Utensils, 
  Ruler, 
  Home as HomeIcon,
  Lock,
  Unlock,
  ExternalLink,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import TimestampGallery from '../../components/property/TimestampGallery';
import RatingStars from '../../components/ui/RatingStars';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/common/Toast';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../services/api';
import { formatINR } from '../../utils/currencyFormatter';
import { SAMPLE_PROPERTIES } from '../../data/sampleProperties';
import { useAuth } from '../../context/AuthContext';
import { subscribeRealtime } from '../../services/realtimeSync';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
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
        let prop = data.property;
        if (prop) {
          // Extract owner uploaded photos so tenant sees real images
          let photos = [];
          try {
            photos = typeof prop.photos === 'string' ? JSON.parse(prop.photos) : (Array.isArray(prop.photos) ? prop.photos : []);
          } catch { }

          try {
            const localProps = [
              ...JSON.parse(localStorage.getItem('prent_verified_admin_properties') || '[]'),
              ...JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]'),
              ...JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]'),
            ];
            const matchedLocal = localProps.find(
              (lp) => String(lp.id) === String(id) || String(lp.property_code) === String(id)
            );
            if (matchedLocal) {
              let matchedPhotos = [];
              try {
                matchedPhotos = typeof matchedLocal.photos === 'string' ? JSON.parse(matchedLocal.photos) : (Array.isArray(matchedLocal.photos) ? matchedLocal.photos : []);
              } catch { }
              if (matchedPhotos.length > 0 && photos.length === 0) {
                photos = matchedPhotos;
              }
              if (!prop.video_url && matchedLocal.video_url) {
                prop.video_url = matchedLocal.video_url;
              }
            }
          } catch { }

          if (photos.length > 0) {
            prop.media = photos.map((ph, idx) => ({
              id: `angle-${idx + 1}`,
              room_tag: ph.label || `Angle ${idx + 1}`,
              media_type: 'IMAGE',
              media_url: ph.url || ph.preview || (typeof ph === 'string' ? ph : ''),
              category: 'ROOM',
              captured_date: prop.created_at || new Date().toISOString(),
            })).filter((m) => Boolean(m.media_url));
          }
        }
        setProperty(prop);
        setUnlocked(Boolean(data.unlocked || isLocallyUnlocked));
      })
      .catch(() => {
        // 1. Check local storage first for user-posted or admin-verified property!
        try {
          const localProps = [
            ...JSON.parse(localStorage.getItem('prent_verified_admin_properties') || '[]'),
            ...JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]'),
            ...JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]'),
          ];
          const matched = localProps.find(
            (lp) => String(lp.id) === String(id) || String(lp.property_code) === String(id)
          );
          if (matched) {
            let photos = [];
            try {
              photos = typeof matched.photos === 'string' ? JSON.parse(matched.photos) : (Array.isArray(matched.photos) ? matched.photos : []);
            } catch { }
            const mediaList = photos.map((ph, idx) => ({
              id: `angle-${idx + 1}`,
              room_tag: ph.label || `Angle ${idx + 1}`,
              media_type: 'IMAGE',
              media_url: ph.url || ph.preview || (typeof ph === 'string' ? ph : ''),
              category: 'ROOM',
              captured_date: matched.created_at || new Date().toISOString(),
            })).filter((m) => Boolean(m.media_url));

            setProperty({
              ...matched,
              rent_amount: matched.rent_amount || matched.price,
              advance_amount: matched.advance_amount || matched.deposit,
              locality: matched.locality || 'Area',
              city: matched.city || 'Kolkata',
              media: mediaList.length > 0 ? mediaList : (matched.cover_url ? [{ id: 'cov-1', room_tag: 'Main View', media_url: matched.cover_url, media_type: 'IMAGE' }] : []),
            });
            setUnlocked(isLocallyUnlocked);
            return;
          }
        } catch { }

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

  // Real-time synchronization: live status & unlock update without page refresh
  useEffect(() => {
    const handleUnlock = () => {
      try {
        const unlockedLocal = JSON.parse(localStorage.getItem('prent_unlocked_properties') || '[]');
        if (unlockedLocal.includes(String(id))) {
          setUnlocked(true);
        }
      } catch {}
    };

    window.addEventListener('prent_property_unlocked', handleUnlock);

    const unsubscribe = subscribeRealtime((event) => {
      if (event?.type === 'PROPERTY_UNLOCKED' && String(event.payload?.property_id) === String(id)) {
        setUnlocked(true);
      }
      if (
        (event?.type === 'PROPERTY_STATUS' || event?.type === 'PROPERTY_SYNC') &&
        String(event.payload?.id) === String(id)
      ) {
        if (event.payload.status) {
          setProperty((prev) => (prev ? { ...prev, verification_status: event.payload.status } : prev));
        }
      }
    });
    return () => {
      window.removeEventListener('prent_property_unlocked', handleUnlock);
      unsubscribe();
    };
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

  // Facts for "Property overview"
  const facts = [
    { label: 'Room size', value: p.roomSize || (p.size_sqft ? `${p.size_sqft} sq ft` : '424 sq ft') },
    { label: 'Floor', value: p.floor || p.roof_floor_type || '3rd floor / 8 floors' },
    { label: 'Roof', value: p.roof || 'RCC roof' },
    { label: 'Environment', value: p.environment || 'Well-connected residential area with nearby shops, transport and daily essentials' }
  ];

  // Details for "Rooms & facilities"
  const details = [
    { label: 'Bathrooms', value: p.bathroom || (p.bathroom_type === 'PRIVATE' ? 'Private' : 'Common') },
    { label: 'Kitchen', value: p.kitchen || (p.kitchen_available ? 'Available' : "Don't need") },
    { label: 'Electricity', value: p.electric || (p.electricity_bill_included ? 'Included in rent' : '₹8/unit') },
    { label: 'Water', value: p.water || (p.water_bill_included ? 'Free — standard building water supply' : 'Free — standard building water supply') },
    { label: 'Furniture & appliances', value: p.furniture || (Array.isArray(p.room_materials) && p.room_materials.length > 0 ? p.room_materials.map(m => `${m}: Yes`).join(' · ') : 'Bed: Yes · Table: Yes · Chair: Yes · Light: Yes · Fan: Yes') },
    { label: 'Roommates', value: p.roommate || (p.sub_type ? `${p.sub_type} occupancy` : '3 resident(s)') },
    { label: 'Visitors', value: p.visitors || (p.allow_parents_friends ? 'Visitors allowed subject to house/building rules' : 'Visitors allowed subject to house/building rules') }
  ];

  // Terms for "💰 Rent & payment terms"
  const terms = [
    { label: 'Monthly rent', value: formatINR(p.rent_amount || p.price || 12000) },
    { label: 'Advance / deposit', value: formatINR(p.advance_amount || p.deposit || 24000) },
    { label: 'Minimum stay / contract', value: p.contract || `Minimum ${p.contract_months || 1} months` },
    { label: 'Rent due date', value: p.rentDue || 'Rent due by the 5th of every month' },
    { label: 'Missed rent limit', value: p.missedRent || 'Maximum 1 month can remain unpaid' }
  ];

  // Rules for "📜 Rules & regulations"
  const rules = Array.isArray(p.rules) && p.rules.length > 0
    ? p.rules
    : (typeof p.rules_and_regulations === 'string' && p.rules_and_regulations.length > 5
      ? p.rules_and_regulations.split(/[.\n]+/).map(s => s.trim()).filter(Boolean)
      : [
          'No illegal activities',
          'No structural changes without owner approval',
          'Keep common areas clean',
          'Follow building quiet hours',
          'Owner approval required for commercial use'
        ]);

  // Nearby places & transport
  const nearbyPlaces = Array.isArray(p.nearby) && p.nearby.length > 0
    ? p.nearby.map(x => ({ icon: x[0], name: x[1], distance: x[2], desc: x[3] }))
    : [
        { icon: '🏧', name: `Bank/ATM — ${p.locality || 'Ballygunge'}`, distance: '0.6 km', desc: 'ATM and basic banking services' },
        { icon: '🛒', name: `Local Market — ${p.locality || 'Ballygunge'}`, distance: '0.9 km', desc: 'Groceries and daily essentials' },
        { icon: '🏥', name: `Nearby Clinic/Hospital — ${p.locality || 'Ballygunge'}`, distance: '1.8 km', desc: 'Medical and emergency support' },
        { icon: '🚇', name: `Nearest Metro/Transit — ${p.locality || 'Ballygunge'}`, distance: '2.2 km', desc: 'Public transport connection' }
      ];

  const transportModes = Array.isArray(p.transport) && p.transport.length > 0
    ? p.transport.map(x => ({ icon: x[0], name: x[1], desc: x[2] }))
    : [
        { icon: '🛺', name: 'Auto', desc: 'Easy local rides' },
        { icon: '🛵', name: 'Toto / E-rickshaw', desc: 'Short-distance connectivity' },
        { icon: '🚌', name: 'Bus', desc: 'Regular city routes' },
        { icon: '🚕', name: 'Cab / App Cab', desc: 'Door-to-door travel' },
        { icon: '🚇', name: 'Metro / Transit', desc: 'Fast city commute' }
      ];

  const handlePayClick = (e) => {
    if (!user) {
      e?.preventDefault?.();
      openAuthModal?.('input', 'tenant', 'Please log in to pay and unlock property details.');
      return;
    }
    if (isSuspended) {
      e?.preventDefault?.();
      alert('⚠️ Payment disabled: Your account is suspended (Strike 1). Open the NestAI chatbot to submit an unblock appeal.');
      return;
    }
    if (isBlocked) {
      e?.preventDefault?.();
      alert('⛔ Account Permanently Blocked (Strike 2): You cannot unlock properties or make payments.');
      return;
    }
    navigate(`/tenant/property/${id}/checkout`);
  };

  const handleContactClick = () => {
    if (!unlocked) {
      handlePayClick();
      return;
    }
    if (p.owner_phone) {
      window.open(`tel:${p.owner_phone}`, '_self');
    } else if (p.owner_whatsapp) {
      window.open(`https://wa.me/${p.owner_whatsapp.replace(/\D/g, '')}`, '_blank');
    } else {
      setToast({ type: 'info', message: `Owner contact: ${p.owner_name} · ${p.owner_email || 'Verified on PointKey'}` });
    }
  };

  const handleVisitClick = () => {
    if (!user) {
      openAuthModal?.('input', 'tenant', 'Please log in to request a property visit.');
      return;
    }
    navigate(`/tenant/property/${id}/visit`);
  };

  const handleBookingClick = () => {
    if (!user) {
      openAuthModal?.('input', 'tenant', 'Please log in to book this property.');
      return;
    }
    navigate(`/tenant/property/${id}/checkout`);
  };

  return (
    <div className="min-h-screen bg-[#f6efdf] text-[#141414] pb-24 md:pb-16 font-sans">
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

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-7">
        {/* Breadcrumb matching video: Home › Explore Homes › Property details */}
        <div className="text-xs text-[#5b5547] flex items-center gap-1.5 font-medium">
          <Link to="/" className="hover:underline">Home</Link>
          <span>›</span>
          <Link to="/" className="hover:underline">Explore Homes</Link>
          <span>›</span>
          <span className="font-extrabold text-[#1f4d3f] truncate">{p.title || 'Property details'}</span>
        </div>

        {/* HERO SECTION matching video */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Gallery / Automated Video Tour (Left 3 cols) */}
          <div className="lg:col-span-3">
            <TimestampGallery 
              media={p.media} 
              videoUrl={p.video_url} 
              propertyTitle={p.title} 
              property={p} 
            />
          </div>

          {/* Hero Card (Right 2 cols) */}
          <aside className="lg:col-span-2 rounded-3xl bg-white/95 border border-[#1f4d3f]/30 p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
                  <ShieldCheck size={13} /> VERIFIED PROPERTY
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                  {p.category} · {String(p.sub_type || p.type || '').replace('_', ' ')}
                </span>
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-black text-slate-800 leading-tight">
                {p.title}
              </h1>

              <div className="mt-1 flex items-center gap-1.5 text-sm text-[#5b5547]">
                <MapPin size={15} className="text-[#1f4d3f] shrink-0" />
                <span>{p.locality}, {p.city || 'Kolkata'}</span>
                {!unlocked && <span className="text-slate-400 text-xs"> — exact address locked</span>}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <RatingStars value={Number(p.average_rating || 4.8)} />
                <span className="text-xs font-bold text-slate-600">({p.average_rating || 4.8} / 5.0)</span>
              </div>

              <div className="mt-4 text-3xl font-black text-[#1f4d3f]">
                {formatINR(p.rent_amount || p.price || 12000)}
                <span className="text-xs font-semibold text-slate-500"> /month</span>
              </div>

              {/* Mini Grid matching reference video */}
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-[#ebe1c9] bg-[#fbf7f0] p-3 text-left transition hover:-translate-y-0.5">
                  <small className="block text-[10px] font-semibold text-[#5b5547] uppercase tracking-wider">Type</small>
                  <b className="mt-0.5 block text-xs font-black text-slate-800">{p.sub_type || p.type || p.category || '1 BHK'}</b>
                </div>
                <div className="rounded-2xl border border-[#ebe1c9] bg-[#fbf7f0] p-3 text-left transition hover:-translate-y-0.5">
                  <small className="block text-[10px] font-semibold text-[#5b5547] uppercase tracking-wider">Availability</small>
                  <b className="mt-0.5 block text-xs font-black text-emerald-700">{p.availability || (p.booking_status === 'BOOKED' ? 'Booked' : 'Available now')}</b>
                </div>
                <div className="rounded-2xl border border-[#ebe1c9] bg-[#fbf7f0] p-3 text-left transition hover:-translate-y-0.5">
                  <small className="block text-[10px] font-semibold text-[#5b5547] uppercase tracking-wider">Deposit</small>
                  <b className="mt-0.5 block text-xs font-black text-slate-800">{formatINR(p.advance_amount || p.deposit || 24000)}</b>
                </div>
                <div className="rounded-2xl border border-[#ebe1c9] bg-[#fbf7f0] p-3 text-left transition hover:-translate-y-0.5">
                  <small className="block text-[10px] font-semibold text-[#5b5547] uppercase tracking-wider">Contract</small>
                  <b className="mt-0.5 block text-xs font-black text-slate-800">{p.contract || `Minimum ${p.contract_months || 6} months`}</b>
                </div>
              </div>
            </div>

            {/* Unlock Button matching video */}
            <div className="mt-6">
              {!unlocked ? (
                <button
                  type="button"
                  onClick={handlePayClick}
                  className="w-full rounded-2xl py-3.5 px-4 font-black text-sm text-white bg-gradient-to-r from-[#1f4d3f] via-[#e08a1e] to-[#1f2f6b] hover:opacity-95 shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Lock size={16} />
                  <span>Unlock exact location + owner contact</span>
                </button>
              ) : (
                <div className="w-full rounded-2xl py-3 px-4 text-center font-black text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>Property Unlocked · Verified Access</span>
                </div>
              )}
              <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
                100% refundable if your room is not confirmed
              </p>
            </div>
          </aside>
        </section>

        {/* SECTION 1: Property overview */}
        <section className="rounded-3xl bg-white/95 border border-[#1f4d3f]/25 p-6 sm:p-7 shadow-md">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#1f4d3f] to-[#e08a1e]" />
            <span>Property overview</span>
          </h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {facts.map((f, i) => (
              <div key={i} className="rounded-2xl border border-[#ebe1c9] bg-gradient-to-br from-[#fbf7f0] to-[#f4ebe0] p-4 transition hover:-translate-y-1 hover:shadow-md">
                <span className="block text-[11px] font-bold text-[#5b5547] uppercase tracking-wider">{f.label}</span>
                <b className="mt-1 block text-sm sm:text-base font-black text-slate-800">{f.value}</b>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Rooms & facilities */}
        <section className="rounded-3xl bg-white/95 border border-[#1f4d3f]/25 p-6 sm:p-7 shadow-md">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#1f2f6b] to-[#1f4d3f]" />
            <span>Rooms & facilities</span>
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {details.map((d, i) => (
              <div key={i} className="rounded-2xl border border-[#ebe1c9] bg-[#fbf7f0] p-4 transition hover:-translate-y-0.5">
                <h3 className="text-xs font-bold text-[#5b5547] uppercase tracking-wider">{d.label}</h3>
                <p className="mt-1 text-sm font-black text-slate-800">{d.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: 💰 Rent & payment terms */}
        <section className="rounded-3xl bg-white/95 border border-[#1f4d3f]/25 p-6 sm:p-7 shadow-md">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#e08a1e] to-[#1f4d3f]" />
            <span>💰 Rent & payment terms</span>
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {terms.map((t, i) => (
              <div key={i} className="rounded-2xl border border-[#ebe1c9] bg-[#fbf7f0] p-4 transition hover:-translate-y-0.5">
                <h3 className="text-xs font-bold text-[#5b5547] uppercase tracking-wider">{t.label}</h3>
                <p className="mt-1 text-sm font-black text-slate-800">{t.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: 📜 Rules & regulations */}
        <section className="rounded-3xl bg-white/95 border border-[#1f4d3f]/25 p-6 sm:p-7 shadow-md">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#e08a1e] to-[#1f4d3f]" />
            <span>📜 Rules & regulations</span>
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {rules.map((rule, idx) => (
              <div key={idx} className="rounded-2xl border border-[#ebe1c9] bg-[#fbf7f0] p-3.5 text-xs font-bold text-slate-800 flex items-center gap-2.5 transition hover:translate-x-1">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs">✓</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: 📍 Nearby places & transport */}
        <section className="rounded-3xl bg-white/95 border border-[#1f4d3f]/25 p-6 sm:p-7 shadow-md">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#1f2f6b] to-[#1f4d3f]" />
            <span>📍 Nearby places & transport</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#5b5547]">
            Useful places around this property — with names, approximate distance and quick map access. In the production version, PointKey can populate these automatically from Google Places/Maps.
          </p>

          {/* 4 Places Grid matching reference video */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {nearbyPlaces.map((pl, idx) => (
              <div key={idx} className="rounded-2xl border border-[#ebe1c9] bg-[#fbf7f0] p-4 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-md">
                <div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#ebe1c9] flex items-center justify-center text-xl shrink-0 shadow-xs">
                      {pl.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-tight">{pl.name}</h4>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white border border-[#ebe1c9] text-[10px] font-bold text-[#1f2f6b]">
                        📍 {pl.distance} away
                      </span>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[11px] text-[#5b5547] leading-relaxed">{pl.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pl.name} ${p.locality || ''} ${p.city || 'Kolkata'}`)}`, '_blank')}
                  className="mt-3 w-full rounded-xl py-2 px-3 bg-gradient-to-r from-[#1f2f6b] to-[#1f4d3f] text-white text-[11px] font-black hover:opacity-90 shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={12} />
                  <span>🗺️ View on Google Maps</span>
                </button>
              </div>
            ))}
          </div>

          {/* Transport Box matching video */}
          <div className="mt-5 rounded-2xl border border-[#ebe1c9] bg-gradient-to-r from-[#fbf7f0] to-[#f4ebe0] p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-black text-[#1f4d3f] flex items-center gap-2">
              <span>🚦 Transport available</span>
            </h3>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {transportModes.map((t, idx) => (
                <div key={idx} className="rounded-xl border border-[#ebe1c9] bg-white p-3 text-center transition hover:-translate-y-1 hover:shadow-sm">
                  <div className="text-2xl">{t.icon}</div>
                  <b className="mt-1 block text-xs font-black text-slate-800">{t.name}</b>
                  <span className="mt-0.5 block text-[10px] text-[#5b5547]">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[#5b5547]">
            Prototype distances and place names are sample data. Live PointKey listings can use Google Places/Maps to calculate current distance and route information.
          </p>
        </section>

        {/* SECTION 6: Exact location & owner contact are protected Banner matching video */}
        <section className="rounded-3xl bg-gradient-to-r from-[#17324D] via-[#1f4d3f] to-[#1f4d3f] text-white p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Exact location & owner contact are protected
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              To reduce unwanted visits, spam and privacy risks, PointKey keeps these two sensitive details locked until the tenant completes the unlock payment.
            </p>
            <ul className="list-disc list-inside text-xs text-emerald-200/90 pt-1 space-y-1">
              <li>Exact room/property location on Google Maps</li>
              <li>Verified property owner contact details</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={handlePayClick}
            className="shrink-0 rounded-2xl py-3.5 px-6 font-black text-sm text-[#1f4d3f] bg-white hover:bg-emerald-50 shadow-lg shadow-black/20 transition-all cursor-pointer whitespace-nowrap active:scale-98"
          >
            {unlocked ? '✓ Already Unlocked' : `Unlock for ${formatINR(p.advance_amount || 49)}`}
          </button>
        </section>

        {/* SECTION 7: 🔐 Exact location & owner details matching video */}
        <section className="rounded-3xl bg-white/95 border border-[#1f4d3f]/25 p-6 sm:p-7 shadow-md space-y-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#1f4d3f] to-[#1f2f6b]" />
            <span>🔐 Exact location & owner details</span>
          </h2>

          {/* Google Maps Embed / Lock Container */}
          <div className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden border border-[#ebe1c9] bg-gradient-to-br from-[#f6efdf] to-[#e3ecdf] shadow-inner">
            {!unlocked ? (
              // Map Lock Screen matching video
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-white/70 backdrop-blur-xs">
                <div className="max-w-xs rounded-2xl border border-[#ebe1c9] bg-white p-5 text-center shadow-2xl">
                  <div className="text-4xl">📍</div>
                  <h3 className="mt-2 text-base font-black text-slate-800">Exact location locked</h3>
                  <p className="mt-1 text-xs text-[#5b5547] leading-relaxed">
                    Pay the unlock fee to reveal the exact Google Maps location and verified owner details.
                  </p>
                  <button
                    type="button"
                    onClick={handlePayClick}
                    className="mt-3.5 w-full rounded-xl py-2 px-3 bg-[#1f4d3f] text-white text-xs font-black hover:bg-[#17324D] transition cursor-pointer"
                  >
                    Unlock Location & Owner
                  </button>
                </div>
              </div>
            ) : (
              // Unlocked Live Interactive Map
              <iframe
                title="Google Maps Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={
                  mapsKey
                    ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${encodeURIComponent(mapQuery)}&zoom=15`
                    : `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                }
              />
            )}
          </div>

          {unlocked && (
            <div className="flex items-center justify-between px-1 text-xs font-semibold text-emerald-700">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} /> Exact Google Maps location unlocked
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#1f4d3f] hover:underline flex items-center gap-1"
              >
                <span>Open in Google Maps</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* 4 Owner Details Cards matching video */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            <div className="rounded-2xl border border-[#ebe1c9] bg-gradient-to-br from-white to-[#fbf7f0] p-4 transition hover:-translate-y-0.5">
              <small className="block text-[10px] font-bold text-[#5b5547] uppercase tracking-wider">Owner name</small>
              <strong className="mt-1 block text-sm font-black text-slate-800 truncate">
                {unlocked ? (p.owner_name || p.owner || 'Verified Landlord') : '🔒 Locked'}
              </strong>
            </div>
            <div className="rounded-2xl border border-[#ebe1c9] bg-gradient-to-br from-white to-[#fbf7f0] p-4 transition hover:-translate-y-0.5">
              <small className="block text-[10px] font-bold text-[#5b5547] uppercase tracking-wider">Gender</small>
              <strong className="mt-1 block text-sm font-black text-slate-800">
                {unlocked ? (p.owner_gender || p.ownerGender || 'Landlord') : '🔒 Locked'}
              </strong>
            </div>
            <div className="rounded-2xl border border-[#ebe1c9] bg-gradient-to-br from-white to-[#fbf7f0] p-4 transition hover:-translate-y-0.5">
              <small className="block text-[10px] font-bold text-[#5b5547] uppercase tracking-wider">Contact number</small>
              <strong className="mt-1 block text-sm font-black text-slate-800 truncate">
                {unlocked ? (p.owner_phone || p.contact || '+91 98300 12345') : '🔒 Locked'}
              </strong>
            </div>
            <div className="rounded-2xl border border-[#ebe1c9] bg-gradient-to-br from-white to-[#fbf7f0] p-4 transition hover:-translate-y-0.5">
              <small className="block text-[10px] font-bold text-[#5b5547] uppercase tracking-wider">Email ID</small>
              <strong className="mt-1 block text-sm font-black text-slate-800 truncate">
                {unlocked ? (p.owner_email || 'owner@pointkey.in') : '🔒 Locked'}
              </strong>
            </div>
          </div>

          {/* 3 Action Buttons matching video */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleContactClick}
              className="rounded-2xl py-3.5 px-4 font-black text-xs text-white bg-gradient-to-r from-[#1f4d3f] to-[#e08a1e] hover:opacity-95 shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <MessageCircle size={15} />
              <span>💬 Request to Contact</span>
            </button>
            <button
              type="button"
              onClick={handleVisitClick}
              className="rounded-2xl py-3.5 px-4 font-black text-xs text-[#1f4d3f] bg-white border border-[#ebe1c9] hover:bg-slate-50 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CalendarDays size={15} />
              <span>📅 Request to Visit Property</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBookingClick}
            className="w-full rounded-2xl py-4 px-4 font-black text-sm text-white bg-gradient-to-r from-[#1f4d3f] via-[#17324D] to-[#1f4d3f] hover:opacity-95 shadow-lg shadow-black/15 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>🏠 Book This Property</span>
          </button>
        </section>

        {/* SECTION 8: Rate & Report Scam */}
        <section className="rounded-3xl bg-white/95 border border-[#1f4d3f]/25 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#5b5547] uppercase tracking-wider">Rate this property</p>
            <div className="mt-1.5">
              <RatingStars value={rating} interactive onChange={submitRating} />
            </div>
          </div>
          <button
            type="button"
            onClick={reportScam}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            <Flag size={13} />
            <span>Report scam / incorrect details</span>
          </button>
        </section>
      </main>

      <BottomNav />
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
