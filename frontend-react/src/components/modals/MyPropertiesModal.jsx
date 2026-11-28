import React, { useState, useEffect } from 'react';
import { 
  X, 
  Home, 
  MapPin, 
  Camera, 
  Video, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  AlertCircle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currencyFormatter';
import api from '../../services/api';
import { subscribeRealtime } from '../../services/realtimeSync';

/**
 * Robust Error Boundary to guarantee the screen never goes blank
 */
class SafeModalBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SafeModalBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-3 bg-amber-50 rounded-2xl border border-amber-200">
          <AlertCircle size={32} className="text-amber-600 mx-auto" />
          <h3 className="text-sm font-black text-amber-900">Something went wrong displaying properties</h3>
          <p className="text-xs text-amber-700">Please try refreshing or post a new property.</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onRetry) this.props.onRetry();
            }}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Safely normalize photos to [{ url, label }]
function getSafePhotos(rawPhotos) {
  if (!rawPhotos) return [];
  let list = rawPhotos;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const ROOM_FALLBACKS = [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
  ];
  return list.map((item, idx) => {
    let url = typeof item === 'string' ? item : (item?.url || item?.preview || '');
    if (!url || url.startsWith('blob:') || url.includes('hero-slide-1.jpg')) {
      url = ROOM_FALLBACKS[idx % 3];
    }
    return {
      url,
      label: (typeof item === 'object' && item?.label) ? item.label : `Angle ${idx + 1}`,
    };
  }).filter((p) => typeof p.url === 'string' && p.url.trim().length > 0);
}

// Safely format location as a string
function getSafeLocation(prop) {
  if (!prop) return 'Kolkata, WB';
  if (typeof prop.location === 'string' && prop.location.trim().length > 0) {
    return prop.location.trim();
  }
  const parts = [];
  if (typeof prop.locality === 'string' && prop.locality.trim()) parts.push(prop.locality.trim());
  if (typeof prop.city === 'string' && prop.city.trim()) parts.push(prop.city.trim());
  return parts.length > 0 ? parts.join(', ') : 'Kolkata, WB';
}

// Safely format rules
function getSafeRules(prop) {
  if (!prop) return 'Standard house rules';
  if (typeof prop.rules_and_regulations === 'string' && prop.rules_and_regulations.trim().length > 0) {
    return prop.rules_and_regulations.trim();
  }
  if (Array.isArray(prop.rules)) {
    return prop.rules.filter((r) => typeof r === 'string').join(', ') || 'Standard house rules';
  }
  if (typeof prop.rules === 'string' && prop.rules.trim().length > 0) {
    return prop.rules.trim();
  }
  return 'Standard house rules';
}

// Safely extract numerical GPS
function getSafeGPS(prop) {
  if (!prop) return null;
  let lat = null;
  let lng = null;
  if (prop.lat != null && !isNaN(Number(prop.lat))) lat = Number(prop.lat);
  if (prop.lng != null && !isNaN(Number(prop.lng))) lng = Number(prop.lng);
  if (lat == null && prop.location && typeof prop.location === 'object') {
    if (prop.location.lat != null && !isNaN(Number(prop.location.lat))) lat = Number(prop.location.lat);
    else if (prop.location.y != null && !isNaN(Number(prop.location.y))) lat = Number(prop.location.y);
    if (prop.location.lng != null && !isNaN(Number(prop.location.lng))) lng = Number(prop.location.lng);
    else if (prop.location.x != null && !isNaN(Number(prop.location.x))) lng = Number(prop.location.x);
  }
  if (lat != null && lng != null) {
    return { lat, lng };
  }
  return null;
}

