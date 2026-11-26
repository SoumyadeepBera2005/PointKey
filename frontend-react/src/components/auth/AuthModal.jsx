import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  KeyRound, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', initialRole = 'tenant', promptMessage = '' }) {
  const navigate = useNavigate();
  const { login, verifyLoginOtp, signup, refreshUser } = useAuth();

  const [role, setRole] = useState(initialRole); // 'tenant' | 'owner'
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'otp' | 'forgot' | 'reset' | 'done'

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    gender: '',
    occupation: '',
    terms: false,
    keepLoggedIn: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  // OTP flow states
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(60);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  // Forgot password flow
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetDevOtp, setResetDevOtp] = useState('');

  const [doneTitle, setDoneTitle] = useState('');

  const isOwner = role === 'owner';
  const roleUpper = isOwner ? 'OWNER' : 'TENANT';

  // Sync mode and role when props change
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setRole(initialRole || 'tenant');
      setFieldErrors({});
      setFormError('');
      setDevOtp('');
      setOtpCode('');
    }
  }, [isOpen, initialMode, initialRole]);

  // Format countdown seconds MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Timer effect for OTP
  useEffect(() => {
    if (mode !== 'otp' && mode !== 'reset') return;
    if (otpSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, otpSecondsLeft]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (mode === 'login') {
      if (!formData.email.trim()) errors.email = 'Please enter your email.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
        errors.email = 'Enter a valid email address.';
      }
      if (!formData.phone.trim()) errors.phone = 'Please enter your phone number.';
      else {
        const digits = formData.phone.replace(/\D/g, '');
        if (digits.length < 10) errors.phone = 'Enter a valid 10-digit mobile number.';
      }
      if (!formData.password) errors.password = 'Please enter your password.';
    } else if (mode === 'signup') {
      if (!formData.fullName.trim()) errors.fullName = 'Please enter your full name.';
      if (!formData.phone.trim()) errors.phone = 'Please enter your phone number.';
      else {
        const digits = formData.phone.replace(/\D/g, '');
        if (digits.length < 10) errors.phone = 'Enter a valid 10-digit mobile number.';
      }
      if (!formData.email.trim()) errors.email = 'Please enter your email.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
        errors.email = 'Enter a valid email address.';
      }
      if (!formData.password) errors.password = 'Please create a password.';
      else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters.';

      if (isOwner && !formData.city.trim()) {
        errors.city = 'Please specify where your property is located.';
      }
      if (!formData.terms) {
        errors.terms = 'Please accept the Terms to continue.';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setBusy(true);
    setFormError('');

    try {
      const data = await login(formData.email.trim(), formData.phone.trim(), formData.password, roleUpper);
      setMaskedEmail(data.email || formData.email.trim());
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setOtpSecondsLeft(60);
      setOtpSuccessMsg('');
      setMode('otp');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setFormError('Please enter the 6-digit OTP.');
      return;
    }
    if (otpSecondsLeft <= 0) {
      setFormError('Your code has expired. Click "Resend code" below.');
      return;
    }
    setBusy(true);
    setFormError('');

    try {
      const u = await verifyLoginOtp(formData.email.trim(), otpCode.trim(), roleUpper);
      setDoneTitle('Logged In Successfully!');
      setMode('done');
      await refreshUser();
      setTimeout(() => {
        onClose();
        if (u.role === 'OWNER') navigate('/owner');
      }, 900);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setBusy(false);
    }
  };

  const handleResendLoginOtp = async () => {
    setBusy(true);
    setFormError('');
    setOtpSuccessMsg('');
    try {
      const data = await login(formData.email.trim(), formData.phone.trim(), formData.password, roleUpper);
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setOtpSecondsLeft(60);
      setOtpSuccessMsg('A fresh verification code has been sent to your email.');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setBusy(true);
    setFormError('');

    try {
      const u = await signup({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: roleUpper,
        tenant_gender: !isOwner ? formData.gender || undefined : undefined,
        tenant_occupation: !isOwner ? formData.occupation || undefined : undefined,
      });

      setDoneTitle('Account Created Successfully!');
      setMode('done');
      await refreshUser();
      setTimeout(() => {
        onClose();
        if (u.role === 'OWNER') navigate('/owner');
      }, 900);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Forgot password handler
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setFieldErrors({ email: 'Please enter your registered email.' });
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: formData.email.trim() });
      if (data.dev_otp) setResetDevOtp(data.dev_otp);
      setOtpSecondsLeft(60);
      setMode('reset');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not find account with this email.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword) {
      setFormError('Please enter reset OTP and your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      await api.post('/auth/reset-password', {
        email: formData.email.trim(),
        otp: resetCode.trim(),
        newPassword,
      });
      setDoneTitle('Password Reset Successfully!');
      setMode('done');
      setTimeout(() => {
        setMode('login');
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div 
        className="bg-[#FBF8F2] border border-[#E8DCB9] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#ede3cc] hover:bg-[#d8cba9] text-[#17324D] flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Top Branding */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#1f4d3f] flex items-center justify-center text-white font-extrabold text-sm">
            pK
          </div>
          <span className="text-lg font-black text-[#17324D] tracking-tight">PointKey</span>
          <span className="ml-auto mr-7 inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
            ZERO BROKERAGE
          </span>
        </div>

        {promptMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-amber-600" />
            <span>{promptMessage}</span>
          </div>
        )}

        {/* ==============================================================
            MODE: DONE SUCCESS ANIMATION
            ============================================================== */}
        {mode === 'done' && (
          <div className="py-8 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-[#17324D]">{doneTitle}</h3>
            <p className="text-xs text-slate-600 mt-1">Updating your experience...</p>
          </div>
        )}

        {/* ==============================================================
            MODE: OTP VERIFICATION
            ============================================================== */}
        {mode === 'otp' && (
          <div>
            <h3 className="text-xl font-extrabold text-[#17324D] mt-2">Enter Verification Code</h3>
            <p className="text-xs text-slate-600 mt-1">
              We sent a 6-digit code to <strong className="text-slate-900">{maskedEmail}</strong>.
            </p>

            {devOtp && (
              <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-800 font-bold">
                🔑 Development Auto-Code: <span className="font-mono text-sm tracking-wider font-extrabold">{devOtp}</span>
              </div>
            )}

            {otpSuccessMsg && (
              <p className="text-xs text-emerald-700 mt-2 font-semibold">{otpSuccessMsg}</p>
            )}

            <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''));
                    setFormError('');
                  }}
                  className="w-full px-4 py-2.5 text-center tracking-[0.4em] font-mono font-bold text-lg rounded-xl bg-white border border-[#d8cba9] focus:outline-none focus:border-[#1f4d3f]"
                  autoFocus
                />
              </div>

              {formError && (
                <p className="text-xs text-red-600 font-medium">{formError}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Code expires in: <strong className="text-slate-800">{formatTime(otpSecondsLeft)}</strong></span>
                <button
                  type="button"
                  onClick={handleResendLoginOtp}
                  disabled={busy}
                  className="font-bold text-[#1f4d3f] hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white font-extrabold text-sm shadow transition mt-2"
              >
                {busy ? 'Verifying Code...' : 'Verify & Log In'}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 mt-2"
              >
                ← Back to Login
              </button>
            </form>
          </div>
        )}

        {/* ==============================================================
            MODE: FORGOT PASSWORD
            ============================================================== */}
        {mode === 'forgot' && (
          <div>
            <h3 className="text-xl font-extrabold text-[#17324D] mt-2">Reset Password</h3>
            <p className="text-xs text-slate-600 mt-1">Enter your registered email to receive a reset code.</p>

            <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none focus:border-[#1f4d3f]"
                  autoFocus
                />
                {fieldErrors.email && <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.email}</p>}
              </div>

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white font-extrabold text-xs shadow"
              >
                {busy ? 'Sending Reset Code...' : 'Send Reset Code'}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 mt-1"
              >
                ← Back to Login
              </button>
            </form>
          </div>
        )}

        {/* ==============================================================
            MODE: RESET PASSWORD STEP
            ============================================================== */}
        {mode === 'reset' && (
          <div>
            <h3 className="text-xl font-extrabold text-[#17324D] mt-2">Set New Password</h3>
            <p className="text-xs text-slate-600 mt-1">Enter the OTP sent to your email and choose a new password.</p>

            {resetDevOtp && (
              <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-800 font-bold">
                🔑 Reset Code: <span className="font-mono text-sm tracking-wider font-extrabold">{resetDevOtp}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="mt-4 space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reset OTP Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none focus:border-[#1f4d3f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none focus:border-[#1f4d3f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none focus:border-[#1f4d3f]"
                />
              </div>

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white font-extrabold text-xs shadow mt-2"
              >
                {busy ? 'Updating Password...' : 'Save New Password & Log In'}
              </button>
            </form>
          </div>
        )}

        {/* ==============================================================
            MODE: MAIN LOGIN OR SIGNUP
            ============================================================== */}
        {(mode === 'login' || mode === 'signup') && (
          <div>
            <h3 className="text-xl font-black text-[#17324D] mt-1">
              {mode === 'login' ? 'Welcome back to PointKey' : 'Create your PointKey Account'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {mode === 'login'
                ? 'Sign in to access your profile, saved homes & bookings.'
                : 'Join thousands of tenants & owners renting directly with zero brokerage.'}
            </p>

            {/* Role Toggle Selector */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 bg-[#ede3cc] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setRole('tenant')}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  !isOwner ? 'bg-[#1f4d3f] text-white shadow' : 'text-[#17324D] hover:bg-white/40'
                }`}
              >
                <User size={14} />
                <span>I&apos;m a Tenant</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  isOwner ? 'bg-[#1f4d3f] text-white shadow' : 'text-[#17324D] hover:bg-white/40'
                }`}
              >
                <Building2 size={14} />
                <span>I&apos;m an Owner</span>
              </button>
            </div>

            {/* Mode Tabs (Login / Signup) */}
            <div className="flex border-b border-[#d8cba9] mt-3">
              <button
                type="button"
                onClick={() => { setMode('login'); setFieldErrors({}); setFormError(''); }}
                className={`flex-1 py-2 text-xs font-extrabold border-b-2 transition ${
                  mode === 'login' ? 'border-[#1f4d3f] text-[#1f4d3f]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setFieldErrors({}); setFormError(''); }}
                className={`flex-1 py-2 text-xs font-extrabold border-b-2 transition ${
                  mode === 'signup' ? 'border-[#1f4d3f] text-[#1f4d3f]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={mode === 'login' ? handleLoginSubmit : handleSignupSubmit} className="mt-3.5 space-y-2.5">
              
              {/* Full Name for Signup */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-0.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400" size={15} />
                    <input
                      type="text"
                      placeholder="e.g. Subham Roy"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none focus:border-[#1f4d3f]"
                    />
                  </div>
                  {fieldErrors.fullName && <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.fullName}</p>}
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-0.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-400" size={15} />
                  <input
                    type="email"
                    placeholder="e.g. user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none focus:border-[#1f4d3f]"
                  />
                </div>
                {fieldErrors.email && <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.email}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-0.5">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-slate-400" size={15} />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none focus:border-[#1f4d3f]"
                  />
                </div>
                {fieldErrors.phone && <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-bold text-[#1f4d3f] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-400" size={15} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none focus:border-[#1f4d3f]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.password}</p>}
              </div>

              {/* Specific details for signup */}
              {mode === 'signup' && (
                <>
                  {!isOwner ? (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Occupation</label>
                        <select
                          value={formData.occupation}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none"
                        >
                          <option value="">Select (optional)</option>
                          <option value="Student">Student</option>
                          <option value="Working Professional">Working Professional</option>
                          <option value="Business">Business</option>
                          <option value="Family">Family Member</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Gender</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none"
                        >
                          <option value="">Select (optional)</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-0.5">Property Location City</label>
                      <input
                        type="text"
                        placeholder="e.g. Kolkata, Salt Lake, New Town"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-medium focus:outline-none"
                      />
                      {fieldErrors.city && <p className="text-[11px] text-red-600 mt-0.5">{fieldErrors.city}</p>}
                    </div>
                  )}

                  <label className="flex items-start gap-2 text-[11px] text-slate-600 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                      className="mt-0.5 rounded accent-[#1f4d3f]"
                    />
                    <span>
                      I agree to the PointKey Zero Brokerage Terms &amp; Community Rules.
                    </span>
                  </label>
                  {fieldErrors.terms && <p className="text-[11px] text-red-600">{fieldErrors.terms}</p>}
                </>
              )}

              {/* General Form Error */}
              {formError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white font-extrabold text-sm shadow-md transition-all active:scale-95 disabled:opacity-60 mt-2"
              >
                {busy
                  ? 'Processing...'
                  : mode === 'login'
                  ? `Log in as ${isOwner ? 'Owner' : 'Tenant'}`
                  : `Create ${isOwner ? 'Owner' : 'Tenant'} Account`}
              </button>
            </form>

            {/* Bottom Switch Link */}
            <div className="text-center pt-3 text-xs text-slate-600">
              {mode === 'login' ? (
                <span>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setFieldErrors({}); setFormError(''); }}
                    className="font-extrabold text-[#1f4d3f] hover:underline"
                  >
                    Sign up now
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setFieldErrors({}); setFormError(''); }}
                    className="font-extrabold text-[#1f4d3f] hover:underline"
                  >
                    Log in
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
