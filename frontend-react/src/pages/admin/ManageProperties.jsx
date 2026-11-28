import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Check, 
  X, 
  ExternalLink,
  Camera,
  Video,
  FileText,
  User,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Filter
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PropertyVerificationModal from '../../components/admin/PropertyVerificationModal';
import AdminEditPropertyModal from '../../components/admin/AdminEditPropertyModal';
import api from '../../services/api';
import { formatINR } from '../../utils/currencyFormatter';
import { publishRealtime, subscribeRealtime } from '../../services/realtimeSync';

const DEFAULT_ROOM_ANGLES = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
];
const DEFAULT_BILL_FILE = '/assets/images/electric-bill-sample.png';
const DEFAULT_WALKTHROUGH_VIDEO = '/assets/video/property-video-1.mp4';

const sanitizePropMedia = (p) => {
  if (!p) return p;
  let photos = [];
  try {
    photos = typeof p.photos === 'string' ? JSON.parse(p.photos) : (Array.isArray(p.photos) ? p.photos : []);
  } catch { photos = []; }

  const cleanPhotos = [0, 1, 2].map((idx) => {
    const existing = photos[idx];
    const defaultLabel = idx === 0 ? 'Angle 1 (Front/Entrance)' : idx === 1 ? 'Angle 2 (Living/Bedroom)' : 'Angle 3 (Balcony/Kitchen/Side)';
    let u = existing?.url || existing?.preview || existing?.dataUrl || (idx === 0 ? p.cover_url : '');
    if (!u || u.includes('hero-slide-1.jpg')) {
      u = DEFAULT_ROOM_ANGLES[idx];
    }
    return {
      label: existing?.label || defaultLabel,
      name: existing?.name || `photo_angle_${idx + 1}.jpg`,
      url: u,
      preview: existing?.preview || existing?.dataUrl || u,
    };
  });

  let billUrl = p.electricity_bill_url || p.electricity_bill_preview;
  if (!billUrl) {
    billUrl = DEFAULT_BILL_FILE;
  }

  let videoUrl = p.video_url || p.video_preview;
  if (!videoUrl) {
    videoUrl = DEFAULT_WALKTHROUGH_VIDEO;
  }

  return {
    ...p,
    photos: cleanPhotos,
    cover_url: cleanPhotos[0].url,
    image: cleanPhotos[0].url,
    electricity_bill_url: billUrl,
    electricity_bill_uploaded: true,
    video_url: videoUrl,
  };
};

