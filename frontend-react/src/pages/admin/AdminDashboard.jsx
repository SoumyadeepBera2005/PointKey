import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, BadgePercent, Undo2, ShieldAlert, ListChecks, IndianRupee } from 'lucide-react';
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
    api.get('/admin/revenue?months=6').then(({ data }) => setRevenue(data)).catch(() => {});
    api.get('/admin/verification-queue').then(({ data }) => setQueue(data.queue || [])).catch(() => {});
    api.get('/admin/properties/pending').then(({ data }) => setPendingProps(data.properties || [])).catch(() => {});
    api.get('/admin/reports').then(({ data }) => setReports(data.reports || [])).catch(() => {});
    api.get('/admin/users?role=TENANT').then(({ data }) => setTenants((data.users || []).length)).catch(() => {});
    api.get('/admin/users?role=OWNER').then(({ data }) => setOwners((data.users || []).length)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const verifyProperty = async (id, decision) => {
    await api.post(`/admin/properties/${id}/verify`, { decision }).catch(() => {});
    load();
  };

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
              <li key={p.id} className="glass-card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{p.property_code} · {p.title}</p>
                  <p className="text-[11px] text-slate-400">{p.owner_name} · {p.category} · {formatINR(p.rent_amount)}/mo</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => verifyProperty(p.id, 'VERIFIED')} className="rounded-lg bg-trust px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-600">Verify</button>
                  <button onClick={() => verifyProperty(p.id, 'REJECTED')} className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50">Reject</button>
                </div>
              </li>
            ))}
            {pendingProps.length === 0 && <li className="text-sm text-slate-400">All listings verified.</li>}
          </ul>
        </section>
      </main>
      {showReports && <ScamReportDrawer items={reports} onClose={() => setShowReports(false)} onUpdated={load} />}
      <BottomNav />
    </div>
  );
}
