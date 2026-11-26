import { useState, useEffect } from 'react';

const SERVICE_ITEMS = [
  {
    id: 'srv-water',
    name: '20L Mineral Water Jar',
    category: 'Daily Essentials',
    price: 45,
    unit: 'per jar',
    icon: '💧',
    desc: 'Bisleri / Kinley sealed bubble-top jar doorstep delivery.',
  },
  {
    id: 'srv-gas',
    name: 'GasGo LPG Cylinder Assist',
    category: 'Daily Essentials',
    price: 120,
    unit: 'per refill',
    icon: '🔥',
    desc: 'HP / Indane / Bharat Gas doorstep booking & refill pickup.',
  },
  {
    id: 'srv-cleaning',
    name: 'Deep Room & Bathroom Cleaning',
    category: 'Home & Moving',
    price: 499,
    unit: 'per session',
    icon: '🧹',
    desc: 'Eco-friendly sanitization, tile scrubbing and floor polishing.',
  },
  {
    id: 'srv-repairs',
    name: 'Electrician & Plumber Visit',
    category: 'Home & Moving',
    price: 199,
    unit: 'visit fee',
    icon: '⚡',
    desc: 'Fast repair for geysers, switches, taps, and leaking pipes.',
  },
  {
    id: 'srv-moving',
    name: 'GharSafar MiniMove',
    category: 'Home & Moving',
    price: 1499,
    unit: 'starting at',
    icon: '🚚',
    desc: 'Tata Ace mini-truck with 2 helpers for smooth room shifting.',
  },
  {
    id: 'srv-tiffin',
    name: 'Homemade Daily Tiffin Service',
    category: 'Daily Essentials',
    price: 80,
    unit: 'per meal',
    icon: '🍱',
    desc: 'Fresh home-cooked hygienic Bengali / North Indian meals.',
  },
];

export default function ServiceDrawer({ isOpen, onClose, onCartCountChange }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('prent_service_cart') || '{}');
    } catch {
      return {};
    }
  });

  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('prent_service_cart', JSON.stringify(cart));
      const totalCount = Object.values(cart).reduce((a, b) => a + b, 0);
      if (onCartCountChange) onCartCountChange(totalCount);
    } catch {}
  }, [cart, onCartCountChange]);

  if (!isOpen) return null;

  const updateQuantity = (id, delta) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = SERVICE_ITEMS.find((s) => s.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleCheckout = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setCart({});
      setBookingSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-[#fffaf0] border-l border-[#d8cba9] w-full max-w-md h-full flex flex-col shadow-2xl text-[#17324D] animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8e0d3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#f6efdf] flex items-center justify-center text-lg">
              🛒
            </span>
            <div>
              <h3 className="font-extrabold text-base text-[#17324D]">Service Bag &amp; Cart</h3>
              <p className="text-xs text-slate-500">Everyday Home Services on Demand</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f6efdf] hover:bg-[#ebdcc0] text-[#17324D] flex items-center justify-center text-sm font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {bookingSuccess ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#e0ece6] text-[#1f4d3f] flex items-center justify-center text-3xl font-extrabold">
                ✓
              </div>
              <h4 className="text-lg font-black text-[#1f4d3f]">Service Request Placed!</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Our local service partner in your area will contact you shortly to confirm the scheduled time slot.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span>Select Everyday Facility</span>
                <span>{totalItems} in bag</span>
              </div>

              {SERVICE_ITEMS.map((item) => {
                const qty = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#e8e0d3] shadow-xs flex items-center justify-between gap-3 hover:border-[#1f4d3f] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0 p-2 rounded-xl bg-[#f6efdf]">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-[#17324D] truncate">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc}</p>
                        <span className="text-xs font-black text-[#1f4d3f] mt-0.5 inline-block">
                          ₹{item.price}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            /{item.unit}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 bg-[#f6efdf] rounded-xl p-1">
                      {qty > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white text-[#17324D] font-bold text-xs flex items-center justify-center shadow-xs hover:bg-[#ebdcc0]"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-xs font-black">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-[#1f4d3f] text-white font-bold text-xs flex items-center justify-center shadow-xs hover:bg-[#163a30]"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-3 py-1.5 rounded-lg bg-[#1f4d3f] hover:bg-[#163a30] text-white font-bold text-xs transition"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {!bookingSuccess && (
          <div className="p-4 sm:p-5 border-t border-[#e8e0d3] bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Estimated Subtotal</span>
              <span className="text-lg font-black text-[#17324D]">₹{totalAmount}</span>
            </div>
            <button
              type="button"
              disabled={totalItems === 0}
              onClick={handleCheckout}
              className="w-full py-3 rounded-xl bg-[#FF9A1F] hover:bg-[#ea580c] text-white font-extrabold text-sm shadow-md transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Schedule Service ({totalItems} items)</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
