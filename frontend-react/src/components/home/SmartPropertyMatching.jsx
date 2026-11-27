import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SmartPropertyMatching({
  listings = [],
  selectedCity = 'Kolkata',
  selectedCategory = 'All',
  searchQuery = '',
  onSelectProperty,
}) {
  const navigate = useNavigate();
  const [scanStep, setScanStep] = useState(0);
  const [videoIdx, setVideoIdx] = useState(0);

  const criteriaList = [
    { label: 'Checking locality match', key: 'location' },
    { label: 'Comparing property type', key: 'type' },
    { label: 'Checking monthly rent & value', key: 'budget' },
  ];

  // Cycle criteria steps
  useEffect(() => {
    const timer = setInterval(() => {
      setScanStep((prev) => (prev + 1) % criteriaList.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [criteriaList.length]);

  // Cycle preview image
  useEffect(() => {
    if (!listings.length) return;
    const timer = setInterval(() => {
      setVideoIdx((prev) => (prev + 1) % listings.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [listings.length]);

  const currentPreview = listings[videoIdx] || listings[0] || {
    title: 'Scanning available properties…',
    location: selectedCity,
    price: 9500,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=90',
  };

  // Rank properties based on match
  const rankedProperties = useMemo(() => {
    if (!listings || !listings.length) return [];

    const cleanQuery = (searchQuery || '').trim().toLowerCase();
    const cleanCity = (selectedCity || '').trim().toLowerCase();

    return listings
      .map((p) => {
        let score = 70; // baseline
        const locMatch =
          !cleanCity ||
          cleanCity === 'all' ||
          (p.city && p.city.toLowerCase().includes(cleanCity)) ||
          (p.location && p.location.toLowerCase().includes(cleanCity));
        if (locMatch) score += 15;

        const catMatch =
          !selectedCategory ||
          selectedCategory === 'All' ||
          (p.type && p.type.toLowerCase() === selectedCategory.toLowerCase());
        if (catMatch) score += 15;

        if (cleanQuery && (p.title?.toLowerCase().includes(cleanQuery) || p.keywords?.includes(cleanQuery))) {
          score = Math.min(100, score + 10);
        }

        return { ...p, matchScore: Math.min(100, score) };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);
  }, [listings, selectedCity, selectedCategory, searchQuery]);

  const bestScore = rankedProperties.length ? rankedProperties[0].matchScore : 95;

  return (
    <section
      id="smart-property-matching"
      className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-100 border-y border-emerald-100 py-12 sm:py-16"
    >
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider">
            <i className="fa-solid fa-wand-magic-sparkles"></i> Live Inventory Matching
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-black text-slate-900">
            Properties matched to <span className="text-emerald-600">your search</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            We compare your selected locality, property type and maximum budget with the property listings available on PointKey.
          </p>
        </div>

        {/* 2-COLUMN MATCHING DASHBOARD */}
        <div className="grid lg:grid-cols-[0.95fr_1.45fr] gap-6 items-start">
          {/* LEFT: SCANNING RADAR & ENGINE */}
          <div className="rounded-3xl bg-slate-950 text-white p-5 sm:p-6 shadow-xl overflow-hidden relative">
            {/* Visual Scan Radar Window */}
            <div className="mb-5 rounded-2xl overflow-hidden border border-emerald-300/25 bg-slate-900">
              <div className="relative h-48 sm:h-56">
                <img
                  src={currentPreview.image}
                  alt={currentPreview.title}
                  className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                {/* Laser scan beam */}
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-emerald-300/30 to-transparent pk-live-scan pointer-events-none"></div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-slate-950/80 border border-emerald-300/30 px-3 py-1.5 text-[10px] font-extrabold text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>MATCHING IN PROGRESS</span>
                </div>

                {/* Scanned Property Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm font-black text-white drop-shadow truncate">
                    {currentPreview.title}
                  </p>
                  <p className="text-[10px] text-emerald-200 mt-0.5">
                    {currentPreview.location} • ₹{Number(currentPreview.price || 0).toLocaleString('en-IN')} / month
                  </p>
                </div>

                {/* Progress Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{
                      width: `${((videoIdx + 1) / (listings.length || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="px-3 py-2 flex items-center justify-between text-[10px] text-emerald-200 bg-slate-900">
                <span>
                  <i className="fa-solid fa-film mr-1"></i> Property match preview
                </span>
                <span>
                  {videoIdx + 1} / {listings.length} listings scanned
                </span>
              </div>
            </div>

            {/* Criteria Checklist */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-widest">
                  Matching Engine
                </p>
                <h3 className="text-lg font-black mt-0.5">Checking criteria</h3>
              </div>
              <span className="pk-live-pulse inline-flex items-center gap-2 rounded-full bg-emerald-400/15 border border-emerald-300/25 px-3 py-1 text-[10px] font-bold text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active
              </span>
            </div>

            {/* Criteria Summary Boxes */}
            <div className="space-y-2 mb-4 text-xs">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-2.5">
                <i className="fa-solid fa-location-dot text-emerald-300 w-4 text-center"></i>
                <div className="min-w-0">
                  <p className="text-[9px] text-slate-400 uppercase">Locality</p>
                  <p className="font-bold truncate text-white">{selectedCity || 'All Localities'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-2.5">
                <i className="fa-solid fa-house text-emerald-300 w-4 text-center"></i>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Property Type</p>
                  <p className="font-bold text-white">{selectedCategory || 'All Property Types'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-2.5">
                <i className="fa-solid fa-wallet text-emerald-300 w-4 text-center"></i>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Direct Owner Budget</p>
                  <p className="font-bold text-white">Zero Brokerage Included</p>
                </div>
              </div>
            </div>

            {/* Animated Step Scanner */}
            <div className="space-y-2" aria-live="polite">
              {criteriaList.map((step, idx) => {
                const isCurrent = idx === scanStep;
                const isDone = idx < scanStep || scanStep === criteriaList.length - 1;
                return (
                  <div
                    key={step.key}
                    className={`pk-check-row ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-done' : ''}`}
                  >
                    <span className="pk-check-icon">
                      <i className="fa-solid fa-check"></i>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200">{step.label}</span>
                    <span className="ml-auto text-[10px] text-emerald-300 font-bold">
                      {isCurrent ? 'Checking…' : isDone ? 'Done' : 'Waiting'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Match Score Display */}
            <div className="relative mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/5 p-4 overflow-hidden">
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-400/15 text-emerald-300 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-chart-simple text-lg"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Live match score</p>
                    <p className="text-[10px] text-slate-400">Calculated from inventory criteria</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-300">{bestScore}</span>
                  <span className="text-xs font-bold text-emerald-200">/100</span>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-700"
                  style={{ width: `${bestScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* RIGHT: MATCHED PROPERTIES LIST */}
          <div>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Your Matching Properties
                </p>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Top Recommended Stays
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-white border border-emerald-200 rounded-full px-3 py-1 shadow-xs">
                {rankedProperties.length} verified matches
              </span>
            </div>

            <div className="space-y-3">
              {rankedProperties.map((prop) => (
                <article
                  key={prop.id}
                  onClick={() => {
                    if (onSelectProperty) onSelectProperty(prop);
                    else navigate(`/tenant/property/${prop.id}`);
                  }}
                  className="bg-white rounded-2xl border border-emerald-100 hover:border-emerald-400 p-3.5 sm:p-4 transition-all duration-300 hover:shadow-md cursor-pointer flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-xs"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          {prop.matchScore}% Match
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {prop.type || 'Flat'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-[#0B2545] mt-1 truncate" title={prop.title}>
                        {prop.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        📍 {prop.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div>
                      <span className="text-base font-black text-[#0B2545]">
                        ₹{Number(prop.price || prop.monthly_rent || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold ml-1">/mo</span>
                    </div>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition"
                    >
                      View Details →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
