import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    tag: 'EXPLORE',
    title: 'See homes from above',
    desc: 'Start with the whole neighbourhood on the map, then zoom right down to your street.',
    img: '/assets/images/map-aerial.jpg',
    pos: '54% 57%',
  },
  {
    tag: 'VERIFIED',
    title: 'Verified homes only',
    desc: 'Every property is checked by an administrator before it goes live.',
    img: '/assets/images/neighborhood.jpg',
    pos: '43% 60%',
  },
  {
    tag: 'MOVE IN',
    title: 'Visit, book, move in',
    desc: 'Send a visit or booking request and the owner confirms it.',
    img: '/assets/images/house.jpg',
    pos: '62% 50%',
  },
];

export default function Onboarding() {
  const [slideIdx, setSlideIdx] = useState(0);
  const touchStartRef = useRef(null);
  const navigate = useNavigate();

  const finishAll = () => {
    localStorage.setItem('prent_onboarding_done', '1');
    const token = localStorage.getItem('prent_token');
    const user = JSON.parse(localStorage.getItem('prent_user') || 'null');
    if (token && user) {
      if (user.role === 'OWNER') navigate('/owner', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin', { replace: true });
      else navigate('/tenant', { replace: true });
    } else {
      navigate('/auth', { replace: true });
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') {
        setSlideIdx((curr) => (curr < SLIDES.length - 1 ? curr + 1 : curr));
      } else if (e.key === 'ArrowLeft') {
        setSlideIdx((curr) => (curr > 0 ? curr - 1 : curr));
      } else if (e.key === 'Escape') {
        finishAll();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#0b1538] text-white"
      onTouchStart={(e) => {
        touchStartRef.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartRef.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartRef.current;
        if (Math.abs(dx) > 50) {
          if (dx < 0 && slideIdx < SLIDES.length - 1) setSlideIdx((i) => i + 1);
          else if (dx > 0 && slideIdx > 0) setSlideIdx((i) => i - 1);
        }
        touchStartRef.current = null;
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {SLIDES.map((s, idx) => (
          <img
            key={idx}
            src={s.img}
            alt=""
            style={{ objectPosition: s.pos }}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
              slideIdx === idx ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#070738]/95 via-[#070738]/70 to-[#070738]/40" />

      <div className="relative mx-auto flex h-full max-w-[520px] flex-col justify-between px-6 py-8">
        <div className="flex items-start justify-between">
          <div className="rounded-2xl bg-[#fffaf0]/95 px-4 py-2 shadow-lg">
            <img src="/assets/pointkey-logo.png" alt="PointKey" className="h-14 sm:h-16 w-auto" />
          </div>
          {slideIdx < SLIDES.length - 1 && (
            <button
              onClick={finishAll}
              className="rounded-full border border-white/40 bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/25"
            >
              Skip
            </button>
          )}
        </div>

        <div className="my-auto py-8">
          <span className="inline-block rounded-xl bg-[#e08a1e] px-3 py-1 text-xs font-bold tracking-wider text-[#141414]">
            {SLIDES[slideIdx].tag}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl leading-tight">
            {SLIDES[slideIdx].title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#f3ead6] opacity-90 max-w-md">
            {SLIDES[slideIdx].desc}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setSlideIdx(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  slideIdx === idx ? 'w-7 bg-[#e08a1e]' : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (slideIdx === SLIDES.length - 1) finishAll();
              else setSlideIdx((i) => i + 1);
            }}
            className="rounded-full bg-[#e08a1e] px-8 py-3.5 text-sm font-bold text-[#141414] shadow-lg transition hover:scale-105 active:scale-95"
          >
            {slideIdx === SLIDES.length - 1 ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
