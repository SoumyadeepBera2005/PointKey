import { useState } from 'react';

export default function ContactOwnerModal({ isOpen, onClose, property, onScheduled }) {
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [slot, setSlot] = useState('Morning (10 AM - 1 PM)');
  const [scheduled, setScheduled] = useState(false);

  if (!isOpen || !property) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setScheduled(true);
    setTimeout(() => {
      setScheduled(false);
      if (onScheduled) onScheduled(property, visitDate, slot);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FBF7EE] border border-[#E7DDC8] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-[#0B2545] flex items-center justify-center transition cursor-pointer"
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

        <div className="mt-4 p-4 rounded-2xl bg-white border border-[#E7DDC8] space-y-2.5 text-xs">
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
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-2xl">🎉</span>
            <h4 className="text-sm font-black text-emerald-900 mt-1">Direct Visit Requested!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              The verified lister has been notified for {visitDate} ({slot}).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <label className="block text-xs font-black text-[#0B2545]">
              Preferred Site Visit Slot
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
                className="px-3 py-2 rounded-xl bg-white border border-[#E7DDC8] text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#E85D04]"
              />
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-[#E7DDC8] text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#E85D04]"
              >
                <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#E85D04] hover:bg-[#d05303] text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              Schedule Direct Visit
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
