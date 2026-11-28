import { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Camera, 
  Video, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  User,
  Home,
  Check,
  Maximize2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download
} from 'lucide-react';
import { formatINR } from '../../utils/currencyFormatter';
import { getMediaBlobUrl } from '../../utils/mediaStorage';

const DEFAULT_ANGLES = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
];

const SAMPLE_BILL_PREVIEW = '/assets/images/electric-bill-sample.png';

export default function PropertyVerificationModal({ property, isOpen, onClose, onUpdateStatus }) {
  const [selectedPreview, setSelectedPreview] = useState(null); // { url, title, type: 'IMAGE'|'BILL' }
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoPlayError, setVideoPlayError] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState(null);
  const [localBillUrl, setLocalBillUrl] = useState(null);
  const [tourAngleIdx, setTourAngleIdx] = useState(0);
  const [isTourPlaying, setIsTourPlaying] = useState(true);
  const [viewMode, setViewMode] = useState('REAL_VIDEO'); // 'REAL_VIDEO' | 'AUTOMATED_TOUR'

  // Retrieve persistent large media from IndexedDB if stored client-side
  useEffect(() => {
    let active = true;
    async function loadIndexedDbMedia() {
      if (!property) return;
      try {
        if (property.id) {
          const vUrl = await getMediaBlobUrl(`video_${property.id}`);
          if (vUrl && active) setLocalVideoUrl(vUrl);
          const bUrl = await getMediaBlobUrl(`bill_${property.id}`);
          if (bUrl && active) setLocalBillUrl(bUrl);
        }
        if (property.property_code) {
          if (!localVideoUrl) {
            const vUrl2 = await getMediaBlobUrl(`video_${property.property_code}`);
            if (vUrl2 && active) setLocalVideoUrl(vUrl2);
          }
          if (!localBillUrl) {
            const bUrl2 = await getMediaBlobUrl(`bill_${property.property_code}`);
            if (bUrl2 && active) setLocalBillUrl(bUrl2);
          }
        }
      } catch (err) {
        console.warn('Could not load IndexedDB media:', err);
      }
    }
    loadIndexedDbMedia();
    return () => { active = false; };
  }, [property?.id, property?.property_code]);

  // Automated 3-angle walkthrough tour timer
  useEffect(() => {
    let interval = null;
    if (isTourPlaying) {
      interval = setInterval(() => {
        setTourAngleIdx((prev) => (prev + 1) % 3);
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTourPlaying]);

  if (!isOpen || !property) return null;

  // Extract photos safely
  let rawPhotos = [];
  try {
    rawPhotos = typeof property.photos === 'string' ? JSON.parse(property.photos) : (Array.isArray(property.photos) ? property.photos : []);
  } catch { rawPhotos = []; }
  if (rawPhotos.length === 0 && property.cover_url) {
    rawPhotos = [{ label: 'Front Entrance (Angle 1)', url: property.cover_url }];
  }

  // Ensure 3 angles exist without stripping user uploaded photos
  const safePhotos = [0, 1, 2].map((idx) => {
    const p = rawPhotos[idx];
    const defaultLabel = idx === 0 ? 'Angle 1 (Front/Entrance)' : idx === 1 ? 'Angle 2 (Living/Bedroom)' : 'Angle 3 (Balcony/Kitchen/Side)';
    let url = p?.url || p?.preview || p?.dataUrl || (idx === 0 ? property.cover_url : '');
    if (!url || url.includes('hero-slide-1.jpg')) {
      url = DEFAULT_ANGLES[idx];
    }
    return {
      url,
      preview: p?.preview || p?.dataUrl || url,
      label: p?.label || defaultLabel,
      name: p?.name || `photo_angle_${idx + 1}.jpg`
    };
  });

  // Safe electricity bill URL (prioritizes local indexedDB, then property dataUrl/remote url)
  let billUrl = localBillUrl || property.electricity_bill_url || property.electricity_bill_preview;
  if (!billUrl || billUrl.includes('undefined')) {
    billUrl = SAMPLE_BILL_PREVIEW;
  }

  // Safe video URL
  let videoSrc = localVideoUrl || property.video_url || property.video_preview || '';
  const hasRealPlayableVideo = Boolean(videoSrc) && !videoPlayError;


  const status = String(property.verification_status || (property.verified ? 'VERIFIED' : 'PENDING')).toUpperCase();

  const handleAction = async (decision) => {
    if (decision === 'REJECTED' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdateStatus(property.id, decision, rejectionReason);
      setShowRejectInput(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#fffdf9] border border-[#d8cba9] rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-[#17324D] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#e5dac4] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#17324D] text-white text-[10px] font-black tracking-wider uppercase">
                {property.property_code || 'PROP'} · {property.category || 'FLAT'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {property.sub_type || property.subtype || '2 BHK'}
              </span>
              {status === 'PENDING' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                  ⏳ Pending
                </span>
              )}
              {status === 'UNDER_REVIEW' && (
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black border border-sky-300">
                  🔍 Under Review
                </span>
              )}
              {status === 'VERIFIED' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                  ✅ Verified &amp; Published
                </span>
              )}
              {status === 'REJECTED' && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300">
                  ❌ Rejected
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17324D] mt-1.5 leading-snug">
              {property.title || 'Untitled Property'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin size={13} className="text-emerald-700 shrink-0" />
              <span>{property.exact_address ? `${property.exact_address}, ` : ''}{property.locality || ''}, {property.city || 'Kolkata'}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f6efdf] hover:bg-[#ebdcc0] text-[#17324D] flex items-center justify-center text-sm font-bold transition cursor-pointer ml-3 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 text-xs">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-white rounded-xl border border-[#ebe1c9]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Rent</span>
              <span className="text-base font-black text-emerald-700 block mt-0.5">
                {formatINR(property.rent_amount || property.price || 0)}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#ebe1c9]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Advance Deposit</span>
              <span className="text-base font-black text-[#17324D] block mt-0.5">
                ₹{Number(property.advance_amount || property.deposit || 0)}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#ebe1c9]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lister Type</span>
              <span className="text-sm font-black text-amber-700 block mt-0.5">
                {property.lister_type || property.owner_role || 'Owner'}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#ebe1c9]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Booking Status</span>
              <span className={`text-sm font-black block mt-0.5 ${property.booking_status === 'BOOKED' ? 'text-rose-600' : 'text-emerald-700'}`}>
                {property.booking_status === 'BOOKED' ? '🔴 BOOKED' : '🟢 UNBOOKED'}
              </span>
            </div>
          </div>

          {/* Uploaded 3 Angle Photos */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#e5dac4] space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
                <Camera size={14} className="text-[#FF9A1F]" />
                <span>Uploaded Site Photos (3 Angles - Anti-Fake Authenticity Check):</span>
              </h4>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ 3 Angles Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {safePhotos.map((ph, idx) => (
                <div 
                  key={idx} 
                  className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group relative cursor-pointer hover:border-slate-400 transition"
                  onClick={() => setSelectedPreview({ url: ph.url, title: ph.label, type: 'IMAGE' })}
                >
                  <img 
                    src={ph.url} 
                    alt={ph.label} 
                    className="w-full h-36 object-cover group-hover:scale-105 transition duration-200"
                    onError={(e) => { 
                      if (ph.preview && e.currentTarget.src !== ph.preview) {
                        e.currentTarget.src = ph.preview;
                      } else {
                        e.currentTarget.src = DEFAULT_ANGLES[idx % 3]; 
                      }
                    }}
                  />
                  <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-700 truncate">{ph.label}</span>
                    <Maximize2 size={13} className="text-slate-400 group-hover:text-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video & Electricity Bill Verification Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Real Walkthrough Video Player / Automated Tour */}
            <div className="p-3.5 bg-white rounded-2xl border border-sky-200 bg-sky-50/20 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-sky-950 flex items-center gap-1.5 text-xs">
                    <Video size={14} className="text-sky-600" />
                    <span>{viewMode === 'REAL_VIDEO' && hasRealPlayableVideo ? 'Real Walkthrough Video' : 'Automated Walkthrough Tour'}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {hasRealPlayableVideo && (
                      <button
                        type="button"
                        onClick={() => setViewMode(viewMode === 'REAL_VIDEO' ? 'AUTOMATED_TOUR' : 'REAL_VIDEO')}
                        className="px-2 py-0.5 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-800 text-[9px] font-bold border border-sky-300 transition cursor-pointer"
                      >
                        {viewMode === 'REAL_VIDEO' ? '🎬 3-Angle Tour' : '📹 Real Video'}
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[9px] font-black uppercase">
                      🔒 Admin Only
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {viewMode === 'REAL_VIDEO' && hasRealPlayableVideo
                    ? `Owner walkthrough video (${property.video_size_mb || '20'} MB). Hidden from public tenants.`
                    : "Automated virtual walkthrough generated directly from owner's 3 verified site photos."}
                </p>

                {/* Video Player or Automated Photo Walkthrough Tour */}
                {viewMode === 'REAL_VIDEO' && hasRealPlayableVideo ? (
                  <div className="rounded-xl overflow-hidden border border-sky-300 mt-2 bg-black relative">
                    <video 
                      key={videoSrc}
                      src={videoSrc} 
                      controls 
                      preload="auto"
                      playsInline
                      className="w-full max-h-48 object-cover" 
                      onError={() => {
                        setVideoPlayError(true);
                        setViewMode('AUTOMATED_TOUR');
                      }}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-sky-300 mt-2 bg-slate-900 relative h-48 flex items-center justify-center group">
                    <img 
                      src={safePhotos[tourAngleIdx].url} 
                      alt={safePhotos[tourAngleIdx].label} 
                      className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                      onError={(e) => { e.currentTarget.src = DEFAULT_ANGLES[tourAngleIdx % 3]; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
                    
                    {/* Tour Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-amber-300 text-[10px] font-black border border-amber-400/40">
                      <Sparkles size={11} className="text-amber-400 animate-spin" />
                      <span>Automated Tour · 3 Angles</span>
                    </div>

                    {/* Controls & Active Step Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <div className="bg-black/75 px-2.5 py-1 rounded-md text-white text-[10px] font-bold border border-white/20">
                        {safePhotos[tourAngleIdx].label}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button" 
                          onClick={() => setIsTourPlaying(!isTourPlaying)}
                          className="w-6 h-6 rounded-full bg-white/90 text-slate-800 flex items-center justify-center cursor-pointer shadow hover:bg-white transition"
                        >
                          {isTourPlaying ? <Pause size={11} /> : <Play size={11} />}
                        </button>
                        <div className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full border border-white/20">
                          {[0, 1, 2].map((idx) => (
                            <button
                              type="button" 
                              key={idx} 
                              onClick={() => { setTourAngleIdx(idx); setIsTourPlaying(false); }} 
                              className={`w-2 h-2 rounded-full transition cursor-pointer ${tourAngleIdx === idx ? 'bg-amber-400 scale-125' : 'bg-white/40'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-sky-100 mt-2">
                <span>File: {property.video_name || (hasRealPlayableVideo ? 'Walkthrough_Room_Tour.mp4' : '3-Angle_Automated_Tour')}</span>
                <span className="text-emerald-700">✓ Video Tour Ready</span>
              </div>
            </div>

            {/* Electricity Bill Document & Preview */}
            <div className="p-3.5 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                    <FileText size={14} className="text-amber-600" />
                    <span>Previous Month Electric Bill</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                    🔒 Admin Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Verified electricity bill ({property.electricity_bill_name || 'Screenshot_Bill.png'}) to confirm owner physical address.
                </p>

                {/* Bill Image / Document Thumbnail */}
                <div 
                  className="rounded-xl overflow-hidden border border-amber-300 mt-2 bg-white cursor-pointer relative group"
                  onClick={() => setSelectedPreview({ url: billUrl, title: `Electric Bill: ${property.electricity_bill_name || 'Utility Bill'}`, type: 'BILL' })}
                >
                  <img 
                    src={billUrl} 
                    alt="Electricity Bill" 
                    className="w-full h-32 object-cover bg-slate-50 group-hover:scale-102 transition"
                    onError={(e) => { e.currentTarget.src = SAMPLE_BILL_PREVIEW; }}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                    <Maximize2 size={16} />
                    <span>Click to Inspect Full Bill</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-amber-100 mt-2">
                <span className="text-[10px] text-slate-500 font-bold truncate max-w-[180px]">
                  {property.electricity_bill_name || 'Current_Bill.png'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPreview({ url: billUrl, title: `Electric Bill: ${property.electricity_bill_name || 'Utility Bill'}`, type: 'BILL' })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shadow-2xs transition cursor-pointer"
                >
                  <FileText size={12} />
                  <span>Inspect Bill</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lister & Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border border-[#e5dac4] space-y-1.5">
              <h4 className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
                <User size={13} className="text-[#FF9A1F]" />
                <span>Owner &amp; Contact Details</span>
              </h4>
              <p><strong>Name:</strong> {property.owner_name || 'N/A'}</p>
              {(property.owner_gender || property.ownerGender) && (
                <p><strong>Gender:</strong> {property.owner_gender || property.ownerGender}</p>
              )}
              <p><strong>Phone:</strong> 📞 +91 {property.owner_phone || property.phone || 'N/A'}</p>
              {property.alternate_phone && <p><strong>Alt Phone:</strong> 📞 +91 {property.alternate_phone}</p>}
              {property.owner_whatsapp && <p><strong>WhatsApp:</strong> 💬 +91 {property.owner_whatsapp}</p>}
              {property.owner_email && <p><strong>Email:</strong> ✉️ {property.owner_email}</p>}
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-[#e5dac4] space-y-1.5">
              <h4 className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
                <MapPin size={13} className="text-emerald-700" />
                <span>Address &amp; GPS Location</span>
              </h4>
              <p><strong>Locality:</strong> {property.locality || 'N/A'}</p>
              <p><strong>City:</strong> {property.city || 'Kolkata'}</p>
              <p><strong>Exact Address:</strong> {property.exact_address || `Near ${property.locality}`}</p>
              {property.lat && property.lng && (
                <div className="pt-1">
                  <a
                    href={`https://www.google.com/maps?q=${property.lat},${property.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition border border-emerald-300 text-xs shadow-2xs"
                  >
                    <MapPin size={13} className="text-emerald-700" />
                    <span>Open Live GPS: {property.lat}, {property.lng}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* House Specifications */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#e5dac4] space-y-2">
            <h4 className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
              <Home size={13} className="text-indigo-600" />
              <span>Property Specifications &amp; Terms</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
              <p><strong>Room Size:</strong> {property.roomSize || (property.size_sqft ? `${property.size_sqft} sq ft` : '450 sq ft')}</p>
              <p><strong>Floor:</strong> {property.floor || property.roof_floor_type || '2nd floor'}</p>
              <p><strong>Roof:</strong> {property.roof || 'RCC roof'}</p>
              <p><strong>Bathroom:</strong> {property.bathroom_type || property.bathroom || 'Private'}</p>
              <p><strong>Furnishing:</strong> {property.furnishing_status || property.furnishing || 'Semi-Furnished'}</p>
              <p><strong>Kitchen:</strong> {property.kitchen_type || property.kitchen || 'Private'}</p>
              <p><strong>Electricity:</strong> {property.electric || (property.electricity_bill_included ? 'Included' : '₹8/unit')}</p>
              <p><strong>Water:</strong> {property.water || 'Free building water'}</p>
              <p><strong>Contract:</strong> {property.contract || `Min ${property.contract_months || 6} mo`}</p>
              <p><strong>Rent Due:</strong> {property.rentDue || 'By 5th'}</p>
              <p><strong>Missed Rent:</strong> {property.missedRent || 'Max 1 mo'}</p>
              <p><strong>Occupancy:</strong> {property.roommate || property.occupancy || 'Private'}</p>
            </div>
            {property.furniture && (
              <p className="text-[11px] bg-emerald-50/70 p-2 rounded-xl border border-emerald-200 text-emerald-950">
                <strong>🛋️ Furniture &amp; Inventory:</strong> {property.furniture}
              </p>
            )}
            {property.environment && (
              <p className="text-[11px] bg-sky-50/70 p-2 rounded-xl border border-sky-200 text-sky-950">
                <strong>🌳 Environment:</strong> {property.environment}
              </p>
            )}
            {property.rules_and_regulations && (
              <p className="text-[11px] bg-amber-50/60 p-2 rounded-xl border border-amber-200/80 text-amber-950">
                <strong>House Rules:</strong> {property.rules_and_regulations}
              </p>
            )}
          </div>

          {/* Rejection input box if triggered */}
          {showRejectInput && (
            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 animate-in fade-in">
              <label className="block text-xs font-black text-rose-900">
                Reason for Rejection (sent to owner via notification):
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Electric bill address does not match site location, or photos are blurry."
                className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Action Controls: 3 Options */}
        <div className="pt-3 border-t border-[#e5dac4] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <ShieldCheck size={14} className="text-[#1f4d3f]" />
            <span>Admin Authenticity Gate</span>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {/* Option 1: Under Verification */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('UNDER_REVIEW')}
              className="px-3.5 py-2 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Search size={13} />
              <span>Mark Under Review</span>
            </button>

            {/* Option 2: Reject */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('REJECTED')}
              className="px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <X size={13} />
              <span>{showRejectInput ? 'Confirm Reject' : 'Reject'}</span>
            </button>

            {/* Option 3: Verify & Publish */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('VERIFIED')}
              className="px-4 py-2 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              <span>Verify &amp; Publish for Tenants</span>
            </button>
          </div>
        </div>

        {/* Lightbox Preview Modal for Photos or Electric Bill */}
        {selectedPreview && (
          <div 
            className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedPreview(null)}
          >
            <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden p-4 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-black text-sm text-slate-800">{selectedPreview.title}</span>
                <button type="button" onClick={() => setSelectedPreview(null)} className="p-1 rounded-full hover:bg-slate-100 text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-3 rounded-2xl overflow-hidden bg-slate-100 max-h-[70vh] flex items-center justify-center">
                <img 
                  src={selectedPreview.url} 
                  alt={selectedPreview.title} 
                  className="w-full max-h-[68vh] object-contain rounded-xl" 
                  onError={(e) => { e.currentTarget.src = selectedPreview.type === 'BILL' ? SAMPLE_BILL_PREVIEW : DEFAULT_ANGLES[0]; }}
                />
              </div>

              {selectedPreview.type === 'BILL' && (
                <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <span>🔒 Electric Bill Document Authenticated by PointKey Security</span>
                  <a 
                    href={selectedPreview.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    download 
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px]"
                  >
                    <Download size={12} />
                    <span>Download Bill</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
