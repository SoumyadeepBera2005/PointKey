import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Utensils, Bath } from 'lucide-react';
import { formatINR } from '../../utils/currencyFormatter';
import RatingStars from '../ui/RatingStars';
import Badge from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

const COVER_FALLBACK = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';

export default function PropertyCard({ property }) {
  const p = property;
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (user?.account_status === 'SUSPENDED') {
      e.preventDefault();
      alert('⚠️ Your account is suspended for rule violation (Strike 1). You cannot view property details. Open the NestAI chatbot to appeal.');
      return;
    }
    if (user?.account_status === 'BLOCKED') {
      e.preventDefault();
      alert('⛔ Your account is permanently blocked (Strike 2) due to repeated rule violations.');
      return;
    }
  };

  return (
    <Link
      to={`/tenant/property/${p.id}`}
      onClick={handleClick}
      className={`group glass-card overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-forest hover:shadow-xl bg-beige ${
        user?.account_status === 'SUSPENDED' || user?.account_status === 'BLOCKED' ? 'opacity-80' : ''
      }`}
    >
      <div className="relative h-44 overflow-hidden bg-slate-200">
        <img
          src={p.cover_url || COVER_FALLBACK}
          alt={p.title}
          onError={(e) => {
            e.currentTarget.src = COVER_FALLBACK;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {p.verification_status === 'VERIFIED' && (
            <Badge tone="green"><ShieldCheck size={12} /> Verified</Badge>
          )}
          {p.food_included ? <Badge tone="orange"><Utensils size={12} /> Food</Badge> : null}
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-bold text-navy">{p.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} /> {p.locality}, {p.city}
          {p.distance_km != null && <span className="ml-1 text-slate-400">· {Number(p.distance_km).toFixed(1)} km</span>}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg font-extrabold text-forest">{formatINR(p.rent_amount)}<span className="text-[11px] font-medium text-slate-500">/mo</span></p>
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600"><Bath size={12} /> {p.bathroom_type === 'PRIVATE' ? 'Private' : 'Common'}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <RatingStars value={Number(p.average_rating || 0)} size={14} />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-navy/60">{p.category} · {String(p.sub_type || '').replace('_', ' ')}</span>
        </div>
      </div>
    </Link>
  );
}
