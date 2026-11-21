import { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/common/Toast';
import api from '../../services/api';
import { Ban, Trash2, CheckCircle2, UserX } from 'lucide-react';

export default function ManageTenants() {
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);

  const load = () => api.get('/admin/users?role=TENANT').then(({ data }) => setUsers(data.users || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const setStatus = async (id, account_status) => {
    const verb = account_status === 'DELETED' ? 'mark as deleted' : account_status.toLowerCase();
    if (!window.confirm(`Are you sure you want to ${verb} this tenant?`)) return;
    try {
      await api.patch(`/admin/users/${id}/status`, { account_status });
      setToast({ type: 'success', message: `Tenant ${account_status.toLowerCase()}` });
      load();
    } catch {
      setToast({ type: 'error', message: 'Action failed' });
    }
  };

  const permanentDelete = async (id, name) => {
    const ok = window.confirm(
      `PERMANENTLY delete ${name}?

This erases the account from the database — all listings, visits, payments, ratings and chats linked to it will also be deleted via cascade.

This CANNOT be undone.`
    );
    if (!ok) return;
    try {
      await api.delete(`/admin/users/${id}/permanent`);
      setToast({ type: 'success', message: 'User permanently deleted from the database' });
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Permanent delete failed' });
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-5">
        <h1 className="text-xl font-extrabold text-slate-800">Manage Tenants</h1>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-3">Tenant</th><th className="px-3">Phone</th><th className="px-3">Status</th><th className="px-3">Rating</th><th className="px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="bg-white shadow-sm">
                  <td className="rounded-l-xl px-3 py-2.5"><p className="font-bold text-slate-800">{u.full_name}</p><p className="text-[11px] text-slate-400">{u.email}</p></td>
                  <td className="px-3 py-2.5 text-slate-600">{u.phone}</td>
                  <td className="px-3 py-2.5"><Badge tone={u.account_status === 'ACTIVE' ? 'green' : u.account_status === 'BLOCKED' ? 'amber' : 'red'}>{u.account_status}</Badge></td>
                  <td className="px-3 py-2.5 text-slate-600">{Number(u.average_rating || 0).toFixed(1)} ★</td>
                  <td className="rounded-r-xl px-3 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      {u.account_status !== 'ACTIVE' && <button onClick={() => setStatus(u.id, 'ACTIVE')} title="Reactivate" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={17} /></button>}
                      {u.account_status === 'ACTIVE' && <button onClick={() => setStatus(u.id, 'BLOCKED')} title="Block" className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"><Ban size={17} /></button>}
                      <button onClick={() => setStatus(u.id, 'DELETED')} title="Delete" className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={17} /></button>
                      <button onClick={() => permanentDelete(u.id, u.full_name)} title="Permanent delete — erases from database (irreversible)" className="rounded-lg p-2 text-red-700 ring-1 ring-red-200 hover:bg-red-50"><UserX size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">No tenants found.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <BottomNav />
    </div>
  );
}
