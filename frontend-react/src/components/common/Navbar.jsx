import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import PostPropertyModal from '../modals/PostPropertyModal';
import ServiceDrawer from '../modals/ServiceDrawer';

function getRecentLocationsStorageKey(currentUser) {
  const uid = currentUser?.id || (currentUser?.email ? currentUser.email.toLowerCase().trim() : null);
  return uid ? `prent_recent_locations_${uid}` : 'prent_recent_locations_guest';
}

export default function Navbar({
  onSelectLocation,
  onOpenServices,
  onOpenExpenses,
  activePillar = 'SearchKart',
  onSwitchPillar,
}) {
  const { user, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Location selector state
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocationName, setSelectedLocationName] = useState(() => {
    try {
      return localStorage.getItem('prent_selected_location') || 'Kolkata';
    } catch {
      return 'Kolkata';
    }
  });
  const [isLocating, setIsLocating] = useState(false);

  // Modals & Drawers state
  const [showPostPropertyModal, setShowPostPropertyModal] = useState(false);
  const [showServiceDrawer, setShowServiceDrawer] = useState(false);
  const [serviceCartCount, setServiceCartCount] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('prent_service_cart') || '{}');
      return Object.values(cart).reduce((a, b) => a + Number(b || 0), 0);
    } catch {
      return 0;
    }
  });

  // Dropdowns & Menu state
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'addressBook' | 'payments' | 'refunds' | 'history' | 'support'

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync service bag count on custom event or storage change
  useEffect(() => {
    const handleCartSync = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('prent_service_cart') || '{}');
        setServiceCartCount(Object.values(cart).reduce((a, b) => a + Number(b || 0), 0));
      } catch {}
    };
    window.addEventListener('prent_cart_updated', handleCartSync);
    window.addEventListener('storage', handleCartSync);
    return () => {
      window.removeEventListener('prent_cart_updated', handleCartSync);
      window.removeEventListener('storage', handleCartSync);
    };
  }, []);

  const locationRef = useRef(null);
  const notifyRef = useRef(null);
  const profileRef = useRef(null);

  // Load notifications from API / socket
  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem('prent_token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications');
      if (res.data?.success && Array.isArray(res.data.notifications)) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || res.data.notifications.filter((n) => !n.is_read).length);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadNotifications();
    const socket = getSocket();
    if (!socket) return;
    const handleNewNotif = () => loadNotifications();
    socket.on('notification', handleNewNotif);
    socket.on('account_status_changed', handleNewNotif);
    return () => {
      socket.off('notification', handleNewNotif);
      socket.off('account_status_changed', handleNewNotif);
    };
  }, [loadNotifications]);

  // Click outside listener for popovers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setNotifyOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle location selection
  const handleSelectLocation = (loc) => {
    setSelectedLocationName(loc);
    try {
      localStorage.setItem('prent_selected_location', loc);
      const key = getRecentLocationsStorageKey(user);
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!saved.includes(loc) && loc !== 'All Locations') {
        saved.unshift(loc);
        localStorage.setItem(key, JSON.stringify(saved.slice(0, 6)));
      }
    } catch {}
    if (onSelectLocation) onSelectLocation(loc);
    setLocationOpen(false);
  };

  // Detect GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      handleSelectLocation('Kolkata');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
        )
          .then((r) => r.json())
          .then((data) => {
            const loc = data.locality || data.city || 'Kolkata';
            handleSelectLocation(loc);
          })
          .catch(() => handleSelectLocation('Kolkata'));
      },
      () => {
        setIsLocating(false);
        handleSelectLocation('Kolkata');
      },
      { timeout: 6000 }
    );
  };

  const initialLetter = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <>
      <style>{`
        .pk-header-root {
          position: sticky;
          top: 0;
          z-index: 40;
          background: #0b2545;
          color: #ffffff;
          border-bottom: 1px solid #153858;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
        }

        .pk-header-inner {
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
          padding: 0 16px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (min-width: 1024px) {
          .pk-header-inner {
            display: grid;
            grid-template-columns: auto 1fr auto;
            height: 74px;
            padding: 0 24px;
          }
        }

        /* BRAND */
        .pk-brand-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #ffffff;
          user-select: none;
        }

        .pk-brand-logo-box {
          height: 42px;
          padding: 3px 8px;
          border-radius: 12px;
          background: #f8f5ed;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }

        .pk-brand-name {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #ffffff;
        }

        .pk-brand-name span {
          color: #FF9A1F;
        }

        /* ICON BUTTONS */
        .pk-nav-icon-btn {
          position: relative;
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #153858;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 16px;
          cursor: pointer;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }

        .pk-nav-icon-btn:hover {
          background: #21496e;
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .pk-nav-dot {
          position: absolute;
          right: -4px;
          top: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9999px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0b2545;
        }

        /* POPOVERS */
        .pk-nav-popover {
          position: absolute;
          top: calc(100% + 10px);
          z-index: 80;
          background: #ffffff;
          color: #0b2545;
          border: 1px solid #e8e0d3;
          border-radius: 18px;
          box-shadow: 0 18px 48px rgba(2, 18, 36, 0.22);
          overflow: hidden;
          animation: popFade 0.18s ease-out;
        }

        .pk-location-popover {
          left: 0;
          width: min(340px, calc(100vw - 24px));
        }

        @keyframes popFade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* PRIMARY MEGA NAVIGATION */
        .pk-mega-nav {
          display: none;
        }

        @media (min-width: 1024px) {
          .pk-mega-nav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            height: 100%;
            font-size: 14px;
            font-weight: 700;
            white-space: nowrap;
          }
        }

        .nav-group {
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
        }

        .nav-trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          color: #e2e8f0;
          background: transparent;
          border: none;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .nav-trigger:hover,
        .nav-group:hover .nav-trigger {
          color: #FF9A1F;
          background: rgba(255, 255, 255, 0.06);
        }

        .nav-trigger .chevron {
          font-size: 9px;
          transition: transform 0.2s ease;
        }

        .nav-group:hover .nav-trigger .chevron {
          transform: rotate(180deg);
        }

        .nav-mega {
          display: none;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: calc(100% - 2px);
          background: #ffffff;
          color: #0b2545;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
          border: 1px solid #e8e0d3;
          padding: 24px 28px;
          white-space: normal;
          z-index: 90;
        }

        .nav-group:hover .nav-mega {
          display: block;
        }

        .nav-mega-title {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #64748b;
          margin-bottom: 12px;
        }

        .nav-mega-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }

        .nav-mega-btn {
          display: block;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          padding: 4px 0;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .nav-mega-btn:hover {
          color: #ea580c;
        }

        /* RIGHT ACTIONS */
        .pk-right-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .pk-post-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FF9A1F;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 9px 16px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(255, 154, 31, 0.35);
          transition: all 0.18s ease;
          white-space: nowrap;
        }

        .pk-post-btn:hover {
          background: #ea580c;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.45);
        }

        .pk-post-free-badge {
          background: #1f4d3f;
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .pk-login-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: #0b2545;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.18s ease;
          white-space: nowrap;
        }

        .pk-login-btn:hover {
          background: #f6efdf;
          color: #1f4d3f;
          transform: translateY(-1px);
        }

        .pk-profile-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #6b7f3a;
          border: 2px solid rgba(255, 255, 255, 0.85);
          color: #ffffff;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
        }

        /* MOBILE MENU DRAWER */
        .pk-mobile-drawer {
          position: fixed;
          top: 68px;
          left: 0;
          right: 0;
          background: #0f1e33;
          border-bottom: 1px solid rgba(255,255,255,0.15);
          padding: 16px;
          z-index: 50;
          box-shadow: 0 16px 32px rgba(0,0,0,0.3);
          display: grid;
          gap: 8px;
        }

        .pk-hamburger-btn {
          display: inline-flex;
        }

        @media (min-width: 1024px) {
          .pk-hamburger-btn,
          .pk-mobile-drawer {
            display: none !important;
          }
        }

        .pk-mobile-nav-link {
          padding: 10px 14px;
          border-radius: 10px;
          color: #ffffff;
          background: rgba(255,255,255,0.06);
          font-size: 13.5px;
          font-weight: 700;
          border: none;
          text-align: left;
          cursor: pointer;
        }

        .pk-mobile-nav-link:hover {
          background: rgba(255,255,255,0.12);
          color: #FF9A1F;
        }

        /* MODAL OVERLAY STYLES */
        .pk-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 90;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .pk-modal-card {
          background: #fffaf0;
          border: 1px solid #d8cba9;
          border-radius: 24px;
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
          padding: 24px;
          position: relative;
        }

        .pk-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #e8e0d3;
          padding-bottom: 14px;
          margin-bottom: 16px;
        }

        .pk-modal-head h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          color: #17324D;
        }

        .pk-modal-head p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .pk-modal-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f6efdf;
          border: none;
          color: #17324D;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <header className="pk-header-root">
        <div className="pk-header-inner">
          {/* Left: Brand Logo & Location Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                if (onSelectLocation) onSelectLocation('All');
                onSwitchPillar?.('SearchKart');
                navigate('/');
              }}
              className="pk-brand-link"
            >
              <div className="pk-brand-logo-box">
                <img
                  src="/assets/images/pointkey-brand-logo.png"
                  alt="PointKey"
                  style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <span className="pk-brand-name">
                Point<span>Key</span>
              </span>
            </a>

            {/* Interactive Location Selector Pin Button */}
            <div style={{ position: 'relative' }} ref={locationRef}>
              <button
                type="button"
                onClick={() => setLocationOpen(!locationOpen)}
                className="pk-nav-icon-btn"
                title={`Location: ${selectedLocationName}`}
                aria-label="Choose location"
              >
                <span style={{ color: '#FF9A1F', fontSize: '16px' }}>📍</span>
              </button>

              {locationOpen && (
                <div className="pk-nav-popover pk-location-popover">
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #e8e0d3' }}>
                    <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 900, color: '#0b2545' }}>
                      Choose your location
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      Find rental homes around your preferred area.
                    </p>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'grid', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: '#0b2545',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ color: '#FF9A1F' }}>🎯</span>
                      <span>{isLocating ? 'Detecting GPS...' : 'Use my current location'}</span>
                    </button>

                    <div>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#475569',
                          marginBottom: '6px',
                        }}
                      >
                        Enter location manually
                      </span>
                      <input
                        type="search"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (locationQuery.trim()) {
                              handleSelectLocation(locationQuery.trim());
                            }
                          }
                        }}
                        placeholder="Search area, city or locality"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: '1px solid #d8cba9',
                          background: '#ffffff',
                          fontSize: '13px',
                          color: '#0b2545',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[
                        'Rajpur Sonarpur',
                        'Jadavpur',
                        'Garia',
                        'Salt Lake',
                        'New Town',
                        'Kolkata',
                        'Tollygunge',
                        'Ballygunge',
                        'Behala',
                      ].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => handleSelectLocation(loc)}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '8px',
                            background: '#f6efdf',
                            color: '#0b2545',
                            border: '1px solid #ebe1c9',
                            cursor: 'pointer',
                          }}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (locationQuery.trim()) {
                          handleSelectLocation(locationQuery.trim());
                        }
                      }}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        background: '#FF9A1F',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Apply location
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectLocation('All Locations')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      Clear location filter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Mega Navigation Menus */}
          <nav className="pk-mega-nav" aria-label="Primary navigation">
            {/* 1. For Tenants */}
            <div className="nav-group">
              <button
                type="button"
                className="nav-trigger"
                onClick={() => {
                  onSwitchPillar?.('SearchKart');
                  navigate('/');
                }}
              >
                <span>For Tenants</span>
                <span className="chevron">▼</span>
              </button>
              <div className="nav-mega" style={{ width: '560px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                  <div>
                    <p className="nav-mega-title">Find a Home</p>
                    <ul className="nav-mega-list">
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onSwitchPillar?.('SearchKart');
                            navigate('/tenant/search?type=flat');
                          }}
                        >
                          Flats for Rent
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onSwitchPillar?.('SearchKart');
                            navigate('/tenant/search?type=pg');
                          }}
                        >
                          PG &amp; Rooms
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onSwitchPillar?.('SearchKart');
                            navigate('/tenant/search?type=room');
                          }}
                        >
                          Bachelor-Friendly Homes
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="nav-mega-title">Popular Areas</p>
                    <ul className="nav-mega-list">
                      {['Rajpur Sonarpur', 'Jadavpur', 'Garia', 'Salt Lake', 'New Town'].map((loc) => (
                        <li key={loc}>
                          <button
                            type="button"
                            className="nav-mega-btn"
                            onClick={() => {
                              handleSelectLocation(loc);
                              onSwitchPillar?.('SearchKart');
                            }}
                          >
                            {loc}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. For Owners/Builders */}
            <div className="nav-group">
              <button
                type="button"
                className="nav-trigger"
                onClick={() => navigate(user?.role === 'OWNER' ? '/owner' : '/owner')}
              >
                <span>For Owners/Builders</span>
                <span className="chevron">▼</span>
              </button>
              <div className="nav-mega" style={{ width: '560px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                  <div>
                    <p className="nav-mega-title">Owners</p>
                    <ul className="nav-mega-list">
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setShowPostPropertyModal(true)}
                        >
                          Post Property FREE
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => navigate('/owner')}
                        >
                          Direct Owner Listings
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenServices?.();
                            onSwitchPillar?.('FacilityKart');
                          }}
                        >
                          Home Care for Your Property
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="nav-mega-title">Builders</p>
                    <ul className="nav-mega-list">
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setShowPostPropertyModal(true)}
                        >
                          New Projects &amp; Society Units
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setShowPostPropertyModal(true)}
                        >
                          Bulk Unit Onboarding
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => navigate('/owner')}
                        >
                          Verified Buyer/Tenant Leads
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. For Facilities */}
            <div className="nav-group">
              <button
                type="button"
                className="nav-trigger"
                onClick={() => {
                  onOpenServices?.();
                  onSwitchPillar?.('FacilityKart');
                }}
              >
                <span>For Facilities</span>
                <span className="chevron">▼</span>
              </button>
              <div className="nav-mega" style={{ width: '800px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                  <div>
                    <p className="nav-mega-title">Daily Essentials</p>
                    <ul className="nav-mega-list">
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setShowServiceDrawer(true)}
                        >
                          WaterJar &amp; GasGo
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setShowServiceDrawer(true)}
                        >
                          Tiffin &amp; Grocery Delivery
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setShowServiceDrawer(true)}
                        >
                          Laundry &amp; Ironing
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="nav-mega-title">Home &amp; Moving</p>
                    <ul className="nav-mega-list">
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setShowServiceDrawer(true)}
                        >
                          Cleaning, Cook &amp; Repairs
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setShowServiceDrawer(true)}
                        >
                          MiniMove &amp; Setup
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenServices?.();
                            onSwitchPillar?.('FacilityKart');
                          }}
                        >
                          FlatMate &amp; Lifestyle
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="nav-mega-title">More Facilities</p>
                    <ul className="nav-mega-list">
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenServices?.();
                            onSwitchPillar?.('FacilityKart');
                          }}
                        >
                          All Facilities
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenServices?.();
                            onSwitchPillar?.('FacilityKart');
                          }}
                        >
                          Home Services
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenServices?.();
                            onSwitchPillar?.('FacilityKart');
                          }}
                        >
                          Delivery Services
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. For Locker */}
            <div className="nav-group">
              <button
                type="button"
                className="nav-trigger"
                onClick={() => {
                  onOpenExpenses?.();
                  onSwitchPillar?.('BudgetKart');
                }}
              >
                <span>For Locker</span>
                <span className="chevron">▼</span>
              </button>
              <div className="nav-mega" style={{ width: '800px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                  <div>
                    <p className="nav-mega-title">PickBills</p>
                    <ul className="nav-mega-list">
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenExpenses?.();
                            onSwitchPillar?.('BudgetKart');
                          }}
                        >
                          Rent bills
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenExpenses?.();
                            onSwitchPillar?.('BudgetKart');
                          }}
                        >
                          Electricity &amp; water bills
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenExpenses?.();
                            onSwitchPillar?.('BudgetKart');
                          }}
                        >
                          Service bills
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="nav-mega-title">DocStore</p>
                    <ul className="nav-mega-list">
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setActiveModal('addressBook')}
                        >
                          Rent agreements
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setActiveModal('payments')}
                        >
                          Receipts
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setActiveModal('addressBook')}
                        >
                          Identity papers
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="nav-mega-title">Accounting</p>
                    <ul className="nav-mega-list">
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenExpenses?.();
                            onSwitchPillar?.('BudgetKart');
                          }}
                        >
                          Monthly expenses
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => {
                            onOpenExpenses?.();
                            onSwitchPillar?.('BudgetKart');
                          }}
                        >
                          Paid &amp; due amounts
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="nav-mega-btn"
                          onClick={() => setActiveModal('history')}
                        >
                          Month-wise history
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Right: Post Property, Cart, Notifications & Profile/Login */}
          <div className="pk-right-actions">
            {/* Post Property Button */}
            <button
              type="button"
              onClick={() => setShowPostPropertyModal(true)}
              className="pk-post-btn"
            >
              <span>＋</span>
              <span>Post Property</span>
              <span className="pk-post-free-badge">FREE</span>
            </button>

            {/* Service Cart / Bag */}
            <button
              type="button"
              onClick={() => setShowServiceDrawer(true)}
              className="pk-nav-icon-btn"
              title="Everyday Service Bag"
              aria-label="Everyday Service Bag"
            >
              <span>🛒</span>
              {serviceCartCount > 0 && <span className="pk-nav-dot">{serviceCartCount}</span>}
            </button>

            {/* Notifications */}
            {user && (
              <div style={{ position: 'relative' }} ref={notifyRef}>
                <button
                  type="button"
                  onClick={() => setNotifyOpen(!notifyOpen)}
                  className="pk-nav-icon-btn"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <span>🔔</span>
                  {unreadCount > 0 && <span className="pk-nav-dot">{unreadCount}</span>}
                </button>

                {notifyOpen && (
                  <div
                    className="pk-nav-popover"
                    style={{ right: 0, width: 'min(320px, calc(100vw - 24px))' }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e8e0d3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <b style={{ fontSize: '13px', color: '#0b2545' }}>Notifications</b>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {notifications.length} updates
                      </span>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                      {notifications.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '16px 0' }}>
                          🔔 No new updates
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              background: n.is_read ? 'transparent' : '#f8fafc',
                              borderBottom: '1px solid #f1f5f9',
                            }}
                          >
                            <b style={{ fontSize: '12px', color: '#0b2545', display: 'block' }}>
                              {n.title}
                            </b>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#475569' }}>
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Login or User Profile */}
            {user ? (
              <div style={{ position: 'relative' }} ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="pk-profile-avatar"
                  title="Open profile"
                >
                  <span>{initialLetter}</span>
                </button>

                {profileOpen && (
                  <div
                    className="pk-nav-popover"
                    style={{ right: 0, width: '240px', padding: '8px' }}
                  >
                    <div
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #e8e0d3',
                        marginBottom: '6px',
                      }}
                    >
                      <b style={{ fontSize: '13px', color: '#0b2545', display: 'block' }}>
                        {user.name || 'User'}
                      </b>
                      <small style={{ color: '#64748b', fontSize: '11px' }}>
                        {user.role || 'TENANT'} • {user.email || user.phone}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="nav-mega-btn"
                      style={{ padding: '8px 12px', borderRadius: '8px' }}
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/tenant/profile');
                      }}
                    >
                      ⚙️ Account Settings
                    </button>
                    <button
                      type="button"
                      className="nav-mega-btn"
                      style={{ padding: '8px 12px', borderRadius: '8px' }}
                      onClick={() => {
                        setProfileOpen(false);
                        setActiveModal('addressBook');
                      }}
                    >
                      📍 Address Book
                    </button>
                    <button
                      type="button"
                      className="nav-mega-btn"
                      style={{ padding: '8px 12px', borderRadius: '8px' }}
                      onClick={() => {
                        setProfileOpen(false);
                        setActiveModal('payments');
                      }}
                    >
                      💳 My Payments
                    </button>
                    <button
                      type="button"
                      className="nav-mega-btn"
                      style={{ padding: '8px 12px', borderRadius: '8px' }}
                      onClick={() => {
                        setProfileOpen(false);
                        setActiveModal('history');
                      }}
                    >
                      🕘 Rental History
                    </button>
                    <button
                      type="button"
                      className="nav-mega-btn"
                      style={{ padding: '8px 12px', borderRadius: '8px' }}
                      onClick={() => {
                        setProfileOpen(false);
                        setActiveModal('support');
                      }}
                    >
                      ❓ Help &amp; Support
                    </button>

                    <div style={{ height: '1px', background: '#e8e0d3', margin: '6px 0' }} />

                    <button
                      type="button"
                      className="nav-mega-btn"
                      style={{ padding: '8px 12px', borderRadius: '8px', color: '#dc2626' }}
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        navigate('/');
                      }}
                    >
                      ↪ Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal?.('login', 'tenant')}
                className="pk-login-btn"
                title="Log in or Sign up"
              >
                <span style={{ color: '#FF9A1F', fontSize: '14px' }}>👤</span>
                <span>Login</span>
              </button>
            )}

            {/* Mobile Menu Hamburger (Hidden on Desktop) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="pk-nav-icon-btn pk-hamburger-btn lg:hidden"
              aria-label="Toggle menu"
            >
              <span>{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="pk-mobile-drawer">
            <button
              type="button"
              className="pk-mobile-nav-link"
              onClick={() => {
                setMobileMenuOpen(false);
                onSwitchPillar?.('SearchKart');
                navigate('/');
              }}
            >
              🏠 For Tenants
            </button>
            <button
              type="button"
              className="pk-mobile-nav-link"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/owner');
              }}
            >
              🏢 For Owners / Builders
            </button>
            <button
              type="button"
              className="pk-mobile-nav-link"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenServices?.();
                onSwitchPillar?.('FacilityKart');
              }}
            >
              🛠️ For Facilities
            </button>
            <button
              type="button"
              className="pk-mobile-nav-link"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenExpenses?.();
                onSwitchPillar?.('BudgetKart');
              }}
            >
              💼 For Locker
            </button>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowServiceDrawer(true);
                }}
                className="pk-post-btn"
                style={{ justifyContent: 'center', background: '#153858' }}
              >
                <span>🛒 Cart ({serviceCartCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (user) {
                    navigate('/tenant/profile');
                  } else {
                    openAuthModal?.('login', 'tenant');
                  }
                }}
                className="pk-post-btn"
                style={{ justifyContent: 'center' }}
              >
                <span>{user ? '👤 Profile' : '👤 Login'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* POST PROPERTY MODAL */}
      <PostPropertyModal
        isOpen={showPostPropertyModal}
        onClose={() => setShowPostPropertyModal(false)}
        onSuccess={() => setShowPostPropertyModal(false)}
      />

      {/* SERVICE CART DRAWER */}
      <ServiceDrawer
        isOpen={showServiceDrawer}
        onClose={() => setShowServiceDrawer(false)}
        onCartCountChange={setServiceCartCount}
      />

      {/* PROFILE DASHBOARD MODALS */}
      {activeModal && (
        <div className="pk-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="pk-modal-card" onClick={(e) => e.stopPropagation()}>
            {activeModal === 'addressBook' && (
              <>
                <div className="pk-modal-head">
                  <div>
                    <h3>📍 Address Book &amp; Agreements</h3>
                    <p>Manage your verified residence, office and identity documents</p>
                  </div>
                  <button
                    type="button"
                    className="pk-modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div
                    style={{
                      background: '#fff',
                      border: '1.5px solid #1f4d3f',
                      borderRadius: '14px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b style={{ color: '#1f4d3f', fontSize: '13px' }}>🏠 Current Rental (Primary)</b>
                      <span
                        style={{
                          background: '#e0ece6',
                          color: '#1f4d3f',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        ACTIVE LEASE
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#141414', lineHeight: 1.5 }}>
                      Flat 4B, Greenwood Heights, Salt Lake Sector V, Kolkata - 700091
                    </p>
                    <small style={{ color: '#5b5547', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      Verified via PointKey Digital Lease Vault.
                    </small>
                  </div>

                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid #ebe1c9',
                      borderRadius: '14px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b style={{ color: '#141414', fontSize: '13px' }}>💼 Workplace / Office</b>
                      <span
                        style={{
                          background: '#f6efdf',
                          color: '#5b5547',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        WORK
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#141414', lineHeight: 1.5 }}>
                      Candor TechSpace, Tower 2, Action Area 1, New Town, Kolkata - 700156
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeModal === 'payments' && (
              <>
                <div className="pk-modal-head">
                  <div>
                    <h3>💳 Payment &amp; Escrow Receipts</h3>
                    <p>Transparent rent settlements and security deposits</p>
                  </div>
                  <button
                    type="button"
                    className="pk-modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid #ebe1c9',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <b style={{ fontSize: '13px', color: '#141414', display: 'block' }}>
                        November Rent Payment
                      </b>
                      <small style={{ color: '#64748b', fontSize: '11px' }}>
                        TXN: PK-202611-9821 • Paid via UPI
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <b style={{ fontSize: '14px', color: '#1f4d3f', display: 'block' }}>₹9,500</b>
                      <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 800 }}>SETTLED</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeModal === 'history' && (
              <>
                <div className="pk-modal-head">
                  <div>
                    <h3>🕘 Rental History &amp; Milestones</h3>
                    <p>Review completed leases and visit schedule logs</p>
                  </div>
                  <button
                    type="button"
                    className="pk-modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: '12.5px' }}>
                  <p>✨ Current lease is active with 100% on-time payment track record.</p>
                </div>
              </>
            )}

            {activeModal === 'support' && (
              <>
                <div className="pk-modal-head">
                  <div>
                    <h3>❓ Help &amp; Support</h3>
                    <p>24/7 PointKey Resident Care Desk</p>
                  </div>
                  <button
                    type="button"
                    className="pk-modal-close-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                  <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #ebe1c9' }}>
                    <b>📞 Resident Helpline:</b> +91 98765 43210 (Mon - Sun, 8 AM - 10 PM)
                  </div>
                  <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #ebe1c9' }}>
                    <b>💬 Live NestAI Assistant:</b> Click the chat bubble at the bottom right.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