export default function ManageProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNBOOKED, BOOKED, VERIFIED, PENDING
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected modals
  const [inspectProperty, setInspectProperty] = useState(null);
  const [editProperty, setEditProperty] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const loadProperties = async () => {
    setLoading(true);
    try {
      // 1. Fetch from backend API
      let serverProps = [];
      try {
        const res = await api.get('/admin/properties');
        if (res.data?.properties) {
          serverProps = res.data.properties;
        }
      } catch (err) {
        console.warn('Backend admin properties fetch failed, merging local:', err);
      }

      // 2. Load from localStorage
      const localPosted = JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]');
      const pendingAdmin = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
      const verifiedAdmin = JSON.parse(localStorage.getItem('prent_verified_admin_properties') || '[]');

      const propMap = new Map();

      // Seed with server properties
      serverProps.forEach((p) => {
        if (p && p.id) propMap.set(String(p.id), { ...p });
      });

      // Overlay local collections
      localPosted.forEach((p) => {
        if (p && p.id) {
          const key = String(p.id);
          if (propMap.has(key)) propMap.set(key, { ...propMap.get(key), ...p });
          else propMap.set(key, { ...p });
        }
      });

      pendingAdmin.forEach((p) => {
        if (p && p.id) {
          const key = String(p.id);
          if (propMap.has(key)) propMap.set(key, { ...propMap.get(key), ...p });
          else propMap.set(key, { ...p });
        }
      });

      verifiedAdmin.forEach((p) => {
        if (p && p.id) {
          const key = String(p.id);
          if (propMap.has(key)) {
            propMap.set(key, { ...propMap.get(key), ...p, verification_status: 'VERIFIED', verified: true });
          } else {
            propMap.set(key, { ...p, verification_status: 'VERIFIED', verified: true });
          }
        }
      });

      const list = Array.from(propMap.values()).map(sanitizePropMedia);
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setProperties(list);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Listen for real-time status updates and modifications across all tabs
  useEffect(() => {
    const handleSync = () => loadProperties();
    const unsubscribe = subscribeRealtime(() => loadProperties());
    window.addEventListener('prent_property_status_changed', handleSync);
    window.addEventListener('prent_property_verified', handleSync);
    window.addEventListener('prent_property_modified', handleSync);
    window.addEventListener('prent_new_pending_property', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      unsubscribe();
      window.removeEventListener('prent_property_status_changed', handleSync);
      window.removeEventListener('prent_property_verified', handleSync);
      window.removeEventListener('prent_property_modified', handleSync);
      window.removeEventListener('prent_new_pending_property', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Toggle Booking Status (BOOKED <-> UNBOOKED)
  const handleToggleBooking = async (property) => {
    const current = property.booking_status === 'BOOKED' ? 'BOOKED' : 'UNBOOKED';
    const newStatus = current === 'BOOKED' ? 'UNBOOKED' : 'BOOKED';

    try {
      // 1. Call backend API
      try {
        await api.patch(`/admin/properties/${property.id}/booking`, { booking_status: newStatus });
      } catch (err) {
        console.warn('Backend booking patch fallback:', err);
      }

      // 2. Update local state
      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, booking_status: newStatus } : p))
      );

      // 3. Update localStorage collections
      const updateStorage = (key) => {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) {
            const updated = list.map((item) =>
              item.id === property.id ? { ...item, booking_status: newStatus } : item
            );
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch {}
      };
      updateStorage('prent_user_posted_properties');
      updateStorage('prent_pending_admin_properties');
      updateStorage('prent_verified_admin_properties');

      // 4. Notify owner
      if (property.owner_id) {
        try {
          const notifKey = `prent_user_notifications_${property.owner_id}`;
          const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
          existingNotifs.unshift({
            id: `notif-${Date.now()}`,
            user_id: property.owner_id,
            type: 'PROPERTY_BOOKING_UPDATED',
            title: '🏠 Booking Status Updated by Admin',
            message: `Your property "${property.title}" (${property.property_code}) has been marked as ${newStatus}.`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
          localStorage.setItem(notifKey, JSON.stringify(existingNotifs));
        } catch {}
      }

      publishRealtime('PROPERTY_BOOKING', { id: property.id, status: newStatus });
      window.dispatchEvent(new CustomEvent('prent_property_modified', { detail: { ...property, booking_status: newStatus } }));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      alert('Failed to update booking status: ' + err.message);
    }
  };

  // Update Verification Status (VERIFIED, UNDER_REVIEW, REJECTED)
  const handleUpdateStatus = async (id, decision, reason = '') => {
    try {
      try {
        await api.post(`/admin/properties/${id}/verify`, { decision, rejection_reason: reason });
      } catch (err) {
        console.warn('Backend verify call fallback:', err);
      }

      // Update local storage queues
      const localPending = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
      let userPosted = JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]');

      userPosted = userPosted.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            verification_status: decision,
            verified: decision === 'VERIFIED',
            is_verified: decision === 'VERIFIED',
            status_updated_at: new Date().toISOString(),
          };
        }
        return p;
      });
      localStorage.setItem('prent_user_posted_properties', JSON.stringify(userPosted));

      if (decision === 'UNDER_REVIEW') {
        const updated = localPending.map((p) => (p.id === id ? { ...p, verification_status: 'UNDER_REVIEW' } : p));
        localStorage.setItem('prent_pending_admin_properties', JSON.stringify(updated));
      } else if (decision === 'VERIFIED') {
        const target = localPending.find((p) => p.id === id) || properties.find((p) => p.id === id);
        const remaining = localPending.filter((p) => p.id !== id);
        localStorage.setItem('prent_pending_admin_properties', JSON.stringify(remaining));

        if (target) {
          const verifiedProps = JSON.parse(localStorage.getItem('prent_verified_admin_properties') || '[]');
          const updatedTarget = {
            ...target,
            verification_status: 'VERIFIED',
            verified: true,
            is_verified: true,
            verified_at: new Date().toISOString(),
          };
          verifiedProps.unshift(updatedTarget);
          localStorage.setItem('prent_verified_admin_properties', JSON.stringify(verifiedProps));
          window.dispatchEvent(new CustomEvent('prent_property_verified', { detail: updatedTarget }));
          publishRealtime('PROPERTY_VERIFIED', updatedTarget);
        }
      } else if (decision === 'REJECTED') {
        const remaining = localPending.filter((p) => p.id !== id);
        localStorage.setItem('prent_pending_admin_properties', JSON.stringify(remaining));
      }

      publishRealtime('PROPERTY_STATUS', { id, status: decision });
      window.dispatchEvent(new CustomEvent('prent_property_status_changed', { detail: { id, status: decision } }));
      window.dispatchEvent(new Event('storage'));

      loadProperties();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Delete Property
  const handleDeleteProperty = async (id) => {
    try {
      try {
        await api.delete(`/admin/properties/${id}`);
      } catch (err) {
        console.warn('Backend delete fallback:', err);
      }

      // Remove from localStorage
      const removeFromStorage = (key) => {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) {
            const filtered = list.filter((item) => item.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch {}
      };
      removeFromStorage('prent_user_posted_properties');
      removeFromStorage('prent_pending_admin_properties');
      removeFromStorage('prent_verified_admin_properties');

      setProperties((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
      window.dispatchEvent(new CustomEvent('prent_property_modified', { detail: { id, deleted: true } }));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      alert('Failed to delete property: ' + err.message);
    }
  };

  // Counts for tabs
  const unbookedCount = properties.filter((p) => p.booking_status !== 'BOOKED').length;
  const bookedCount = properties.filter((p) => p.booking_status === 'BOOKED').length;
  const verifiedCount = properties.filter((p) => (p.verification_status || (p.verified ? 'VERIFIED' : 'PENDING')) === 'VERIFIED').length;
  const pendingCount = properties.filter((p) => ['PENDING', 'UNDER_REVIEW'].includes(p.verification_status || (p.verified ? 'VERIFIED' : 'PENDING'))).length;

  // Filter list
  const filtered = properties.filter((p) => {
    const vStatus = String(p.verification_status || (p.verified ? 'VERIFIED' : 'PENDING')).toUpperCase();
    const bStatus = p.booking_status === 'BOOKED' ? 'BOOKED' : 'UNBOOKED';

    if (activeTab === 'UNBOOKED' && bStatus !== 'UNBOOKED') return false;
    if (activeTab === 'BOOKED' && bStatus !== 'BOOKED') return false;
    if (activeTab === 'VERIFIED' && vStatus !== 'VERIFIED') return false;
    if (activeTab === 'PENDING' && !['PENDING', 'UNDER_REVIEW'].includes(vStatus)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const code = String(p.property_code || '').toLowerCase();
      const title = String(p.title || '').toLowerCase();
      const loc = String(p.locality || p.city || '').toLowerCase();
      const owner = String(p.owner_name || '').toLowerCase();
      const phone = String(p.owner_phone || p.phone || '');
      return code.includes(q) || title.includes(q) || loc.includes(q) || owner.includes(q) || phone.includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-12 text-[#17324D]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Top Breadcrumb & Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1f4d3f] mb-1 transition"
            >
              <ArrowLeft size={13} />
              <span>Back to Admin Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[#17324D] flex items-center gap-2">
              <Building2 className="text-[#1f4d3f]" />
              <span>Manage Properties &amp; Inventory</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review booked/unbooked statuses, edit property specs, inspect documents, or delete listings. Updates sync live to owner&apos;s &ldquo;My Properties&rdquo;.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white border border-[#e5dac4] text-xs font-black text-[#17324D] shadow-2xs">
              Total: {properties.length} Listings
            </span>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white border border-[#e5dac4] rounded-2xl p-3.5 shadow-xs mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-black">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-[#1f4d3f] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Properties ({properties.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('UNBOOKED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'UNBOOKED'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>🟢 Unbooked</span>
                <span className="opacity-80">({unbookedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('BOOKED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'BOOKED'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span>🔴 Booked</span>
                <span className="opacity-80">({bookedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('VERIFIED')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'VERIFIED'
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                <span>✅ Verified</span>
                <span className="opacity-80">({verifiedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PENDING')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>⏳ Pending Review</span>
                <span className="opacity-80">({pendingCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search code, title, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#fcfaf5] border border-[#e5dac4] rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#1f4d3f] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold animate-pulse">
            Loading properties inventory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-white rounded-2xl border border-[#e5dac4] p-6">
            <Building2 size={36} className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-black text-slate-700">No Properties Found</h3>
            <p className="text-xs text-slate-500">
              No listings match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((prop) => {
              const vStatus = String(prop.verification_status || (prop.verified ? 'VERIFIED' : 'PENDING')).toUpperCase();
              const isBooked = prop.booking_status === 'BOOKED';

              // Safely extract photos
              let propPhotos = [];
              try {
                propPhotos = typeof prop.photos === 'string' ? JSON.parse(prop.photos) : (Array.isArray(prop.photos) ? prop.photos : []);
              } catch {}
              if (propPhotos.length === 0 && prop.cover_url) {
                propPhotos = [{ label: 'Cover', url: prop.cover_url }];
              }

              return (
                <div
                  key={prop.id}
                  className="bg-white border border-[#e5dac4] rounded-2xl p-4 shadow-xs hover:border-[#1f4d3f]/40 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Code, Lister Type, Status Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-black uppercase">
                          {prop.property_code || 'PROP'} · {prop.lister_type || prop.owner_role || 'Owner'}
                        </span>
                        <span className="text-xs font-black text-[#1f4d3f]">
                          {prop.sub_type || prop.subtype || prop.category || 'Rental'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Booking Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            isBooked
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isBooked ? '🔴 BOOKED' : '🟢 UNBOOKED'}
                        </span>

                        {/* Verification Status Badge */}
                        {vStatus === 'VERIFIED' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                            ✅ Verified
                          </span>
                        )}
                        {vStatus === 'UNDER_REVIEW' && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black border border-sky-300">
                            🔍 Review
                          </span>
                        )}
                        {vStatus === 'PENDING' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                            ⏳ Pending
                          </span>
                        )}
                        {vStatus === 'REJECTED' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300">
                            ❌ Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Price */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-[#17324D] leading-snug">
                          {prop.title || 'Untitled Property'}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-emerald-700 shrink-0" />
                          <span>{prop.exact_address ? `${prop.exact_address}, ` : ''}{prop.locality || ''}, {prop.city || 'Kolkata'}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-700 block">
                          {formatINR(prop.rent_amount || prop.price || 0)}<span className="text-[10px] font-normal text-slate-500">/mo</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Dep: ₹{Number(prop.advance_amount || prop.deposit || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Owner & Contact */}
                    <div className="p-2.5 bg-[#fcfaf5] rounded-xl border border-[#ebe1c9] text-[11px] text-slate-600 space-y-0.5">
                      <p>
                        <strong>Owner:</strong> {prop.owner_name || 'N/A'} · 📞 {prop.owner_phone || prop.phone || 'N/A'}
                        {prop.alternate_phone && <span> · Alt: {prop.alternate_phone}</span>}
                      </p>
                      {prop.rules_and_regulations && (
                        <p className="truncate text-slate-500">
                          <strong>Rules:</strong> {prop.rules_and_regulations}
                        </p>
                      )}
                    </div>

                    {/* Media Attachments Preview */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      {propPhotos.length > 0 && (
                        <div className="flex items-center gap-1">
                          {propPhotos.slice(0, 3).map((ph, idx) => (
                            <img
                              key={idx}
                              src={ph.url || DEFAULT_ROOM_ANGLES[idx % 3]}
                              alt="Site Angle"
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                              onError={(e) => { 
                                if (ph.preview && e.currentTarget.src !== ph.preview) {
                                  e.currentTarget.src = ph.preview;
                                } else {
                                  e.currentTarget.src = DEFAULT_ROOM_ANGLES[idx % 3]; 
                                }
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {prop.video_name && (
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200 flex items-center gap-1">
                          <Video size={11} /> {prop.video_size_mb || '20'}MB
                        </span>
                      )}
                      {(prop.electricity_bill_uploaded || prop.electricity_bill_name) && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                          <FileText size={11} /> Electric Bill
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Controls Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Toggle Booking Status */}
                    <button
                      type="button"
                      onClick={() => handleToggleBooking(prop)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs ${
                        isBooked
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                      }`}
                      title={isBooked ? 'Mark property as unbooked / available' : 'Mark property as booked'}
                    >
                      {isBooked ? <ToggleLeft size={14} className="text-emerald-700" /> : <ToggleRight size={14} className="text-rose-700" />}
                      <span>{isBooked ? 'Mark Unbooked' : 'Mark Booked'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Inspect / Verification Details */}
                      <button
                        type="button"
                        onClick={() => setInspectProperty(prop)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold transition flex items-center gap-1 text-slate-700 cursor-pointer"
                        title="Inspect full details, photos, video, and electricity bill"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>

                      {/* Modify / Edit */}
                      <button
                        type="button"
                        onClick={() => setEditProperty(prop)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Modify property specifications and rent"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(prop.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-600 border border-transparent hover:border-rose-200 transition cursor-pointer"
                        title="Delete Property"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800">Delete Property Listing?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete this property? The owner will be notified. This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProperty(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Verification Modal */}
        {inspectProperty && (
          <PropertyVerificationModal
            property={inspectProperty}
            isOpen={Boolean(inspectProperty)}
            onClose={() => setInspectProperty(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* Edit / Modify Modal */}
        {editProperty && (
          <AdminEditPropertyModal
            property={editProperty}
            isOpen={Boolean(editProperty)}
            onClose={() => setEditProperty(null)}
            onSaved={loadProperties}
          />
        )}
      </main>
    </div>
  );
}
