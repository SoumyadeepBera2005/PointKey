import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  // Elements refs for opening animation
  const stageRef = useRef(null);
  const L1Ref = useRef(null);
  const L2Ref = useRef(null);
  const I1Ref = useRef(null);
  const I2Ref = useRef(null);
  const keyRef = useRef(null);
  const hpinRef = useRef(null);
  const foundRef = useRef(null);
  const flashRef = useRef(null);
  const photoRef = useRef(null);
  const badgeRef = useRef(null);
  const ctaRef = useRef(null);
  const skipRef = useRef(null);

  // Onboarding state
  const [onbOpen, setOnbOpen] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const touchStartRef = useRef(null);
  const deadRef = useRef(false);

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

  const finishAll = useCallback(() => {
    deadRef.current = true;
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
  }, [navigate]);

  const openOnboarding = useCallback(() => {
    deadRef.current = true;
    setOnbOpen(true);
    setSlideIdx(0);
  }, []);

  // Main stage opening animation
  useEffect(() => {
    deadRef.current = false;
    const stage = stageRef.current;
    const L1 = L1Ref.current;
    const L2 = L2Ref.current;
    const I1 = I1Ref.current;
    const I2 = I2Ref.current;
    const KEY = keyRef.current;
    const HP = hpinRef.current;
    const FOUND = foundRef.current;
    const FLASH = flashRef.current;
    const PH = photoRef.current;
    const BADGE = badgeRef.current;
    const CTA = ctaRef.current;

    if (!stage || !L1 || !L2 || !I1 || !I2 || !KEY || !HP || !FOUND || !FLASH || !PH || !BADGE || !CTA) return;

    const W1 = 1584;
    const H1 = 672;
    const T1 = { x: 0.538, y: 0.573 }; // aerial map pin location
    const T2 = { x: 0.431, y: 0.667 }; // neighbourhood house roof
    const SPOTS = [
      { x: 0.592, y: 0.455 },
      { x: 0.537, y: 0.397 },
      { x: 0.328, y: 0.494 },
      { x: 0.887, y: 0.268 },
      { x: 0.926, y: 0.189 },
    ];

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let cx = vw / 2;
    let cy = vh / 2;
    let cur = { x: 0, y: 0 };

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const T = (x, y) => `translate(${x}px, ${y}px) translate(-50%, -100%)`;

    const place = (img, W, H, t) => {
      const px = t.x * W;
      const py = t.y * H;
      const k = Math.max((vw / 2) / Math.min(px, W - px), (vh / 2) / Math.min(py, H - py), vw / W, vh / H) * 1.02;
      img.style.width = W * k + 'px';
      img.style.height = H * k + 'px';
      img.style.left = vw / 2 - px * k + 'px';
      img.style.top = vh / 2 - py * k + 'px';
      img.style.transformOrigin = px * k + 'px ' + py * k + 'px';
      return k;
    };

    const ring = (x, y) => {
      if (deadRef.current) return;
      const r = document.createElement('div');
      r.className = 'stage-rg';
      r.style.left = x + 'px';
      r.style.top = y + 'px';
      stage.appendChild(r);
      setTimeout(() => {
        if (r.parentNode) r.parentNode.removeChild(r);
      }, 1400);
    };

    const fly = (x, y, ms) => {
      const a = KEY.animate(
        [
          { transform: T(cur.x, cur.y) },
          { transform: T((cur.x + x) / 2, Math.min(cur.y, y) - 70) + ' rotate(-8deg)', offset: 0.5 },
          { transform: T(x, y) },
        ],
        { duration: ms, easing: 'ease-in-out', fill: 'forwards' }
      );
      if (KEY.firstElementChild) {
        KEY.firstElementChild.animate(
          [
            { transform: 'perspective(500px) rotateY(0)' },
            { transform: 'perspective(500px) rotateY(360deg)' },
          ],
          { duration: ms, easing: 'ease-in-out' }
        );
      }
      cur = { x, y };
      return a.finished.then(() => {
        try { a.commitStyles(); a.cancel(); } catch { /* ignore */ }
      });
    };

    const loaded = (img) =>
      new Promise((r) => {
        if (!img) return r();
        if (img.complete && img.naturalWidth) r();
        else {
          img.onload = r;
          img.onerror = r;
        }
      });

    const finalState = () => {
      L1.style.display = 'none';
      L2.style.display = 'none';
      PH.style.transition = 'none';
      PH.classList.add('show');
      BADGE.classList.add('show');
      CTA.classList.add('show');
    };

    const play = async () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      cx = vw / 2;
      cy = vh / 2;
      const k1 = place(I1, W1, H1, T1);
      place(I2, W1, H1, T2);

      await Promise.race([
        Promise.all([loaded(I1), loaded(I2), loaded(PH.firstElementChild)]),
        sleep(4000),
      ]);
      if (deadRef.current) return;

      L1.classList.add('on');
      await sleep(1100);
      if (deadRef.current) return;

      const spots = SPOTS.map((s) => ({
        x: cx + (s.x - T1.x) * W1 * k1,
        y: cy + (s.y - T1.y) * H1 * k1,
      }))
        .filter(
          (p) =>
            p.x > 60 &&
            p.x < vw - 60 &&
            p.y > 140 &&
            p.y < vh - 60 &&
            Math.hypot(p.x - cx, p.y - cy) > 120
        )
        .slice(0, window.innerWidth < 600 ? 2 : 3);

      cur = { x: spots.length ? spots[0].x : cx, y: -140 };
      KEY.style.transform = T(cur.x, cur.y);
      KEY.style.opacity = '1';

      for (let i = 0; i < spots.length; i++) {
        await fly(spots[i].x, spots[i].y - 58, 850);
        if (deadRef.current) return;
        ring(spots[i].x, spots[i].y);
        await sleep(450);
        if (deadRef.current) return;
      }

      await fly(cx, cy - 58, 1000);
      if (deadRef.current) return;

      FOUND.classList.add('go');
      await sleep(1100);
      if (deadRef.current) return;

      L1.classList.add('zoom');
      await sleep(2000);
      if (deadRef.current) return;

      L2.classList.add('on');
      FOUND.classList.remove('go');
      await sleep(1400);
      if (deadRef.current) return;

      L2.classList.add('zoom');
      await sleep(1000);
      if (deadRef.current) return;

      HP.classList.add('drop');
      await sleep(450);
      ring(cx, cy);
      await sleep(1300);
      if (deadRef.current) return;

      const a = KEY.animate(
        [
          { transform: T(cur.x, cur.y) },
          { transform: T(cx, cy - 30) + ' scale(.55)', opacity: 0.9 },
        ],
        { duration: 700, easing: 'ease-in', fill: 'forwards' }
      );
      await a.finished;
      if (deadRef.current) return;

      FLASH.classList.add('go');
      KEY.style.opacity = '0';
      try { a.cancel(); } catch { /* ignore */ }
      HP.classList.add('gone');

      await sleep(350);
      PH.classList.add('show');
      await sleep(1700);
      if (deadRef.current) return;

      BADGE.classList.add('show');
      await sleep(900);
      if (deadRef.current) return;

      CTA.classList.add('show');
    };

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finalState();
    } else {
      play();
    }

    return () => {
      deadRef.current = true;
    };
  }, []);

  // Keyboard navigation for onboarding
  useEffect(() => {
    if (!onbOpen) return;
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
  }, [onbOpen, finishAll, SLIDES.length]);

  return (
    <div className="pointkey-splash-root">
      <style>{`
        .pointkey-splash-root {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: #0b1538;
          font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
          color: #141414;
          user-select: none;
          z-index: 9999;
        }
        .stage-box {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .stage-layer {
          position: absolute;
          inset: 0;
          overflow: hidden;
          opacity: 0;
          transition: opacity 1.2s ease;
        }
        .stage-layer.on {
          opacity: 1;
        }
        .stage-layer img {
          position: absolute;
          max-width: none;
          user-select: none;
          -webkit-user-drag: none;
          transition: transform 3s cubic-bezier(.55, 0, .25, 1);
        }
        #L1.zoom img {
          transform: scale(3.8);
        }
        #L2 img {
          transform: scale(1.12);
        }
        #L2.zoom img {
          transform: scale(1.9);
          transition-duration: 3.6s;
        }
        .stage-shade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at 50% 50%, rgba(11,21,56,0) 45%, rgba(11,21,56,.55) 100%);
        }
        #stage-key {
          position: absolute;
          left: 0;
          top: 0;
          width: 64px;
          z-index: 6;
          opacity: 0;
          pointer-events: none;
          filter: drop-shadow(0 0 2px #fffaf0) drop-shadow(0 8px 10px rgba(0,0,0,.5));
        }
        #stage-key img {
          display: block;
          width: 100%;
          height: auto;
        }
        .stage-rg {
          position: absolute;
          width: 26px;
          height: 26px;
          margin: -13px;
          border-radius: 50%;
          border: 3px solid #e08a1e;
          z-index: 4;
          pointer-events: none;
          animation: stage-rg 1.3s ease-out forwards;
        }
        @keyframes stage-rg {
          0% { transform: scale(.5); opacity: 1; }
          100% { transform: scale(5); opacity: 0; }
        }
        #stage-found {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 30px;
          height: 30px;
          margin: -15px;
          border-radius: 50%;
          border: 3px solid #e08a1e;
          z-index: 4;
          opacity: 0;
          pointer-events: none;
        }
        #stage-found.go {
          animation: stage-rg 1.2s ease-out infinite;
        }
        #stage-hpin {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 58px;
          height: 76px;
          z-index: 5;
          transform: translate(-50%, -100%);
          opacity: 0;
          pointer-events: none;
          filter: drop-shadow(0 8px 8px rgba(0,0,0,.45));
        }
        #stage-hpin svg {
          display: block;
          width: 100%;
          height: 100%;
        }
        #stage-hpin.drop {
          animation: stage-drop .9s cubic-bezier(.3, 1.6, .5, 1) forwards;
        }
        #stage-hpin.gone {
          opacity: 0 !important;
          animation: none;
          transition: opacity .3s;
        }
        @keyframes stage-drop {
          0% { opacity: 0; transform: translate(-50%, -340%) scale(.7); }
          60% { opacity: 1; }
          100% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
        #stage-flash {
          position: absolute;
          inset: 0;
          z-index: 7;
          pointer-events: none;
          opacity: 0;
          background: radial-gradient(circle at 50% 50%, #fffaf0 0, rgba(255,250,240,.85) 22%, rgba(255,250,240,0) 60%);
        }
        #stage-flash.go {
          animation: stage-flash 1s ease-out;
        }
        @keyframes stage-flash {
          0% { opacity: 0; transform: scale(.4); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.8); }
        }
        #stage-photo {
          position: absolute;
          inset: 0;
          z-index: 8;
          clip-path: circle(0 at 50% 50%);
          transition: clip-path 1.5s cubic-bezier(.6, 0, .2, 1);
        }
        #stage-photo.show {
          clip-path: circle(150% at 50% 50%);
        }
        #stage-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 62% 50%;
          display: block;
          transform: scale(1.25);
          transition: transform 3s ease-out;
        }
        #stage-photo.show img {
          transform: scale(1);
        }
        #stage-photo::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(11,21,56,.35), rgba(11,21,56,0) 28%, rgba(11,21,56,0) 70%, rgba(11,21,56,.55));
        }
        #stage-badge {
          position: absolute;
          left: 50%;
          top: calc(22px + env(safe-area-inset-top, 0px));
          transform: translate(-50%, -16px);
          z-index: 9;
          opacity: 0;
          transition: opacity .8s, transform .8s;
          background: rgba(255, 250, 240, .95);
          border-radius: 22px;
          padding: 8px 22px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, .25);
          pointer-events: none;
        }
        #stage-badge img {
          display: block;
          height: 92px;
          width: auto;
        }
        #stage-badge.show {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        #stage-cta {
          position: absolute;
          left: 50%;
          bottom: calc(36px + env(safe-area-inset-bottom, 0px));
          transform: translate(-50%, 14px);
          z-index: 9;
          opacity: 0;
          pointer-events: none;
          transition: opacity .7s, transform .7s;
          background: #1f2f6b;
          color: #fffaf0;
          border: 0;
          border-radius: 30px;
          padding: 16px 44px;
          font: 700 16px/1 'Montserrat', 'Segoe UI', sans-serif;
          box-shadow: 0 8px 22px rgba(0, 0, 0, .35);
          cursor: pointer;
        }
        #stage-cta.show {
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, 0);
        }
        #stage-cta:hover {
          filter: brightness(1.1);
        }
        #stage-skip {
          position: absolute;
          right: 14px;
          top: calc(14px + env(safe-area-inset-top, 0px));
          z-index: 10;
          background: rgba(255, 250, 240, .92);
          color: #1f2f6b;
          border: 0;
          border-radius: 20px;
          padding: 9px 18px;
          font: 600 13px/1 'Montserrat', 'Segoe UI', sans-serif;
          cursor: pointer;
          transition: opacity .2s;
        }
        #stage-skip:hover {
          background: #fff;
        }

        /* Onboarding Styles */
        #stage-onb {
          position: fixed;
          inset: 0;
          z-index: 20;
          background: #0b1538;
          transform: translateY(100%);
          visibility: hidden;
          transition: transform .7s cubic-bezier(.7, 0, .2, 1), visibility 0s .7s;
          color: #fff;
        }
        #stage-onb.open {
          transform: none;
          visibility: visible;
          transition: transform .7s cubic-bezier(.7, 0, .2, 1);
        }
        .onb-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .onb-bg img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transform: scale(1);
          transition: opacity .9s ease, transform 9s linear;
        }
        .onb-bg img.on {
          opacity: 1;
          transform: scale(1.12);
        }
        .onb-sh {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(7,7,56,.95) 0, rgba(7,7,56,.72) 34%, rgba(7,7,56,.18) 64%, rgba(7,7,56,.4) 100%);
        }
        .onb-container {
          position: relative;
          max-width: 520px;
          height: 100%;
          margin: 0 auto;
          padding: calc(18px + env(safe-area-inset-top, 0px)) 24px calc(26px + env(safe-area-inset-bottom, 0px));
          display: flex;
          flex-direction: column;
        }
        .onb-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .onb-top .b {
          background: rgba(255, 250, 240, .95);
          border-radius: 18px;
          padding: 6px 16px;
        }
        .onb-top .b img {
          display: block;
          height: 64px;
          width: auto;
        }
        #onbSkip {
          background: rgba(255, 255, 255, .16);
          border: 1px solid rgba(255, 255, 255, .4);
          color: #fff;
          border-radius: 20px;
          padding: 9px 18px;
          font: 600 13px/1 'Montserrat', 'Segoe UI', sans-serif;
          backdrop-filter: blur(6px);
          cursor: pointer;
        }
        .onb-copy {
          margin-top: auto;
          display: grid;
        }
        .onb-txt {
          grid-area: 1/1;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .6s, transform .6s;
          pointer-events: none;
        }
        .onb-txt.on {
          opacity: 1;
          transform: none;
          pointer-events: auto;
        }
        .onb-tag {
          display: inline-block;
          background: #e08a1e;
          color: #141414;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: .06em;
          padding: 5px 12px;
          border-radius: 12px;
          margin-bottom: 14px;
        }
        .onb-txt h2 {
          margin: 0 0 10px;
          font-size: clamp(28px, 7.5vw, 40px);
          line-height: 1.15;
          color: #fff;
        }
        .onb-txt p {
          margin: 0;
          max-width: 38ch;
          font-size: 16px;
          line-height: 1.65;
          opacity: .92;
          color: #f3ead6;
        }
        .onb-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 28px;
        }
        .onb-dots {
          display: flex;
          gap: 8px;
        }
        .onb-dots i {
          width: 9px;
          height: 9px;
          border-radius: 5px;
          background: rgba(255, 255, 255, .5);
          transition: all .3s;
          display: inline-block;
        }
        .onb-dots i.on {
          width: 28px;
          background: #e08a1e;
        }
        #onbNext {
          background: #e08a1e;
          color: #141414;
          border: 0;
          border-radius: 30px;
          padding: 16px 34px;
          font: 700 15px/1 'Montserrat', 'Segoe UI', sans-serif;
          min-width: 140px;
          cursor: pointer;
          transition: transform .15s;
        }
        #onbNext:hover {
          transform: scale(1.03);
        }
        @media (min-width: 900px) {
          .onb-top .b img {
            height: 72px;
          }
        }
      `}</style>

      {/* STAGE OPENING ANIMATION */}
      <div id="stage" ref={stageRef} className="stage-box">
        <div className="stage-layer" id="L1" ref={L1Ref}>
          <img id="I1" ref={I1Ref} src="/assets/images/map-aerial.jpg" alt="" />
        </div>
        <div className="stage-layer" id="L2" ref={L2Ref}>
          <img id="I2" ref={I2Ref} src="/assets/images/neighborhood.jpg" alt="" />
        </div>

        <div className="stage-shade" />

        <div id="stage-found" ref={foundRef} />

        <div id="stage-hpin" ref={hpinRef}>
          <svg viewBox="0 0 38 50" aria-hidden="true">
            <path
              d="M19 1C9 1 1 9 1 19c0 13 18 30 18 30s18-17 18-30C37 9 29 1 19 1Z"
              fill="#e08a1e"
              stroke="#fffaf0"
              strokeWidth="2"
            />
            <circle cx="19" cy="19" r="7" fill="#fffaf0" />
          </svg>
        </div>

        <div id="stage-key" ref={keyRef}>
          <img src="/assets/pointkey-key.png" alt="" />
        </div>

        <div id="stage-flash" ref={flashRef} />

        <div id="stage-photo" ref={photoRef}>
          <img src="/assets/images/house.jpg" alt="PointKey Residence" />
        </div>

        <div id="stage-badge" ref={badgeRef}>
          <img src="/assets/pointkey-logo.png" alt="PointKey" />
        </div>

        <button id="stage-skip" ref={skipRef} onClick={openOnboarding}>
          Skip
        </button>

        <button id="stage-cta" ref={ctaRef} onClick={openOnboarding}>
          Get started
        </button>
      </div>

      {/* ONBOARDING OVERLAY */}
      <section
        id="stage-onb"
        className={onbOpen ? 'open' : ''}
        aria-hidden={!onbOpen}
        aria-label="Welcome to PointKey"
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
        <div className="onb-bg">
          {SLIDES.map((s, idx) => (
            <img
              key={idx}
              src={s.img}
              alt=""
              style={{ objectPosition: s.pos }}
              className={slideIdx === idx ? 'on' : ''}
            />
          ))}
        </div>
        <div className="onb-sh" />

        <div className="onb-container">
          <div className="onb-top">
            <div className="b">
              <img src="/assets/pointkey-logo.png" alt="PointKey" />
            </div>
            {slideIdx < SLIDES.length - 1 && (
              <button id="onbSkip" onClick={finishAll}>
                Skip
              </button>
            )}
          </div>

          <div className="onb-copy">
            {SLIDES.map((s, idx) => (
              <div key={idx} className={`onb-txt ${slideIdx === idx ? 'on' : ''}`}>
                <span className="onb-tag">{s.tag}</span>
                <h2>{s.title}</h2>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="onb-foot">
            <div className="onb-dots" aria-hidden="true">
              {SLIDES.map((_, idx) => (
                <i
                  key={idx}
                  className={slideIdx === idx ? 'on' : ''}
                  onClick={() => setSlideIdx(idx)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
            <button
              id="onbNext"
              onClick={() => {
                if (slideIdx === SLIDES.length - 1) finishAll();
                else setSlideIdx((i) => i + 1);
              }}
            >
              {slideIdx === SLIDES.length - 1 ? 'Get started' : 'Next'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
