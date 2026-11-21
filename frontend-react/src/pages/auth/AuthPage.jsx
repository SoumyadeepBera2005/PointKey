import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AuthPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, verifyLoginOtp } = useAuth();

  // Role: 'tenant' | 'owner'
  const initialRole = (params.get('role') || 'tenant').toLowerCase() === 'owner' ? 'owner' : 'tenant';
  const initialMode = (params.get('mode') || 'login').toLowerCase() === 'signup' ? 'signup' : 'login';

  const [role, setRole] = useState(initialRole);
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'otp' | 'forgot' | 'reset' | 'done'

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    area: '',
    city: '',
    propertyCount: '1',
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

  // OTP countdown & notification states
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(300); // 5 minutes countdown (300s)
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  // Password reset flow states
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetDevOtp, setResetDevOtp] = useState('');

  // Done message
  const [doneTitle, setDoneTitle] = useState('');
  const [doneSubtitle, setDoneSubtitle] = useState('');

  const isOwner = role === 'owner';
  const roleUpper = isOwner ? 'OWNER' : 'TENANT';

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // OTP countdown timer effect
  useEffect(() => {
    if (mode !== 'otp' && mode !== 'reset') return;
    if (otpSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, otpSecondsLeft]);

  // Synchronize URL search params when role/mode change
  useEffect(() => {
    setParams({ role, mode: mode === 'signup' ? 'signup' : 'login' }, { replace: true });
  }, [role, mode, setParams]);

  const patch = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    }
    if (formError) setFormError('');
  };

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setFieldErrors({});
    setFormError('');
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setFieldErrors({});
    setFormError('');
  };

  // Validation
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
        errors.terms = 'Please accept the Terms and Privacy Policy to continue.';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const destination = () =>
    location.state?.from?.pathname || (isOwner ? '/owner' : '/tenant');

  // Submit Login (Step 1 -> receives OTP)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setBusy(true);
    setFormError('');

    try {
      const data = await login(formData.email.trim(), formData.phone.trim(), formData.password, roleUpper);
      setMaskedEmail(data.email || formData.email.trim());
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setOtpSecondsLeft(300);
      setOtpSuccessMsg('');
      setMode('otp');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  // Submit OTP Verification (Step 2)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setFormError('Please enter the 6-digit OTP.');
      return;
    }
    if (otpSecondsLeft <= 0) {
      setFormError('Your verification code has expired. Please click "Resend code" below to get a fresh code.');
      return;
    }
    setBusy(true);
    setFormError('');

    try {
      await verifyLoginOtp(formData.email.trim(), otpCode.trim(), roleUpper);
      setDoneTitle('You’re logged in');
      setDoneSubtitle(`Logged in as a ${role}.`);
      setMode('done');
      setTimeout(() => {
        navigate(destination(), { replace: true });
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setBusy(false);
    }
  };

  // Resend Login OTP
  const handleResendLoginOtp = async () => {
    setBusy(true);
    setFormError('');
    setOtpSuccessMsg('');
    try {
      const data = await login(formData.email.trim(), formData.phone.trim(), formData.password, roleUpper);
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setOtpSecondsLeft(300);
      setOtpSuccessMsg('A new verification code has been sent to your email.');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setBusy(false);
    }
  };

  // Submit Signup
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setBusy(true);
    setFormError('');

    try {
      await signup({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: roleUpper,
        tenant_gender: !isOwner ? formData.gender || undefined : undefined,
        tenant_occupation: !isOwner ? formData.occupation || undefined : undefined,
      });

      setDoneTitle('Your account is ready');
      setDoneSubtitle(`Welcome to PointKey! You’re signed up as a ${role}.`);
      setMode('done');
      setTimeout(() => {
        navigate(destination(), { replace: true });
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Request Forgot Password OTP
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
      setOtpSecondsLeft(300);
      setOtpSuccessMsg('');
      setMode('reset');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setBusy(false);
    }
  };

  // Resend Reset OTP
  const handleResendResetOtp = async () => {
    setBusy(true);
    setFormError('');
    setOtpSuccessMsg('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: formData.email.trim() });
      if (data.dev_otp) setResetDevOtp(data.dev_otp);
      setOtpSecondsLeft(300);
      setOtpSuccessMsg('A fresh verification code has been sent to your email.');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to resend reset code.');
    } finally {
      setBusy(false);
    }
  };

  // Submit Password Reset with OTP
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setFormError('Please enter the 6-digit verification code.');
      return;
    }
    if (otpSecondsLeft <= 0) {
      setFormError('Your verification code has expired. Please click "Resend code" below to request a fresh code.');
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
        code: resetCode.trim(),
        new_password: newPassword,
      });
      setDoneTitle('Password updated');
      setDoneSubtitle('You can now log in with your new password.');
      setMode('done');
      setTimeout(() => {
        setMode('login');
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`pointkey-auth-shell ${isOwner ? 'role-owner' : 'role-tenant'}`}>
      <style>{`
        :root {
          --pk-beige: #f3ead6;
          --pk-beige2: #e9dec3;
          --pk-line: #d8cba9;
          --pk-navy: #1f2f6b;
          --pk-green: #1f4d3f;
          --pk-orange: #e08a1e;
          --pk-darkblue: #070738;
          --pk-ink: #141414;
          --pk-white: #ffffff;
        }

        .pointkey-auth-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
          background: var(--pk-beige);
          color: var(--pk-ink);
          font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
          font-size: 15px;
          line-height: 1.5;
          --accent: var(--pk-green);
        }

        .pointkey-auth-shell.role-owner {
          --accent: var(--pk-darkblue);
        }

        /* BRAND COLUMN (LEFT) */
        .pk-brand {
          background: var(--accent);
          color: var(--pk-white);
          padding: calc(36px + env(safe-area-inset-top, 0px)) 44px 0;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: background .45s ease;
        }

        .pk-brand::before {
          content: "";
          position: absolute;
          inset: 0;
          background: url('/assets/images/neighborhood.jpg') 43% 60%/cover;
          opacity: .3;
          mix-blend-mode: luminosity;
          pointer-events: none;
        }

        .pk-brand > * {
          position: relative;
        }

        .pk-badge {
          background: var(--pk-beige);
          border-radius: 22px;
          padding: 14px 28px;
          width: fit-content;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .pk-badge img {
          display: block;
          height: 105px;
          width: auto;
        }

        .pk-brand h2 {
          margin: clamp(28px, 8vh, 80px) 0 14px;
          font-size: clamp(28px, 3.4vw, 44px);
          line-height: 1.15;
          font-weight: 700;
          max-width: 14ch;
          color: #fff;
        }

        .pk-brand p {
          margin: 0;
          max-width: 34ch;
          opacity: .92;
          font-size: 16px;
          line-height: 1.6;
          color: #f3ead6;
        }

        .pk-sky {
          margin-top: auto;
          width: calc(100% + 88px);
          margin-left: -44px;
          display: block;
        }

        /* FORM COLUMN (RIGHT) */
        .pk-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: calc(28px + env(safe-area-inset-top, 0px)) 24px calc(28px + env(safe-area-inset-bottom, 0px));
        }

        .pk-card {
          width: 100%;
          max-width: 440px;
        }

        .pk-roles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--pk-beige2);
          border-radius: 14px;
          padding: 5px;
          gap: 5px;
        }

        .pk-roles button {
          border: 0;
          background: none;
          border-radius: 10px;
          padding: 12px 8px;
          font-weight: 600;
          cursor: pointer;
          color: var(--pk-ink);
          transition: all .2s;
        }

        .pk-roles button[aria-pressed="true"] {
          background: var(--accent);
          color: var(--pk-white);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .pk-modes {
          display: flex;
          gap: 26px;
          margin: 26px 0 22px;
          border-bottom: 1.5px solid var(--pk-line);
        }

        .pk-modes button {
          border: 0;
          background: none;
          padding: 0 0 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          color: var(--pk-ink);
          opacity: .55;
          position: relative;
          transition: opacity .2s;
        }

        .pk-modes button[aria-selected="true"] {
          opacity: 1;
        }

        .pk-modes button[aria-selected="true"]::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1.5px;
          height: 3px;
          border-radius: 2px;
          background: var(--pk-orange);
        }

        .pk-title {
          margin: 0 0 4px;
          font-size: 26px;
          line-height: 1.25;
          font-weight: 700;
          color: var(--pk-navy);
        }

        .pk-sub {
          margin: 0 0 22px;
          opacity: .8;
          font-size: 14px;
          color: #334155;
        }

        .pk-f {
          margin-bottom: 16px;
        }

        .pk-f label {
          display: block;
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 6px;
          color: #17324d;
        }

        .pk-f label em {
          font-style: normal;
          font-weight: 400;
          opacity: .6;
        }

        .pk-in {
          position: relative;
        }

        .pk-in input, .pk-in select {
          width: 100%;
          background: var(--pk-white);
          border: 1.5px solid var(--pk-line);
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 15px;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          color: var(--pk-ink);
          transition: border-color .15s, box-shadow .15s;
        }

        .pk-in input:focus, .pk-in select:focus {
          border-color: var(--accent);
          outline: 3px solid rgba(224, 138, 30, .45);
          outline-offset: 0;
        }

        .pk-in input[aria-invalid="true"], .pk-in select[aria-invalid="true"] {
          border-color: var(--pk-orange);
          border-width: 2px;
        }

        .pk-in .pk-show {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: none;
          font-weight: 600;
          font-size: 13px;
          color: var(--accent);
          padding: 8px;
          cursor: pointer;
        }

        .pk-in select {
          background-image: linear-gradient(45deg, transparent 50%, var(--pk-ink) 50%), linear-gradient(135deg, var(--pk-ink) 50%, transparent 50%);
          background-position: calc(100% - 22px) 55%, calc(100% - 16px) 55%;
          background-size: 6px 6px;
          background-repeat: no-repeat;
          padding-right: 40px;
        }

        .pk-err {
          display: block;
          min-height: 0;
          font-size: 13px;
          margin-top: 5px;
          font-weight: 500;
          color: #b91c1c;
        }

        .pk-err:not(:empty)::before {
          content: "!";
          display: inline-grid;
          place-items: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--pk-orange);
          color: var(--pk-ink);
          font-size: 11px;
          font-weight: 700;
          margin-right: 6px;
        }

        .pk-ferr {
          background: #fbe3cc;
          border-left: 4px solid var(--pk-orange);
          padding: 10px 14px;
          border-radius: 10px;
          margin-bottom: 14px;
          font-weight: 500;
          font-size: 14px;
          color: #8a4700;
        }

        .pk-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin: 4px 0 20px;
          font-size: 14px;
        }

        .pk-chk {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-size: 14px;
          cursor: pointer;
          color: #17324d;
        }

        .pk-chk input {
          width: 18px;
          height: 18px;
          margin: 2px 0 0;
          accent-color: var(--accent);
          flex: none;
          cursor: pointer;
        }

        .pk-link {
          background: none;
          border: 0;
          padding: 0;
          color: var(--accent);
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          font-size: 14px;
        }

        .pk-go {
          width: 100%;
          border: 0;
          border-radius: 14px;
          padding: 15px;
          background: var(--accent);
          color: var(--pk-white);
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          margin-top: 8px;
          transition: transform .15s, opacity .15s, filter .15s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .pk-go:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.06);
        }

        .pk-go:disabled {
          opacity: .65;
          cursor: wait;
        }

        .pk-alt {
          text-align: center;
          margin: 20px 0 0;
          font-size: 14px;
          color: #334155;
        }

        .pk-done {
          text-align: center;
          padding: 30px 0;
        }

        .pk-done .pk-tick {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--pk-orange);
          display: grid;
          place-items: center;
          margin: 0 auto 18px;
          box-shadow: 0 8px 24px rgba(224, 138, 30, 0.4);
        }

        .pk-dev-pill {
          display: inline-block;
          background: #fef08a;
          color: #854d0e;
          font-weight: 700;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        /* OTP Countdown Timer & Notification Styles */
        .pk-timer-wrap {
          display: flex;
          align-items: center;
          margin: -10px 0 18px;
        }

        .pk-timer-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
          border-radius: 9999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .pk-timer-badge strong {
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.5px;
        }

        .pk-timer-badge.urgent {
          background: #ffedd5;
          color: #c2410c;
          border-color: #fed7aa;
          animation: pk-pulse 1.4s ease-in-out infinite;
        }

        .pk-timer-badge.expired {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }

        @keyframes pk-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(0.98); }
        }

        .pk-fsuccess {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 860px) {
          .pointkey-auth-shell {
            grid-template-columns: 1fr;
          }
          .pk-brand {
            padding: calc(18px + env(safe-area-inset-top, 0px)) 22px 18px;
          }
          .pk-brand h2 {
            margin: 14px 0 0;
            font-size: 22px;
            max-width: none;
          }
          .pk-brand p, .pk-sky {
            display: none;
          }
          .pk-badge {
            padding: 8px 16px;
            border-radius: 16px;
          }
          .pk-badge img {
            height: 64px;
          }
          .pk-panel {
            align-items: flex-start;
            padding: 22px 18px calc(28px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>

      {/* BRAND COLUMN (LEFT) */}
      <aside className="pk-brand">
        <div className="pk-badge">
          <img src="/assets/pointkey-logo.png" alt="PointKey" />
        </div>

        <h2>
          {isOwner
            ? 'Rent out your home, simply.'
            : 'Find a home you’ll love.'}
        </h2>
        <p>
          {isOwner
            ? 'List your property and meet tenants who are looking right now.'
            : 'Browse rentals on the map and move in with confidence.'}
        </p>

        {/* Skyline Vector Illustration */}
        <svg className="pk-sky" viewBox="0 0 480 140" aria-hidden="true">
          <g fill="none" stroke="#f3ead6" strokeOpacity=".55" strokeWidth="3" strokeLinejoin="round">
            <path d="M0 138H480" />
            <path d="M22 138V92L72 52L122 92V138" />
            <path d="M152 138V70L217 18L282 70V138" />
            <path d="M312 138V96L357 62L402 96V138" />
            <path d="M426 138V110L452 90L478 110V138" />
          </g>
          <rect x="204" y="86" width="26" height="28" rx="3" fill="#e08a1e" />
          <rect x="170" y="86" width="26" height="28" rx="3" fill="none" stroke="#f3ead6" strokeOpacity=".55" strokeWidth="3" />
          <rect x="340" y="100" width="34" height="38" rx="3" fill="none" stroke="#f3ead6" strokeOpacity=".55" strokeWidth="3" />
        </svg>
      </aside>

      {/* FORM COLUMN (RIGHT) */}
      <main className="pk-panel">
        <div className="pk-card">
          {/* Role switcher */}
          <div className="pk-roles" role="group" aria-label="I am a">
            <button
              type="button"
              aria-pressed={!isOwner}
              onClick={() => handleRoleSwitch('tenant')}
            >
              I’m a tenant
            </button>
            <button
              type="button"
              aria-pressed={isOwner}
              onClick={() => handleRoleSwitch('owner')}
            >
              I’m an owner
            </button>
          </div>

          {/* Mode Tabs (Login vs Signup) */}
          {mode !== 'otp' && mode !== 'forgot' && mode !== 'reset' && mode !== 'done' && (
            <div className="pk-modes" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => handleModeSwitch('login')}
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => handleModeSwitch('signup')}
              >
                Sign up
              </button>
            </div>
          )}

          {/* Error Banner */}
          {formError && <div className="pk-ferr">{formError}</div>}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <div>
              <h1 className="pk-title">Welcome back</h1>
              <p className="pk-sub">Log in to continue as a {role}.</p>

              <form onSubmit={handleLoginSubmit} noValidate>
                <div className="pk-f">
                  <label htmlFor="login-email">Email</label>
                  <div className="pk-in">
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={patch('email')}
                      aria-invalid={!!fieldErrors.email}
                    />
                  </div>
                  {fieldErrors.email && <span className="pk-err">{fieldErrors.email}</span>}
                </div>

                <div className="pk-f">
                  <label htmlFor="login-phone">Mobile number</label>
                  <div className="pk-in">
                    <input
                      id="login-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="98XXXXXXXX (10 digits)"
                      value={formData.phone}
                      onChange={patch('phone')}
                      aria-invalid={!!fieldErrors.phone}
                    />
                  </div>
                  {fieldErrors.phone && <span className="pk-err">{fieldErrors.phone}</span>}
                </div>

                <div className="pk-f">
                  <label htmlFor="login-pw">Password</label>
                  <div className="pk-in">
                    <input
                      id="login-pw"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={patch('password')}
                      aria-invalid={!!fieldErrors.password}
                    />
                    <button
                      type="button"
                      className="pk-show"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="pk-err">{fieldErrors.password}</span>}
                </div>

                <div className="pk-row">
                  <label className="pk-chk">
                    <input
                      type="checkbox"
                      checked={formData.keepLoggedIn}
                      onChange={patch('keepLoggedIn')}
                    />
                    <span>Keep me logged in</span>
                  </label>
                  <button
                    type="button"
                    className="pk-link"
                    onClick={() => {
                      setFormError('');
                      setMode('forgot');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button className="pk-go" type="submit" disabled={busy}>
                  {busy ? 'Please wait…' : 'Log in'}
                </button>
              </form>

              <p className="pk-alt">
                New to PointKey?{' '}
                <button
                  type="button"
                  className="pk-link"
                  onClick={() => handleModeSwitch('signup')}
                >
                  Create an account
                </button>
              </p>

              <p className="pk-alt" style={{ opacity: 0.75, fontSize: '13px', marginTop: '16px' }}>
                <Link to="/admin/login" className="pk-link">
                  Administrator log in
                </Link>
              </p>
            </div>
          )}

          {/* 2. OTP VERIFICATION (STEP 2 OF LOGIN) */}
          {mode === 'otp' && (
            <div>
              <h1 className="pk-title">Verify your email</h1>
              <p className="pk-sub">
                Enter the 6-digit code sent to <strong>{maskedEmail}</strong>.
              </p>

              {devOtp && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  color: '#92400e',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  Your Verification Code: <strong style={{ fontSize: '18px', letterSpacing: '3px', color: '#1f4d3f' }}>{devOtp}</strong>
                </div>
              )}

              {/* OTP Validation Countdown Timer */}
              <div className="pk-timer-wrap">
                {otpSecondsLeft > 0 ? (
                  <div className={`pk-timer-badge ${otpSecondsLeft <= 60 ? 'urgent' : ''}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>
                      Code valid for: <strong>{formatTime(otpSecondsLeft)}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="pk-timer-badge expired">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Code expired! Please click <strong>Resend code</strong>.</span>
                  </div>
                )}
              </div>

              {otpSuccessMsg && (
                <div className="pk-fsuccess">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{otpSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} noValidate>
                <div className="pk-f">
                  <label htmlFor="otp-input">6-Digit Verification Code</label>
                  <div className="pk-in">
                    <input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      autoFocus
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''));
                        if (formError) setFormError('');
                      }}
                    />
                  </div>
                </div>

                <button className="pk-go" type="submit" disabled={busy || otpCode.length < 6 || otpSecondsLeft <= 0}>
                  {busy ? 'Verifying…' : 'Verify & Continue'}
                </button>
              </form>

              <div className="pk-row" style={{ marginTop: '16px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="pk-link font-semibold"
                  onClick={handleResendLoginOtp}
                  disabled={busy}
                >
                  Resend code
                </button>
                <span style={{ opacity: 0.4 }}>•</span>
                <button
                  type="button"
                  className="pk-link"
                  onClick={() => {
                    setFormError('');
                    setOtpSuccessMsg('');
                    setMode('login');
                  }}
                >
                  Back to log in
                </button>
              </div>
            </div>
          )}

          {/* 3. SIGNUP FORM */}
          {mode === 'signup' && (
            <div>
              <h1 className="pk-title">
                {isOwner ? 'Create your owner account' : 'Create your tenant account'}
              </h1>
              <p className="pk-sub">
                {isOwner
                  ? 'List your property and manage enquiries in one place.'
                  : 'Save homes and contact owners in one place.'}
              </p>

              <form onSubmit={handleSignupSubmit} noValidate>
                <div className="pk-f">
                  <label htmlFor="reg-name">Full name</label>
                  <div className="pk-in">
                    <input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Ananya Iyer"
                      value={formData.fullName}
                      onChange={patch('fullName')}
                      aria-invalid={!!fieldErrors.fullName}
                    />
                  </div>
                  {fieldErrors.fullName && <span className="pk-err">{fieldErrors.fullName}</span>}
                </div>

                <div className="pk-f">
                  <label htmlFor="reg-phone">Phone number</label>
                  <div className="pk-in">
                    <input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="98XXXXXXXX"
                      value={formData.phone}
                      onChange={patch('phone')}
                      aria-invalid={!!fieldErrors.phone}
                    />
                  </div>
                  {fieldErrors.phone && <span className="pk-err">{fieldErrors.phone}</span>}
                </div>

                <div className="pk-f">
                  <label htmlFor="reg-email">Email</label>
                  <div className="pk-in">
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={patch('email')}
                      aria-invalid={!!fieldErrors.email}
                    />
                  </div>
                  {fieldErrors.email && <span className="pk-err">{fieldErrors.email}</span>}
                </div>

                {isOwner ? (
                  <>
                    <div className="pk-f">
                      <label htmlFor="reg-city">Where is your property?</label>
                      <div className="pk-in">
                        <input
                          id="reg-city"
                          type="text"
                          placeholder="Area or city (e.g. Salt Lake)"
                          value={formData.city}
                          onChange={patch('city')}
                          aria-invalid={!!fieldErrors.city}
                        />
                      </div>
                      {fieldErrors.city && <span className="pk-err">{fieldErrors.city}</span>}
                    </div>

                    <div className="pk-f">
                      <label htmlFor="reg-count">How many properties?</label>
                      <div className="pk-in">
                        <select
                          id="reg-count"
                          value={formData.propertyCount}
                          onChange={patch('propertyCount')}
                        >
                          <option value="1">1</option>
                          <option value="2 to 5">2 to 5</option>
                          <option value="6 or more">6 or more</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="pk-f">
                      <label htmlFor="reg-area">
                        Preferred area <em>(optional)</em>
                      </label>
                      <div className="pk-in">
                        <input
                          id="reg-area"
                          type="text"
                          placeholder="Where do you want to live?"
                          value={formData.area}
                          onChange={patch('area')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="pk-f">
                        <label htmlFor="reg-gender">
                          Gender <em>(optional)</em>
                        </label>
                        <div className="pk-in">
                          <select
                            id="reg-gender"
                            value={formData.gender}
                            onChange={patch('gender')}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="pk-f">
                        <label htmlFor="reg-occ">
                          Occupation <em>(opt)</em>
                        </label>
                        <div className="pk-in">
                          <select
                            id="reg-occ"
                            value={formData.occupation}
                            onChange={patch('occupation')}
                          >
                            <option value="">Select</option>
                            <option value="Student">Student</option>
                            <option value="Working Professional">Working</option>
                            <option value="Freelancer">Freelance</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="pk-f">
                  <label htmlFor="reg-pw">Create password</label>
                  <div className="pk-in">
                    <input
                      id="reg-pw"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={patch('password')}
                      aria-invalid={!!fieldErrors.password}
                    />
                    <button
                      type="button"
                      className="pk-show"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="pk-err">{fieldErrors.password}</span>}
                </div>

                <div className="pk-f">
                  <label className="pk-chk">
                    <input
                      type="checkbox"
                      checked={formData.terms}
                      onChange={patch('terms')}
                      aria-invalid={!!fieldErrors.terms}
                    />
                    <span>I agree to the Terms and Privacy Policy.</span>
                  </label>
                  {fieldErrors.terms && <span className="pk-err">{fieldErrors.terms}</span>}
                </div>

                <button className="pk-go" type="submit" disabled={busy}>
                  {busy ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="pk-alt">
                Already have an account?{' '}
                <button
                  type="button"
                  className="pk-link"
                  onClick={() => handleModeSwitch('login')}
                >
                  Log in
                </button>
              </p>
            </div>
          )}

          {/* 4. FORGOT PASSWORD (STEP 1) */}
          {mode === 'forgot' && (
            <div>
              <h1 className="pk-title">Reset your password</h1>
              <p className="pk-sub">Enter your email address to receive a verification code.</p>

              <form onSubmit={handleForgotSubmit} noValidate>
                <div className="pk-f">
                  <label htmlFor="forgot-email">Email</label>
                  <div className="pk-in">
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={patch('email')}
                      aria-invalid={!!fieldErrors.email}
                    />
                  </div>
                  {fieldErrors.email && <span className="pk-err">{fieldErrors.email}</span>}
                </div>

                <button className="pk-go" type="submit" disabled={busy}>
                  {busy ? 'Sending code…' : 'Send reset code'}
                </button>
              </form>

              <p className="pk-alt">
                <button
                  type="button"
                  className="pk-link"
                  onClick={() => {
                    setFormError('');
                    setMode('login');
                  }}
                >
                  Back to log in
                </button>
              </p>
            </div>
          )}

          {/* 5. RESET PASSWORD WITH CODE (STEP 2) */}
          {mode === 'reset' && (
            <div>
              <h1 className="pk-title">Enter new password</h1>
              <p className="pk-sub">Check your email for the 6-digit code.</p>

              {resetDevOtp && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  color: '#92400e',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  Your Reset Code: <strong style={{ fontSize: '18px', letterSpacing: '3px', color: '#1f4d3f' }}>{resetDevOtp}</strong>
                </div>
              )}

              {/* OTP Validation Countdown Timer */}
              <div className="pk-timer-wrap">
                {otpSecondsLeft > 0 ? (
                  <div className={`pk-timer-badge ${otpSecondsLeft <= 60 ? 'urgent' : ''}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>
                      Code valid for: <strong>{formatTime(otpSecondsLeft)}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="pk-timer-badge expired">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Code expired! Please click <strong>Resend code</strong>.</span>
                  </div>
                )}
              </div>

              {otpSuccessMsg && (
                <div className="pk-fsuccess">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{otpSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit} noValidate>
                <div className="pk-f">
                  <label htmlFor="reset-code">6-Digit Verification Code</label>
                  <div className="pk-in">
                    <input
                      id="reset-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={resetCode}
                      onChange={(e) => {
                        setResetCode(e.target.value.replace(/\D/g, ''));
                        if (formError) setFormError('');
                      }}
                    />
                  </div>
                </div>

                <div className="pk-f">
                  <label htmlFor="new-pw">New password</label>
                  <div className="pk-in">
                    <input
                      id="new-pw"
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pk-f">
                  <label htmlFor="confirm-pw">Confirm new password</label>
                  <div className="pk-in">
                    <input
                      id="confirm-pw"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button className="pk-go" type="submit" disabled={busy || otpSecondsLeft <= 0}>
                  {busy ? 'Updating…' : 'Update password'}
                </button>
              </form>

              <div className="pk-row" style={{ marginTop: '16px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="pk-link font-semibold"
                  onClick={handleResendResetOtp}
                  disabled={busy}
                >
                  Resend code
                </button>
                <span style={{ opacity: 0.4 }}>•</span>
                <button
                  type="button"
                  className="pk-link"
                  onClick={() => {
                    setFormError('');
                    setOtpSuccessMsg('');
                    setMode('login');
                  }}
                >
                  Back to log in
                </button>
              </div>
            </div>
          )}

          {/* 6. DONE / SUCCESS SCREEN */}
          {mode === 'done' && (
            <div className="pk-done">
              <div className="pk-tick">
                <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
                  <path
                    d="M8 19l7 7 13-15"
                    fill="none"
                    stroke="#141414"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="pk-title">{doneTitle}</h1>
              <p className="pk-sub">{doneSubtitle}</p>
              <button
                className="pk-go"
                onClick={() => navigate(destination(), { replace: true })}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
