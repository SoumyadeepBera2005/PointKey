import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Toast from '../../components/common/Toast';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', mfa_code: '' });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminLogin(form.email, form.password, form.mfa_code);
      navigate('/admin', { replace: true });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Admin authentication failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-trust"><ShieldCheck size={32} /></div>
        <h1 className="mt-4 text-center text-xl font-black">pRent Administration</h1>
        <p className="mt-1 text-center text-[11px] uppercase tracking-widest text-slate-400">Restricted · MFA required · All actions audited</p>
        <div className="mt-6 space-y-3 [&_input]:!border-white/10 [&_input]:!bg-white/10 [&_input]:!text-white [&_.label]:!text-slate-400">
          <Input label="Admin email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@prent.in" />
          <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          <Input label="MFA code (6 digits)" inputMode="numeric" required value={form.mfa_code} onChange={(e) => setForm({ ...form, mfa_code: e.target.value })} placeholder="123456 (dev default)" />
        </div>
        <Button type="submit" className="mt-5 w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={18} /> : 'Authenticate'}</Button>
        <p className="mt-3 text-center text-[10px] text-slate-500">Seed admin: admin@prent.in · dev MFA code 123456 (override via ADMIN_MFA_CODE)</p>
      </form>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
