import { useState, useEffect, useRef } from 'react';
import {
  SERVICE_CATEGORIES,
  HOME_SERVICES_DATA,
  SRV_CHIP_POS,
} from '../../data/homeServicesData';

const SRV_PHOTOS = {
  essentials:
    'https://images.pexels.com/photos/6682773/pexels-photo-6682773.jpeg?auto=compress&cs=tinysrgb&w=1200',
  homecare:
    'https://images.pexels.com/photos/6195198/pexels-photo-6195198.jpeg?auto=compress&cs=tinysrgb&w=1200',
  lifestyle:
    'https://images.pexels.com/photos/3764496/pexels-photo-3764496.jpeg?auto=compress&cs=tinysrgb&w=1200',
  shifting:
    'https://images.pexels.com/photos/8293696/pexels-photo-8293696.jpeg?auto=compress&cs=tinysrgb&w=1200',
  emergency:
    'https://images.pexels.com/photos/8942494/pexels-photo-8942494.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

export default function FacilitiesCarousel({ onAddToCart, onOpenDrawer }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isPaused, setIsPaused] = useState(false);
  const [addedItems, setAddedItems] = useState({});
  const timerRef = useRef(null);
  const exploreRef = useRef(null);

  const categories = SERVICE_CATEGORIES;
  const currentCat = categories[activeIdx] || categories[0];

  // Auto advance every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % categories.length);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, categories.length, activeIdx]);

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % categories.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + categories.length) % categories.length);
  };

  const handleExplore = (catKey) => {
    setSelectedFilter(catKey);
    if (exploreRef.current) {
      exploreRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAdd = (srv) => {
    setAddedItems((prev) => ({ ...prev, [srv.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [srv.id]: false }));
    }, 1800);
    if (onAddToCart) {
      onAddToCart(srv);
    }
  };

  const filteredServices =
    selectedFilter === 'all'
      ? HOME_SERVICES_DATA
      : HOME_SERVICES_DATA.filter((s) => s.category === selectedFilter);

  const currentItems = HOME_SERVICES_DATA.filter(
    (s) => s.category === currentCat.key
  );
  const itemNames =
    currentItems.slice(0, 3).map((s) => s.title).join(', ') +
    (currentItems.length > 3 ? ` +${currentItems.length - 3} more` : '');

  return (
    <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* SECTION HEADER & CATEGORY TABS */}
      <div id="srvCarouselWrap" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] text-[#E85D04] text-xs font-black uppercase tracking-wider mb-2">
              <i className="fa-solid fa-boxes-stacked"></i> FacilityKart
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">Facilities & Everyday Needs</h2>
            <p className="text-sm text-slate-600 mt-1">Explore verified services for daily life, home care, shifting and emergency safety.</p>
          </div>

          {/* Interactive Thumbs with animated progress bar */}
          <div id="srvThumbs" className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 max-w-full">
            {categories.map((cat, i) => {
              const isActive = i === activeIdx;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`srv-thumb group text-left cursor-pointer shrink-0 rounded-2xl p-2.5 sm:p-3 transition ${
                    isActive ? 'is-active bg-white shadow-md' : 'bg-slate-100/80 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold transition group-hover:scale-110"
                      style={{ background: cat.accent }}
                    >
                      <i className={`fa-solid ${cat.icon}`}></i>
                    </span>
                    <div>
                      <span className="block text-xs font-extrabold text-[#0B2545] whitespace-nowrap">
                        {cat.short}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {cat.key === 'emergency' ? 'Free 24x7' : 'Doorstep'}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      key={isActive ? `active-${activeIdx}` : 'inactive'}
                      className={`h-full rounded-full ${isActive ? 'srv-progress' : ''}`}
                      style={{ background: cat.accent }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CAROUSEL SLIDE CONTAINER */}
        <div className="relative">
          <div className="overflow-hidden rounded-3xl shadow-xl border border-beige-border">
            <article className="srv-slide is-active">
              <div
                className="grid lg:grid-cols-[380px_1fr] rounded-3xl overflow-hidden min-h-[420px] transition-all duration-700"
                style={{ background: currentCat.panel }}
              >
                {/* Left Info Panel */}
                <div className="p-6 sm:p-8 flex flex-col justify-between gap-6 z-10 bg-white/75 backdrop-blur-md">
                  <div>
                    <div className="srv-anim flex items-center gap-3.5 mb-4" style={{ '--d': 0 }}>
                      <div
                        className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl"
                        style={{ color: currentCat.accent }}
                      >
                        <i className={`fa-solid ${currentCat.icon}`}></i>
                      </div>
                      <div>
                        <span className="text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                          PointKey Services
                        </span>
                        <h4 className="text-base font-black text-[#0B2545]">{currentCat.short}</h4>
                      </div>
                    </div>

                    <div className="srv-anim space-y-2" style={{ '--d': 1 }}>
                      <h3 className="text-2xl sm:text-3xl font-black text-[#0B2545] leading-tight">
                        {currentCat.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {currentCat.tag}
                      </p>
                    </div>

                    <div className="srv-anim mt-4 p-3 rounded-xl bg-white/80 border border-white space-y-1" style={{ '--d': 2 }}>
                      <p className="text-sm font-extrabold text-[#0B2545]">
                        {currentCat.key === 'emergency' ? 'Free emergency hotlines' : 'Verified local providers'}
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {currentItems.length} services: {itemNames}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div
                      className="srv-anim inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 text-xs font-bold text-[#0B2545] shadow-xs"
                      style={{ '--d': 3 }}
                    >
                      <i className={`fa-solid ${currentCat.hlIcon}`} style={{ color: currentCat.accent }}></i>
                      <span>{currentCat.highlight}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExplore(currentCat.key)}
                      className="srv-cta srv-anim w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 hover:brightness-110 transition cursor-pointer"
                      style={{ '--d': 4, background: currentCat.accent }}
                    >
                      <span>Explore {currentCat.short} Services</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </div>

                {/* Right Visual Panel with Floating Chips */}
                <div
                  className="relative min-h-[300px] lg:min-h-full flex items-center justify-center overflow-hidden p-6"
                  style={{ background: currentCat.visual }}
                >
                  {/* Subtle Background Glow */}
                  <div className="srv-glow absolute inset-0 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                  {/* High Clarity Background Photo with Vibrant Gradient Overlay */}
                  <img
                    src={SRV_PHOTOS[currentCat.key]}
                    alt={currentCat.name}
                    referrerPolicy="no-referrer"
                    className="srv-photo absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-700"
                  />
                  <div
                    className="srv-photo-shade absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${currentCat.accent}b3 0%, ${currentCat.accent}40 50%, transparent 80%), linear-gradient(to top, rgba(11,37,69,0.7) 0%, transparent 60%)`,
                    }}
                  ></div>

                  {/* Floating Chips */}
                  <div className="relative w-full h-full min-h-[320px] pointer-events-auto">
                    {currentItems.slice(0, 7).map((srv, k) => {
                      const pos = SRV_CHIP_POS[k] || [20, 20];
                      return (
                        <div
                          key={srv.id}
                          className="srv-chip z-[2] absolute flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl text-xs font-extrabold text-[#0B2545] whitespace-nowrap cursor-pointer transition hover:scale-105 border border-white/60"
                          style={{
                            left: `${pos[0]}%`,
                            top: `${pos[1]}%`,
                            animationDelay: `${(k * 0.45).toFixed(2)}s`,
                          }}
                          onClick={() => handleExplore(currentCat.key)}
                        >
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[12px] shadow-xs"
                            style={{ background: currentCat.accent }}
                          >
                            <i className={`fa-solid ${srv.icon}`}></i>
                          </span>
                          <span>{srv.title}</span>
                          {srv.callLabel ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black">
                              {srv.callLabel}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-500">
                              ₹{srv.price}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrev}
            className="srv-nav-btn absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-[#0B2545] shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer"
            aria-label="Previous service slide"
          >
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="srv-nav-btn absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-[#0B2545] shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer"
            aria-label="Next service slide"
          >
            <i className="fa-solid fa-arrow-right text-sm"></i>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPLORE ALL SERVICES & DAILY NEEDS GRID (#servicesExplore)                */}
      {/* ========================================================================= */}
      <div
        id="servicesExplore"
        ref={exploreRef}
        className="mt-12 bg-[#FBF7EE] border border-[#E7DDC8] rounded-3xl p-5 sm:p-8 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E7DDC8]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E85D04] animate-pulse"></span>
              <span className="text-xs font-black uppercase text-[#E85D04] tracking-wider">
                Explore Services & Daily Needs
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#0B2545] mt-1">
              {selectedFilter === 'all'
                ? 'All Available Services (20+)'
                : `${categories.find((c) => c.key === selectedFilter)?.name} (${filteredServices.length})`}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Select any service to add to your cart or call emergency helpline instantly.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-[#0B2545] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedFilter(cat.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === cat.key
                    ? 'bg-[#0B2545] text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className={`fa-solid ${cat.icon} text-[11px]`}></i>
                <span>{cat.short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 20+ SERVICES GRID */}
        <div id="servicesGrid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map((srv, idx) => {
            const cat = categories.find((c) => c.key === srv.category) || categories[0];
            const isAdded = !!addedItems[srv.id];

            if (srv.category === 'emergency') {
              return (
                <div
                  key={srv.id}
                  className="srv-card srv-card-emg srv-cat-emergency bg-white border border-rose-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs transition hover:shadow-lg"
                >
                  <div>
                    <div className="srv-icon w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg mb-3 shadow-xs">
                      <i className={`fa-solid ${srv.icon}`}></i>
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-extrabold text-[#0B2545]">{srv.title}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase">
                        Emergency
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{srv.desc}</p>
                  </div>
                  <a
                    href={`tel:${srv.call}`}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition"
                  >
                    <i className="fa-solid fa-phone"></i>
                    <span>Call {srv.callLabel} (Free 24x7)</span>
                  </a>
                </div>
              );
            }

            return (
              <div
                key={srv.id}
                className={`srv-card srv-cat-${cat.key} bg-white rounded-2xl p-5 flex flex-col justify-between shadow-xs transition hover:shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className="srv-icon w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-xs"
                      style={{ background: cat.accent, color: '#fff' }}
                    >
                      <i className={`fa-solid ${srv.icon}`}></i>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${cat.badgeCls}`}>
                      {cat.short}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-[#0B2545]">{srv.title}</h4>
                  <p className="srv-sub text-[11px] font-bold mt-0.5" style={{ color: cat.accent }}>
                    {srv.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{srv.desc}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-[#0B2545]">₹{srv.price}</span>
                    <span className="text-[10px] text-slate-500 font-bold ml-1">{srv.unit}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(srv)}
                    className={`srv-addbtn px-3.5 py-2 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer ${
                      isAdded ? 'srv-added bg-[#166534]' : 'bg-[#0B2545] hover:bg-[#E85D04]'
                    }`}
                  >
                    <i className={`fa-solid ${isAdded ? 'fa-check' : 'fa-cart-plus'}`}></i>
                    <span>{isAdded ? 'Added' : 'Add to Bag'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