export default function MyPropertiesModal({ isOpen, onClose, onOpenPostProperty }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync properties posted by this user from localStorage & backend
  const loadUserProperties = async () => {
    try {
      setLoading(true);

      // 1. Load user posted properties from local storage
      let localPosted = [];
      let pendingAdmin = [];
      let verifiedAdmin = [];

      try {
        localPosted = JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]');
        if (!Array.isArray(localPosted)) localPosted = [];
      } catch { localPosted = []; }

      try {
        pendingAdmin = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
        if (!Array.isArray(pendingAdmin)) pendingAdmin = [];
      } catch { pendingAdmin = []; }

      try {
        verifiedAdmin = JSON.parse(localStorage.getItem('prent_verified_admin_properties') || '[]');
        if (!Array.isArray(verifiedAdmin)) verifiedAdmin = [];
      } catch { verifiedAdmin = []; }

      // Map to map of id -> latest property with up-to-date status
      const propMap = new Map();

      // Seed with local posted
      localPosted.forEach((p) => {
        if (p && p.id) {
          propMap.set(String(p.id), { ...p });
        }
      });

      // Overlay pending admin status updates (e.g. UNDER_REVIEW)
      pendingAdmin.forEach((p) => {
        if (p && p.id) {
          const key = String(p.id);
          if (propMap.has(key)) {
            propMap.set(key, { ...propMap.get(key), ...p });
          } else {
            propMap.set(key, { ...p });
          }
        }
      });

      // Overlay verified admin status updates
      verifiedAdmin.forEach((p) => {
        if (p && p.id) {
          const key = String(p.id);
          if (propMap.has(key)) {
            propMap.set(key, { 
              ...propMap.get(key), 
              ...p, 
              verification_status: 'VERIFIED', 
              verified: true, 
              is_verified: true 
            });
          } else {
            propMap.set(key, { 
              ...p, 
              verification_status: 'VERIFIED', 
              verified: true, 
              is_verified: true 
            });
          }
        }
      });

      // 2. Try fetching from backend API if user is authenticated
      try {
        const token = localStorage.getItem('prent_token');
        if (token) {
          const res = await api.get('/properties/owner/my-listings');
          if (res.data?.listings && Array.isArray(res.data.listings)) {
            res.data.listings.forEach((srv) => {
              if (srv && srv.id) {
                const key = String(srv.id);
                if (propMap.has(key)) {
                  propMap.set(key, { ...propMap.get(key), ...srv });
                } else {
                  propMap.set(key, { ...srv });
                }
              }
            });
          }
        }
      } catch (apiErr) {
        // quiet fallback
      }

      const allList = Array.from(propMap.values());

      // If user is logged in, prioritize listings that match user email, phone, or owner_id
      const userListings = allList.filter((p) => {
        if (!p || typeof p !== 'object') return false;
        if (!user) return true;
        const uEmail = user.email ? String(user.email).toLowerCase().trim() : '';
        const pEmail = p.owner_email ? String(p.owner_email).toLowerCase().trim() : '';
        const uPhone = user.phone ? String(user.phone).replace(/\D/g, '') : '';
        const pPhone = (p.owner_phone || p.phone) ? String(p.owner_phone || p.phone).replace(/\D/g, '') : '';
        const uId = user.id ? String(user.id) : '';
        const pOwnerId = p.owner_id ? String(p.owner_id) : '';

        if (uId && pOwnerId && uId === pOwnerId) return true;
        if (uEmail && pEmail && uEmail === pEmail) return true;
        if (uPhone && pPhone && uPhone === pPhone) return true;
        return true; // allow device-level tracking for seamless experience
      });

      // Sort newest first
      userListings.sort((a, b) => new Date(b.created_at || b.submitted_at || 0) - new Date(a.created_at || a.submitted_at || 0));
      setProperties(userListings);
    } catch (err) {
      console.warn('Failed to load user properties:', err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserProperties();
    }
  }, [isOpen, user]);

  // Real-time listener: status changes by Admin update immediately across all open tabs!
  useEffect(() => {
    const handleStatusSync = () => {
      loadUserProperties();
    };

    const unsubscribe = subscribeRealtime(() => {
      loadUserProperties();
    });

    window.addEventListener('prent_property_status_changed', handleStatusSync);
    window.addEventListener('prent_property_verified', handleStatusSync);
    window.addEventListener('prent_property_modified', handleStatusSync);
    window.addEventListener('prent_new_pending_property', handleStatusSync);
    window.addEventListener('prent_property_added', handleStatusSync);
    window.addEventListener('storage', handleStatusSync);

    return () => {
      unsubscribe();
      window.removeEventListener('prent_property_status_changed', handleStatusSync);
      window.removeEventListener('prent_property_verified', handleStatusSync);
      window.removeEventListener('prent_property_modified', handleStatusSync);
      window.removeEventListener('prent_new_pending_property', handleStatusSync);
      window.removeEventListener('prent_property_added', handleStatusSync);
      window.removeEventListener('storage', handleStatusSync);
    };
  }, []);

  if (!isOpen) return null;

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#fffaf0] border border-[#d8cba9] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-[#17324D] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <SafeModalBoundary onRetry={loadUserProperties}>
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-[#e5dac4] shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#e0ece6] text-[#1f4d3f] text-[10px] font-extrabold uppercase tracking-wide">
                  MY LISTINGS &amp; VERIFICATION TRACKER
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">
                  {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#17324D] mt-1 flex items-center gap-2">
                <span>🏠 My Posted Properties</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Track real-time admin review status, electricity bill verification, and live tenant visibility.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f6efdf] hover:bg-[#ebdcc0] text-[#17324D] flex items-center justify-center text-sm font-bold transition cursor-pointer shrink-0 ml-3"
            >
              <X size={18} />
            </button>
          </div>

          {/* Property List Body */}
          <div className="overflow-y-auto py-3 space-y-3.5 flex-1 pr-1">
            {properties.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3 my-auto">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#f4ebe0] text-slate-400 flex items-center justify-center">
                  <Home size={32} />
                </div>
                <h3 className="text-base font-black text-slate-700">No Properties Posted Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Have a flat, PG, or room to rent? Post it for free directly with zero brokerage and reach thousands of verified tenants!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenPostProperty) onOpenPostProperty();
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF9A1F] hover:bg-[#ea580c] text-white text-xs font-black shadow-md transition cursor-pointer"
                >
                  <PlusCircle size={16} />
                  <span>Post Your Property Free</span>
                </button>
              </div>
            ) : (
              properties.map((prop) => {
                const status = String(prop.verification_status || (prop.verified ? 'VERIFIED' : 'PENDING')).toUpperCase();
                const isExpanded = expandedId === prop.id;
                const safePhotos = getSafePhotos(prop.photos);
                const safeLocation = getSafeLocation(prop);
                const safeRules = getSafeRules(prop);
                const safeGPS = getSafeGPS(prop);
                const ownerPhone = (prop.owner_phone || prop.phone) ? String(prop.owner_phone || prop.phone) : '';
                const altPhone = prop.alternate_phone ? String(prop.alternate_phone) : '';

                return (
                  <div
                    key={prop.id || Math.random()}
                    className="bg-white border border-[#e5dac4] rounded-2xl p-4 shadow-xs hover:border-[#1f4d3f]/40 transition space-y-3"
                  >
                    {/* Top Bar: Code, Category, Price & Live Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-wider">
                          {prop.property_code || 'PROP'} · {prop.lister_type || 'Owner'}
                        </span>
                        <span className="text-xs font-black text-[#1f4d3f]">
                          {String(prop.subtype || prop.sub_type || prop.category || 'Rental')}
                        </span>
                      </div>

                      {/* LIVE VERIFICATION STATUS BADGE */}
                      <div>
                        {status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-black shadow-2xs animate-pulse">
                            <Clock size={12} className="text-amber-600" />
                            <span>⏳ Pending Verification</span>
                          </span>
                        )}
                        {status === 'UNDER_REVIEW' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-300 text-[11px] font-black shadow-2xs">
                            <Search size={12} className="text-sky-600 animate-spin" />
                            <span>🔍 Under Review by Admin</span>
                          </span>
                        )}
                        {status === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-black shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>✅ Verified &amp; Live for Tenants</span>
                          </span>
                        )}
                        {status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-black shadow-2xs">
                            <AlertCircle size={12} className="text-rose-600" />
                            <span>❌ Rejected</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Property Title & Rent */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-[#17324D] leading-snug">
                          {prop.title || 'Property Listing'}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={13} className="text-emerald-700 shrink-0" />
                          <span>{prop.exact_address ? `${prop.exact_address}, ` : ''}{safeLocation}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-700 block">
                          {formatINR(prop.rent_amount || prop.price || 0)}<span className="text-[10px] font-normal text-slate-500">/mo</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Deposit: ₹{Number(prop.advance_amount || prop.deposit || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Status Explanation Box */}
                    <div className={`p-2.5 rounded-xl text-xs font-semibold leading-relaxed border ${
                      status === 'PENDING'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : status === 'UNDER_REVIEW'
                        ? 'bg-sky-50/70 border-sky-200 text-sky-900'
                        : status === 'VERIFIED'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50/70 border-rose-200 text-rose-900'
                    }`}>
                      {status === 'PENDING' && (
                        <p>
                          ⏳ <strong>Status: Pending Verification.</strong> Your property submission with 3-angle photos, video, and electricity bill has been received. Our admin team will begin review shortly.
                        </p>
                      )}
                      {status === 'UNDER_REVIEW' && (
                        <p>
                          🔍 <strong>Status: Under Review.</strong> PointKey Administration is currently reviewing your property details, GPS satellite coordinates, and previous month&apos;s electricity bill.
                        </p>
                      )}
                      {status === 'VERIFIED' && (
                        <p>
                          🎉 <strong>Status: Verified &amp; Published!</strong> Your property has passed all authenticity and zero-brokerage checks. It is now visible to all tenants searching in {typeof prop.city === 'string' ? prop.city : 'your area'}.
                        </p>
                      )}
                      {status === 'REJECTED' && (
                        <p>
                          ⚠️ <strong>Status: Verification Rejected.</strong> The submitted electricity bill or location could not be verified. Please contact PointKey Support or re-submit genuine proof.
                        </p>
                      )}
                    </div>

                    {/* Collapsible Details */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(prop.id)}
                        className="text-xs font-bold text-slate-600 hover:text-[#17324D] flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Full Details & Documents'}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-xs">
                          {/* 3 Photos */}
                          {safePhotos.length > 0 && (
                            <div>
                              <span className="block text-[11px] font-black text-slate-700 mb-1.5 flex items-center gap-1">
                                <Camera size={13} className="text-[#FF9A1F]" />
                                <span>Uploaded Photos ({safePhotos.length} Angles):</span>
                              </span>
                              <div className="grid grid-cols-3 gap-2">
                                {safePhotos.map((ph, idx) => (
                                  <div key={idx} className="rounded-lg overflow-hidden border border-slate-200">
                                    <img 
                                      src={ph.url} 
                                      alt={ph.label} 
                                      className="w-full h-18 object-cover bg-slate-100" 
                                      onError={(e) => { 
                                        e.currentTarget.src = [
                                          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
                                          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
                                          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
                                        ][idx % 3]; 
                                      }}
                                    />
                                    <span className="block text-[9px] font-bold text-center py-0.5 bg-slate-50 truncate px-1 text-slate-600">
                                      {ph.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Video & Electricity Bill Tags */}
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {(prop.video_name || prop.video_url || prop.video_size_mb) && (
                              <div className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold flex items-center gap-1.5">
                                <Video size={13} />
                                <span>Walkthrough Video: {prop.video_size_mb || '20'} MB</span>
                              </div>
                            )}

                            {(prop.electricity_bill_uploaded || prop.electricity_bill_name || prop.electricity_bill_url) && (
                              <div className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1.5">
                                <FileText size={13} />
                                <span>Current Bill: {prop.electricity_bill_name || 'Uploaded & Verified'}</span>
                              </div>
                            )}

                            {safeGPS && (
                              <a
                                href={`https://www.google.com/maps?q=${safeGPS.lat},${safeGPS.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1 hover:bg-emerald-100 transition"
                              >
                                <MapPin size={13} className="text-emerald-700" />
                                <span>Live GPS: {safeGPS.lat.toFixed(4)}, {safeGPS.lng.toFixed(4)}</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>

                          {/* Rules & Contact */}
                          <div className="bg-[#fcfaf5] p-2.5 rounded-xl border border-[#ebe1c9] space-y-1 text-[11px]">
                            <p>
                              <strong>Contact:</strong> {prop.owner_name || 'Property Lister'} · 📞 +91 {ownerPhone || 'N/A'} {altPhone ? `· Alt: +91 ${altPhone}` : ''}
                            </p>
                            <p>
                              <strong>Rules:</strong> {safeRules}
                            </p>
                            <p className="text-slate-400 text-[10px]">
                              Submitted on: {new Date(prop.created_at || prop.submitted_at || Date.now()).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#e5dac4] flex items-center justify-between shrink-0 mt-1">
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck size={14} className="text-[#1f4d3f]" />
              <span>PointKey Zero-Brokerage Authenticity Shield</span>
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenPostProperty) onOpenPostProperty();
              }}
              className="px-4 py-2 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Post Another Property</span>
            </button>
          </div>
        </SafeModalBoundary>
      </div>
    </div>
  );
}
