import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Wallet, Star, Settings, LifeBuoy, FileText, LogOut, ToggleLeft } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

export default function OwnerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const MENU = [
    { label: 'Verified / Unverified Status', sub: user?.verification_status === 'VERIFIED' ? 'Your identity is verified' : 'Complete face verification to unlock verified badge', icon: ShieldCheck, tone: 'text-emerald-600 bg-emerald-50', to: '/owner' },
    { label: 'Booked / Unbooked Properties', sub: 'Manage availability per listing', icon: ToggleLeft, tone: 'text-sky-600 bg-sky-50', to: '/owner/listings' },
    { label: 'Payment Receipts', sub: 'Platform fees & payouts', icon: Wallet, tone: 'text-violet-600 bg-violet-50', to: '/owner/requests' },
    { label: 'Rating Tenants', sub: 'Two-way ratings for tenants you hosted', icon: Star, tone: 'text-amber-600 bg-amber-50', to: '/owner/requests' },
    { label: 'Settings', sub: 'Profile & account', icon: Settings, tone: 'text-slate-600 bg-slate-100', to: '/owner' },
    { label: 'Help & Support', sub: 'care@prent.in · +91 90000 00000', icon: LifeBuoy, tone: 'text-blue-600 bg-blue-50', to: '/owner' },
    { label: 'Terms & Conditions', sub: 'Owner agreement & verification policy', icon: FileText, tone: 'text-slate-600 bg-slate-100', to: '/owner' },
  ];

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="glass-card flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-trust text-2xl font-black text-white">{user?.full_name?.[0]?.toUpperCase() || 'O'}</div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold text-slate-800">{user?.full_name}</h1>
            <p className="truncate text-xs text-slate-500">{user?.email} · {user?.phone}</p>
            <div className="mt-1"><Badge tone={user?.verification_status === 'VERIFIED' ? 'green' : 'amber'}>{user?.verification_status || 'NOT_SUBMITTED'} OWNER</Badge></div>
          </div>
        </div>

        <div className="glass-card mt-4 divide-y divide-slate-100 overflow-hidden">
          {MENU.map(({ label, sub, icon: Icon, tone, to }) => (
            <button key={label} onClick={() => navigate(to)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-800">{label}</span>
                <span className="block truncate text-[11px] text-slate-400">{sub}</span>
              </span>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          ))}
        </div>

        <button onClick={() => { logout(); navigate('/role-selection'); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-500 transition hover:bg-red-100">
          <LogOut size={18} /> Logout
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
