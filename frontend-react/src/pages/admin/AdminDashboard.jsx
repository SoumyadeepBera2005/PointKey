import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, BadgePercent, Undo2, ShieldAlert, ListChecks, IndianRupee, MapPin, Camera, Video, FileText, ExternalLink } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import VerificationQueue from '../../components/admin/VerificationQueue';
import ScamReportDrawer from '../../components/admin/ScamReportDrawer';
import { formatINR } from '../../utils/currencyFormatter';
import api from '../../services/api';

export default function AdminDashboard() {
  const [revenue, setRevenue] = useState({ monthly: [], totals: {} });
  const [queue, setQueue] = useState([]);
  const [pendingProps, setPendingProps] = useState([]);
  const [reports, setReports] = useState([]);
  const [tenants, setTenants] = useState(0);
  const [owners, setOwners] = useState(0);
  const [showReports, setShowReports] = useState(false);

  const load = () => {
    api.get('/admin/revenue?months=6').then(({ data }) => setRevenue(data)).catch(() => { });
    api.get('/admin/verification-queue').then(({ data }) => setQueue(data.queue || [])).catch(() => { });
    api.get('/admin/properties/pending').then(({ data }) => {
      const dbProps = data.properties || [];
      let localPending = [];
      try {
        localPending = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
      } catch { }
      const combined = [...localPending, ...dbProps.filter((dp) => !localPending.some((lp) => lp.id === dp.id))];
      setPendingProps(combined);
    }).catch(() => {
      try {
        const localPending = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
        setPendingProps(localPending);
      } catch { }
    });
    api.get('/admin/reports').then(({ data }) => setReports(data.reports || [])).catch(() => { });
    api.get('/admin/users?role=TENANT').then(({ data }) => setTenants((data.users || []).length)).catch(() => { });
    api.get('/admin/users?role=OWNER').then(({ data }) => setOwners((data.users || []).length)).catch(() => { });
  };
  useEffect(() => { load(); }, []);

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
        }
      } else if (decision === 'REJECTED') {
        const remainingPending = localPending.filter((p) => p.id !== id);
        localStorage.setItem('prent_pending_admin_properties', JSON.stringify(remainingPending));
      }

      // Dispatch global real-time event so user's My Properties updates INSTANTLY
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

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link to="/admin/tenants" className="glass-card bg-beige border border-beige-border p-4 transition hover:-translate-y-0.5 hover:shadow-lg"><Users size={20} className="text-navy" /><p className="mt-1 text-2xl font-black text-navy">{tenants}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">Tenants</p></Link>
          <Link to="/admin/owners" className="glass-card bg-beige border border-beige-border p-4 transition hover:-translate-y-0.5 hover:shadow-lg"><Building2 size={20} className="text-forest" /><p className="mt-1 text-2xl font-black text-navy">{owners}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">Owners</p></Link>
          <div className="glass-card bg-beige border border-beige-border p-4"><IndianRupee size={20} className="text-forest" /><p className="mt-1 text-lg font-black text-navy">{formatINR(revenue.totals?.gross || 0)}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">Gross revenue</p></div>
          <div className="glass-card bg-beige border border-beige-border p-4"><Undo2 size={20} className="text-orange" /><p className="mt-1 text-lg font-black text-navy">{formatINR(revenue.totals?.refunded || 0)}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">Refunded</p></div>
        </div>

        <div className="mt-5"><AnalyticsCharts monthly={revenue.monthly} /></div>

        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800"><ShieldAlert size={18} className="text-amber-500" /> Owner Verification Queue <span className="text-sm font-bold text-slate-400">({queue.length})</span></h2>
          <div className="mt-3"><VerificationQueue items={queue} onReviewed={load} /></div>
        </section>

        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800"><ListChecks size={18} className="text-sky-600" /> Property Verification <span className="text-sm font-bold text-slate-400">({pendingProps.length})</span></h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {pendingProps.map((p) => (
              <li key={p.id} className="glass-card flex flex-col justify-between gap-3 p-4 border border-[#e5dac4] rounded-2xl bg-white shadow-xs">
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

                  <p className="text-sm font-black text-slate-800 leading-snug">{p.title}</p>

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
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition border border-emerald-200"
                      >
                        <MapPin size={12} className="text-emerald-700" />
                        <span>Live GPS: {p.lat}, {p.lng}</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}

                  {/* Media attachments */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {p.photos && p.photos.length > 0 && (
                      <div className="flex items-center gap-1">
                        {p.photos.map((ph, idx) => (
                          <img
                            key={idx}
                            src={ph.url}
                            alt={ph.label}
                            title={ph.label}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                        ))}
                      </div>
                    )}
                    {p.video_name && (
                      <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200 flex items-center gap-1">
                        <Video size={11} /> Video ({p.video_size_mb || '20'}MB)
                      </span>
                    )}
                    {p.electricity_bill_uploaded && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                        <FileText size={11} /> Electric Bill
                      </span>
                    )}
                  </div>
                </div>

                {/* 3 Status Action Controls */}
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  {p.verification_status !== 'UNDER_REVIEW' && (
                    <button
                      type="button"
                      onClick={() => updatePropertyStatus(p.id, 'UNDER_REVIEW')}
                      className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                    >
                      🔍 Mark Under Review
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => updatePropertyStatus(p.id, 'REJECTED')}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePropertyStatus(p.id, 'VERIFIED')}
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
      <BottomNav />
    </div>
  );
}
