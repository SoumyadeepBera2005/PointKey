import { ShieldCheck, LogOut, Megaphone, FileText, UserCog } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = [
    { icon: UserCog, label: 'Change Details', sub: 'Admin profile & credentials (via ops team)' },
    { icon: Megaphone, label: 'Digital Marketing', sub: 'Campaigns & growth (placeholder — connect CRM)' },
    { icon: FileText, label: 'Terms and Conditions', sub: 'pRent admin operating terms' },
  ];

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="glass-card flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white"><ShieldCheck size={30} /></div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800">{user?.full_name}</h1>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-trust">Administration · Full audit log</p>
          </div>
        </div>
        <div className="glass-card mt-4 divide-y divide-slate-100">
          {items.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon size={20} /></span>
              <span><span className="block text-sm font-bold text-slate-800">{label}</span><span className="block text-[11px] text-slate-400">{sub}</span></span>
            </div>
          ))}
        </div>
        <button onClick={() => { logout(); navigate('/admin/login'); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-500 transition hover:bg-red-100">
          <LogOut size={18} /> Logout
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
