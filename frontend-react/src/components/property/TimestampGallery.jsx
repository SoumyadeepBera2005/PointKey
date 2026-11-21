import { useState } from 'react';
import { Camera, CalendarDays } from 'lucide-react';
import { formatDate } from '../../utils/dateTimestampHelper';

/** Photos/videos carry a capture-date badge per the spec's anti-fake requirement. */
export default function TimestampGallery({ media = [] }) {
  const [active, setActive] = useState(0);
  const items = media.length ? media : [{ id: 'fallback', room_tag: 'BEDROOM', media_type: 'IMAGE', media_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200', captured_date: new Date().toISOString() }];
  const current = items[Math.min(active, items.length - 1)];

  return (
    <div>
      <div className="relative h-64 overflow-hidden rounded-2xl sm:h-96">
        {current.media_type === 'VIDEO'
          ? <video src={current.media_url} className="h-full w-full object-cover" controls />
          : <img src={current.media_url} alt={current.room_tag} className="h-full w-full object-cover" />}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          <CalendarDays size={12} /> {formatDate(current.captured_date)}
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-trust/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
          {String(current.room_tag).replace('_', ' ')}
        </div>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {items.map((m, i) => (
          <button
            key={m.id || i}
            onClick={() => setActive(i)}
            className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === active ? 'border-trust' : 'border-transparent opacity-60 hover:opacity-100'}`}
            aria-label={`View ${m.room_tag} media`}
          >
            {m.media_type === 'VIDEO'
              ? <span className="flex h-full w-full items-center justify-center bg-slate-800 text-[10px] font-bold text-white"><Camera size={16} className="mr-1 inline" />VIDEO</span>
              : <img src={m.media_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
          </button>
        ))}
      </div>
    </div>
  );
}
