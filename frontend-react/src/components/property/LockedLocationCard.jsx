import { Lock, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Shown pre-payment: masks exact pin + owner contact (spec §3-C State 1). */
export default function LockedLocationCard({ propertyId }) {
  const { user } = useAuth();
  const isSuspended = user?.account_status === 'SUSPENDED';
  const isBlocked = user?.account_status === 'BLOCKED';

  const handlePayClick = (e) => {
    if (isSuspended) {
      e.preventDefault();
      alert('⚠️ Payment disabled: Your account is suspended (Strike 1). Open the NestAI chatbot to submit an unblock appeal.');
      return;
    }
    if (isBlocked) {
      e.preventDefault();
      alert('⛔ Account Permanently Blocked (Strike 2): You cannot unlock properties or make payments.');
      return;
    }
  };

  return (
    <div className="glass-card relative overflow-hidden p-6 text-center">
      {/* blurred fake map backdrop */}
      <div className="absolute inset-0 opacity-30 blur-[6px]" aria-hidden="true">
        <svg viewBox="0 0 200 120" className="h-full w-full">
          <rect width="200" height="120" fill="#dbeafe" />
          <path d="M0 70 Q60 60 90 75 T200 65" stroke="#93c5fd" strokeWidth="8" fill="none" />
          <path d="M40 0 Q60 60 45 120" stroke="#bfdbfe" strokeWidth="6" fill="none" />
          <circle cx="120" cy="48" r="10" fill="#fca5a5" />
        </svg>
      </div>
      <div className="relative">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white shadow-md">
          <Lock size={26} />
        </div>
        <h3 className="text-lg font-extrabold text-navy">Exact location &amp; owner contact locked</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-600">
          Pay the refundable unlock amount to see the exact Google Maps pin, owner name, phone/WhatsApp and email — plus book a visit.
        </p>

        {isSuspended && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800">
            ⚠️ <strong>Account Suspended (Strike 1):</strong> Payment option is disabled due to rule violations. Please submit an unblock appeal via NestAI chatbot.
          </div>
        )}
        {isBlocked && (
          <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800">
            ⛔ <strong>Account Blocked (Strike 2):</strong> Payments and unlocks are permanently blocked.
          </div>
        )}

        <ul className="mx-auto mt-4 flex max-w-xs flex-col gap-1.5 text-left text-xs text-slate-600">
          <li className="flex items-center gap-2"><MapPin size={13} className="text-forest" /> Exact Google Map location</li>
          <li className="flex items-center gap-2"><Phone size={13} className="text-forest" /> Owner phone &amp; WhatsApp number</li>
          <li className="flex items-center gap-2"><Mail size={13} className="text-forest" /> Owner email address</li>
          <li className="flex items-center gap-2"><MessageCircle size={13} className="text-forest" /> Request-to-contact + visit slots</li>
        </ul>
        <Link
          to={isSuspended || isBlocked ? '#' : `/tenant/property/${propertyId}/checkout`}
          onClick={handlePayClick}
          className={`btn-primary mt-5 w-full sm:w-auto ${isSuspended || isBlocked ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          {isSuspended ? 'Payment Disabled (Suspended)' : isBlocked ? 'Permanently Blocked' : 'Pay & Unlock Property'}
        </Link>
        <p className="mt-2 text-[10px] font-medium text-navy/60">100% refundable if your room is not confirmed</p>
      </div>
    </div>
  );
}
