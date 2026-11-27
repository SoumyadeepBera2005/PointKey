import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ContactOwnerModal({ isOpen, onClose, property, onScheduled }) {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [slot, setSlot] = useState('Morning (10 AM - 1 PM)');
  const [scheduled, setScheduled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (user?.full_name && !user.full_name.startsWith('User ')) {
        setFullName(user.full_name);
      } else {
        setFullName('');
      }
      setPhone(user?.phone || '');
      setScheduled(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !property) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // If user is logged in, save the tenant's full name to their profile
      if (user?.id && fullName.trim()) {
        await api.patch('/auth/profile', {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
        }).catch(() => {});
        await refreshUser?.();
      }
    } catch {}

    setSubmitting(false);
    setScheduled(true);

    setTimeout(() => {
      setScheduled(false);
      if (onScheduled) onScheduled(property, visitDate, slot, fullName, phone);
      onClose();
    }, 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#FBF7EE] border border-[#E7DDC8] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-[#0B2545] flex items-center justify-center transition cursor-pointer"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
          <i className="fa-solid fa-circle-check"></i> 100% ZERO BROKERAGE
        </span>

        <h3 className="text-lg font-black text-[#0B2545] mt-2.5 leading-snug">
          {property.title}
        </h3>
        <p className="text-xs font-bold text-slate-600 mt-1">
          📍 {property.location} • ₹{Number(property.price || property.monthly_rent || 0).toLocaleString('en-IN')}/mo
        </p>

        <div className="mt-4 p-4 rounded-2xl bg-white border border-[#E7DDC8] space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Direct Contact:</span>
            <span className="font-black text-[#0B2545]">+91 98300-XXXXX</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Brokerage Fee:</span>
            <span className="font-black text-emerald-700">₹0 (Direct Lister)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Verification Status:</span>
            <span className="font-black text-emerald-800 flex items-center gap-1">
              <i className="fa-solid fa-shield-halved text-emerald-600"></i> Bill / Tax Checked
            </span>
          </div>
        </div>

        {scheduled ? (
          <div className="mt-5 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in fade-in">
            <span className="text-3xl">🎉</span>
            <h4 className="text-sm font-black text-emerald-900 mt-1.5">
              Direct Visit Requested by {fullName}!
            </h4>
            <p className="text-xs text-emerald-700 mt-1">
              The verified lister has been notified for {visitDate} ({slot}). We will connect you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {/* Tenant Full Name (Taken at the time of booking) */}
            <div>
              <label className="block text-xs font-black text-[#0B2545] mb-1">
                Your Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter your full name (e.g. Subham Roy)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7DDC8] text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#E85D04]"
                autoFocus
              />
            </div>

            {/* Tenant Phone Number */}
            <div>
              <label className="block text-xs font-black text-[#0B2545] mb-1">
                Contact Phone / WhatsApp <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E7DDC8] text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#E85D04]"
              />
            </div>

            {/* Preferred Visit Date & Slot */}
            <div>
              <label className="block text-xs font-black text-[#0B2545] mb-1">
                Preferred Site Visit Slot
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  required
                  className="px-3 py-2.5 rounded-xl bg-white border border-[#E7DDC8] text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#E85D04]"
                />
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-white border border-[#E7DDC8] text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#E85D04]"
                >
                  <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                  <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#E85D04] hover:bg-[#d05303] text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer mt-2 disabled:opacity-60"
            >
              {submitting ? 'Saving Request...' : 'Schedule Direct Visit & Connect'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
