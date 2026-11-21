import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, X, Loader2, ShieldCheck } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Toast from '../common/Toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * Login/signup shown as a modal overlay — never navigates to a separate page.
 * Login is 2 steps: email + mobile + password → OTP sent to the email.
 * Phone numbers are stored but never verified; the backend checks that the
 * email ↔ mobile pair belongs to the same account.
 */
export default function AuthModal({ role = 'TENANT', onClose }) {
  const [mode, setMode] = useState('login'); // login | signup | otp | forgot | reset
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', tenant_gender: '', tenant_occupation: '' });
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const { login, signup, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isTenant = role === 'TENANT';
  const destination = () => location.state?.from?.pathname || (isTenant ? '/tenant' : '/owner');
  const patch = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submitPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    setToast(null);
    try {
      if (mode === 'login') {
        const data = await login(form.email, form.phone, form.password, role);
        setMaskedEmail(data.email || form.email);
        setMode('otp');
        setToast({
          type: 'info',
          message: data.dev_otp ? `OTP sent (dev code: ${data.dev_otp})` : `OTP sent to ${data.email || 'your email'}`,
        });
      } else {
        await signup({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role,
          tenant_gender: isTenant ? form.tenant_gender || undefined : undefined,
          tenant_occupation: isTenant ? form.tenant_occupation || undefined : undefined,
        });
        navigate(destination(), { replace: true });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Authentication failed' });
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setToast(null);
    try {
      await verifyLoginOtp(form.email, otp, role);
      navigate(destination(), { replace: true });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Invalid or expired OTP' });
    } finally {
      setBusy(false);
    }
  };

  const sendResetOtp = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setToast(null);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: form.email });
      setMode('reset');
      setToast({
        type: 'info',
        message: data.dev_otp ? `OTP sent (dev code: ${data.dev_otp})` : 'If an account exists for this email, an OTP has been sent',
      });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e) => {
    e?.preventDefault?.();
    setToast(null);
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email: form.email, code: resetOtp, new_password: newPassword });
      setToast({ type: 'success', message: data.message || 'Password updated — login with your new password' });
      setMode('login');
      setForm({ ...form, password: '' });
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Invalid or expired OTP' });
    } finally {
      setBusy(false);
    }
  };

  const resendResetOtp = async () => {
    setBusy(true);
    setToast(null);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: form.email });
      setToast({
        type: 'info',
        message: data.dev_otp ? `OTP re-sent (dev code: ${data.dev_otp})` : 'OTP re-sent to your email',
      });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to resend OTP' });
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setBusy(true);
    setToast(null);
    try {
      const data = await login(form.email, form.phone, form.password, role);
      setToast({
        type: 'info',
        message: data.dev_otp ? `OTP re-sent (dev code: ${data.dev_otp})` : `OTP re-sent to ${data.email || maskedEmail}`,
      });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to resend OTP' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 42, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="glass-card max-h-[94vh] w-full max-w-md overflow-y-auto p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'signup' ? 'Create account' : mode === 'forgot' || mode === 'reset' ? 'Reset password' : 'Login'}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-forest">
            <Building2 size={24} />
            <span className="text-2xl font-black tracking-tight text-navy">pRent</span>
            <span className="rounded-full bg-forest/15 border border-forest/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest">
              {isTenant ? 'Tenant' : 'Owner'}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-beige-border/50 hover:text-navy" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {(mode === 'login' || mode === 'signup') ? (
          <>
            <h1 className="mt-4 text-xl font-extrabold text-navy">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-xs text-slate-600">
              {isTenant ? 'Find your next home with trust.' : 'List your property in minutes.'}
            </p>

            <form onSubmit={submitPassword} className="mt-5 space-y-3">
              {mode === 'signup' && (
                <Input label="Full name" required value={form.full_name} onChange={patch('full_name')} placeholder="Ananya Iyer" />
              )}
              <Input label="Email" type="email" required value={form.email} onChange={patch('email')} placeholder="you@example.com" />
              <Input label="Mobile number" type="tel" required inputMode="numeric" value={form.phone} onChange={patch('phone')} placeholder="9830012345" />
              <Input label="Password" type="password" required minLength={6} value={form.password} onChange={patch('password')} placeholder="••••••••" />
              {mode === 'login' && (
                <div className="-mt-1 text-right">
                  <button type="button" onClick={() => { setMode('forgot'); setToast(null); }} className="text-xs font-semibold text-forest hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              {mode === 'signup' && isTenant && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="label">Gender</span>
                    <select className="input" value={form.tenant_gender} onChange={patch('tenant_gender')}>
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="FAMILY">Family</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="label">Occupation</span>
                    <select className="input" value={form.tenant_occupation} onChange={patch('tenant_occupation')}>
                      <option value="">Select</option>
                      <option value="STUDENT">Student</option>
                      <option value="WORKING_PROFESSIONAL">Working Professional</option>
                      <option value="FAMILY">Family</option>
                    </select>
                  </label>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? <Loader2 className="animate-spin" size={18} />
                  : (mode === 'login' ? 'Login' : 'Create account')}
              </Button>
            </form>

            {/* Toggle login ↔ signup */}
            <p className="mt-4 text-center text-sm text-slate-600">
              {mode === 'login' ? (
                <>New user?{' '}
                  <button type="button" onClick={() => { setMode('signup'); setToast(null); }} className="font-bold text-forest hover:underline">
                    Sign up
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button type="button" onClick={() => { setMode('login'); setToast(null); }} className="font-bold text-forest hover:underline">
                    Login
                  </button>
                </>
              )}
            </p>
          </>
        ) : mode === 'otp' ? (
          /* OTP step — verification code is sent to the email used above */
          <>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-forest/10 border border-forest/20 px-4 py-3">
              <ShieldCheck size={22} className="shrink-0 text-forest" />
              <p className="text-xs leading-snug text-navy">
                We sent a 6-digit code to <span className="font-bold">{maskedEmail}</span>.<br />
                Phone numbers are not verified — this email check keeps your account safe.
              </p>
            </div>
            <form onSubmit={verifyOtp} className="mt-4 space-y-3">
              <Input label="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" autoFocus />
              <Button type="submit" className="w-full" disabled={busy || otp.length < 4}>
                {busy ? <Loader2 className="animate-spin" size={18} /> : 'Verify & Login'}
              </Button>
            </form>
            <div className="mt-3 flex items-center justify-between text-xs">
              <button type="button" onClick={() => setMode('login')} className="font-semibold text-slate-400 hover:text-navy">
                ← Back
              </button>
              <button type="button" onClick={resendOtp} disabled={busy} className="font-semibold text-forest hover:underline disabled:opacity-50">
                Resend code
              </button>
            </div>
          </>
        ) : mode === 'forgot' ? (
          /* Forgot password — OTP goes to the email attached to the account */
          <>
            <h1 className="mt-4 text-xl font-extrabold text-navy">Forgot password</h1>
            <p className="text-xs text-slate-600">We&apos;ll send a 6-digit OTP to the email attached to your account.</p>
            <form onSubmit={sendResetOtp} className="mt-5 space-y-3">
              <Input label="Email" type="email" required value={form.email} onChange={patch('email')} placeholder="you@example.com" autoFocus />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" size={18} /> : 'Send OTP'}
              </Button>
            </form>
            <div className="mt-3 flex items-center justify-start text-xs">
              <button type="button" onClick={() => setMode('login')} className="font-semibold text-slate-400 hover:text-navy">
                ← Back to login
              </button>
            </div>
          </>
        ) : (
          /* Reset — verify OTP from the email, then set a new password */
          <>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-forest/10 border border-forest/20 px-4 py-3">
              <ShieldCheck size={22} className="shrink-0 text-forest" />
              <p className="text-xs leading-snug text-navy">
                If an account exists for <span className="font-bold">{form.email}</span>, we sent a 6-digit code there.
              </p>
            </div>
            <form onSubmit={submitReset} className="mt-4 space-y-3">
              <Input label="Enter OTP" value={resetOtp} onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" autoFocus />
              <Input label="New password" type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              <Input label="Confirm new password" type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              <Button type="submit" className="w-full" disabled={busy || resetOtp.length < 4}>
                {busy ? <Loader2 className="animate-spin" size={18} /> : 'Verify & Update password'}
              </Button>
            </form>
            <div className="mt-3 flex items-center justify-between text-xs">
              <button type="button" onClick={() => setMode('forgot')} className="font-semibold text-slate-400 hover:text-navy">
                ← Back
              </button>
              <button type="button" onClick={resendResetOtp} disabled={busy} className="font-semibold text-forest hover:underline disabled:opacity-50">
                Resend code
              </button>
            </div>
          </>
        )}

        <p className="mt-4 text-center text-[10px] text-slate-400">By continuing you agree to pRent&apos;s Terms &amp; Privacy Policy.</p>
      </motion.div>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
