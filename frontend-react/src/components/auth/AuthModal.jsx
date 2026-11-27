import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, promptMessage = '' }) {
  const navigate = useNavigate();
  const { login, verifyLoginOtp, refreshUser } = useAuth();

  // Mode: 'input' | 'otp' | 'done'
  const [mode, setMode] = useState('input');

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  // OTP flow states
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(60);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  // Reset states when opening modal
  useEffect(() => {
    if (isOpen) {
      setMode('input');
      setFieldErrors({});
      setFormError('');
      setDevOtp('');
      setOtpCode('');
      setOtpSuccessMsg('');
    }
  }, [isOpen]);

  // Format countdown seconds MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Timer effect for OTP
  useEffect(() => {
    if (mode !== 'otp') return;
    if (otpSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, otpSecondsLeft]);

  if (!isOpen) return null;

  const validateInput = () => {
    const errors = {};
    const emailTrim = formData.email.trim();
    const phoneDigits = formData.phone.replace(/\D/g, '');

    if (!emailTrim) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrim)) {
      errors.email = 'Please enter a valid email (e.g. name@example.com).';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Please enter your 10-digit mobile number.';
    } else if (phoneDigits.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!validateInput()) return;
    setBusy(true);
    setFormError('');

    const emailTrim = formData.email.trim().toLowerCase();
    const phoneTrim = formData.phone.replace(/\D/g, '');

    try {
      const data = await login(emailTrim, phoneTrim);
      setMaskedEmail(data.email || emailTrim);
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setOtpSecondsLeft(60);
      setOtpSuccessMsg(data.message || 'Verification code sent to your email.');
      setMode('otp');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not send verification code. Please check your details.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpCode.trim();
    if (!code || code.length !== 6) {
      setFormError('Please enter the 6-digit OTP code.');
      return;
    }
    setBusy(true);
    setFormError('');

    const emailTrim = formData.email.trim().toLowerCase();
    const phoneTrim = formData.phone.replace(/\D/g, '');

    try {
      const u = await verifyLoginOtp(emailTrim, code, phoneTrim);
      await refreshUser();
      setMode('done');
      setTimeout(() => {
        onClose();
        if (u?.role === 'OWNER') {
          navigate('/owner');
        }
      }, 900);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (busy || otpSecondsLeft > 0) return;
    setBusy(true);
    setFormError('');
    const emailTrim = formData.email.trim().toLowerCase();
    const phoneTrim = formData.phone.replace(/\D/g, '');

    try {
      const data = await login(emailTrim, phoneTrim);
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setOtpSecondsLeft(60);
      setOtpSuccessMsg('New verification code sent to your email.');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div 
        className="bg-[#FBF8F2] border border-[#E8DCB9] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#ede3cc] hover:bg-[#d8cba9] text-[#17324D] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Top Branding */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#1f4d3f] flex items-center justify-center text-white font-black text-sm">
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
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-[#17324D]">Welcome to PointKey!</h3>
            <p className="text-xs text-slate-600 mt-1">Logged in successfully. Zero brokerage unlocked.</p>
          </div>
        )}

        {/* ==============================================================
            MODE: STEP 1 - EMAIL & PHONE (OYO / BLINKIT STYLE)
            ============================================================== */}
        {mode === 'input' && (
          <div>
            <h3 className="text-xl font-black text-[#17324D] mt-2">
              Login or Sign Up
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Enter your email &amp; mobile number. We will send an OTP to verify.
            </p>

            <form onSubmit={handleRequestOtp} className="mt-4 space-y-3.5">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                      setFormError('');
                    }}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#1f4d3f] focus:ring-2 focus:ring-[#1f4d3f]/15"
                    autoFocus
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold">{fieldErrors.email}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none">
                    <Phone size={14} className="text-slate-400" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phone: val });
                      setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      setFormError('');
                    }}
                    required
                    className="w-full pl-16 pr-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#0B2545] tracking-wide focus:outline-none focus:border-[#1f4d3f] focus:ring-2 focus:ring-[#1f4d3f]/15"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold">{fieldErrors.phone}</p>
                )}
              </div>

              {/* General Form Error */}
              {formError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {busy ? (
                  <span>Sending OTP...</span>
                ) : (
                  <>
                    <span>Continue with OTP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Informational Pill (OYO / Blinkit style) */}
            <div className="mt-4 p-3 rounded-2xl bg-white/70 border border-[#E7DDC8] flex items-center gap-2.5 text-[11px] text-slate-600 font-medium">
              <Sparkles size={16} className="text-[#FF9A1F] shrink-0" />
              <span>
                <strong>Passwordless Login:</strong> No passwords or role selection needed. Instant access via Email OTP.
              </span>
            </div>

            <p className="text-[11px] text-center text-slate-500 mt-3 leading-relaxed">
              By continuing, you agree to PointKey&apos;s Zero Brokerage Terms &amp; Community Privacy.
            </p>
          </div>
        )}

        {/* ==============================================================
            MODE: STEP 2 - OTP VERIFICATION
            ============================================================== */}
        {mode === 'otp' && (
          <div>
            <h3 className="text-xl font-black text-[#17324D] mt-2">
              Enter Verification Code
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              We sent a 6-digit code to <strong className="text-[#0B2545]">{maskedEmail}</strong>.
            </p>

            {devOtp && (
              <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-800 font-bold flex items-center justify-between">
                <span>🔑 Auto Verification Code:</span>
                <span className="font-mono text-sm tracking-widest font-black bg-white px-2 py-0.5 rounded-lg border border-emerald-300">
                  {devOtp}
                </span>
              </div>
            )}

            {otpSuccessMsg && (
              <p className="text-xs text-emerald-700 mt-2 font-bold">{otpSuccessMsg}</p>
            )}

            <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setFormError('');
                  }}
                  className="w-full px-4 py-2.5 text-center tracking-[0.4em] font-mono font-black text-xl rounded-xl bg-white border border-[#d8cba9] text-[#0B2545] focus:outline-none focus:border-[#1f4d3f] focus:ring-2 focus:ring-[#1f4d3f]/15"
                  autoFocus
                />
              </div>

              {formError && (
                <p className="text-xs text-red-600 font-semibold">{formError}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>
                  Expires in: <strong className="text-slate-800">{formatTime(otpSecondsLeft)}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={busy || otpSecondsLeft > 0}
                  className="font-bold text-[#1f4d3f] hover:underline disabled:opacity-40 cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer mt-2"
              >
                {busy ? 'Verifying Code...' : 'Verify & Enter PointKey'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('input');
                  setOtpCode('');
                  setFormError('');
                }}
                className="w-full text-center text-xs font-bold text-slate-600 hover:text-slate-900 mt-2 cursor-pointer"
              >
                ← Edit Email or Mobile Number
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
