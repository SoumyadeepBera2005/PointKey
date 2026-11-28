import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, BadgePercent, Undo2, ShieldAlert, ListChecks, IndianRupee, MapPin, Camera, Video, FileText, ExternalLink, Building } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import VerificationQueue from '../../components/admin/VerificationQueue';
import ScamReportDrawer from '../../components/admin/ScamReportDrawer';
import PropertyVerificationModal from '../../components/admin/PropertyVerificationModal';
import { formatINR } from '../../utils/currencyFormatter';
import api from '../../services/api';
import { publishRealtime, subscribeRealtime } from '../../services/realtimeSync';
import { resolveMediaUrl, DEFAULT_ANGLE_PLACEHOLDERS } from '../../utils/mediaStorage';

const DEFAULT_ROOM_ANGLES = DEFAULT_ANGLE_PLACEHOLDERS;
const DEFAULT_BILL_FILE = '/assets/images/electric-bill-sample.png';
const DEFAULT_WALKTHROUGH_VIDEO = '/assets/video/property-video-1.mp4';

const sanitizePropMedia = (p) => {
  if (!p) return p;
  let photos = [];
  try {
    photos = typeof p.photos === 'string' ? JSON.parse(p.photos) : (Array.isArray(p.photos) ? p.photos : []);
  } catch { photos = []; }

  const cleanPhotos = [0, 1, 2].map((idx) => {
    let existing = photos[idx];
    if (typeof existing === 'string') {
      try {
        const parsed = JSON.parse(existing);
        if (parsed && typeof parsed === 'object') existing = parsed;
      } catch {}
    }
    const defaultLabel = idx === 0 ? 'Angle 1 (Front/Entrance)' : idx === 1 ? 'Angle 2 (Living/Bedroom)' : 'Angle 3 (Balcony/Kitchen/Side)';
    let rawU = existing?.url || existing?.preview || existing?.dataUrl || (typeof existing === 'string' ? existing : '') || (idx === 0 ? p.cover_url : '');
    let u = resolveMediaUrl(rawU);
    if (!u || u.includes('hero-slide-1.jpg')) {
      u = DEFAULT_ROOM_ANGLES[idx];
    }
    return {
      label: existing?.label || defaultLabel,
      name: existing?.name || `photo_angle_${idx + 1}.jpg`,
      url: u,
      preview: resolveMediaUrl(existing?.preview || existing?.dataUrl || u),
    };
  });

  let billUrl = resolveMediaUrl(p.electricity_bill_url || p.electricity_bill_preview);
  if (!billUrl) {
    billUrl = DEFAULT_BILL_FILE;
  }

  let videoUrl = resolveMediaUrl(p.video_url || p.video_preview);
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

export default function AdminDashboard() {
  const [revenue, setRevenue] = useState({ monthly: [], totals: {} });
  const [queue, setQueue] = useState([]);
  const [pendingProps, setPendingProps] = useState([]);
  const [reports, setReports] = useState([]);
  const [tenants, setTenants] = useState(0);
  const [owners, setOwners] = useState(0);
  const [totalProps, setTotalProps] = useState(0);
  const [showReports, setShowReports] = useState(false);
  const [selectedInspectProp, setSelectedInspectProp] = useState(null);

  const load = () => {
    api.get('/admin/revenue?months=6').then(({ data }) => setRevenue(data)).catch(() => { });
    api.get('/admin/verification-queue').then(({ data }) => setQueue(data.queue || [])).catch(() => { });
    api.get('/admin/properties/pending').then(({ data }) => {
      const dbProps = (data.properties || []).map(sanitizePropMedia);
      let localPending = [];
      try {
        localPending = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
        localPending = localPending.map(sanitizePropMedia);
      } catch { }

      // Authoritative merge: DB properties take priority
      const propMap = new Map();
      dbProps.forEach((p) => { if (p && p.id) propMap.set(String(p.id), p); });
      localPending.forEach((lp) => {
        if (!lp || !lp.id) return;
        const key = String(lp.id);
        if (!propMap.has(key)) {
          propMap.set(key, lp);
        }
      });
      const combined = Array.from(propMap.values());
      try {
        localStorage.setItem('prent_pending_admin_properties', JSON.stringify(combined));
      } catch { }
      setPendingProps(combined);
    }).catch(() => {
      try {
        let localPending = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
        localPending = localPending.map(sanitizePropMedia);
        localStorage.setItem('prent_pending_admin_properties', JSON.stringify(localPending));
        setPendingProps(localPending);
      } catch { }
    });
    api.get('/admin/reports').then(({ data }) => setReports(data.reports || [])).catch(() => { });
    api.get('/admin/properties').then(({ data }) => {
      setTotalProps(data.count || (data.properties ? data.properties.length : 0));
    }).catch(() => {
      try {
        const u = JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]');
        const p = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
        const v = JSON.parse(localStorage.getItem('prent_verified_admin_properties') || '[]');
        const ids = new Set([...u, ...p, ...v].map((x) => x.id).filter(Boolean));
        setTotalProps(ids.size);
      } catch {}
    });

    // টেন্যান্ট ও ওনার সংখ্যা গণনা: যে সকল টেন্যান্ট প্রপার্টি পোস্ট করেছে তারা ওনার হিসেবে গণ্য হবে
    Promise.all([
      api.get('/admin/users?role=TENANT').catch(() => ({ data: { users: [] } })),
      api.get('/admin/users?role=OWNER').catch(() => ({ data: { users: [] } })),
    ]).then(([tenantRes, ownerRes]) => {
      let tenantList = tenantRes.data?.users || [];
      let ownerList = ownerRes.data?.users || [];

      // লোকাল স্টোরেজে পেন্ডিং প্রপার্টি থাকলে সেই টেন্যান্টকে ওনার লিস্টে নিয়ে আসা
      try {
        const localPending = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
        if (localPending.length > 0) {
          const localPosterEmails = new Set(localPending.map((p) => p.owner_email).filter(Boolean));
          const localPosterPhones = new Set(localPending.map((p) => p.owner_phone || p.phone).filter(Boolean));
          const localPosterIds = new Set(localPending.map((p) => p.owner_id).filter(Boolean));

          const moved = tenantList.filter(
            (t) => localPosterEmails.has(t.email) || localPosterPhones.has(t.phone) || localPosterIds.has(t.id)
          );
          if (moved.length > 0) {
            tenantList = tenantList.filter(
              (t) => !localPosterEmails.has(t.email) && !localPosterPhones.has(t.phone) && !localPosterIds.has(t.id)
            );
            for (const m of moved) {
              if (!ownerList.some((o) => o.id === m.id || o.email === m.email)) {
                ownerList.push({ ...m, role: 'TENANT+OWNER' });
              }
            }
          }
        }
      } catch {}

      setTenants(tenantList.length);
      setOwners(ownerList.length);
    });
  };

  useEffect(() => {
    load();
    const handleSync = () => load();
    const unsubscribe = subscribeRealtime((event) => {
      load();
    });
    window.addEventListener('prent_new_pending_property', handleSync);
    window.addEventListener('prent_property_status_changed', handleSync);
    window.addEventListener('prent_property_verified', handleSync);
    window.addEventListener('prent_user_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      unsubscribe();
      window.removeEventListener('prent_new_pending_property', handleSync);
      window.removeEventListener('prent_property_status_changed', handleSync);
      window.removeEventListener('prent_property_verified', handleSync);
      window.removeEventListener('prent_user_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const updatePropertyStatus = async (id, decision) => {
    try {
      await api.post(`/admin/properties/${id}/verify`, { decision });
    } catch { }

    // Process local queues & notify user in real time
    try {
      const localPending = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
      let userPosted = JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]');

      // Update user posted properties real-time
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
        // Keep in pending queue with UNDER_REVIEW status
        const updatedPending = localPending.map((p) => (p.id === id ? { ...p, verification_status: 'UNDER_REVIEW' } : p));
        localStorage.setItem('prent_pending_admin_properties', JSON.stringify(updatedPending));
      } else if (decision === 'VERIFIED') {
        const target = localPending.find((p) => p.id === id);
        const remainingPending = localPending.filter((p) => p.id !== id);
        localStorage.setItem('prent_pending_admin_properties', JSON.stringify(remainingPending));

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
        const remainingPending = localPending.filter((p) => p.id !== id);
        localStorage.setItem('prent_pending_admin_properties', JSON.stringify(remainingPending));
      }

      publishRealtime('PROPERTY_STATUS', { id, status: decision });
      window.dispatchEvent(new CustomEvent('prent_property_status_changed', { detail: { id, status: decision } }));

      // Property verification notification for owner
      try {
        const prop = properties.find((p) => p.id === id);
        const ownerId = prop?.owner_id;
        if (ownerId) {
          const notifItem = {
            id: `notif-${Date.now()}`,
            user_id: ownerId,
            type: decision === 'VERIFIED' ? 'PROPERTY_VERIFIED' : decision === 'REJECTED' ? 'PROPERTY_REJECTED' : 'PROPERTY_UNDER_REVIEW',
            title: decision === 'VERIFIED' ? '🎉 Property Verified & Live!' : decision === 'REJECTED' ? '❌ Property Listing Rejected' : '🔍 Property Under Review',
            message: decision === 'VERIFIED'
              ? 'Your property listing has been verified by Admin and is now published for all tenants!'
              : decision === 'REJECTED'
              ? 'Your property listing was rejected by Admin. Please check information and re-submit.'
              : 'Admin is currently reviewing your property listing and verification documents.',
            is_read: false,
            created_at: new Date().toISOString(),
          };
          const userNotifsKey = `prent_user_notifications_${ownerId}`;
          const existingNotifs = JSON.parse(localStorage.getItem(userNotifsKey) || '[]');
          existingNotifs.unshift(notifItem);
          localStorage.setItem(userNotifsKey, JSON.stringify(existingNotifs));
        }
        localStorage.removeItem('prent_user_notifications');
      } catch {}

      // Dispatch property status change event
      window.dispatchEvent(new CustomEvent('prent_property_status_changed', { detail: { id, status: decision } }));
    } catch { }

    load();
  };

  const verifyProperty = updatePropertyStatus;

  const openReports = reports.filter((r) => r.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Admin Dashboard</h1>
            <p className="text-xs text-slate-400">Revenue, verification queues, scam reports — all in one place.</p>
          </div>
          <button onClick={() => setShowReports(true)} className="relative flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100">
            <ShieldAlert size={16} /> Scam Queue
            {openReports > 0 && <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">{openReports}</span>}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Link to="/admin/tenants" className="glass-card bg-beige border border-beige-border p-4 transition hover:-translate-y-0.5 hover:shadow-lg"><Users size={20} className="text-navy" /><p className="mt-1 text-2xl font-black text-navy">{tenants}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">Tenants</p></Link>
          <Link to="/admin/owners" className="glass-card bg-beige border border-beige-border p-4 transition hover:-translate-y-0.5 hover:shadow-lg"><Building2 size={20} className="text-forest" /><p className="mt-1 text-2xl font-black text-navy">{owners}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">Owners</p></Link>
          <Link to="/admin/properties" className="glass-card bg-beige border border-beige-border p-4 transition hover:-translate-y-0.5 hover:shadow-lg"><Building size={20} className="text-[#1f4d3f]" /><p className="mt-1 text-2xl font-black text-navy">{totalProps}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">Manage Properties</p></Link>
          <div className="glass-card bg-beige border border-beige-border p-4"><IndianRupee size={20} className="text-forest" /><p className="mt-1 text-lg font-black text-navy">{formatINR(revenue.totals?.gross || 0)}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">Gross revenue</p></div>
          <div className="glass-card bg-beige border border-beige-border p-4"><Undo2 size={20} className="text-orange" /><p className="mt-1 text-lg font-black text-navy">{formatINR(revenue.totals?.refunded || 0)}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">Refunded</p></div>
        </div>

        <div className="mt-5"><AnalyticsCharts monthly={revenue.monthly} /></div>

        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800"><ShieldAlert size={18} className="text-amber-500" /> Owner Verification Queue <span className="text-sm font-bold text-slate-400">({queue.length})</span></h2>
          <div className="mt-3"><VerificationQueue items={queue} onReviewed={load} /></div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800"><ListChecks size={18} className="text-sky-600" /> Property Verification <span className="text-sm font-bold text-slate-400">({pendingProps.length})</span></h2>
            <Link to="/admin/properties" className="text-xs font-bold text-[#1f4d3f] hover:underline flex items-center gap-1">
              <span>View All Properties</span>
              <ExternalLink size={12} />
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Click on any property card to inspect full details, 3-angle photos, walkthrough video, and electric bill.</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {pendingProps.map((p) => (
              <li
                key={p.id}
                onClick={() => setSelectedInspectProp(p)}
                className="glass-card flex flex-col justify-between gap-3 p-4 border border-[#e5dac4] rounded-2xl bg-white shadow-xs cursor-pointer hover:border-[#1f4d3f]/60 hover:shadow-md transition"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-black uppercase">
                        {p.property_code || 'PROP'} · {p.category || 'Listing'}
                      </span>
                      {p.verification_status === 'UNDER_REVIEW' ? (
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black border border-sky-300">
                          🔍 Under Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-emerald-700">
                      {formatINR(p.rent_amount || p.price)}/mo
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-800 leading-snug">{p.title}</p>
                    <span className="text-[10px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 shrink-0">
                      Inspect 👁️
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>
                      <strong>Lister:</strong> {p.owner_name} ({p.lister_type || 'Owner'}) · 📞 {p.phone || p.owner_phone}
                      {p.alternate_phone && <span> · Alt: {p.alternate_phone}</span>}
                    </p>
                    <p className="text-slate-500">
                      <strong>Location:</strong> {p.exact_address ? `${p.exact_address}, ` : ''}{p.locality || p.city || 'Kolkata'}
                    </p>
                  </div>

                  {/* Live GPS Coordinates Link */}
                  {p.lat && p.lng && (
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <a
                        href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition border border-emerald-200"
                      >
                        <MapPin size={12} className="text-emerald-700" />
                        <span>Live GPS: {p.lat}, {p.lng}</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}

                  {/* Media attachments */}
                  {(() => {
                    let propPhotos = [];
                    try {
                      propPhotos = typeof p.photos === 'string' ? JSON.parse(p.photos) : (Array.isArray(p.photos) ? p.photos : []);
                    } catch {}
                    if (propPhotos.length === 0 && p.cover_url) {
                      propPhotos = [{ label: 'Front Entrance (Angle 1)', url: p.cover_url }];
                    }

                    const displayPhotos = [0, 1, 2].map((i) => {
                      const ph = propPhotos[i];
                      let rawUrl = ph?.url || ph?.preview || ph?.dataUrl || '';
                      let url = resolveMediaUrl(rawUrl);
                      if (!url || url.includes('hero-slide-1.jpg')) {
                        url = DEFAULT_ROOM_ANGLES[i];
                      }
                      return {
                        url,
                        preview: resolveMediaUrl(ph?.preview || ph?.dataUrl || url),
                        label: ph?.label || `Angle ${i + 1}`,
                      };
                    });

                    return (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <div className="flex items-center gap-1">
                          {displayPhotos.map((ph, idx) => (
                            <img
                              key={idx}
                              src={ph.url}
                              alt={ph.label || 'Room Angle'}
                              title={ph.label || 'Room Angle'}
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
                        {p.video_name && (
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200 flex items-center gap-1">
                            <Video size={11} /> Video ({p.video_size_mb || '20'}MB)
                          </span>
                        )}
                        {(p.electricity_bill_uploaded || p.electricity_bill_url || p.electricity_bill_name) && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                            <FileText size={11} /> Electric Bill
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 3 Status Action Controls */}
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  {p.verification_status !== 'UNDER_REVIEW' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePropertyStatus(p.id, 'UNDER_REVIEW');
                      }}
                      className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                    >
                      🔍 Mark Under Review
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePropertyStatus(p.id, 'REJECTED');
                    }}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePropertyStatus(p.id, 'VERIFIED');
                    }}
                    className="rounded-xl bg-trust hover:bg-emerald-700 px-4 py-1.5 text-xs font-black text-white shadow-xs transition cursor-pointer"
                  >
                    ✓ Verify &amp; Publish for Tenants
                  </button>
                </div>
              </li>
            ))}
            {pendingProps.length === 0 && <li className="text-sm text-slate-400 col-span-2 py-4 text-center">All listings verified. No pending reviews.</li>}
          </ul>
        </section>
      </main>
      {showReports && <ScamReportDrawer items={reports} onClose={() => setShowReports(false)} onUpdated={load} />}
      {selectedInspectProp && (
        <PropertyVerificationModal
          property={selectedInspectProp}
          isOpen={Boolean(selectedInspectProp)}
          onClose={() => setSelectedInspectProp(null)}
          onUpdateStatus={(id, dec, reason) => {
            updatePropertyStatus(id, dec);
            setSelectedInspectProp(null);
          }}
        />
      )}
      <BottomNav />
    </div>
  );
}
