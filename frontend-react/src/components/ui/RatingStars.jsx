import { Star, StarHalf } from 'lucide-react';
import { useState } from 'react';

export default function RatingStars({ value = 0, onChange, size = 18 }) {
  const [hover, setHover] = useState(0);
  const display = hover || value || 0;
  const interactive = typeof onChange === 'function';

  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const full = display >= i;
        const half = !full && display >= i - 0.5;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(i)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange(i)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
          >
            {half
              ? <StarHalf size={size} className="fill-amber-400 text-amber-400" />
              : <Star size={size} className={full ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />}
          </button>
        );
      })}
      {value > 0 && <span className="ml-1.5 text-sm font-semibold text-slate-600">{Number(value).toFixed(1)}</span>}
    </div>
  );
}
