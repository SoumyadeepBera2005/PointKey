import { useState, useRef } from 'react';

export default function PostPropertyModal({ isOpen, onClose, onSuccess }) {
  const [listerType, setListerType] = useState('Owner'); // 'Owner' | 'Builder'
  const [type, setType] = useState('flat');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Rajpur Sonarpur');
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [phone, setPhone] = useState('');
  const [foodOption, setFoodOption] = useState('both');

  // Electricity bill upload state
  const [electricityBill, setElectricityBill] = useState(null);
  const [billFileName, setBillFileName] = useState('');
  const [billFileSize, setBillFileSize] = useState('');
  const [billError, setBillError] = useState('');
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleBillChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setBillError('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    setBillError('');
    setElectricityBill(file);
    setBillFileName(file.name);
    const sizeKb = Math.round(file.size / 1024);
    setBillFileSize(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);
  };

  const handleRemoveBill = () => {
    setElectricityBill(null);
    setBillFileName('');
    setBillFileSize('');
    setBillError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!electricityBill) {
      setBillError('Please upload previous month\'s electricity bill to verify direct listing.');
      return;
    }

    setIsSubmitting(true);

    const newProperty = {
      id: `prop-custom-${Date.now()}`,
      title: title || `${type === 'flat' ? '2 BHK Flat' : type === 'pg' ? 'Co-living PG Bed' : 'Private Room'} in ${location}`,
      location,
      city: 'Kolkata',
      type: type === 'flat' ? 'Flat' : type === 'pg' ? 'PG' : 'Room',
      subtype: type === 'flat' ? '2 BHK' : type === 'pg' ? 'Shared Bed' : 'Single Room',
      price: Number(rent) || 8500,
      deposit: Number(deposit) || Number(rent) * 2 || 17000,
      phone,
      lister_type: listerType, // 'Owner' or 'Builder'
      role: listerType,
      electricity_bill_uploaded: true,
      electricity_bill_name: billFileName,
      food: type === 'pg' ? foodOption : 'Not included',
      image: '/assets/images/hero-slide-1.jpg',
      verified: true,
      created_at: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]');
      existing.unshift(newProperty);
      localStorage.setItem('prent_user_posted_properties', JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('prent_property_added', { detail: newProperty }));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      if (onSuccess) onSuccess(newProperty);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1600);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#fffaf0] border border-[#d8cba9] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-6 text-[#17324D] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f6efdf] hover:bg-[#ebdcc0] text-[#17324D] flex items-center justify-center text-sm font-bold transition cursor-pointer"
        >
          ✕
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#e0ece6] text-[#1f4d3f] flex items-center justify-center text-3xl font-extrabold shadow-sm">
              ✓
            </div>
            <h3 className="text-xl font-black text-[#1f4d3f]">Property Listed Successfully!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your direct {listerType.toLowerCase()} listing with electricity bill verification is saved and will be verified within 2 hours.
            </p>
          </div>
        ) : (
          <>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#e0ece6] text-[#1f4d3f] text-[11px] font-extrabold tracking-wide uppercase">
              NO BROKERS • ZERO BROKERAGE LISTING
            </span>
            <h3 className="text-xl font-black text-[#17324D] mt-1">Post Your Property Free</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Direct Owner &amp; Builder verified listings. No middleman charges.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {/* 1. Owner vs Builder Option Selector */}
              <div>
                <label className="block text-xs font-black text-[#17324D] mb-1.5">
                  1. I am listing as: <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#f4ebe0] p-1 rounded-2xl border border-[#e5dac4]">
                  <button
                    type="button"
                    onClick={() => setListerType('Owner')}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                      listerType === 'Owner'
                        ? 'bg-[#1f4d3f] text-white shadow-sm'
                        : 'text-[#17324D] hover:bg-white/50'
                    }`}
                  >
                    <span>👤</span>
                    <span>Property Owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setListerType('Builder')}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                      listerType === 'Builder'
                        ? 'bg-[#1f4d3f] text-white shadow-sm'
                        : 'text-[#17324D] hover:bg-white/50'
                    }`}
                  >
                    <span>🏗️</span>
                    <span>Builder / Developer</span>
                  </button>
                </div>
              </div>

              {/* 2. Property Category */}
              <div>
                <label className="block text-xs font-black text-[#17324D] mb-1">
                  2. Property Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                >
                  <option value="flat">Full Flat (1 / 2 / 3 BHK Apartment)</option>
                  <option value="pg">PG / Hostel Bed &amp; Meals</option>
                  <option value="room">Single / Shared Independent Room</option>
                </select>
              </div>

              {/* 3. Property Title */}
              <div>
                <label className="block text-xs font-black text-[#17324D] mb-1">
                  3. Property Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spacious 2 BHK Flat near Station Road"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                />
              </div>

              {/* 4. Locality & Rent */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-black text-[#17324D] mb-1">
                    4. Locality / Area
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Salt Lake Sector V"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#17324D] mb-1">
                    5. Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    max="500000"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    placeholder="8500"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#17324D] mb-1">
                    6. Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    placeholder="17000"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                  />
                </div>
              </div>

              {/* 5. Contact Phone */}
              <div>
                <label className="block text-xs font-black text-[#17324D] mb-1">
                  7. Contact Phone / WhatsApp <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                />
              </div>

              {/* 6. Previous Month's Electricity Bill Upload (Mandatory verification) */}
              <div className="p-3.5 rounded-2xl bg-[#f4ebe0] border border-[#e5dac4] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-[#17324D]">
                    ⚡ Upload Previous Month&apos;s Electricity Bill <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">PDF, JPG, PNG (Max 5MB)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Required to verify direct ownership/builder authenticity and ensure 100% zero brokerage.
                </p>

                {electricityBill ? (
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-300">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 truncate">
                      <span className="text-base">📄</span>
                      <span className="truncate">{billFileName}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">({billFileSize})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveBill}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="electricity-bill-upload"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleBillChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="electricity-bill-upload"
                      className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-[#d8cba9] bg-white hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-[#17324D] cursor-pointer transition"
                    >
                      <span className="text-base">📤</span>
                      <span>Click to Upload Electricity Bill</span>
                    </label>
                  </div>
                )}

                {billError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">{billError}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#FF9A1F] hover:bg-[#ea580c] text-white font-black text-xs sm:text-sm shadow-md transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Publishing &amp; Verifying Listing...</span>
                  ) : (
                    <>
                      <span>Submit {listerType} Listing Free</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
