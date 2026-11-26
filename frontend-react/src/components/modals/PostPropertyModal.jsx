import { useState } from 'react';

export default function PostPropertyModal({ isOpen, onClose, onSuccess }) {
  const [role, setRole] = useState('Owner');
  const [type, setType] = useState('flat');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Rajpur Sonarpur');
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [phone, setPhone] = useState('');
  const [foodOption, setFoodOption] = useState('both');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
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
      role,
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
        className="bg-[#fffaf0] border border-[#d8cba9] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-6 text-[#17324D] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f6efdf] hover:bg-[#ebdcc0] text-[#17324D] flex items-center justify-center text-sm font-bold transition"
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
              Your direct owner listing is saved and will be verified by PointKey Admin within 2 hours.
            </p>
          </div>
        ) : (
          <>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#e0ece6] text-[#1f4d3f] text-[11px] font-extrabold tracking-wide uppercase">
              NO BROKERS • MAX 2 FREE LISTINGS
            </span>
            <h3 className="text-xl font-extrabold text-[#17324D] mt-1">Post Your Flat, PG or Room Free</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              I confirm I am a direct Owner, Builder, or PG/Room lister and will charge zero brokerage.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17324D] mb-1">1. Lister Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Builder">Builder</option>
                    <option value="PG / Hostel Manager">PG / Hostel Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17324D] mb-1">2. Property Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                  >
                    <option value="flat">Full Flat (1 / 2 / 3 BHK)</option>
                    <option value="pg">PG / Hostel Bed</option>
                    <option value="room">Single / Shared Room</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17324D] mb-1">3. Property Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spacious 2 BHK Flat near Jadavpur Station"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs text-[#17324D] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17324D] mb-1">4. Locality / Area</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Rajpur Sonarpur"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17324D] mb-1">5. Monthly Rent (₹)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    max="200000"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    placeholder="8500"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17324D] mb-1">6. Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    placeholder="17000"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17324D] mb-1">7. Contact Phone / WhatsApp</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#FF9A1F] hover:bg-[#ea580c] text-white font-extrabold text-sm shadow-md transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Publishing Listing...</span>
                  ) : (
                    <>
                      <span>Submit Free Listing</span>
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
