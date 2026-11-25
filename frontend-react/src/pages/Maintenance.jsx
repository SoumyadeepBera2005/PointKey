import React, { useState } from 'react';
import { 
  Wrench, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  Server, 
  Mail, 
  Phone, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Maintenance() {
  const [checking, setChecking] = useState(false);
  const [showBypassPrompt, setShowBypassPrompt] = useState(false);
  const [bypassPin, setBypassPin] = useState('');
  const [bypassError, setBypassError] = useState('');
  const navigate = useNavigate();

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleBypassSubmit = (e) => {
    e.preventDefault();
    // Default preview PIN is 'admin' or 'pointkey'
    if (bypassPin.trim().toLowerCase() === 'admin' || bypassPin.trim() === '1234' || bypassPin.trim().toLowerCase() === 'pointkey') {
      sessionStorage.setItem('pk_maintenance_bypass', 'true');
      window.location.href = '/tenant';
    } else {
      setBypassError('Invalid PIN. Use "admin" or "pointkey" to preview.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F2] flex flex-col justify-between font-sans text-slate-800 selection:bg-[#4F7A63] selection:text-white relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#4F7A63]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f4d3f] to-[#2d6a55] flex items-center justify-center text-white font-extrabold text-lg shadow-md border border-white/20">
            pK
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-[#17324D] block leading-none">PointKey</span>
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Smart Rental Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Scheduled Maintenance
          </span>
        </div>
      </header>

      {/* MAIN CONTENT CARD */}
      <main className="w-full max-w-3xl mx-auto px-4 py-8 flex-1 flex flex-col justify-center items-center relative z-10">
        <div className="w-full bg-white/80 backdrop-blur-md border border-[#E8DCB9] rounded-3xl p-6 sm:p-10 shadow-2xl shadow-slate-900/5 text-center transition-all">
          
          {/* Animated Maintenance Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#1f4d3f] via-[#2d6a55] to-[#4F7A63] flex items-center justify-center text-white shadow-xl shadow-[#1f4d3f]/25 rotate-3 hover:rotate-0 transition-transform duration-300">
              <Wrench className="w-12 h-12 text-white animate-bounce" style={{ animationDuration: '2.5s' }} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-[#FF7A00] text-white flex items-center justify-center shadow-md border-2 border-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Bengali Headline */}
          <div className="inline-block px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold mb-3">
            ⚠️ রক্ষণাবেক্ষণ কাজের জন্য সাইটটি সাময়িকভাবে বন্ধ আছে
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-[#17324D] tracking-tight leading-tight mb-3">
            We&apos;re Currently Under Maintenance
          </h1>

          {/* Explanatory Paragraphs */}
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-2">
            PointKey প্ল্যাটফর্মে সিস্টেম আপডেট ও পারফরম্যান্স উন্নয়নের কাজ চলছে। এ কারণে রেন্টাল সার্চ, ভিজিট বুকিং ও পেমেন্ট সাময়িকভাবে বন্ধ রাখা হয়েছে।
          </p>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto mb-8">
            Our systems are offline for scheduled infrastructure upgrades. We apologize for the inconvenience and will be back live very shortly!
          </p>

          {/* Status Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
            <div className="p-3.5 rounded-2xl bg-[#FBF8F2] border border-[#E8DCB9]/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-xs font-bold text-[#17324D] block">Search &amp; Listings</strong>
                <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Paused Temporarily
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FBF8F2] border border-[#E8DCB9]/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-xs font-bold text-[#17324D] block">Visits &amp; Payments</strong>
                <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Temporarily Offline
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FBF8F2] border border-[#E8DCB9]/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-xs font-bold text-[#17324D] block">Escrow &amp; Security</strong>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  100% Secure &amp; Safe
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white px-6 py-3 text-sm font-bold shadow-lg shadow-[#1f4d3f]/20 transition-all active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking Status...' : 'Check If Site Is Back'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBypassPrompt(!showBypassPrompt)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8DCB9] bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 text-sm font-bold transition-all"
            >
              <span>Preview Site</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Bypass Prompt Modal / Accordion */}
          {showBypassPrompt && (
            <form onSubmit={handleBypassSubmit} className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-sm mx-auto animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Developer / Admin Passcode:</label>
                <span className="text-[10px] text-slate-400">PIN: admin</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter 'admin' to preview"
                  value={bypassPin}
                  onChange={(e) => {
                    setBypassPin(e.target.value);
                    setBypassError('');
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1f4d3f]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1f4d3f] hover:bg-[#15382e] text-white text-xs font-bold rounded-xl"
                >
                  Enter
                </button>
              </div>
              {bypassError && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{bypassError}</p>
              )}
            </form>
          )}

          {/* Emergency Support Bar */}
          <div className="mt-8 pt-6 border-t border-[#E8DCB9]/60 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Need urgent support?</span>
            <a href="mailto:support@pointkey.in" className="inline-flex items-center gap-1.5 hover:text-[#1f4d3f] transition-colors">
              <Mail className="w-3.5 h-3.5 text-[#4F7A63]" />
              <span>support@pointkey.in</span>
            </a>
            <a href="tel:+919876543210" className="inline-flex items-center gap-1.5 hover:text-[#1f4d3f] transition-colors">
              <Phone className="w-3.5 h-3.5 text-[#4F7A63]" />
              <span>+91 98765 43210</span>
            </a>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 border-t border-[#E8DCB9]/40 relative z-10">
        <div>
          © {new Date().getFullYear()} PointKey Technologies. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="inline-flex items-center gap-1 text-slate-600 hover:text-[#1f4d3f] font-semibold transition-colors">
            <span>Admin Portal</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </footer>

    </div>
  );
}
