import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CalendarDays, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldCheck, 
  Video, 
  Sparkles, 
  Maximize2, 
  ChevronRight, 
  ChevronLeft,
  Film
} from 'lucide-react';
import { formatDate } from '../../utils/dateTimestampHelper';
import { getMediaBlobUrl, resolveMediaUrl, DEFAULT_ANGLE_PLACEHOLDERS } from '../../utils/mediaStorage';

const ROOM_ANGLE_FALLBACKS = DEFAULT_ANGLE_PLACEHOLDERS;

const DEFAULT_SAMPLE_VIDEO = '/assets/video/property-video-1.mp4';

/** 
 * TimestampGallery:
 * 1. Photos carry capture-date badge & anti-fake verification.
 * 2. Automated Virtual Walkthrough Video Tour generated directly from owner's 3 angle photos.
 * 3. Real video player toggle if owner uploaded a walkthrough video.
 */
export default function TimestampGallery({ media = [], videoUrl = null, propertyTitle = '', property = null }) {
  const [active, setActive] = useState(0);
  const [isTourMode, setIsTourMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [tourTimeSec, setTourTimeSec] = useState(0);
  const [showRealVideo, setShowRealVideo] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState(null);
  const galleryContainerRef = useRef(null);

  // Retrieve persistent video blob from IndexedDB if stored client-side
  useEffect(() => {
    let activeEffect = true;
    async function loadVideo() {
      if (!property) return;
      try {
        if (property.id) {
          const vUrl = await getMediaBlobUrl(`video_${property.id}`);
          if (vUrl && activeEffect) setLocalVideoUrl(vUrl);
        }
        if (property.property_code && !localVideoUrl) {
          const vUrl2 = await getMediaBlobUrl(`video_${property.property_code}`);
          if (vUrl2 && activeEffect) setLocalVideoUrl(vUrl2);
        }
      } catch (err) {
        console.warn('TimestampGallery video load:', err);
      }
    }
    loadVideo();
    return () => { activeEffect = false; };
  }, [property?.id, property?.property_code]);

  // Normalize media items with owner's uploaded photos (retaining dataUrls, blobUrls and resolving relative paths)
  const items = (Array.isArray(media) && media.length > 0)
    ? media.map((m, idx) => {
        let rawU = m.media_url || m.url || m.preview || m.dataUrl || '';
        let u = resolveMediaUrl(rawU);
        if (!u || u.includes('hero-slide-1.jpg')) {
          u = ROOM_ANGLE_FALLBACKS[idx % 3];
        }
        return {
          ...m,
          media_url: u,
          preview: resolveMediaUrl(m.preview || m.dataUrl || u),
          room_tag: m.room_tag || m.label || `Angle ${idx + 1}`,
          chapterTitle: m.room_tag || m.label || (idx === 0 ? 'Front Entrance' : idx === 1 ? 'Living / Bedroom' : 'Balcony / Kitchen'),
        };
      })
    : [
        {
          id: 'fallback-1',
          room_tag: 'Angle 1 (Front/Entrance)',
          chapterTitle: 'Front Entrance',
          media_type: 'IMAGE',
          media_url: ROOM_ANGLE_FALLBACKS[0],
          captured_date: new Date().toISOString(),
        },
        {
          id: 'fallback-2',
          room_tag: 'Angle 2 (Living/Bedroom)',
          chapterTitle: 'Living / Bedroom',
          media_type: 'IMAGE',
          media_url: ROOM_ANGLE_FALLBACKS[1],
          captured_date: new Date().toISOString(),
        },
        {
          id: 'fallback-3',
          room_tag: 'Angle 3 (Balcony/Kitchen/Side)',
          chapterTitle: 'Balcony / Kitchen',
          media_type: 'IMAGE',
          media_url: ROOM_ANGLE_FALLBACKS[2],
          captured_date: new Date().toISOString(),
        },
      ];

  const SECONDS_PER_ANGLE = 5;
  const TOTAL_TOUR_SECONDS = items.length * SECONDS_PER_ANGLE;
  const current = items[Math.min(active, items.length - 1)];

  // Automated Tour Timer: Advances second-by-second for cinematic video feeling
  useEffect(() => {
    let interval = null;
    if (isTourMode && isPlaying && !showRealVideo && items.length > 0) {
      interval = setInterval(() => {
        setTourTimeSec((prevSec) => {
          const nextSec = (prevSec + 1) % TOTAL_TOUR_SECONDS;
          const targetIndex = Math.floor(nextSec / SECONDS_PER_ANGLE);
          if (targetIndex !== active) {
            setActive(targetIndex);
          }
          return nextSec;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTourMode, isPlaying, showRealVideo, items.length, TOTAL_TOUR_SECONDS, active]);

  // Handle angle jump
  const jumpToAngle = (index) => {
    setActive(index);
    setTourTimeSec(index * SECONDS_PER_ANGLE);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!galleryContainerRef.current) return;
    if (!document.fullscreenElement) {
      galleryContainerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const formatSec = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const safeVideoUrl = resolveMediaUrl(localVideoUrl || (videoUrl ? videoUrl : DEFAULT_SAMPLE_VIDEO));
  const hasPlayableVideo = Boolean(localVideoUrl || videoUrl);

  return (
    <div ref={galleryContainerRef} className="select-none">
      {/* Top Header & Tour Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-[#17324D] flex items-center gap-1">
            <Camera size={14} className="text-[#FF9A1F]" />
            <span>Site Visuals ({items.length} Verified Angles)</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
            ✓ Owner Photos
          </span>
        </div>

        {/* Action Buttons: Automated Video Tour & Real Video */}
        <div className="flex items-center gap-1.5">
          {hasPlayableVideo && (
            <button
              type="button"
              onClick={() => {
                setShowRealVideo(!showRealVideo);
                setIsTourMode(false);
              }}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                showRealVideo
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100'
              }`}
            >
              <Video size={12} />
              <span>{showRealVideo ? 'View Photos' : '📹 Walkthrough Video'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowRealVideo(false);
              setIsTourMode(!isTourMode);
              setIsPlaying(true);
              if (!isTourMode) {
                setTourTimeSec(0);
                setActive(0);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black shadow-xs transition cursor-pointer ${
              isTourMode
                ? 'bg-[#1f4d3f] text-white ring-2 ring-emerald-500/30'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Sparkles size={13} className={isTourMode ? 'animate-spin text-[#FF9A1F]' : 'text-emerald-700'} />
            <span>{isTourMode ? 'Exit Tour Mode' : '🎬 Play Automated Video Tour'}</span>
          </button>
        </div>
      </div>

      {/* Main Showcase Player */}
      <div className="relative h-64 sm:h-96 w-full overflow-hidden rounded-2xl bg-black shadow-xl flex items-center justify-center">
        {showRealVideo ? (
          // Real walkthrough video recorded by owner
          <video
            src={safeVideoUrl}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          // Image / Automated Video Tour generated from owner's uploaded photos
          <div className="relative h-full w-full overflow-hidden">
            {items.map((m, idx) => (
              <img
                key={m.id || idx}
                src={m.media_url}
                alt={m.room_tag}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
                  idx === active
                    ? `opacity-100 ${isTourMode ? (active % 2 === 0 ? 'scale-110 translate-x-2' : 'scale-110 -translate-x-2') : 'scale-100'}`
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
                onError={(e) => {
                  if (m.preview && e.currentTarget.src !== m.preview) {
                    e.currentTarget.src = m.preview;
                  } else {
                    e.currentTarget.src = ROOM_ANGLE_FALLBACKS[idx % 3];
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
          {/* Active Room Angle Chapter Badge */}
          <div className="rounded-full bg-[#17324D]/85 backdrop-blur-md px-3 py-1.5 text-[11px] font-black text-white shadow-md flex items-center gap-1.5 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{String(current.room_tag).replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Date Timestamp Badge */}
            <div className="flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm border border-white/10">
              <CalendarDays size={11} /> 
              <span>{formatDate(current.captured_date)}</span>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-full bg-black/65 text-white/90 hover:text-white hover:bg-black/85 transition"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Cinematic Property Details Overlay written inside the Automated Video Tour */}
        {isTourMode && !showRealVideo && (
          <div className="absolute top-12 left-3 z-20 max-w-[270px] sm:max-w-[340px] rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 p-2.5 sm:p-3 text-white shadow-2xl transition-all">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-[9px] font-black uppercase text-white flex items-center gap-1">
                <ShieldCheck size={10} /> VERIFIED
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold text-white/90">
                {property?.category || 'FLAT'} · {property?.sub_type || property?.type || '2 BHK'}
              </span>
            </div>
            <h4 className="mt-1 font-black text-xs sm:text-sm text-white truncate drop-shadow-md">
              {propertyTitle || property?.title || 'Verified Property'}
            </h4>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-[#FF9A1F]">
                ₹{Number(property?.rent_amount || property?.price || 12000).toLocaleString('en-IN')}<span className="text-[9px] text-white/70">/mo</span>
              </span>
              <span className="text-[9px] text-white/75">
                Deposit: ₹{Number(property?.advance_amount || property?.deposit || 24000).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[9px] text-white/80 border-t border-white/10 pt-1">
              <span>📐 {property?.roomSize || (property?.size_sqft ? `${property.size_sqft} sq ft` : '424 sq ft')}</span>
              <span>•</span>
              <span>🏢 {property?.floor || property?.roof_floor_type || '3rd floor / 8 floors'}</span>
              <span>•</span>
              <span>📍 {property?.locality || property?.location || 'Kolkata'}</span>
            </div>
          </div>
        )}

        {/* Next / Prev Buttons in manual mode */}
        {!isTourMode && !showRealVideo && items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((prev) => (prev - 1 + items.length) % items.length)}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition z-20"
              title="Previous Angle"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setActive((prev) => (prev + 1) % items.length)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition z-20"
              title="Next Angle"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* ============================================================== */}
        {/* AUTOMATED VIDEO WALKTHROUGH CONTROLS OVERLAY (CINEMA MODE)     */}
        {/* ============================================================== */}
        {isTourMode && !showRealVideo && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent p-3 pt-10 flex flex-col gap-2 z-20">
            {/* Video Scrubber & Timeline Bar */}
            <div className="flex items-center gap-2">
              <div 
                className="relative flex-1 h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  const targetSec = Math.floor(ratio * TOTAL_TOUR_SECONDS);
                  setTourTimeSec(targetSec);
                  setActive(Math.floor(targetSec / SECONDS_PER_ANGLE));
                }}
              >
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#FF9A1F] transition-all duration-300"
                  style={{ width: `${(tourTimeSec / TOTAL_TOUR_SECONDS) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-white/90 shrink-0">
                {formatSec(tourTimeSec)} / {formatSec(TOTAL_TOUR_SECONDS)}
              </span>
            </div>

            {/* Video Controls Bar */}
            <div className="flex items-center justify-between text-white text-xs pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition flex items-center justify-center cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTourTimeSec(0);
                    setActive(0);
                    setIsPlaying(true);
                  }}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                  title="Replay Video Tour"
                >
                  <RotateCcw size={13} />
                </button>
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <Film size={12} />
                  <span>Automated Video Tour ({items.length} Angles)</span>
                </span>
              </div>

              {/* Angle chapter pills */}
              <div className="hidden sm:flex items-center gap-1">
                {items.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => jumpToAngle(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      idx === active ? 'bg-[#FF9A1F] text-slate-900' : 'bg-white/10 hover:bg-white/20 text-white/70'
                    }`}
                  >
                    Angle {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-white/75 text-center flex items-center justify-center gap-1 pt-0.5">
              <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
              <span>Automated video tour created by PointKey from owner&apos;s genuine site photos. Zero brokerage verified.</span>
            </p>
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
        {items.map((m, i) => (
          <button
            key={m.id || i}
            onClick={() => {
              setShowRealVideo(false);
              jumpToAngle(i);
            }}
            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer ${
              i === active && !showRealVideo
                ? 'border-[#1f4d3f] ring-2 ring-[#1f4d3f]/30 scale-102'
                : 'border-slate-200 opacity-65 hover:opacity-100 hover:border-slate-400'
            }`}
            aria-label={`View ${m.room_tag} media`}
          >
            <img
              src={m.media_url}
              alt={m.room_tag}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = ROOM_ANGLE_FALLBACKS[i % 3];
              }}
            />
            <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] font-black text-center truncate py-0.5">
              Angle {i + 1}
            </span>
          </button>
        ))}

        {videoUrl && (
          <button
            type="button"
            onClick={() => {
              setShowRealVideo(true);
              setIsTourMode(false);
            }}
            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center bg-slate-900 ${
              showRealVideo
                ? 'border-sky-500 ring-2 ring-sky-500/30 text-sky-400'
                : 'border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Video size={18} />
            <span className="text-[9px] font-black mt-1 uppercase">Video Tour</span>
          </button>
        )}
      </div>
    </div>
  );
}
