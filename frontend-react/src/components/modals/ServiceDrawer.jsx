import { useState, useEffect } from 'react';
import { HOME_SERVICES_DATA } from '../../data/homeServicesData';

export default function ServiceDrawer({ isOpen, onClose, onCartCountChange }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('prent_service_cart') || '{}');
    } catch {
      return {};
    }
  });

  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Sync cart from localStorage when opened
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('prent_service_cart') || '{}');
        setCart(saved);
      } catch {}
    }
  }, [isOpen]);

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

  const clearCart = () => {
    setCart({});
    try {
      localStorage.setItem('prent_service_cart', JSON.stringify({}));
      if (onCartCountChange) onCartCountChange(0);
    } catch {}
  };

  const bookableServices = HOME_SERVICES_DATA.filter((s) => s.category !== 'emergency');

  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = bookableServices.find((s) => s.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleCheckout = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      clearCart();
      setBookingSuccess(false);
      onClose();
    }, 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#FBF7EE] border-l border-[#E7DDC8] w-full max-w-md h-full flex flex-col shadow-2xl text-[#0B2545] animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#E7DDC8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#FFE8D6] text-[#E85D04] flex items-center justify-center text-lg shadow-xs">
              <i className="fa-solid fa-basket-shopping"></i>
            </span>
            <div>
              <h3 className="font-black text-base text-[#0B2545]">FacilityKart Bag</h3>
              <p className="text-xs text-slate-500">Everyday Services Delivered to Your Door</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0B2545] flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {bookingSuccess ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl font-black">
                <i className="fa-solid fa-check"></i>
              </div>
              <h4 className="text-lg font-black text-emerald-900">Service Request Placed!</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Our local service partner in your locality will contact you shortly to confirm the scheduled visit.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                <span>Select Everyday Facility</span>
                <span>{totalItems} in bag</span>
              </div>

              {bookableServices.map((item) => {
                const qty = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl bg-white border shadow-xs flex items-center justify-between gap-3 transition ${
                      qty > 0 ? 'border-[#E85D04] ring-1 ring-[#FFE8D6]' : 'border-[#E7DDC8] hover:border-[#0B2545]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-slate-100 text-[#0B2545] flex items-center justify-center text-base shrink-0">
                        <i className={`fa-solid ${item.icon}`}></i>
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm text-[#0B2545] truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{item.subtitle}</p>
                        <span className="text-xs font-black text-[#E85D04] mt-0.5 inline-block">
                          ₹{item.price}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            {item.unit}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
                      {qty > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white text-[#0B2545] font-black text-xs flex items-center justify-center shadow-xs hover:bg-slate-200 cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-xs font-black text-[#0B2545]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-[#E85D04] text-white font-black text-xs flex items-center justify-center shadow-xs hover:bg-[#d05303] cursor-pointer"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-3 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#E85D04] text-white font-extrabold text-xs transition cursor-pointer"
                        >
                          + Add
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
          <div className="p-4 sm:p-5 border-t border-[#E7DDC8] bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-bold">Estimated Subtotal</span>
              <span className="text-xl font-black text-[#0B2545]">₹{totalAmount}</span>
            </div>
            <button
              type="button"
              disabled={totalItems === 0}
              onClick={handleCheckout}
              className="w-full py-3.5 rounded-2xl bg-[#E85D04] hover:bg-[#d05303] text-white font-black text-sm shadow-md transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-calendar-check"></i>
              <span>Book &amp; Schedule ({totalItems} items)</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
