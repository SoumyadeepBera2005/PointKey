import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SAMPLE_PROPERTIES } from '../../data/sampleProperties';

const POPULAR_LOCATIONS = [
  { name: 'Purba Medinipur, West Bengal', desc: 'Tamluk, Haldia, Digha, Contai & Kolaghat' },
  { name: 'Kolkata, West Bengal', desc: 'City-wide verified rental search' },
  { name: 'Salt Lake, Kolkata', desc: 'Sector I, II, III & Sector V IT Hub' },
  { name: 'New Town, Kolkata', desc: 'Action Area I, II, III IT corridor' },
  { name: 'Haldia, Purba Medinipur', desc: 'Industrial port city & residential flats' },
  { name: 'Digha, Purba Medinipur', desc: 'Coastal holiday & rental apartments' },
  { name: 'Tamluk, Purba Medinipur', desc: 'District headquarters verified homes' },
  { name: 'Contai, Purba Medinipur', desc: 'Kanthi town flats & residences' },
  { name: 'Paschim Medinipur, West Bengal', desc: 'Kharagpur & Midnapore Town' },
  { name: 'Howrah, West Bengal', desc: 'Station & transit hub apartments' },
  { name: 'Rajarhat, Kolkata', desc: 'Modern high-rises & affordable homes' },
  { name: 'Ballygunge, Kolkata', desc: 'South Kolkata prime residences' },
  { name: 'Garia, Kolkata', desc: 'Metro-connected rooms & flats' },
  { name: 'Jadavpur, Kolkata', desc: 'University area & student PGs' },
  { name: 'Behala, Kolkata', desc: 'Spacious family apartments' },
  { name: 'Bangalore, Karnataka', desc: 'Tech corridor flats & shared co-living' },
  { name: 'Mumbai, Maharashtra', desc: 'Suburban & city-center residences' },
  { name: 'Delhi NCR', desc: 'Noida, Gurgaon & Delhi rental suites' },
  { name: 'Hyderabad, Telangana', desc: 'HITEC City & Gachibowli residences' },
  { name: 'Pune, Maharashtra', desc: 'Viman Nagar, Hinjewadi & Kharadi' },
];

