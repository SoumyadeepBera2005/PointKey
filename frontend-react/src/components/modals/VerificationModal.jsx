export default function VerificationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

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

        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
            <i className="fa-solid fa-shield-halved"></i>
          </span>
          <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
            Verification System
          </span>
        </div>

        <h3 className="text-lg font-black text-[#0B2545]">
          How PointKey Keeps Listings Broker-Free
        </h3>

        <ul className="mt-4 space-y-3 text-xs text-slate-700 leading-relaxed">
          <li className="p-3 rounded-2xl bg-white border border-[#E7DDC8]">
            <strong className="text-[#0B2545] block font-black mb-0.5">
              1. Strict No-Broker Accounts:
            </strong>
            Commercial property brokers and middlemen are strictly prohibited. Any listing flagged as a broker number is permanently removed.
          </li>
          <li className="p-3 rounded-2xl bg-white border border-[#E7DDC8]">
            <strong className="text-[#0B2545] block font-black mb-0.5">
              2. Electricity Bill &amp; Tax Receipt Check:
            </strong>
            Owners submit recent electricity bills, municipal property tax receipts, or mutation records to verify ownership before receiving the Verified badge.
          </li>
          <li className="p-3 rounded-2xl bg-white border border-[#E7DDC8]">
            <strong className="text-[#0B2545] block font-black mb-0.5">
              3. Free Listing Caps:
            </strong>
            Strict property posting caps prevent bulk dumping by agents, ensuring only authentic direct home rentals remain on the platform.
          </li>
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-black shadow-md transition cursor-pointer"
        >
          Got It, Thanks!
        </button>
      </div>
    </div>
  );
}