export default function Navbar({ onSelectLocation, onOpenServices, onOpenExpenses, activePillar = 'SearchKart', onSwitchPillar, transparent = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [locationOpen, setLocationOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocationName, setSelectedLocationName] = useState(() => {
    try {
      const saved = localStorage.getItem('prent_selected_location');
      if (saved) return saved;
      return 'Kolkata';
    } catch {
      return 'Kolkata';
    }
  });

  // Non-intrusive auto-detect on initial load if user hasn't set one yet
  useEffect(() => {
    try {
      const saved = localStorage.getItem('prent_selected_location');
      if (!saved) {
        fetch('https://api.bigdatacloud.net/data/reverse-geocode-client')
          .then((r) => r.json())
          .then((data) => {
            const loc = data.locality || data.city;
            if (loc) {
              setSelectedLocationName(loc);
              localStorage.setItem('prent_selected_location', loc);
              if (onSelectLocation) onSelectLocation(loc);
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, [onSelectLocation]);
  const [isLocating, setIsLocating] = useState(false);
  const [recentLocations, setRecentLocations] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('prent_recent_locations') || '[]');
      return saved.length > 0 ? saved : ['Purba Medinipur, West Bengal', 'Salt Lake, Kolkata', 'New Town, Kolkata'];
    } catch {
      return ['Purba Medinipur, West Bengal', 'Salt Lake, Kolkata', 'New Town, Kolkata'];
    }
  });
  const [favOpen, setFavOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoriteItems, setFavoriteItems] = useState([]);

  const locationRef = useRef(null);
  const favRef = useRef(null);
  const notifyRef = useRef(null);
  const profileRef = useRef(null);

  // Sync favorites count and list from localStorage
  useEffect(() => {
    const updateFavorites = () => {
      try {
        const raw = JSON.parse(localStorage.getItem('prent_favorites') || '[]');
        const resolved = raw.map((item) => {
          if (typeof item === 'object' && item !== null && item.title) {
            return item;
          }
          const id = typeof item === 'object' ? item?.id : item;
          // Look up in SAMPLE_PROPERTIES by id or index
          const found = SAMPLE_PROPERTIES.find(
            (p) => String(p.id).toLowerCase() === String(id).toLowerCase()
          );
          if (found) {
            return {
              id: found.id,
              title: found.title,
              location: found.location,
              rent: found.price || found.monthly_rent || 0,
              image: found.image || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90',
            };
          }
          const num = parseInt(id, 10);
          if (!isNaN(num) && num > 0 && num <= SAMPLE_PROPERTIES.length) {
            const byIdx = SAMPLE_PROPERTIES[num - 1];
            return {
              id: byIdx.id,
              title: byIdx.title,
              location: byIdx.location,
              rent: byIdx.price || byIdx.monthly_rent || 0,
              image: byIdx.image || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90',
            };
          }
          return {
            id: id,
            title: `PointKey Verified Home #${String(id).replace('property-', '')}`,
            location: 'Salt Lake, Kolkata',
            rent: 8500,
            image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90',
          };
        });
        setFavoriteItems(resolved);
        setFavoritesCount(resolved.length);
      } catch {
        setFavoriteItems([]);
        setFavoritesCount(0);
      }
    };
    updateFavorites();
    window.addEventListener('storage', updateFavorites);
    window.addEventListener('prent_fav_change', updateFavorites);
    return () => {
      window.removeEventListener('storage', updateFavorites);
      window.removeEventListener('prent_fav_change', updateFavorites);
    };
  }, []);

  const handleRemoveFavorite = (e, id) => {
    e.stopPropagation();
    try {
      const raw = JSON.parse(localStorage.getItem('prent_favorites') || '[]');
      const updated = raw.filter((item) => {
        const itemId = typeof item === 'object' ? item?.id : item;
        return String(itemId) !== String(id);
      });
      localStorage.setItem('prent_favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('prent_fav_change'));
    } catch (err) {
      console.error(err);
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
      if (favRef.current && !favRef.current.contains(e.target)) {
        setFavOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setNotifyOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const filteredLocations = POPULAR_LOCATIONS.filter(
    (l) =>
      l.name.toLowerCase().includes(locationQuery.toLowerCase()) ||
      l.desc.toLowerCase().includes(locationQuery.toLowerCase())
  );

  const handleLocationPick = (loc) => {
    setLocationOpen(false);
    const locName = typeof loc === 'object' ? loc.name : loc;
    const cleanName = locName.split(',')[0].trim();

    setSelectedLocationName(cleanName);
    try {
      localStorage.setItem('prent_selected_location', cleanName);
    } catch {}

    try {
      const updated = [locName, ...recentLocations.filter((r) => r !== locName)].slice(0, 5);
      setRecentLocations(updated);
      localStorage.setItem('prent_recent_locations', JSON.stringify(updated));
    } catch {}

    if (onSelectLocation) onSelectLocation(cleanName);
    else navigate(`/tenant/search?location=${encodeURIComponent(cleanName)}`);
  };

  const handleCurrentLocation = () => {
    setIsLocating(true);

    const resolveCoords = async (latitude, longitude) => {
      // 1. Try BigDataCloud reverse geocode client (specifically designed for browsers, fast, highly accurate, CORS-friendly)
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        if (res.ok) {
          const data = await res.json();
          const locality = data.locality || data.city || '';
          const adminList = data.localityInfo?.administrative || [];
          const district = adminList.find((a) => a.adminLevel === 6 || a.adminLevel === 5)?.name || data.city || '';
          const state = data.principalSubdivision || '';

          const primary = locality || district || state;
          if (primary) {
            let displayName = primary;
            if (district && district !== primary && !primary.includes(district)) {
              displayName = `${primary}, ${district}`;
            } else if (state && state !== primary) {
              displayName = `${primary}, ${state}`;
            }
            handleLocationPick({ name: displayName, desc: 'GPS Detected Location' });
            return true;
          }
        }
      } catch (e) {
        console.warn('BigDataCloud error:', e);
      }

      // 2. Fallback to OpenStreetMap Nominatim
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const locality =
            addr.suburb ||
            addr.neighbourhood ||
            addr.town ||
            addr.village ||
            addr.city_district ||
            addr.municipality ||
            addr.city ||
            addr.county ||
            '';
          const district = addr.county || addr.state_district || '';
          const state = addr.state || '';

          const primary = locality || district || state;
          if (primary) {
            let displayName = primary;
            if (district && district !== primary && !primary.includes(district)) {
              displayName = `${primary}, ${district}`;
            } else if (state && state !== primary) {
              displayName = `${primary}, ${state}`;
            }
            handleLocationPick({ name: displayName, desc: 'GPS Detected Location' });
            return true;
          }
        }
      } catch (e) {
        console.warn('Nominatim error:', e);
      }
      return false;
    };

    const fallbackToIP = async () => {
      try {
        const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
        if (res.ok) {
          const data = await res.json();
          const locality = data.locality || data.city || data.principalSubdivision;
          const district = (data.localityInfo?.administrative || []).find((a) => a.adminLevel === 6 || a.adminLevel === 5)?.name || '';
          if (locality) {
            const displayName = district && district !== locality ? `${locality}, ${district}` : `${locality}, ${data.principalSubdivision || 'WB'}`;
            handleLocationPick({ name: displayName, desc: 'Network Detected Location' });
            return;
          }
        }
      } catch {}
      handleLocationPick({ name: 'Kolkata, West Bengal', desc: 'Default Metro' });
    };

    if (!navigator.geolocation) {
      fallbackToIP().finally(() => setIsLocating(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const ok = await resolveCoords(position.coords.latitude, position.coords.longitude);
          if (!ok) await fallbackToIP();
        } catch {
          await fallbackToIP();
        } finally {
          setIsLocating(false);
        }
      },
      async (err) => {
        console.warn('Geolocation error:', err.message);
        await fallbackToIP();
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const clearRecentLocations = (e) => {
    e.stopPropagation();
    setRecentLocations([]);
    try {
      localStorage.removeItem('prent_recent_locations');
    } catch {}
  };

  const initialLetter = (user?.full_name || 'Tenant').charAt(0).toUpperCase();

  return (
    <header className={`pointkey-navbar-root ${transparent ? 'pk-navbar-transparent' : ''}`}>
      <style>{`
        .pointkey-navbar-root {
          height: 72px;
          background: #ffffff;
          border-bottom: 1px solid #d8cba9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          position: sticky;
          top: 0;
          z-index: 1000;
          font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
          user-select: none;
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }

        /* TRANSPARENT HERO NAVBAR (OYO STYLE OVER ARCHITECTURAL REEL) */
        .pointkey-navbar-root.pk-navbar-transparent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: transparent;
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: none;
          z-index: 100;
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-brand-title {
          color: #ffffff;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-location-btn {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.32);
          color: #ffffff;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-location-btn:hover {
          background: rgba(255, 255, 255, 0.28);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-loc-btn-icon,
        .pointkey-navbar-root.pk-navbar-transparent .pk-loc-btn-name,
        .pointkey-navbar-root.pk-navbar-transparent .pk-loc-btn-arrow {
          color: #ffffff;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-pillar-group {
          background: rgba(15, 23, 42, 0.45);
          border-color: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-pillar-tab {
          color: rgba(255, 255, 255, 0.92);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-pillar-tab:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-pillar-tab.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-pillar-tab.active svg {
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-explore-btn {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-explore-btn:hover {
          background: rgba(255, 255, 255, 0.24);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.4);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-nav-icon-btn,
        .pointkey-navbar-root.pk-navbar-transparent .pk-avatar-btn {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.3);
          color: #ffffff;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .pointkey-navbar-root.pk-navbar-transparent .pk-nav-icon-btn:hover,
        .pointkey-navbar-root.pk-navbar-transparent .pk-avatar-btn:hover {
          background: rgba(255, 255, 255, 0.28);
          border-color: rgba(255, 255, 255, 0.45);
        }

        .pk-nav-left, .pk-nav-right {
          display: flex;
          align-items: center;
        }

        .pk-nav-left {
          gap: 16px;
        }

        .pk-nav-right {
          gap: 12px;
        }

        .pk-nav-center {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 10px;
          pointer-events: auto;
          z-index: 10;
        }

        .pk-pillar-group {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(216, 203, 169, 0.45);
          padding: 4px 6px;
          border-radius: 16px;
          border: 1px solid #d8cba9;
        }

        .pk-pillar-tab {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 15px;
          border-radius: 12px;
          border: 0;
          background: transparent;
          color: #141414;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pk-pillar-tab:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .pk-pillar-tab.active {
          background: #1E3A8A;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(30, 58, 138, 0.28);
        }

        .pk-tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media(max-width: 860px) {
          .pk-nav-center {
            display: none;
          }
          .pointkey-navbar-root {
            padding: 0 16px;
          }
        }

        .pk-brand-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
        }

        .pk-logo-mark {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1f4d3f 0%, #2d6a55 100%);
          position: relative;
          box-shadow: 0 6px 16px rgba(31, 77, 63, 0.35);
          display: inline-block;
          flex-shrink: 0;
        }

        .pk-logo-mark::before {
          content: "";
          position: absolute;
          width: 17px;
          height: 17px;
          background: #fff;
          transform: rotate(45deg);
          left: 9.5px;
          top: 9px;
          border-radius: 3px;
        }

        .pk-logo-mark::after {
          content: "";
          position: absolute;
          width: 5px;
          height: 11px;
          background: #1f4d3f;
          left: 15.5px;
          top: 18px;
          border-radius: 2px;
        }

        .pk-brand-title {
          color: #141414;
          font-weight: 900;
          font-size: 24px;
          letter-spacing: -0.5px;
        }

        .pk-location-btn {
          height: 42px;
          padding: 0 14px;
          border: 1px solid #d8cba9;
          background: #ffffff;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 700;
          color: #14532D;
          cursor: pointer;
          transition: background .18s, border-color .18s, transform .15s;
          white-space: nowrap;
        }

        .pk-location-btn:hover {
          background: #f6efdf;
          border-color: #c4b591;
          transform: translateY(-1px);
        }

        .pk-loc-btn-icon {
          display: flex;
          align-items: center;
          color: #14532D;
          flex-shrink: 0;
        }

        .pk-loc-btn-name {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #141414;
          font-weight: 700;
          font-size: 13px;
        }

        .pk-loc-btn-arrow {
          font-size: 10px;
          opacity: 0.75;
          color: #555;
          margin-left: 2px;
          flex-shrink: 0;
        }

        .pk-location-dropdown {
          position: absolute;
          top: 56px;
          right: 0;
          left: auto;
          width: 360px;
          max-width: 92vw;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          border-radius: 20px;
          box-shadow: 0 25px 70px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
          padding: 14px;
          z-index: 1250;
          animation: pkLocDrop 0.2s ease-out;
        }

        @keyframes pkLocDrop {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pk-location-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 9px 12px;
          transition: border-color 0.15s, background 0.15s;
        }

        .pk-location-input-wrap:focus-within {
          background: rgba(255, 255, 255, 0.85);
          border-color: #14532D;
          box-shadow: 0 0 0 3px rgba(20, 83, 45, 0.15);
        }

        .pk-location-input-wrap input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 13.5px;
          color: #141414;
          font-family: inherit;
        }

        .pk-loc-mini-clear {
          background: #ebe1c9;
          border: 0;
          color: #5b5547;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          font-size: 10px;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* 1. CHOOSE CURRENT LOCATION */
        .pk-loc-current-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(220, 252, 231, 0.65);
          border: 1.5px solid rgba(134, 239, 172, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 14px;
          padding: 10px 14px;
          cursor: pointer;
          margin-top: 10px;
          transition: background 0.15s, border-color 0.15s, transform 0.15s;
          text-align: left;
        }

        .pk-loc-current-btn:hover {
          background: rgba(187, 247, 208, 0.85);
          border-color: #4ade80;
          transform: translateY(-1px);
        }

        .pk-loc-gps-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #14532D;
          color: #ffffff;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(20, 83, 45, 0.25);
        }

        /* 2. PREVIOUS SEARCHES SECTION */
        .pk-loc-section {
          margin-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.35);
          padding-top: 10px;
        }

        .pk-loc-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 800;
          color: #4b5563;
          letter-spacing: 0.04em;
          margin-bottom: 8px;
          padding: 0 4px;
        }

        .pk-loc-clear-link {
          background: transparent;
          border: 0;
          color: #b8560a;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .pk-loc-clear-link:hover {
          text-decoration: underline;
        }

        .pk-loc-recent-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .pk-loc-recent-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #141414;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }

        .pk-loc-recent-tag:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: #14532D;
          color: #14532D;
        }

        /* 3. POPULAR CITIES LIST */
        .pk-location-list {
          margin-top: 6px;
          max-height: 240px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pk-location-item {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          text-align: left;
          padding: 8px 10px;
          border-radius: 12px;
          cursor: pointer;
          transition: all .15s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pk-location-item:hover {
          background: rgba(255, 255, 255, 0.8);
          border-color: rgba(20, 83, 45, 0.4);
          transform: translateY(-1px);
        }

        .pk-loc-item-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.7);
          display: grid;
          place-items: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .pk-location-item strong {
          font-size: 12.5px;
          color: #141414;
          display: block;
        }

        .pk-location-item small {
          font-size: 11px;
          color: #6b7280;
          margin-top: 1px;
          display: block;
        }

        .pk-loc-item-arrow {
          color: #14532D;
          font-size: 13px;
          font-weight: 800;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .pk-location-item:hover .pk-loc-item-arrow {
          opacity: 1;
        }

        .pk-explore-btn {
          border: 1px solid transparent;
          background: transparent;
          color: #5b5547;
          font-size: 13px;
          font-weight: 700;
          padding: 9px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all .18s;
        }

        .pk-explore-btn:hover {
          background: #f6efdf;
          color: #1f4d3f;
          border-color: #ebe1c9;
        }

        .pk-nav-icon-btn {
          width: 42px;
          height: 42px;
          border: 1px solid #d8cba9;
          background: #ffffff;
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-size: 19px;
          color: #5b5547;
          cursor: pointer;
          position: relative;
          transition: background .18s, border-color .18s;
        }

        .pk-nav-icon-btn:hover {
          background: #f6efdf;
          border-color: #c4b591;
        }

        .pk-badge-count {
          position: absolute;
          top: 4px;
          right: 4px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 20px;
          background: #b8560a;
          color: #ffffff;
          font-size: 9px;
          font-weight: 900;
          display: grid;
          place-items: center;
          border: 2px solid #ffffff;
        }

        .pk-avatar-btn {
          width: 42px;
          height: 42px;
          border: 1px solid #d8cba9;
          background: #ffffff;
          border-radius: 12px;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: background .18s;
        }

        .pk-avatar-btn:hover {
          background: #f6efdf;
        }

        .pk-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1f4d3f 0%, #2d6a55 100%);
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 13px;
        }

        /* POPUP PANELS (FROSTED GLASS) */
        .pk-popup-panel {
          position: absolute;
          top: 56px;
          right: 0;
          width: 350px;
          max-width: 92vw;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          border-radius: 20px;
          box-shadow: 0 25px 70px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
          z-index: 1250;
          overflow: hidden;
          animation: pkLocDrop 0.2s ease-out;
        }

        .pk-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.45);
          background: rgba(255, 255, 255, 0.35);
        }

        .pk-panel-head b {
          font-size: 14px;
          color: #111827;
        }

        .pk-panel-head span {
          font-size: 11px;
          color: #4b5563;
          font-weight: 700;
        }

        .pk-panel-body {
          max-height: 340px;
          overflow-y: auto;
          padding: 8px 0;
          background: transparent;
        }

        .pk-panel-item {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.35);
          display: flex;
          gap: 10px;
          background: transparent;
          transition: background 0.15s;
        }

        .pk-panel-item:hover {
          background: rgba(255, 255, 255, 0.45);
        }

        .pk-panel-item:last-child {
          border-bottom: 0;
        }

        .pk-panel-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.7);
          display: grid;
          place-items: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .pk-fav-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.35);
          cursor: pointer;
          transition: background 0.15s ease;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .pk-fav-row:hover {
          background: rgba(255, 255, 255, 0.45);
        }

        .pk-fav-thumb {
          width: 58px;
          height: 50px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .pk-fav-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #111827;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pk-fav-meta {
          font-size: 11px;
          color: #4b5563;
          font-weight: 600;
          margin-top: 3px;
          display: flex;
          align-items: center;
        }

        .pk-fav-remove-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.65);
          color: #5b5547;
          display: grid;
          place-items: center;
          font-size: 11px;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }

        .pk-fav-remove-btn:hover {
          background: #fbe3cc;
          color: #b8560a;
        }

        .pk-profile-menu {
          position: absolute;
          top: 56px;
          right: 0;
          width: 260px;
          max-width: 92vw;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          border-radius: 22px;
          box-shadow: 0 25px 70px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
          z-index: 1250;
          overflow: hidden;
          padding: 8px;
          animation: pkMenuDrop 0.18s ease-out;
        }

        @keyframes pkMenuDrop {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pk-profile-section {
          padding: 2px;
        }

        .pk-profile-item {
          width: 100%;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 9px 12px;
          border-radius: 14px;
          font-size: 13.5px;
          font-weight: 700;
          color: #141414;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease, transform 0.15s ease;
          user-select: none;
        }

        .pk-profile-item:hover {
          background: rgba(255, 255, 255, 0.55);
          color: #14532D;
        }

        .pk-profile-item .pk-pi {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.75);
          display: grid;
          place-items: center;
          font-size: 18px;
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }

        .pk-profile-item:hover .pk-pi {
          transform: scale(1.06);
          background: rgba(255, 255, 255, 0.85);
        }

        .pk-profile-divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
          margin: 6px 10px;
        }

        .pk-profile-logout {
          color: #b8560a !important;
        }

        .pk-profile-logout:hover {
          background: #fdeee2 !important;
          color: #9c4505 !important;
        }

        .pk-profile-logout .pk-pi {
          background: #fbe3cc !important;
          color: #b8560a !important;
          font-weight: 900;
        }

        /* MODAL STYLES */
        .pk-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 20, 20, 0.45);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: pkFade 0.2s ease-out;
        }

        @keyframes pkFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .pk-modal-card {
          background: #ffffff;
          width: 100%;
          max-width: 520px;
          border-radius: 22px;
          border: 1.5px solid #ebe1c9;
          box-shadow: 0 25px 70px rgba(20, 20, 20, 0.25);
          overflow: hidden;
          animation: pkModalPop 0.2s ease-out;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }

        @keyframes pkModalPop {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .pk-modal-head {
          background: linear-gradient(135deg, #1f4d3f 0%, #2d6a55 100%);
          color: #ffffff;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pk-modal-head h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pk-modal-head p {
          margin: 3px 0 0;
          font-size: 12px;
          opacity: 0.88;
        }

        .pk-modal-close-btn {
          background: rgba(255, 255, 255, 0.16);
          border: 0;
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: background 0.15s;
        }

        .pk-modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .pk-modal-body {
          padding: 20px 22px;
          overflow-y: auto;
          background: #faf7f0;
          flex: 1;
        }

        .pk-modal-footer {
          padding: 14px 22px;
          background: #ffffff;
          border-top: 1px solid #ebe1c9;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .pk-modal-primary-btn {
          background: #1f4d3f;
          color: #ffffff;
          border: 0;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
        }

        .pk-modal-primary-btn:hover {
          background: #16372c;
        }

        .pk-modal-secondary-btn {
          background: #f6efdf;
          color: #141414;
          border: 1px solid #ebe1c9;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>

      {/* LEFT: BRAND LOGO */}
      <div className="pk-nav-left">
        <Link to="/tenant" className="pk-brand-link">
          <div className="pk-logo-mark" />
          <span className="pk-brand-title">PointKey</span>
        </Link>
      </div>

      {/* CENTER: EXPLORE LINKS OR PILLARS */}
      <nav className="pk-nav-center">
        {onSwitchPillar ? (
          <div className="pk-pillar-group" aria-label="Primary Platform Pillars">
            <button
              type="button"
              onClick={() => onSwitchPillar('SearchKart')}
              className={`pk-pillar-tab ${activePillar === 'SearchKart' ? 'active' : ''}`}
            >
              <span className="pk-tab-icon">
                <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <span>SearchKart</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchPillar('FacilityKart')}
              className={`pk-pillar-tab ${activePillar === 'FacilityKart' ? 'active' : ''}`}
            >
              <span className="pk-tab-icon">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766" />
                </svg>
              </span>
              <span>FacilityKart</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchPillar('BudgetKart')}
              className={`pk-pillar-tab ${activePillar === 'BudgetKart' ? 'active' : ''}`}
            >
              <span className="pk-tab-icon">
                <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6" />
                </svg>
              </span>
              <span>BudgetKart</span>
            </button>
          </div>
        ) : (
          <>
            <button
              className="pk-explore-btn"
              type="button"
              onClick={() => onOpenServices?.()}
            >
              Explore Services
            </button>
            <button
              className="pk-explore-btn"
              type="button"
              onClick={() => onOpenExpenses?.()}
            >
              Explore My Expenses
            </button>
          </>
        )}
      </nav>

      {/* RIGHT: LOCATION SELECTOR + FAVORITES + NOTIFICATIONS + PROFILE */}
      <div className="pk-nav-right">
        {/* Location Dropdown (beside Favorites) */}
        <div style={{ position: 'relative' }} ref={locationRef}>
          <button
            className="pk-location-btn"
            type="button"
            onClick={() => setLocationOpen(!locationOpen)}
            title="Choose city / location"
            aria-label="Location selector"
          >
            <span className="pk-loc-btn-icon">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span className="pk-loc-btn-name">{selectedLocationName}</span>
            <span className="pk-loc-btn-arrow">▾</span>
          </button>

          {locationOpen && (
            <div className="pk-location-dropdown">
              {/* Search input with mini clear */}
              <div className="pk-location-input-wrap">
                <span style={{ fontSize: '14px' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search city, area, or locality..."
                  autoFocus
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
                {locationQuery && (
                  <button
                    type="button"
                    className="pk-loc-mini-clear"
                    onClick={() => setLocationQuery('')}
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 1. SOBER UPOR A: CHOOSE CURRENT LOCATION */}
              <button
                type="button"
                className="pk-loc-current-btn"
                onClick={handleCurrentLocation}
                disabled={isLocating}
              >
                <span className="pk-loc-gps-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: isLocating ? 'spin 1s linear infinite' : 'none' }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                  </svg>
                </span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <strong style={{ fontSize: '13px', color: '#14532D', display: 'block' }}>
                    {isLocating ? 'Detecting current GPS location...' : 'Choose Current Location'}
                  </strong>
                  <small style={{ fontSize: '11px', color: '#166534', display: 'block' }}>
                    {isLocating ? 'Requesting device coordinates & area...' : 'Detect automatically via device GPS'}
                  </small>
                </div>
                <span style={{ color: '#166534', fontSize: '14px', fontWeight: 800 }}>
                  {isLocating ? '⏳' : '→'}
                </span>
              </button>

              {/* 2. UPOR ER DIKE: PREVIOUS SEARCHES */}
              {!locationQuery && recentLocations && recentLocations.length > 0 && (
                <div className="pk-loc-section">
                  <div className="pk-loc-section-title">
                    <span>🕒 PREVIOUS SEARCHES</span>
                    <button
                      type="button"
                      className="pk-loc-clear-link"
                      onClick={clearRecentLocations}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="pk-loc-recent-tags">
                    {recentLocations.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        className="pk-loc-recent-tag"
                        onClick={() => handleLocationPick(loc)}
                      >
                        <span>🕒</span>
                        <span>{loc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. POPULAR CITIES & AREAS */}
              <div className="pk-loc-section">
                <div className="pk-loc-section-title">
                  <span>{locationQuery ? 'SEARCH RESULTS' : '🏙️ POPULAR CITIES & AREAS'}</span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    {filteredLocations.length} locations
                  </span>
                </div>

                <div className="pk-location-list">
                  {filteredLocations.map((loc, i) => (
                    <button
                      key={i}
                      type="button"
                      className="pk-location-item"
                      onClick={() => handleLocationPick(loc)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="pk-loc-item-icon">📍</span>
                        <div>
                          <strong>{loc.name}</strong>
                          <small>{loc.desc}</small>
                        </div>
                      </div>
                      <span className="pk-loc-item-arrow">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Favorites */}
        <div style={{ position: 'relative' }} ref={favRef}>
          <button
            className="pk-nav-icon-btn"
            type="button"
            onClick={() => setFavOpen(!favOpen)}
            title="Favorite properties"
          >
            ♡
            {favoritesCount > 0 && (
              <span className="pk-badge-count">{favoritesCount}</span>
            )}
          </button>

          {favOpen && (
            <div className="pk-popup-panel" style={{ width: '360px' }}>
              <div className="pk-panel-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px' }}>❤️</span>
                  <b>Favorite Properties</b>
                </div>
                <span>{favoriteItems.length} saved</span>
              </div>
              <div className="pk-panel-body" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {favoriteItems.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px', color: '#b8560a' }}>♡</span>
                    <b style={{ display: 'block', fontSize: '13px', color: '#141414' }}>No favorites yet</b>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#5b5547' }}>
                      Click the ♡ heart on any property card to save it here!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {favoriteItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="pk-fav-row"
                        onClick={() => {
                          setFavOpen(false);
                          navigate(`/tenant/property/${item.id}`);
                        }}
                        title="Click to view details"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="pk-fav-thumb"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90';
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b className="pk-fav-title">{item.title}</b>
                          <div className="pk-fav-meta">
                            <span>📍 {item.location}</span>
                            <span style={{ margin: '0 5px' }}>·</span>
                            <strong style={{ color: '#1f4d3f' }}>
                              ₹{Number(item.rent || 0).toLocaleString('en-IN')}/mo
                            </strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="pk-fav-remove-btn"
                          onClick={(e) => handleRemoveFavorite(e, item.id)}
                          title="Remove from favorites"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {favoriteItems.length > 0 && (
                <div style={{ padding: '10px 14px', background: '#faf7f0', borderTop: '1px solid #ebe1c9', textAlign: 'center' }}>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 0, color: '#1f4d3f', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    onClick={() => {
                      setFavOpen(false);
                      navigate('/tenant/search');
                    }}
                  >
                    Explore all homes →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifyRef}>
          <button
            className="pk-nav-icon-btn"
            type="button"
            onClick={() => setNotifyOpen(!notifyOpen)}
            title="Notifications"
          >
            🔔
            <span className="pk-badge-count">3</span>
          </button>

          {notifyOpen && (
            <div className="pk-popup-panel">
              <div className="pk-panel-head">
                <b>Notifications</b>
                <span>3 updates</span>
              </div>
              <div className="pk-panel-body">
                <div className="pk-panel-item">
                  <div className="pk-panel-item-icon">🏠</div>
                  <div>
                    <b style={{ fontSize: '13px', display: 'block', color: '#141414' }}>New property match</b>
                    <p style={{ fontSize: '11px', color: '#5b5547', margin: '2px 0 0' }}>
                      A verified rental in Salt Lake matches your preferences.
                    </p>
                  </div>
                </div>
                <div className="pk-panel-item">
                  <div className="pk-panel-item-icon">❤️</div>
                  <div>
                    <b style={{ fontSize: '13px', display: 'block', color: '#141414' }}>Availability updated</b>
                    <p style={{ fontSize: '11px', color: '#5b5547', margin: '2px 0 0' }}>
                      A single room in New Town is now available for visit.
                    </p>
                  </div>
                </div>
                <div className="pk-panel-item">
                  <div className="pk-panel-item-icon">🔔</div>
                  <div>
                    <b style={{ fontSize: '13px', display: 'block', color: '#141414' }}>PointKey reminder</b>
                    <p style={{ fontSize: '11px', color: '#5b5547', margin: '2px 0 0' }}>
                      Book your visit slot to verify rooms in person.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            className="pk-avatar-btn"
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            title="Profile menu"
          >
            <div className="pk-avatar-circle">{initialLetter}</div>
          </button>

          {profileOpen && (
            <div className="pk-profile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="pk-profile-section">
                <button
                  type="button"
                  className="pk-profile-item"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/tenant/profile');
                  }}
                >
                  <span className="pk-pi">⚙️</span>
                  <span>Account Settings</span>
                </button>

                <button
                  type="button"
                  className="pk-profile-item"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveModal('addressBook');
                  }}
                >
                  <span className="pk-pi">📍</span>
                  <span>Address Book</span>
                </button>

                <button
                  type="button"
                  className="pk-profile-item"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveModal('payments');
                  }}
                >
                  <span className="pk-pi">💳</span>
                  <span>My Payments</span>
                </button>

                <button
                  type="button"
                  className="pk-profile-item"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveModal('refunds');
                  }}
                >
                  <span className="pk-pi">↩️</span>
                  <span>My Refunds</span>
                </button>

                <button
                  type="button"
                  className="pk-profile-item"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveModal('history');
                  }}
                >
                  <span className="pk-pi">🕘</span>
                  <span>My History</span>
                </button>

                <button
                  type="button"
                  className="pk-profile-item"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveModal('support');
                  }}
                >
                  <span className="pk-pi">❓</span>
                  <span>Help &amp; Support</span>
                </button>
              </div>

              <div className="pk-profile-divider" />

              <div className="pk-profile-section">
                <button
                  type="button"
                  className="pk-profile-item pk-profile-logout"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate('/auth');
                  }}
                >
                  <span className="pk-pi">↪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE INTERACTIVE MODALS */}
      {activeModal && (
        <div className="pk-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="pk-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* 1. ADDRESS BOOK MODAL */}
            {activeModal === 'addressBook' && (
              <>
                <div className="pk-modal-head">
                  <div>
                    <h3><span>📍</span> Address Book</h3>
                    <p>Manage your current residence, office, and delivery addresses</p>
                  </div>
                  <button
                    type="button"
                    className="pk-modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="pk-modal-body">
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ background: '#fff', border: '1.5px solid #1f4d3f', borderRadius: '14px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ color: '#1f4d3f', fontSize: '13px' }}>🏠 Current Rental (Primary)</b>
                        <span style={{ background: '#e0ece6', color: '#1f4d3f', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                          ACTIVE LEASE
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#141414', lineHeight: 1.5 }}>
                        Flat 4B, Greenwood Heights, Salt Lake Sector V, Kolkata - 700091
                      </p>
                      <small style={{ color: '#5b5547', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                        Locked location &amp; landlord contact verified via PointKey.
                      </small>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '14px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ color: '#141414', fontSize: '13px' }}>💼 Workplace / Office</b>
                        <span style={{ background: '#f6efdf', color: '#5b5547', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                          WORK
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#141414', lineHeight: 1.5 }}>
                        Candor TechSpace, Tower 2, Action Area 1, New Town, Kolkata - 700156
                      </p>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '14px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ color: '#141414', fontSize: '13px' }}>🏡 Permanent Home Address</b>
                        <span style={{ background: '#f6efdf', color: '#5b5547', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                          PERMANENT
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#141414', lineHeight: 1.5 }}>
                        45 Lake View Road, Ballygunge, South Kolkata - 700029
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pk-modal-footer">
                  <button
                    type="button"
                    className="pk-modal-secondary-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="pk-modal-primary-btn"
                    onClick={() => alert('New address saved to your PointKey profile!')}
                  >
                    + Add New Address
                  </button>
                </div>
              </>
            )}

            {/* 2. MY PAYMENTS MODAL */}
            {activeModal === 'payments' && (
              <>
                <div className="pk-modal-head">
                  <div>
                    <h3><span>💳</span> My Payments</h3>
                    <p>Rent transactions, security deposit escrow &amp; receipts</p>
                  </div>
                  <button
                    type="button"
                    className="pk-modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="pk-modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #ebe1c9', borderRadius: '14px', padding: '12px' }}>
                      <span style={{ fontSize: '10px', color: '#5b5547', fontWeight: 700, textTransform: 'uppercase' }}>Next Rent Due</span>
                      <strong style={{ display: 'block', fontSize: '18px', color: '#1f4d3f', marginTop: '4px' }}>₹8,500</strong>
                      <small style={{ fontSize: '10px', color: '#b8560a' }}>Due on Dec 01, 2026</small>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #ebe1c9', borderRadius: '14px', padding: '12px' }}>
                      <span style={{ fontSize: '10px', color: '#5b5547', fontWeight: 700, textTransform: 'uppercase' }}>Escrow Deposit</span>
                      <strong style={{ display: 'block', fontSize: '18px', color: '#1f4d3f', marginTop: '4px' }}>₹17,000</strong>
                      <small style={{ fontSize: '10px', color: '#1f4d3f' }}>🔒 100% Protected</small>
                    </div>
                  </div>

                  <b style={{ display: 'block', fontSize: '12px', color: '#5b5547', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Recent Transactions
                  </b>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <b style={{ fontSize: '13px', color: '#141414', display: 'block' }}>Monthly Rent — Nov 2026</b>
                        <small style={{ fontSize: '11px', color: '#5b5547' }}>Paid via UPI (Ref #PK99182) • 01 Nov 2026</small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#1f4d3f' }}>₹8,500</span>
                        <span style={{ display: 'block', fontSize: '10px', color: '#1f4d3f', fontWeight: 700 }}>PAID ✅</span>
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <b style={{ fontSize: '13px', color: '#141414', display: 'block' }}>Monthly Rent — Oct 2026</b>
                        <small style={{ fontSize: '11px', color: '#5b5547' }}>Paid via NetBanking • 01 Oct 2026</small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#1f4d3f' }}>₹8,500</span>
                        <span style={{ display: 'block', fontSize: '10px', color: '#1f4d3f', fontWeight: 700 }}>PAID ✅</span>
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <b style={{ fontSize: '13px', color: '#141414', display: 'block' }}>Security Deposit (Escrow)</b>
                        <small style={{ fontSize: '11px', color: '#5b5547' }}>Held safely by PointKey Guarantee • 15 Sep 2026</small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#1f4d3f' }}>₹17,000</span>
                        <span style={{ display: 'block', fontSize: '10px', color: '#1f4d3f', fontWeight: 700 }}>ESCROW 🔒</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pk-modal-footer">
                  <button
                    type="button"
                    className="pk-modal-secondary-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="pk-modal-primary-btn"
                    onClick={() => alert('Receipt downloaded successfully!')}
                  >
                    📄 Download Statement
                  </button>
                </div>
              </>
            )}

            {/* 3. MY REFUNDS MODAL */}
            {activeModal === 'refunds' && (
              <>
                <div className="pk-modal-head">
                  <div>
                    <h3><span>↩️</span> My Refunds</h3>
                    <p>100% Refund Protection tracker &amp; token deposits</p>
                  </div>
                  <button
                    type="button"
                    className="pk-modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="pk-modal-body">
                  <div style={{ background: '#e0ece6', border: '1.5px solid #1f4d3f', borderRadius: '14px', padding: '14px 16px', marginBottom: '14px' }}>
                    <b style={{ color: '#1f4d3f', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🛡️ PointKey 100% Refund Guarantee
                    </b>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#1f4d3f', lineHeight: 1.5 }}>
                      If a property doesn't match its verified description or you cancel your visit reservation 24 hours prior, your token advance is 100% refunded to your source account immediately.
                    </p>
                  </div>

                  <b style={{ display: 'block', fontSize: '12px', color: '#5b5547', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Refund Activity
                  </b>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ fontSize: '13px', color: '#141414' }}>Token Refund — Visit Cancellation</b>
                        <span style={{ background: '#e0ece6', color: '#1f4d3f', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                          PROCESSED
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5b5547' }}>
                        Property: Salt Lake Sector II Studio • Ref: #PKREF-3901
                      </p>
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#5b5547' }}>Amount: <strong style={{ color: '#1f4d3f' }}>₹1,000</strong></span>
                        <span style={{ color: '#1f4d3f', fontWeight: 700 }}>Credited via UPI on 12 Nov 2026</span>
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>✨</span>
                      <b style={{ fontSize: '13px', color: '#141414' }}>No Pending Disputes or Claims</b>
                      <p style={{ fontSize: '11px', color: '#5b5547', margin: '4px 0 0' }}>
                        All previous token reservations and rent payments are in good standing.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pk-modal-footer">
                  <button
                    type="button"
                    className="pk-modal-secondary-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="pk-modal-primary-btn"
                    onClick={() => alert('Support ticket initiated for refund verification.')}
                  >
                    Request New Refund
                  </button>
                </div>
              </>
            )}

            {/* 4. MY HISTORY MODAL */}
            {activeModal === 'history' && (
              <>
                <div className="pk-modal-head">
                  <div>
                    <h3><span>🕘</span> My History</h3>
                    <p>Timeline of property visits, saved favorites &amp; interactions</p>
                  </div>
                  <button
                    type="button"
                    className="pk-modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="pk-modal-body">
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '12px 14px' }}>
                      <span style={{ fontSize: '10px', color: '#5b5547', fontWeight: 800 }}>YESTERDAY • 4:30 PM</span>
                      <b style={{ display: 'block', fontSize: '13px', color: '#141414', margin: '3px 0' }}>
                        Explored "Cozy Single Room in Salt Lake"
                      </b>
                      <p style={{ margin: 0, fontSize: '11px', color: '#5b5547' }}>
                        Unlocked contact details &amp; requested owner slot verification.
                      </p>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '12px 14px' }}>
                      <span style={{ fontSize: '10px', color: '#5b5547', fontWeight: 800 }}>18 NOV 2026</span>
                      <b style={{ display: 'block', fontSize: '13px', color: '#141414', margin: '3px 0' }}>
                        In-Person Property Visit Completed
                      </b>
                      <p style={{ margin: 0, fontSize: '11px', color: '#5b5547' }}>
                        Visited Furnished 2 BHK Flat for Family in Salt Lake. Status verified by owner.
                      </p>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '12px 14px' }}>
                      <span style={{ fontSize: '10px', color: '#5b5547', fontWeight: 800 }}>14 NOV 2026</span>
                      <b style={{ display: 'block', fontSize: '13px', color: '#141414', margin: '3px 0' }}>
                        PointKey HomeMate Consultation
                      </b>
                      <p style={{ margin: 0, fontSize: '11px', color: '#5b5547' }}>
                        Searched for 1 BHK flats in New Town IT corridor under ₹12,000 budget.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pk-modal-footer">
                  <button
                    type="button"
                    className="pk-modal-secondary-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="pk-modal-primary-btn"
                    onClick={() => {
                      setActiveModal(null);
                      navigate('/tenant/search');
                    }}
                  >
                    Explore More Homes
                  </button>
                </div>
              </>
            )}

            {/* 5. HELP & SUPPORT MODAL */}
            {activeModal === 'support' && (
              <>
                <div className="pk-modal-head">
                  <div>
                    <h3><span>❓</span> Help &amp; Support</h3>
                    <p>24/7 PointKey Assistance, FAQs &amp; Help Desk</p>
                  </div>
                  <button
                    type="button"
                    className="pk-modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="pk-modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <a
                      href="tel:18004197368"
                      style={{ textDecoration: 'none', background: '#fff', border: '1px solid #ebe1c9', borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}
                    >
                      <span style={{ fontSize: '18px' }}>📞</span>
                      <b style={{ fontSize: '12px', color: '#141414' }}>Call Helpline</b>
                      <small style={{ fontSize: '10px', color: '#1f4d3f' }}>1800-419-RENT (Toll Free)</small>
                    </a>
                    <a
                      href="https://wa.me/919830012345"
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: 'none', background: '#fff', border: '1px solid #ebe1c9', borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}
                    >
                      <span style={{ fontSize: '18px' }}>💬</span>
                      <b style={{ fontSize: '12px', color: '#141414' }}>WhatsApp Support</b>
                      <small style={{ fontSize: '10px', color: '#1f4d3f' }}>+91 98300 12345</small>
                    </a>
                  </div>

                  <b style={{ display: 'block', fontSize: '12px', color: '#5b5547', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Frequently Asked Questions
                  </b>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '12px' }}>
                      <b style={{ fontSize: '12.5px', color: '#141414', display: 'block' }}>
                        How does the 100% Refund Guarantee work?
                      </b>
                      <p style={{ fontSize: '11px', color: '#5b5547', margin: '4px 0 0', lineHeight: 1.5 }}>
                        Your token deposit is held safely in PointKey Escrow. If you visit and find the property does not match what was advertised, you can decline on the spot and receive a 100% instant refund.
                      </p>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '12px' }}>
                      <b style={{ fontSize: '12.5px', color: '#141414', display: 'block' }}>
                        How do I contact the property owner?
                      </b>
                      <p style={{ fontSize: '11px', color: '#5b5547', margin: '4px 0 0', lineHeight: 1.5 }}>
                        Owner details and exact address are unlocked as soon as you schedule a free visit or place a token reservation, ensuring privacy for both tenants and landlords.
                      </p>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ebe1c9', borderRadius: '12px', padding: '12px' }}>
                      <b style={{ fontSize: '12.5px', color: '#141414', display: 'block' }}>
                        Can I reschedule my visit?
                      </b>
                      <p style={{ fontSize: '11px', color: '#5b5547', margin: '4px 0 0', lineHeight: 1.5 }}>
                        Yes! Open your visit booking from the history tab and click "Reschedule Slot" at any time prior to 2 hours of the appointment.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pk-modal-footer">
                  <button
                    type="button"
                    className="pk-modal-secondary-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="pk-modal-primary-btn"
                    onClick={() => alert('Support ticket raised. An agent will contact you within 15 minutes.')}
                  >
                    Raise Support Ticket
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
