import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import HomeMateChatbot from '../../components/ai/HomeMateChatbot';
import { SAMPLE_PROPERTIES } from '../../data/sampleProperties';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function generateDynamicCityProperties(city) {
  if (!city || city === 'All Cities' || city === 'All') return [];
  const cleanCity = city.split(',')[0].trim();

  return [
    {
      id: `prop-${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1`,
      title: `2 BHK Premium Apartment in ${cleanCity}`,
      location: `${cleanCity} Central, ${cleanCity}`,
      city: cleanCity,
      type: 'Flat',
      subtype: '2 BHK',
      price: 9500,
      bathroom: 'Private',
      kitchen: 'Need',
      tenant: 'Family',
      furnishing: 'Semi-furnished',
      food: 'Not included',
      distance: 0.6,
      stay: 6,
      roomSize: '780 sq ft',
      deposit: 19000,
      contract: 'Minimum 6 months',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=90',
      keywords: `${cleanCity.toLowerCase()} flat 2 bhk verified family central apartment`,
      verified: true,
      availability: 'Available now',
      electric: 'Standard unit billing',
      water: '24/7 Supply',
      furniture: 'Wardrobe, Modular kitchen cabinets, Lights, Fans',
      roommate: 'Private occupancy',
      nearby: [
        ['🏥', `${cleanCity} Hospital`, '0.6 km', 'Medical and emergency care'],
        ['🛒', `${cleanCity} Daily Market`, '0.3 km', 'Fresh groceries & essentials'],
        ['🚌', `${cleanCity} Transit Stop`, '0.4 km', 'Local commute']
      ],
      transport: [
        ['🛺', 'Toto / Auto', 'Every 2 mins'],
        ['🚌', 'Bus', 'District bus services']
      ]
    },
    {
      id: `prop-${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '-')}-2`,
      title: `Furnished Single Room near ${cleanCity} Station`,
      location: `Station Road, ${cleanCity}`,
      city: cleanCity,
      type: 'Room',
      subtype: 'Single private room',
      price: 5500,
      bathroom: 'Attached',
      kitchen: 'Need',
      tenant: 'Working',
      furnishing: 'Furnished',
      food: 'Not included',
      distance: 0.3,
      stay: 3,
      roomSize: '320 sq ft',
      deposit: 11000,
      contract: 'Minimum 3 months',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=90',
      keywords: `${cleanCity.toLowerCase()} room single private working station furnished`,
      verified: true,
      availability: 'Available now',
      electric: 'Submeter basis',
      water: 'Running water',
      furniture: 'Single bed, Study desk, Chair, Ceiling fan',
      roommate: 'Single bachelor',
      nearby: [
        ['🚉', `${cleanCity} Railway Station`, '0.3 km', 'Train connections'],
        ['🛒', `${cleanCity} Station Market`, '0.2 km', 'Food & snacks']
      ],
      transport: [
        ['🛵', 'Toto / Rickshaw', 'Right outside lane']
      ]
    },
    {
      id: `prop-${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '-')}-3`,
      title: `Co-living PG & Mess in ${cleanCity} College Area`,
      location: `College Road, ${cleanCity}`,
      city: cleanCity,
      type: 'PG',
      subtype: 'Co-living Shared Room',
      price: 4500,
      bathroom: 'Attached',
      kitchen: "Don't need",
      tenant: 'Student',
      furnishing: 'Furnished',
      food: 'Included',
      distance: 0.5,
      stay: 1,
      roomSize: '280 sq ft',
      deposit: 9000,
      contract: 'Minimum 1 month',
      image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=90',
      keywords: `${cleanCity.toLowerCase()} pg student meals included food college mess`,
      verified: true,
      availability: 'Immediate move-in',
      electric: 'Included',
      water: '24/7 Filtered drinking water',
      furniture: 'Bunk/Single bed, Individual locker, Study table',
      roommate: '2 students',
      nearby: [
        ['🎓', `${cleanCity} College`, '0.4 km', 'Higher education campus'],
        ['📚', 'Library & Book Stores', '0.2 km', 'Study essentials']
      ],
      transport: [
        ['🚶', 'Walking Distance', 'Direct to college & bus stand']
      ]
    },
    {
      id: `prop-${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '-')}-4`,
      title: `Spacious 3 BHK Family Flat in ${cleanCity}`,
      location: `Main Town, ${cleanCity}`,
      city: cleanCity,
      type: 'Flat',
      subtype: '3 BHK',
      price: 14500,
      bathroom: '2 Attached',
      kitchen: 'Need',
      tenant: 'Family',
      furnishing: 'Furnished',
      food: 'Not included',
      distance: 1.0,
      stay: 12,
      roomSize: '1200 sq ft',
      deposit: 29000,
      contract: 'Minimum 11 months',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90',
      keywords: `${cleanCity.toLowerCase()} flat 3 bhk family residential spacious main town`,
      verified: true,
      availability: 'Available soon',
      electric: 'Direct meter',
      water: '24 hrs deep boring supply',
      furniture: 'Complete sofa set, Dining table, 2 Double beds, Wardrobes',
      roommate: 'Private family residence',
      nearby: [
        ['🏦', 'Nationalized Bank & ATM', '0.3 km', 'Banking services'],
        ['🏫', 'Reputed High School', '0.8 km', 'School bus stoppage']
      ],
      transport: [
        ['🚗', 'Car Parking Included', 'Secure covered ground floor slot']
      ]
    },
    {
      id: `prop-${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '-')}-5`,
      title: `1 BHK Independent Residence in ${cleanCity}`,
      location: `Civil Lines, ${cleanCity}`,
      city: cleanCity,
      type: 'Flat',
      subtype: '1 BHK',
      price: 7200,
      bathroom: 'Private',
      kitchen: 'Need',
      tenant: 'Any',
      furnishing: 'Semi-furnished',
      food: 'Not included',
      distance: 0.8,
      stay: 6,
      roomSize: '460 sq ft',
      deposit: 14400,
      contract: 'Minimum 6 months',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90',
      keywords: `${cleanCity.toLowerCase()} flat 1 bhk independent peaceful civil lines`,
      verified: true,
      availability: 'Available now',
      electric: 'Individual meter',
      water: 'Corporation/Deep well supply',
      furniture: 'Bed, Curtains, Geyser, Kitchen shelves',
      roommate: 'Independent occupancy',
      nearby: [
        ['🌳', 'Town Park & Playground', '0.2 km', 'Walking & recreation'],
        ['🛒', 'Supermarket', '0.5 km', 'All brands available']
      ],
      transport: [
        ['🛺', 'Auto Rickshaw Stand', '0.2 km']
      ]
    },
    {
      id: `prop-${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '-')}-6`,
      title: `Budget Bachelor Room in ${cleanCity} Bus Stand Area`,
      location: `Bus Terminus Road, ${cleanCity}`,
      city: cleanCity,
      type: 'Room',
      subtype: 'Single Room',
      price: 3900,
      bathroom: 'Common',
      kitchen: "Don't need",
      tenant: 'Working',
      furnishing: 'Semi-furnished',
      food: 'Not included',
      distance: 0.2,
      stay: 2,
      roomSize: '220 sq ft',
      deposit: 7800,
      contract: 'Minimum 2 months',
      image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=90',
      keywords: `${cleanCity.toLowerCase()} room budget bachelor bus terminus`,
      verified: true,
      availability: 'Available now',
      electric: '₹7 per unit',
      water: 'Constant supply',
      furniture: 'Single cot, Mattress, Fan, Light',
      roommate: 'Single working executive',
      nearby: [
        ['🚌', `${cleanCity} Central Bus Stand`, '0.2 km', 'State & private buses'],
        ['☕', 'Tea stalls & Dhabas', '0.1 km', 'Affordable dining']
      ],
      transport: [
        ['🚌', 'Buses', 'Connects everywhere']
      ]
    }
  ];
}

const HERO_SLIDES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=85',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=85',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2000&q=85',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=2000&q=85',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2000&q=85',
];

const FAQS = [
  {
    q: 'How much security deposit is usually required when renting a Flat, Room, or PG?',
    a: "Security deposits depend on the property type and city. Managed PGs and shared rooms typically require 1 month's rent, while independent flats usually range from 1 to 3 months' rent. You can track your deposit milestone directly inside BudgetKart.",
  },
  {
    q: 'Are the rental listings on PointKey verified and free of hidden brokerage?',
    a: 'Yes. Listings marked with the Verified badge go through property & owner checks, and eligible zero-brokerage homes clearly display their terms upfront so you never face surprise middleman fees.',
  },
  {
    q: 'What is a lock-in period and notice period in a standard rental agreement?',
    a: 'A lock-in period is the initial minimum stay during which neither party can terminate early without terms applying, while the notice period (commonly 30 days) is the advance window required before moving out. Always confirm both before signing.',
  },
  {
    q: 'Which bills are typically extra over the monthly base rent?',
    a: 'In unfurnished or semi-furnished flats, electricity, water/society maintenance, broadband/Wi-Fi, and gas are often billed separately or split among flatmates. All-inclusive PGs bundle meals, Wi-Fi, and housekeeping into a single monthly plan.',
  },
  {
    q: 'How can I get HRA rent receipts and split flatmate expenses easily?',
    a: 'Switch to BudgetKart anytime to log monthly rent and utilities, view roommate split balances, and download monthly rent receipts for your House Rent Allowance (HRA) records.',
  },
  {
    q: 'What should I check before moving in or shifting my belongings?',
    a: 'Record initial electricity and water meter readings, click timestamped photos of walls, appliances, and fixtures, and book HouseKeeping or HomeService via FacilityKart if anything needs a quick fix before move-in.',
  },
];

export default function TenantHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuspended = user?.account_status === 'SUSPENDED';
  const isBlocked = user?.account_status === 'BLOCKED';
  const isRestricted = isSuspended || isBlocked;

  // Active platform pillar: 'SearchKart' | 'FacilityKart' | 'BudgetKart'
  const [activePillar, setActivePillar] = useState('SearchKart');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All' | 'Flats' | 'Rooms' | 'PG'
  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const saved = localStorage.getItem('prent_selected_location');
      if (saved) return saved;
      return 'Kolkata';
    } catch {
      return 'Kolkata';
    }
  });
  const [sortOption, setSortOption] = useState('featured');
  const [isSearchSticky, setIsSearchSticky] = useState(false);

  // Hero Reel Motion state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reelPlaying, setReelPlaying] = useState(true);

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('prent_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Services & Expenses state
  const [selectedService, setSelectedService] = useState('DoorDrop');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

  // BudgetKart state - initially empty, loaded from localStorage
  const [expenseLedger, setExpenseLedger] = useState(() => {
    try {
      const saved = localStorage.getItem('prent_tracked_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamically calculate monthlyTrackedExpense based on user's added entries
  const monthlyTrackedExpense = expenseLedger.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const monthlyBudgetLimit = 22000;
  const [quickLabel, setQuickLabel] = useState('');
  const [quickAmount, setQuickAmount] = useState('');

  // FAQ state: set of open FAQ indices
  const [openFaqs, setOpenFaqs] = useState(new Set([0]));

  // Properties from DB + fallback to sample properties
  const [properties, setProperties] = useState(() =>
    SAMPLE_PROPERTIES.map((p) => ({
      ...p,
      city: p.city || 'Kolkata',
    }))
  );

  // Toast trigger helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 3200);
  };

  // Handle blocked / suspended user attempt on services and features
  const handleRestrictedAction = (actionName = 'This service') => {
    if (isBlocked) {
      showToast(`⛔ Account Blocked (Strike 2): ${actionName} is permanently disabled due to repeated rule violations.`);
      return true;
    }
    if (isSuspended) {
      showToast(`⚠️ Account Suspended (Strike 1): ${actionName} is disabled. Open the NestAI chatbot to submit an unblock appeal.`);
      return true;
    }
    return false;
  };

  // Sync favorites across tabs and window
  useEffect(() => {
    const syncFavs = () => {
      try {
        setFavorites(JSON.parse(localStorage.getItem('prent_favorites') || '[]'));
      } catch {
        setFavorites([]);
      }
    };
    window.addEventListener('prent_fav_change', syncFavs);
    window.addEventListener('storage', syncFavs);
    return () => {
      window.removeEventListener('prent_fav_change', syncFavs);
      window.removeEventListener('storage', syncFavs);
    };
  }, []);

  // Listen for real-time account status changes (Admin Strike 1 / Strike 2 or Reinstatement)
  useEffect(() => {
    const handleStatusSync = (e) => {
      const data = e.detail;
      if (data?.account_status === 'BLOCKED') {
        showToast('⛔ Alert: Your account has been permanently blocked by Admin (Strike 2). Platform access is restricted.');
      } else if (data?.account_status === 'SUSPENDED') {
        showToast('⚠️ Alert: Your account has been suspended by Admin (Strike 1). View Details & Payments are disabled. Check notifications.');
      } else if (data?.account_status === 'ACTIVE') {
        showToast('✅ Great news! Your PointKey account access has been fully restored.');
      }
    };
    window.addEventListener('prent_user_status_changed', handleStatusSync);
    return () => window.removeEventListener('prent_user_status_changed', handleStatusSync);
  }, []);

  // Listen to window scroll to stick search bar when past hero (OYO style)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 360) {
        setIsSearchSticky(true);
      } else {
        setIsSearchSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch live properties from backend
  useEffect(() => {
    let cancelled = false;
    api
      .get('/properties/search?limit=100')
      .then(({ data }) => {
        if (!cancelled && data?.results?.length > 0) {
          const backendMapped = data.results.map((p) => ({
            id: String(p.id),
            title: p.title,
            location: p.locality || p.city || 'Kolkata',
            city: p.city || 'Kolkata',
            type: p.category === 'FLAT' ? 'Flat' : p.category === 'PG' ? 'PG' : 'Room',
            subtype: p.sub_type || p.room_type || p.category,
            price: Number(p.rent_amount || p.monthly_rent || p.price) || 9500,
            bathroom: p.bathroom_type || 'Common',
            kitchen: p.kitchen_available ? 'Need' : "Don't need",
            tenant: p.allowed_tenant_type || p.allowed_tenants || 'Any',
            furnishing: p.furnishing || 'Furnished',
            food: p.food_included ? 'Included' : 'Not included',
            image:
              p.cover_url ||
              p.photos?.[0] ||
              p.image ||
              'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90',
            verified: true,
          }));
          const sampleMapped = SAMPLE_PROPERTIES.map((p) => ({
            ...p,
            city: p.city || 'Kolkata',
          }));
          setProperties([...backendMapped, ...sampleMapped]);
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hero Video Reel continuous autoplay slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Toggle favorite property
  const toggleFavorite = (e, prop) => {
    e.stopPropagation();
    const id = prop.id;
    const exists = favorites.some((f) => (typeof f === 'object' ? f.id : f) === id);
    let updated;
    if (exists) {
      updated = favorites.filter((f) => (typeof f === 'object' ? f.id : f) !== id);
      showToast(`Removed "${prop.title || 'Property'}" from Saved Favourites`);
    } else {
      const favObj = {
        id: prop.id,
        title: prop.title || 'Verified Property',
        location: prop.location || prop.locality || 'Kolkata',
        rent: prop.price || prop.monthly_rent || 0,
        image:
          prop.image ||
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90',
      };
      updated = [...favorites, favObj];
      showToast(`Saved "${prop.title || 'Property'}" to Favourites!`);
    }
    setFavorites(updated);
    localStorage.setItem('prent_favorites', JSON.stringify(updated));
    window.dispatchEvent(new Event('prent_fav_change'));
  };

  // Combined property pool: dynamic verified properties for selected city + backend properties + sample properties
  const allProperties = useMemo(() => {
    const dynamicProps = selectedCity && selectedCity !== 'All Cities' && selectedCity !== 'All'
      ? generateDynamicCityProperties(selectedCity)
      : [];
    return [...dynamicProps, ...properties];
  }, [selectedCity, properties]);

  // Filter properties
  const filteredListings = allProperties.filter((prop) => {
    // City filter
    if (selectedCity && selectedCity !== 'All Cities' && selectedCity !== 'All') {
      const cityLower = selectedCity.toLowerCase().trim();
      const pCity = (prop.city || 'Kolkata').toLowerCase();
      const pLoc = (prop.location || '').toLowerCase();
      const pKeywords = (prop.keywords || '').toLowerCase();
      const pTitle = (prop.title || '').toLowerCase();

      // If selectedCity is 'Purba Medinipur' or contains 'medinipur'
      const isMedinipurQuery = cityLower.includes('medinipur') || cityLower.includes('midnapore');
      const isMedinipurLocality = [
        'tamluk', 'haldia', 'digha', 'contai', 'kolaghat', 'mecheda', 'mahishadal', 'panskura', 'medinipur', 'midnapore'
      ].some((area) => pLoc.includes(area) || pTitle.includes(area) || pKeywords.includes(area));

      // If selectedCity is 'Kolkata', all properties in Kolkata localities match
      const isKolkataQuery = cityLower === 'kolkata';
      const isKolkataLocality = [
        'salt lake',
        'new town',
        'garia',
        'ballygunge',
        'jadavpur',
        'behala',
        'park street',
        'howrah',
        'dum dum',
        'tollygunge',
        'kasba',
        'rajarhat',
        'kolkata',
      ].some((area) => pLoc.includes(area) || pTitle.includes(area) || pKeywords.includes(area));

      const matchesCity =
        (isMedinipurQuery && (pCity.includes('medinipur') || isMedinipurLocality || pKeywords.includes('medinipur'))) ||
        (isKolkataQuery && (pCity.includes('kolkata') || isKolkataLocality || pKeywords.includes('kolkata'))) ||
        pCity.includes(cityLower) ||
        cityLower.includes(pCity) ||
        pLoc.includes(cityLower) ||
        cityLower.includes(pLoc) ||
        pTitle.includes(cityLower) ||
        pKeywords.includes(cityLower);

      if (!matchesCity) return false;
    }

    // Category filter
    if (selectedCategory !== 'All') {
      const pType = (prop.type || '').toLowerCase();
      if (selectedCategory === 'Flats' && !pType.includes('flat')) return false;
      if (selectedCategory === 'Rooms' && !pType.includes('room')) return false;
      if (selectedCategory === 'PG' && !pType.includes('pg') && !pType.includes('co-living') && !pType.includes('shared'))
        return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        prop.title?.toLowerCase().includes(q) ||
        prop.location?.toLowerCase().includes(q) ||
        prop.type?.toLowerCase().includes(q) ||
        prop.subtype?.toLowerCase().includes(q) ||
        prop.keywords?.toLowerCase().includes(q) ||
        prop.city?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Sort properties
  const sortedListings = [...filteredListings].sort((a, b) => {
    const priceA = Number(a.price || a.monthly_rent || 0);
    const priceB = Number(b.price || b.monthly_rent || 0);
    if (sortOption === 'priceLow') return priceA - priceB;
    if (sortOption === 'priceHigh') return priceB - priceA;
    return 0; // featured default
  });

  // Fallback to top verified homes if no direct match found (never show 0 homes initially)
  const hasDirectMatches = sortedListings.length > 0;
  const displayListings = hasDirectMatches ? sortedListings : allProperties.slice(0, 12);

  // Track clicked properties into recently viewed
  // সাসপেন্ডেড (Strike 1) বা পার্মানেন্ট ব্লকড (Strike 2) হলে ডিটেইলস এক্সেস ব্লক করা হয়
  const handleCardClick = (prop) => {
    if (handleRestrictedAction('View Details')) return;
    try {
      const recents = JSON.parse(localStorage.getItem('prent_recent_homes') || '[]');
      const filtered = recents.filter((r) => r.id !== prop.id);
      localStorage.setItem('prent_recent_homes', JSON.stringify([prop, ...filtered].slice(0, 8)));
    } catch { }
    navigate(`/tenant/property/${prop.id}`);
  };

  // Scroll smoothly to listings
  const scrollToListings = () => {
    setActivePillar('SearchKart');
    const el = document.getElementById('searchkart-listings-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCity('Kolkata');
    setSortOption('featured');
    setActivePillar('SearchKart');
  };

  // Handle Quick Expense addition in BudgetKart
  const handleQuickAddExpense = (e) => {
    e.preventDefault();
    if (handleRestrictedAction('Expense tracking')) return;
    const amt = Number(quickAmount);
    if (!quickLabel.trim() || isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid expense name and amount.');
      return;
    }
    const newEntry = {
      id: Date.now(),
      label: quickLabel.trim(),
      category: 'Living',
      amount: amt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    };
    const updated = [newEntry, ...expenseLedger];
    setExpenseLedger(updated);
    try {
      localStorage.setItem('prent_tracked_expenses', JSON.stringify(updated));
    } catch { }
    setQuickLabel('');
    setQuickAmount('');
    showToast(`Added expense "₹${amt.toLocaleString('en-IN')}" for ${quickLabel.trim()}!`);
  };

  // Remove single tracked expense
  const handleRemoveExpense = (id) => {
    if (handleRestrictedAction('Modifying tracked expenses')) return;
    const target = expenseLedger.find((item) => item.id === id);
    const updated = expenseLedger.filter((item) => item.id !== id);
    setExpenseLedger(updated);
    try {
      localStorage.setItem('prent_tracked_expenses', JSON.stringify(updated));
    } catch { }
    showToast(`Removed "${target?.label || 'Item'}" from tracked expenses.`);
  };

  // Toggle single FAQ
  const toggleFaq = (idx) => {
    const next = new Set(openFaqs);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setOpenFaqs(next);
  };

  // Expand or collapse all FAQs
  const setAllFaqs = (expand) => {
    if (expand) setOpenFaqs(new Set(FAQS.map((_, i) => i)));
    else setOpenFaqs(new Set());
  };

  const isFilterActive = searchQuery.trim() !== '' || selectedCategory !== 'All';

  return (
    <div className="pointkey-tenant-home-wrapper">
      <style>{`
        .pointkey-tenant-home-wrapper {
          min-height: 100vh;
          background-color: #F5F0E6;
          color: #111827;
          font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
          overflow-x: hidden;
        }

        /* HERO BACKGROUND IMAGE SLIDESHOW (7 IMAGES, LOOPS FOREVER) */
        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: #EAF1F8;
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transform: scale(1.02);
          filter: brightness(1.07) saturate(1.1) contrast(1.02);
          animation: heroFade 42s infinite;
          will-change: opacity, transform;
        }

        .hero-slide:nth-child(1) { animation-delay: -1.8s; background-position: 14% center; }
        .hero-slide:nth-child(2) { animation-delay: 4.2s; background-position: 30% center; }
        .hero-slide:nth-child(3) { animation-delay: 10.2s; }
        .hero-slide:nth-child(4) { animation-delay: 16.2s; }
        .hero-slide:nth-child(5) { animation-delay: 22.2s; background-position: 78% center; }
        .hero-slide:nth-child(6) { animation-delay: 28.2s; }
        .hero-slide:nth-child(7) { animation-delay: 34.2s; }

        @keyframes heroFade {
          0%   { opacity: 0; transform: scale(1.02); }
          4%   { opacity: 1; }
          15%  { opacity: 1; }
          19%  { opacity: 0; transform: scale(1.09); }
          100% { opacity: 0; transform: scale(1.09); }
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(180deg, rgba(12,72,132,.62) 0%, rgba(12,72,132,.48) 48%, rgba(12,72,132,.24) 78%, rgba(246,241,231,.78) 100%);
        }

        .hero-text-shadow {
          text-shadow: 0 3px 18px rgba(0,12,35,.95), 0 1px 4px rgba(0,12,35,.9);
        }

        .hero-word {
          display: inline-block;
          color: #FF9A1F;
          text-shadow: 0 1px 0 #c96a00, 0 2px 0 #b35e00, 0 4px 10px rgba(0,0,0,.6);
        }

        .pk-hero-content {
          position: relative;
          z-index: 10;
          max-width: 880px;
          margin: 0 auto;
          text-align: center;
        }

        .pk-hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 9999px;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-size: 13px;
          font-weight: 700;
          color: #fed7aa;
          letter-spacing: 0.04em;
          margin-bottom: 16px;
        }

        .pk-kicker-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #EA580C;
        }

        .pk-hero-title {
          font-size: clamp(32px, 5.5vw, 56px);
          font-weight: 900;
          line-height: 1.14;
          letter-spacing: -0.025em;
          color: #ffffff;
          margin: 0 0 16px;
          text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
        }

        .pk-hero-title span {
          color: #fb923c;
        }

        .pk-hero-subtitle {
          font-size: clamp(15px, 2vw, 18px);
          font-weight: 700;
          line-height: 1.6;
          max-width: 720px;
          margin: 0 auto 32px;
          color: #ffffff;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.95);
        }

        /* SEARCH BAR CARD */
        .pk-searchbar-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 8px 10px 8px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 740px;
          margin: 0 auto;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .pk-search-icon {
          color: #1E3A8A;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .pk-search-input {
          flex: 1;
          border: 0;
          outline: none;
          background: transparent;
          font-size: 15px;
          color: #111827;
          font-family: inherit;
        }

        .pk-search-input::placeholder {
          color: #9ca3af;
        }

        .pk-clear-btn {
          background: transparent;
          border: 0;
          color: #9ca3af;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .pk-clear-btn:hover {
          color: #111827;
        }

        .pk-search-submit {
          background: #14532D;
          color: #ffffff;
          border: 0;
          border-radius: 14px;
          padding: 13px 26px;
          font-weight: 800;
          font-size: 14.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.18s, transform 0.15s;
          white-space: nowrap;
        }

        .pk-search-submit:hover {
          background: #166534;
          transform: scale(1.02);
        }

        /* CATEGORY FILTER PILLS */
        .pk-cat-pills {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .pk-pill-btn {
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(17, 24, 39, 0.55);
          backdrop-filter: blur(8px);
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 700;
          padding: 9px 20px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pk-pill-btn:hover {
          border-color: #fb923c;
          background: rgba(17, 24, 39, 0.85);
          transform: translateY(-2px);
        }

        .pk-pill-btn.active {
          background: #1E3A8A;
          border-color: #EA580C;
          box-shadow: 0 4px 16px rgba(234, 88, 12, 0.35);
        }

        /* POPULAR LOCALITY QUICK-LINKS IN HERO (OYO STYLE - IMAGE 1) */
        .pk-hero-locations {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px 14px;
          margin-top: 18px;
          font-size: 13px;
        }

        .pk-loc-label {
          color: rgba(255, 255, 255, 0.72);
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .pk-loc-link {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 9999px;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          transition: all 0.15s ease;
        }

        .pk-loc-link:hover {
          background: rgba(255, 255, 255, 0.28);
          border-color: #fb923c;
          color: #fed7aa;
          transform: translateY(-1px);
        }

        /* STICKY SEARCH BAR ON SCROLL (OYO STYLE - FLOATING CENTERED PILL) */
        .pk-sticky-search-bar {
          position: fixed;
          top: 14px;
          left: 0;
          right: 0;
          z-index: 1100;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
          transform: translateY(-90px);
          opacity: 0;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
        }

        .pk-sticky-search-bar.is-sticky {
          transform: translateY(0);
          opacity: 1;
        }

        .pk-sticky-inner {
          pointer-events: auto;
          width: min(840px, calc(100vw - 48px));
          margin: 0 auto;
          background: #ffffff;
          border-radius: 9999px;
          padding: 6px 8px 6px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 14px 40px rgba(15, 23, 42, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1.5px solid #d8cba9;
        }

        .pk-sticky-icon {
          color: #1E3A8A;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .pk-sticky-input {
          flex: 1;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 14.5px;
          font-weight: 500;
          color: #111827;
          font-family: inherit;
          min-width: 0;
        }

        .pk-sticky-input::placeholder {
          color: #6b7280;
          font-weight: 400;
        }

        .pk-sticky-clear-btn {
          background: #f6efdf;
          border: 0;
          color: #5b5547;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 11px;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }

        .pk-sticky-clear-btn:hover {
          background: #eedfc7;
          color: #141414;
        }

        .pk-sticky-cat-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .pk-sticky-pill {
          padding: 7px 13px;
          border-radius: 9999px;
          font-size: 12.5px;
          font-weight: 700;
          border: 1px solid #d8cba9;
          background: #faf7f0;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .pk-sticky-pill:hover {
          background: #f6efdf;
          color: #141414;
        }

        .pk-sticky-pill.active {
          background: #1E3A8A;
          color: #ffffff;
          border-color: #1E3A8A;
          box-shadow: 0 2px 8px rgba(30, 58, 138, 0.25);
        }

        .pk-sticky-submit-btn {
          background: #14532D;
          color: #ffffff;
          border: 0;
          border-radius: 9999px;
          padding: 10px 22px;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s, transform 0.15s;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(20, 83, 45, 0.35);
        }

        .pk-sticky-submit-btn:hover {
          background: #166534;
          transform: translateY(-1px);
        }

        /* =====================================================================
         * MOBILE PILLAR SWITCHER BAR (<860px)
         * মোবাইলে হেডারের সেন্টার বারটি লুকিয়ে যায়, তাই মোবাইলের জন্য হিরো সেকশনের নিচে
         * এই স্টিকি পিলার বারটি (SearchKart | FacilityKart | BudgetKart) দেওয়া হয়েছে
         * যাতে ব্যবহারকারী মোবাইল থেকে এক ক্লিকেই তিন স্তম্ভে যেতে পারেন।
         * ===================================================================== */
        .pk-mobile-pillar-bar {
          display: none;
        }

        @media (max-width: 860px) {
          .pk-sticky-cat-pills {
            display: none;
          }
          .pk-mobile-pillar-bar {
            display: flex;
            align-items: center;
            justify-content: space-around;
            background: #ffffff;
            border-bottom: 1px solid #ebe1c9;
            padding: 8px 10px;
            gap: 6px;
            position: sticky;
            top: 60px;
            z-index: 90;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }
          .pk-mob-tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 10px;
            border-radius: 12px;
            border: 1px solid #ebe1c9;
            background: #faf7f0;
            color: #4b5563;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .pk-mob-tab.active {
            background: #1E3A8A;
            color: #ffffff;
            border-color: #1E3A8A;
            box-shadow: 0 3px 10px rgba(30, 58, 138, 0.25);
          }
        }

        /* মোবাইল স্ক্রিনের জন্য হিরো ও ফিল্টার ক্যারোসেল অপ্টিমাইজেশন */
        @media (max-width: 768px) {
          .pk-hero-root {
            min-height: 440px !important;
            padding: 76px 14px 40px !important;
          }
          .pk-hero-title {
            font-size: clamp(24px, 6.8vw, 34px) !important;
            line-height: 1.2 !important;
            margin-bottom: 12px !important;
          }
          .pk-hero-subtitle {
            font-size: 14.5px !important;
            font-weight: 700 !important;
            line-height: 1.5 !important;
            margin-bottom: 22px !important;
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.95) !important;
          }
          .pk-searchbar-card {
            padding: 6px 6px 6px 14px !important;
            border-radius: 16px !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .pk-search-input {
            font-size: 16px !important;
          }
          .pk-search-submit {
            padding: 10px 16px !important;
            font-size: 13px !important;
            border-radius: 12px !important;
          }
          .pk-cat-pills {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            justify-content: flex-start !important;
            padding: 4px 4px 8px !important;
            margin-top: 16px !important;
            width: 100% !important;
          }
          .pk-cat-pills::-webkit-scrollbar {
            display: none !important;
          }
          .pk-pill-btn {
            flex-shrink: 0 !important;
            padding: 7px 14px !important;
            font-size: 12.5px !important;
          }
          .pk-hero-locations {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            justify-content: flex-start !important;
            padding: 2px 4px !important;
            gap: 6px !important;
          }
          .pk-hero-locations::-webkit-scrollbar {
            display: none !important;
          }
          .pk-loc-link {
            flex-shrink: 0 !important;
            font-size: 11.5px !important;
            padding: 3px 10px !important;
          }
          .pk-reel-controls {
            bottom: 12px !important;
            left: 14px !important;
          }
        }

        @media (max-width: 600px) {
          .pk-sticky-inner {
            width: calc(100vw - 20px);
            padding: 6px 8px 6px 14px;
          }
          .pk-sticky-submit-btn {
            padding: 8px 14px;
            font-size: 12.5px;
          }
        }

        @media (max-width: 640px) {
          .pk-main-content {
            padding: 20px 12px 100px !important;
          }
          .pk-section-head {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .pk-section-title {
            font-size: 22px !important;
          }
          .pk-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .pk-card-image-wrap {
            height: 180px !important;
          }
          .pk-facility-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .pk-facility-card {
            padding: 16px !important;
          }
          .pk-budget-showcase-shell {
            padding: 20px 16px !important;
            border-radius: 18px !important;
          }
          .pk-budget-dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .pk-budget-summary-box {
            padding: 18px 16px !important;
          }
          .pk-budget-ledger-box {
            padding: 18px 16px !important;
          }
          .pk-quick-add-form {
            grid-template-columns: 1fr !important;
          }
          .pk-footer-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .pk-footer-root {
            padding: 36px 16px 100px !important;
          }
        }

        /* REEL PLAY / PAUSE CONTROLS AT BOTTOM-LEFT */
        .pk-reel-controls {
          position: absolute;
          bottom: 20px;
          left: 24px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pk-reel-toggle {
          background: rgba(17, 24, 39, 0.65);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          padding: 7px 14px;
          border-radius: 9999px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: border-color 0.15s;
        }

        .pk-reel-toggle:hover {
          border-color: #fb923c;
        }

        .pk-reel-dots {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(17, 24, 39, 0.65);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 7px 12px;
          border-radius: 9999px;
        }

        .pk-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pk-dot.active {
          width: 20px;
          border-radius: 9999px;
          background: #EA580C;
        }

        /* MAIN WRAPPER */
        .pk-main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 44px 24px 80px;
        }

        /* SECTION HEADER */
        .pk-section-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .pk-tag-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .pk-tag-blue {
          background: #1E3A8A;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .pk-tag-orange {
          background: #EA580C;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .pk-tag-green {
          background: #14532D;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .pk-section-title {
          font-size: 28px;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.02em;
          margin: 0 0 4px;
        }

        .pk-section-desc {
          font-size: 13.5px;
          color: #4b5563;
          margin: 0;
        }

        .pk-sort-select {
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          cursor: pointer;
          outline: none;
        }

        .pk-view-all-btn {
          background: transparent;
          border: 0;
          color: #1E3A8A;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s;
        }

        .pk-view-all-btn:hover {
          color: #EA580C;
        }

        /* LISTINGS GRID & CARDS */
        .pk-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 24px;
        }

        .pk-listing-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease, border-color 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .pk-listing-card:hover {
          transform: translateY(-4px);
          border-color: #1E3A8A;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
        }

        .pk-card-image-wrap {
          position: relative;
          height: 200px;
          background: #f3f4f6;
          overflow: hidden;
        }

        .pk-card-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .pk-listing-card:hover .pk-card-image-wrap img {
          transform: scale(1.04);
        }

        .pk-card-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          gap: 6px;
          z-index: 2;
        }

        .pk-badge-verified {
          background: #14532D;
          color: #ffffff;
          font-size: 10.5px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        .pk-badge-category {
          background: #1E3A8A;
          color: #ffffff;
          font-size: 10.5px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        .pk-card-heart-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 2;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          border: 0;
          display: grid;
          place-items: center;
          font-size: 16px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pk-card-heart-btn:hover {
          background: #ffffff;
          transform: scale(1.1);
        }

        .pk-card-heart-btn.is-fav {
          color: #EA580C;
          font-weight: 900;
        }

        .pk-card-bottom-tag {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(17, 24, 39, 0.75);
          backdrop-filter: blur(6px);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .pk-card-details {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .pk-card-price-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .pk-price-val {
          font-size: 20px;
          font-weight: 900;
          color: #111827;
        }

        .pk-price-unit {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          margin-left: 2px;
        }

        .pk-location-tag {
          font-size: 11.5px;
          font-weight: 700;
          color: #14532D;
          background: #dcfce7;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .pk-card-prop-title {
          font-size: 15px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pk-card-address {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pk-card-specs {
          font-size: 11.5px;
          color: #4b5563;
          margin: 0 0 14px;
          font-weight: 600;
        }

        .pk-view-details-btn {
          margin-top: auto;
          width: 100%;
          background: #EA580C;
          color: #ffffff;
          border: 0;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.15s, transform 0.15s;
        }

        .pk-view-details-btn:hover {
          background: #c2410c;
          transform: scale(1.01);
        }

        .pk-view-details-btn.is-suspended {
          background: #d97706 !important;
          color: #ffffff !important;
          cursor: not-allowed !important;
          opacity: 0.9 !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .pk-view-details-btn.is-blocked {
          background: #dc2626 !important;
          color: #ffffff !important;
          cursor: not-allowed !important;
          opacity: 0.9 !important;
          transform: none !important;
          box-shadow: none !important;
        }

        /* FACILITYKART SERVICE TILES */
        .pk-service-tiles-shell {
          margin-top: 56px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 28px;
          padding: 28px 32px;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
        }

        .pk-service-strip-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .pk-service-tiles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 16px;
        }

        .pk-service-tile {
          background: #FAF8F4;
          border: 1.5px solid #EBE3D3;
          border-radius: 20px;
          padding: 18px 14px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pk-service-tile:hover {
          background: #ffffff;
          border-color: #EA580C;
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
        }

        .pk-service-tile.highlighted {
          background: #ffffff;
          border-color: #1E3A8A;
          box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.35), 0 12px 24px rgba(15, 23, 42, 0.1);
        }

        .pk-service-tile.is-disabled {
          opacity: 0.55 !important;
          cursor: not-allowed !important;
          filter: grayscale(0.65) !important;
        }

        .pk-service-tile.is-disabled:hover {
          background: #FAF8F4 !important;
          border-color: #EBE3D3 !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .pk-service-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }

        .pk-service-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 2px;
        }

        .pk-service-sub {
          font-size: 11px;
          color: #6b7280;
          font-weight: 600;
        }

        /* BUDGETKART SHOWCASE BANNER */
        .pk-budget-showcase-shell {
          margin-top: 48px;
          background: linear-gradient(135deg, #0F172A 0%, #1e293b 60%, #1E3A8A 100%);
          border-radius: 28px;
          color: #ffffff;
          padding: 36px 40px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 36px;
          align-items: center;
        }

        @media(max-width: 900px) {
          .pk-budget-showcase-shell {
            grid-template-columns: 1fr;
            padding: 28px 24px;
          }
        }

        .pk-showcase-bullets {
          list-style: none;
          padding: 0;
          margin: 20px 0 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pk-bullet-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13.5px;
          color: #e2e8f0;
        }

        .pk-bullet-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(234, 88, 12, 0.2);
          border: 1px solid rgba(234, 88, 12, 0.4);
          color: #fed7aa;
          display: grid;
          place-items: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .pk-open-budget-btn {
          background: #EA580C;
          color: #ffffff;
          border: 0;
          border-radius: 14px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s;
        }

        .pk-open-budget-btn:hover {
          background: #c2410c;
        }

        /* MONTHLY EXPENSE SNAPSHOT CARD */
        .pk-snapshot-card {
          background: rgba(2, 6, 23, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          border-radius: 22px;
          padding: 24px;
        }

        .pk-progress-bar-shell {
          width: 100%;
          height: 10px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.15);
          overflow: hidden;
          margin: 12px 0 16px;
        }

        .pk-progress-fill {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #14532D 0%, #10b981 50%, #EA580C 100%);
          transition: width 0.3s ease;
        }

        .pk-quick-expense-form {
          display: flex;
          gap: 8px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .pk-quick-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 10px;
          padding: 8px 12px;
          color: #ffffff;
          font-size: 12.5px;
          outline: none;
        }

        .pk-quick-input::placeholder {
          color: #94a3b8;
        }

        .pk-quick-add-btn {
          background: #14532D;
          color: #ffffff;
          border: 0;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .pk-quick-add-btn:hover {
          background: #166534;
        }

        /* FAQ ACCORDION SECTION */
        .pk-faq-shell {
          margin-top: 56px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 28px;
          padding: 32px;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
        }

        .pk-faq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 24px;
        }

        @media(max-width: 860px) {
          .pk-faq-grid {
            grid-template-columns: 1fr;
          }
        }

        .pk-faq-card {
          background: #FAF8F4;
          border: 1px solid #EBE3D3;
          border-radius: 18px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .pk-faq-btn {
          width: 100%;
          border: 0;
          background: transparent;
          text-align: left;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          color: #111827;
        }

        .pk-faq-chevron {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          display: grid;
          place-items: center;
          font-size: 11px;
          color: #1E3A8A;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .pk-faq-chevron.open {
          transform: rotate(180deg);
        }

        .pk-faq-answer {
          padding: 0 20px 16px;
          font-size: 13px;
          line-height: 1.6;
          color: #4b5563;
          border-top: 1px solid rgba(235, 227, 211, 0.8);
          padding-top: 12px;
        }

        /* PILLAR 2: FACILITYKART VIEW */
        .pk-facility-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }

        .pk-facility-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .pk-facility-card:hover {
          transform: translateY(-3px);
          border-color: #1E3A8A;
        }

        .pk-facility-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 24px;
          margin-bottom: 14px;
        }

        .pk-book-service-btn {
          margin-top: 20px;
          width: 100%;
          padding: 12px 18px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 800;
          color: #ffffff;
          border: 0;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .pk-book-service-btn:hover {
          opacity: 0.9;
        }

        /* PILLAR 3: BUDGETKART VIEW */
        .pk-budget-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          margin-top: 24px;
        }

        @media(max-width: 900px) {
          .pk-budget-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .pk-budget-summary-box {
          background: #0F172A;
          color: #ffffff;
          border-radius: 22px;
          padding: 26px;
        }

        .pk-budget-ledger-box {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          padding: 26px;
        }

        /* TOAST BANNER */
        .pk-toast-banner {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          background: #111827;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 9999px;
          font-size: 13.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: toastPop 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes toastPop {
          from { opacity: 0; transform: translate(-50%, 15px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* FOOTER */
        .pk-footer-root {
          background: #0F172A;
          color: #cbd5e1;
          border-top: 1px solid #1e293b;
          padding: 56px 24px 32px;
          margin-top: 60px;
        }

        .pk-footer-grid {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.2fr;
          gap: 40px;
          padding-bottom: 40px;
          border-bottom: 1px solid #1e293b;
        }

        @media(max-width: 900px) {
          .pk-footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media(max-width: 600px) {
          .pk-footer-grid {
            grid-template-columns: 1fr;
          }
        }

        .pk-footer-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #ffffff;
          margin-bottom: 16px;
        }

        .pk-footer-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pk-footer-list a, .pk-footer-list button {
          color: #94a3b8;
          text-decoration: none;
          font-size: 13px;
          background: transparent;
          border: 0;
          padding: 0;
          text-align: left;
          cursor: pointer;
          transition: color 0.15s;
        }

        .pk-footer-list a:hover, .pk-footer-list button:hover {
          color: #ffffff;
        }

        .pk-footer-bottom {
          max-width: 1400px;
          margin: 24px auto 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
          flex-wrap: wrap;
          gap: 12px;
        }
      `}</style>

      {/* TOP NAVIGATION BAR (STICKY, DARK NAVY DESIGN MATCHING REFERENCE VIDEO) */}
      <Navbar
        activePillar={activePillar}
        onSwitchPillar={(pillar) => setActivePillar(pillar)}
        onSelectLocation={(loc) => {
          setSelectedCity(loc);
          if (loc !== 'All Locations' && loc !== 'All Cities') {
            setSearchQuery(loc);
          } else {
            setSearchQuery('');
          }
          showToast(`Filtered listings in ${loc}`);
        }}
        onOpenServices={() => setActivePillar('FacilityKart')}
        onOpenExpenses={() => setActivePillar('BudgetKart')}
      />

      {/* POPULAR LOCATIONS BAR DIRECTLY UNDER NAVBAR */}
      <div className="relative z-30 bg-white border-b border-[#e8e0d3] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm">
          <span className="font-extrabold text-[#0b2545] mr-1 flex items-center gap-1.5">
            <span style={{ color: '#FF9A1F', fontSize: '14px' }}>📍</span>
            <span>Popular Locations:</span>
          </span>
          {['Rajpur Sonarpur', 'Jadavpur', 'Garia', 'Salt Lake', 'New Town'].map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setSelectedCity(loc);
                setSearchQuery(loc);
                showToast(`Filtered listings for ${loc}`);
                scrollToListings();
              }}
              className="px-3.5 py-1 rounded-full bg-[#f6f1e7] hover:bg-[#FF9A1F] hover:text-white text-[#0b2545] font-semibold border border-[#d8cba9] transition cursor-pointer"
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* STICKY SEARCH BAR ON SCROLL */}
      <div
        className={`pk-sticky-search-bar ${isSearchSticky ? 'is-sticky' : ''}`}
        aria-hidden={!isSearchSticky}
      >
        <div className="pk-sticky-inner">
          <span className="pk-sticky-icon">🔍</span>
          <input
            type="text"
            className="pk-sticky-input"
            placeholder="Search area, locality, landmark or property type (Flats, Rooms, PG)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && scrollToListings()}
          />
          {searchQuery && (
            <button
              type="button"
              className="pk-sticky-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear Search"
            >
              ✕
            </button>
          )}

          <div className="pk-sticky-cat-pills">
            {['All', 'Flats', 'Rooms', 'PG'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`pk-sticky-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  scrollToListings();
                }}
              >
                {cat === 'All' ? '✨ All' : cat === 'Flats' ? '🏢 Flats' : cat === 'Rooms' ? '🛋️ Rooms' : '🛏️ PG'}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="pk-sticky-submit-btn"
            onClick={scrollToListings}
          >
            <span>Search Homes</span>
            <span style={{ color: '#fed7aa' }}>→</span>
          </button>
        </div>
      </div>

      {/* ==================== 2. HERO SECTION WITH 7-IMAGE LOOPING SLIDESHOW ==================== */}
      <section id="top" className="relative overflow-hidden bg-[#0b2545] flex min-h-[540px] sm:min-h-[620px]">
        {/* Animated background slideshow (7 images, looping) */}
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/images/hero-slide-1.jpg')" }} />
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/images/hero-slide-2.jpg')" }} />
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/images/hero-slide-3.jpg')" }} />
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/images/hero-slide-4.jpg')" }} />
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/images/hero-slide-5.jpg')" }} />
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/images/hero-slide-6.jpg')" }} />
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/images/hero-slide-7.jpg')" }} />
        </div>
        <div className="hero-overlay" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col justify-center gap-6 sm:gap-7 min-h-[540px] sm:min-h-[620px] z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="hero-text-shadow text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Find Direct <span className="hero-word">Flats</span>, <span className="hero-word">PGs</span> &amp; <span className="hero-word">Rooms</span> — Zero Brokerage
            </h1>
            <p className="hero-text-shadow text-white/95 text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
              Settled in? Book doorstep home services too: 20L water jars, homemade tiffin, laundry pickup, room cleaning, electrician/plumber and Wi-Fi setup, all from one place.
            </p>
          </div>

          {/* Hero Search Box */}
          <div className="max-w-3xl w-full mx-auto bg-white rounded-2xl shadow-2xl border border-white/80 p-2.5 sm:p-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToListings()}
                  placeholder="Search area, locality, landmark or property (e.g. Salt Lake, Flats)..."
                  className="w-full bg-[#f6f1e7] border border-transparent rounded-xl pl-11 pr-3.5 py-3 sm:py-3.5 text-sm sm:text-base text-[#0b2545] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                />
              </div>
              <button
                type="button"
                onClick={scrollToListings}
                className="shrink-0 bg-[#FF9A1F] hover:bg-[#ea580c] text-white font-extrabold py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer text-sm sm:text-base"
              >
                <span>Search</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Quick Category Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 -mt-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                scrollToListings();
              }}
              className={`min-w-[96px] px-5 py-2.5 rounded-full font-extrabold text-sm border shadow-lg transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedCategory === 'All'
                  ? 'bg-[#FF9A1F] text-white border-[#FF9A1F]'
                  : 'bg-white/95 hover:bg-white text-[#0b2545] border-white'
              }`}
            >
              <span>✨ All</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Flats');
                scrollToListings();
              }}
              className={`min-w-[96px] px-5 py-2.5 rounded-full font-extrabold text-sm border shadow-lg transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedCategory === 'Flats'
                  ? 'bg-[#FF9A1F] text-white border-[#FF9A1F]'
                  : 'bg-white/95 hover:bg-white text-[#0b2545] border-white'
              }`}
            >
              <span className="text-[#ea580c]">🏢</span>
              <span>Flats</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('PG');
                scrollToListings();
              }}
              className={`min-w-[96px] px-5 py-2.5 rounded-full font-extrabold text-sm border shadow-lg transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedCategory === 'PG'
                  ? 'bg-[#FF9A1F] text-white border-[#FF9A1F]'
                  : 'bg-white/95 hover:bg-white text-[#0b2545] border-white'
              }`}
            >
              <span className="text-[#ea580c]">🛏️</span>
              <span>PGs</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Rooms');
                scrollToListings();
              }}
              className={`min-w-[96px] px-5 py-2.5 rounded-full font-extrabold text-sm border shadow-lg transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedCategory === 'Rooms'
                  ? 'bg-[#FF9A1F] text-white border-[#FF9A1F]'
                  : 'bg-white/95 hover:bg-white text-[#0b2545] border-white'
              }`}
            >
              <span className="text-[#ea580c]">🚪</span>
              <span>Rooms</span>
            </button>
          </div>
        </div>
      </section>

      {/* MOBILE PILLAR SWITCHER BAR (<860px) */}
      <div className="pk-mobile-pillar-bar">
        <button
          type="button"
          className={`pk-mob-tab ${activePillar === 'SearchKart' ? 'active' : ''}`}
          onClick={() => setActivePillar('SearchKart')}
        >
          <span style={{ fontSize: '13px' }}>🔍</span>
          <span>SearchKart</span>
        </button>
        <button
          type="button"
          className={`pk-mob-tab ${activePillar === 'FacilityKart' ? 'active' : ''}`}
          onClick={() => setActivePillar('FacilityKart')}
        >
          <span style={{ fontSize: '13px' }}>🛠️</span>
          <span>FacilityKart</span>
        </button>
        <button
          type="button"
          className={`pk-mob-tab ${activePillar === 'BudgetKart' ? 'active' : ''}`}
          onClick={() => setActivePillar('BudgetKart')}
        >
          <span style={{ fontSize: '13px' }}>💰</span>
          <span>BudgetKart</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="pk-main-content">
        {/* ========================================================================= */}
        {/* CRITICAL SUSPENSION & BLOCK BANNER (FOR SUSPENDED / BLOCKED TENANTS)      */}
        {/* ========================================================================= */}
        {user?.account_status === 'BLOCKED' && (
          <div
            style={{
              marginBottom: '20px',
              padding: '16px 20px',
              borderRadius: '16px',
              background: '#fef2f2',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)',
            }}
          >
            <span style={{ fontSize: '28px', lineHeight: 1 }}>⛔</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Strike 2 Penalty
                </span>
                <strong style={{ fontSize: '15px', color: '#991b1b' }}>Account Permanently Blocked by Admin</strong>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#7f1d1d', lineHeight: 1.5 }}>
                <strong>Reason:</strong> {user.block_reason || 'Repeated rule violations'}.
                Under PointKey zero-tolerance community safety policies, all access to view property details, in-person visits, and payments is permanently blocked. No appeals are permitted.
              </p>
            </div>
          </div>
        )}

        {user?.account_status === 'SUSPENDED' && (
          <div
            style={{
              marginBottom: '20px',
              padding: '16px 20px',
              borderRadius: '16px',
              background: '#fffbeb',
              border: '2px solid #f59e0b',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)',
            }}
          >
            <span style={{ fontSize: '28px', lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: '#d97706', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Strike 1 Penalty
                </span>
                <strong style={{ fontSize: '15px', color: '#92400e' }}>Account Suspended by Admin</strong>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#78350f', lineHeight: 1.5 }}>
                <strong>Reason:</strong> {user.block_reason || 'Platform rules and regulations violation'}.
                Your access to &apos;View Details&apos; and advance payments has been restricted by Admin.
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: '#1f4d3f', fontWeight: 700 }}>
                👉 Open the NestAI Assistant (bottom right) to review the platform rules undertaking and submit an unblock appeal.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PILLAR 1: SEARCHKART VIEW                                                 */}
        {/* ========================================================================= */}
        {activePillar === 'SearchKart' && (
          <div>
            {/* Header: SEARCHKART Badge + Title + Subtitle + Sort + View All */}
            <div className="pk-section-head" id="searchkart-listings-section">
              <div>
                <div className="pk-tag-row">
                  <span className="pk-tag-blue">SearchKart</span>
                  {isFilterActive && <span className="pk-tag-orange">Filtered</span>}
                </div>
                <h2 className="pk-section-title">Homes you may love</h2>
                <p className="pk-section-desc">
                  Showing {displayListings.length} verified listings in {selectedCity} — searchable by
                  filters or NestAI
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <select
                  className="pk-sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                </select>

                <button type="button" className="pk-view-all-btn" onClick={resetFilters}>
                  <span>View all homes</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Fallback notification if specific query has 0 direct matches */}
            {!hasDirectMatches && (
              <div
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: '1px solid #fde68a',
                  fontSize: '14px',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  🔍 No direct matches for &quot;<strong>{searchQuery || selectedCategory}</strong>&quot;. Showing top recommended verified homes in Kolkata:
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #d97706',
                    color: '#b45309',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Property Cards Grid */}
            <div className="pk-cards-grid">
              {displayListings.map((prop, idx) => {
                const isFav = favorites.some((f) => (typeof f === 'object' ? f.id : f) === prop.id);
                const tagBadge =
                  idx % 4 === 0
                    ? 'Zero Brokerage'
                    : idx % 4 === 1
                      ? 'All-Inclusive'
                      : idx % 4 === 2
                        ? 'Student Special'
                        : 'Instant Move-in';

                return (
                  <article
                    key={prop.id || idx}
                    className="pk-listing-card"
                    onClick={() => handleCardClick(prop)}
                  >
                    <div className="pk-card-image-wrap">
                      <img
                        src={
                          prop.image ||
                          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90'
                        }
                        alt={prop.title}
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90';
                        }}
                      />

                      <div className="pk-card-badges">
                        <span className="pk-badge-verified">✓ Verified</span>
                        <span className="pk-badge-category">{prop.type || 'Flat'}</span>
                      </div>

                      <button
                        type="button"
                        className={`pk-card-heart-btn ${isFav ? 'is-fav' : ''}`}
                        onClick={(e) => toggleFavorite(e, prop)}
                        aria-label="Save favorite"
                        title={isFav ? 'Saved' : 'Save'}
                      >
                        {isFav ? '♥' : '♡'}
                      </button>

                      <span className="pk-card-bottom-tag">{tagBadge}</span>
                    </div>

                    <div className="pk-card-details">
                      <div className="pk-card-price-row">
                        <div>
                          <span className="pk-price-val">
                            ₹{Number(prop.price || prop.monthly_rent || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="pk-price-unit">/mo</span>
                        </div>
                        <span className="pk-location-tag">
                          {prop.city || prop.location?.split(',')?.[0]?.trim() || 'Kolkata'}
                        </span>
                      </div>

                      <h3 className="pk-card-prop-title" title={prop.title}>
                        {prop.title}
                      </h3>

                      <p className="pk-card-address">
                        <span>📍</span>
                        <span>{prop.location || 'Kolkata'}</span>
                      </p>

                      <p className="pk-card-specs">
                        {prop.subtype || prop.roomSize || 'Furnished'} •{' '}
                        {prop.bathroom || 'Attached'} Bath • {prop.furnishing || 'Move-in ready'}
                      </p>

                      <button
                        type="button"
                        disabled={user?.account_status === 'SUSPENDED' || user?.account_status === 'BLOCKED'}
                        className={`pk-view-details-btn ${user?.account_status === 'SUSPENDED' ? 'is-suspended' : user?.account_status === 'BLOCKED' ? 'is-blocked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user?.account_status === 'SUSPENDED') {
                            showToast('⚠️ Your account is suspended for rule violation (Strike 1). View Details is disabled. Open the NestAI chatbot to submit an unblock appeal.');
                            return;
                          }
                          if (user?.account_status === 'BLOCKED') {
                            showToast('⛔ Your account is permanently blocked (Strike 2) due to repeated rule violations.');
                            return;
                          }
                          navigate(`/tenant/property/${prop.id}`);
                        }}
                      >
                        {user?.account_status === 'SUSPENDED' ? (
                          <span>⚠️ Access Suspended</span>
                        ) : user?.account_status === 'BLOCKED' ? (
                          <span>⛔ Account Blocked</span>
                        ) : (
                          <>
                            <span>View Details</span>
                            <span>→</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* BELOW LISTINGS: 6 FACILITYKART SERVICES PREVIEW STRIP */}
            <section className="pk-service-tiles-shell" aria-label="Essential Home Services">
              <div className="pk-service-strip-head">
                <div>
                  <div className="pk-tag-row">
                    <span className="pk-tag-green">FacilityKart</span>
                    {isRestricted && (
                      <span style={{
                        background: isBlocked ? '#fee2e2' : '#fef3c7',
                        color: isBlocked ? '#991b1b' : '#92400e',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        border: `1px solid ${isBlocked ? '#fca5a5' : '#fde68a'}`,
                        marginLeft: '8px'
                      }}>
                        {isBlocked ? '⛔ Services Blocked' : '⚠️ Services Suspended'}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: 0 }}>
                    Everyday <span style={{ color: '#14532D' }}>Home &amp; Living Services</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                    From on-demand home repairs and household assistance to daily doorstep deliveries,
                    insured shifting, and 24/7 emergency support.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      background: '#F5F0E6',
                      border: '1px solid #EBE3D3',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '6px 12px',
                      borderRadius: '10px',
                    }}
                  >
                    ✓ Verified Professionals
                  </span>
                  <button
                    type="button"
                    className="pk-view-details-btn"
                    style={{
                      width: 'auto',
                      background: isBlocked ? '#dc2626' : isSuspended ? '#d97706' : '#14532D',
                      padding: '9px 18px',
                      cursor: isRestricted ? 'not-allowed' : 'pointer',
                      opacity: isRestricted ? 0.85 : 1,
                    }}
                    onClick={() => {
                      if (handleRestrictedAction('FacilityKart')) return;
                      setActivePillar('FacilityKart');
                    }}
                  >
                    {isRestricted ? (
                      <span>🔒 FacilityKart Locked</span>
                    ) : (
                      <>
                        <span>Open FacilityKart</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pk-service-tiles-grid">
                {/* 1. HomeService */}
                <div
                  className={`pk-service-tile ${isRestricted ? 'is-disabled' : selectedService === 'HomeService' ? 'highlighted' : ''}`}
                  onClick={() => {
                    if (handleRestrictedAction('HomeService')) return;
                    setSelectedService('HomeService');
                    showToast('HomeService (Home & Repair Support) selected in FacilityKart');
                  }}
                  title={isRestricted ? 'Service disabled due to account penalty' : 'HomeService'}
                >
                  <span className="pk-service-icon">{isRestricted ? '🔒' : '🛠️'}</span>
                  <span className="pk-service-title">HomeService</span>
                  <span className="pk-service-sub">{isRestricted ? '(Disabled)' : '(Home & Repair Support)'}</span>
                </div>

                {/* 2. HouseKeeping */}
                <div
                  className={`pk-service-tile ${isRestricted ? 'is-disabled' : selectedService === 'HouseKeeping' ? 'highlighted' : ''}`}
                  onClick={() => {
                    if (handleRestrictedAction('HouseKeeping')) return;
                    setSelectedService('HouseKeeping');
                    showToast('HouseKeeping (Household Assistance) selected in FacilityKart');
                  }}
                  title={isRestricted ? 'Service disabled due to account penalty' : 'HouseKeeping'}
                >
                  <span className="pk-service-icon">{isRestricted ? '🔒' : '🧹'}</span>
                  <span className="pk-service-title">HouseKeeping</span>
                  <span className="pk-service-sub">{isRestricted ? '(Disabled)' : '(Household Assistance)'}</span>
                </div>

                {/* 3. DoorDrop */}
                <div
                  className={`pk-service-tile ${isRestricted ? 'is-disabled' : selectedService === 'DoorDrop' ? 'highlighted' : ''}`}
                  onClick={() => {
                    if (handleRestrictedAction('DoorDrop')) return;
                    setSelectedService('DoorDrop');
                    showToast('DoorDrop (Daily Deliveries) selected in FacilityKart');
                  }}
                  title={isRestricted ? 'Service disabled due to account penalty' : 'DoorDrop'}
                >
                  <span className="pk-service-icon">{isRestricted ? '🔒' : '📦'}</span>
                  <span className="pk-service-title">DoorDrop</span>
                  <span className="pk-service-sub">{isRestricted ? '(Disabled)' : '(Daily Deliveries)'}</span>
                </div>

                {/* 4. GharSafar */}
                <div
                  className={`pk-service-tile ${isRestricted ? 'is-disabled' : selectedService === 'GharSafar' ? 'highlighted' : ''}`}
                  onClick={() => {
                    if (handleRestrictedAction('GharSafar')) return;
                    setSelectedService('GharSafar');
                    showToast('GharSafar (Shifting & Packing) selected in FacilityKart');
                  }}
                  title={isRestricted ? 'Service disabled due to account penalty' : 'GharSafar'}
                >
                  <span className="pk-service-icon">{isRestricted ? '🔒' : '🚚'}</span>
                  <span className="pk-service-title">GharSafar</span>
                  <span className="pk-service-sub">{isRestricted ? '(Disabled)' : '(Shifting & Packing)'}</span>
                </div>

                {/* 5. LifeLine */}
                <div
                  className={`pk-service-tile ${isRestricted ? 'is-disabled' : selectedService === 'LifeLine' ? 'highlighted' : ''}`}
                  onClick={() => {
                    if (handleRestrictedAction('LifeLine Emergency Desk')) return;
                    setSelectedService('LifeLine');
                    showToast('LifeLine (Emergency Support) selected in FacilityKart');
                  }}
                  title={isRestricted ? 'Service disabled due to account penalty' : 'LifeLine'}
                >
                  <span className="pk-service-icon">{isRestricted ? '🔒' : '🚨'}</span>
                  <span className="pk-service-title">LifeLine</span>
                  <span className="pk-service-sub">{isRestricted ? '(Disabled)' : '(Emergency Support)'}</span>
                </div>

                {/* 6. Explore More */}
                <div
                  className={`pk-service-tile ${isRestricted ? 'is-disabled' : ''}`}
                  style={{ background: '#FAF8F4' }}
                  onClick={() => {
                    if (handleRestrictedAction('FacilityKart Services')) return;
                    setActivePillar('FacilityKart');
                  }}
                  title={isRestricted ? 'Services disabled due to account penalty' : 'Explore More'}
                >
                  <span className="pk-service-icon">{isRestricted ? '🔒' : '✦'}</span>
                  <span className="pk-service-title">Explore More</span>
                  <span className="pk-service-sub">{isRestricted ? '(Disabled)' : 'All FacilityKart Services'}</span>
                </div>
              </div>
            </section>

            {/* BELOW SERVICES: BUDGETKART SHOWCASE BANNER (MY EXPENSES) */}
            <section className="pk-budget-showcase-shell" aria-label="My Expenses — BudgetKart">
              <div>
                <div className="pk-tag-row">
                  <span className="pk-tag-orange">BudgetKart</span>
                </div>
                <h3 style={{ fontSize: '32px', fontWeight: 900, margin: '6px 0 0' }}>
                  My <span style={{ color: '#fb923c' }}>Expenses</span>
                </h3>

                <ul className="pk-showcase-bullets">
                  <li className="pk-bullet-item">
                    <span className="pk-bullet-icon">🏠</span>
                    <span>Track monthly rent &amp; security deposit milestones in one view</span>
                  </li>
                  <li className="pk-bullet-item">
                    <span className="pk-bullet-icon">🤝</span>
                    <span>Split shared flatmate bills fairly with instant settlement status</span>
                  </li>
                  <li className="pk-bullet-item">
                    <span className="pk-bullet-icon">⚡</span>
                    <span>Log utility, Wi-Fi &amp; FacilityKart service expenses effortlessly</span>
                  </li>
                  <li className="pk-bullet-item">
                    <span className="pk-bullet-icon">🧾</span>
                    <span>Generate &amp; download instant HRA rent receipts anytime</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="pk-open-budget-btn"
                  style={{
                    background: isBlocked ? '#dc2626' : isSuspended ? '#d97706' : '#EA580C',
                    cursor: isRestricted ? 'not-allowed' : 'pointer',
                    opacity: isRestricted ? 0.85 : 1,
                  }}
                  onClick={() => {
                    if (handleRestrictedAction('BudgetKart')) return;
                    setActivePillar('BudgetKart');
                  }}
                >
                  {isRestricted ? (
                    <span>🔒 BudgetKart Locked</span>
                  ) : (
                    <>
                      <span>Open BudgetKart</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>

              {/* Monthly Expense Snapshot Card */}
              <div className="pk-snapshot-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    paddingBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#fdba74', textTransform: 'uppercase' }}>
                    Monthly Expense Snapshot
                  </span>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#6ee7b7',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    Nov 2026
                  </span>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 900 }}>
                      ₹{monthlyTrackedExpense.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ mo tracked</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#fed7aa', margin: '4px 0 0' }}>
                    {Math.round((monthlyTrackedExpense / monthlyBudgetLimit) * 100)}% of ₹
                    {monthlyBudgetLimit.toLocaleString('en-IN')} budget used
                  </p>

                  <div className="pk-progress-bar-shell">
                    <div
                      className="pk-progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((monthlyTrackedExpense / monthlyBudgetLimit) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Quick Add Expense Input Row */}
                <form onSubmit={handleQuickAddExpense} className="pk-quick-expense-form">
                  <input
                    type="text"
                    placeholder={isRestricted ? '🔒 Expense tracking disabled' : 'Expense (e.g. Wi-Fi, Maid)'}
                    className="pk-quick-input"
                    style={{ flex: 1, opacity: isRestricted ? 0.6 : 1, cursor: isRestricted ? 'not-allowed' : 'text' }}
                    value={quickLabel}
                    disabled={isRestricted}
                    onChange={(e) => setQuickLabel(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="₹ Amt"
                    className="pk-quick-input"
                    style={{ width: '90px', opacity: isRestricted ? 0.6 : 1, cursor: isRestricted ? 'not-allowed' : 'text' }}
                    value={quickAmount}
                    disabled={isRestricted}
                    onChange={(e) => setQuickAmount(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isRestricted}
                    className="pk-quick-add-btn"
                    style={{
                      opacity: isRestricted ? 0.6 : 1,
                      cursor: isRestricted ? 'not-allowed' : 'pointer',
                      background: isRestricted ? '#64748b' : undefined,
                    }}
                  >
                    {isRestricted ? 'Locked' : '+ Add'}
                  </button>
                </form>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    fontSize: '11px',
                    color: '#94a3b8',
                  }}
                >
                  <span>
                    {isRestricted
                      ? '🔒 Expense tracking disabled due to account penalty'
                      : expenseLedger.length === 0
                      ? 'No expenses tracked yet • Add below'
                      : `Latest: ${expenseLedger[0].label} (₹${expenseLedger[0].amount.toLocaleString('en-IN')})`}
                  </span>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: isRestricted ? '#94a3b8' : '#fdba74',
                      fontWeight: 700,
                      cursor: isRestricted ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => {
                      if (handleRestrictedAction('BudgetKart ledger')) return;
                      setActivePillar('BudgetKart');
                    }}
                  >
                    Full ledger →
                  </button>
                </div>
              </div>
            </section>

            {/* RENT RELATED QUESTIONS & ANSWERS (FAQ ACCORDION) */}
            <section className="pk-faq-shell" id="rentFaqSection" aria-label="Rent Related Questions">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #EBE3D3',
                  paddingBottom: '20px',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div className="pk-tag-row">
                    <span className="pk-tag-orange">Rental Help Center</span>
                  </div>
                  <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#111827', margin: '4px 0 0' }}>
                    Rent Related <span style={{ color: '#1E3A8A' }}>Questions &amp; Answers</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                    Clear answers on security deposits, zero-brokerage listings, rental agreements,
                    lock-in periods, move-in inspections, and HRA receipts.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    style={{
                      background: '#F5F0E6',
                      border: '1px solid #EBE3D3',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    onClick={() => setAllFaqs(true)}
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#6b7280',
                      cursor: 'pointer',
                    }}
                    onClick={() => setAllFaqs(false)}
                  >
                    Collapse
                  </button>
                </div>
              </div>

              <div className="pk-faq-grid">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaqs.has(idx);
                  return (
                    <div key={idx} className="pk-faq-card">
                      <button
                        type="button"
                        className="pk-faq-btn"
                        onClick={() => toggleFaq(idx)}
                      >
                        <span>{faq.q}</span>
                        <span className={`pk-faq-chevron ${isOpen ? 'open' : ''}`}>▼</span>
                      </button>
                      {isOpen && <div className="pk-faq-answer">{faq.a}</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PILLAR 2: FACILITYKART VIEW                                               */}
        {/* ========================================================================= */}
        {activePillar === 'FacilityKart' && (
          <div>
            <div className="pk-section-head">
              <div>
                <div className="pk-tag-row">
                  <span className="pk-tag-green">FacilityKart</span>
                  {isRestricted && (
                    <span style={{
                      background: isBlocked ? '#fee2e2' : '#fef3c7',
                      color: isBlocked ? '#991b1b' : '#92400e',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '9999px',
                      border: `1px solid ${isBlocked ? '#fca5a5' : '#fde68a'}`,
                      marginLeft: '8px'
                    }}>
                      {isBlocked ? '⛔ Services Blocked' : '⚠️ Services Suspended'}
                    </span>
                  )}
                </div>
                <h2 className="pk-section-title">Everyday Home Services, On-Demand</h2>
                <p className="pk-section-desc">
                  Background-verified professionals for PointKey tenants and homeowners.
                </p>
              </div>

              <button
                type="button"
                className="pk-view-all-btn"
                onClick={() => setActivePillar('SearchKart')}
              >
                <span>← Back to SearchKart Homes</span>
              </button>
            </div>

            {isRestricted && (
              <div style={{
                marginBottom: '24px',
                padding: '16px 20px',
                borderRadius: '16px',
                background: isBlocked ? '#fef2f2' : '#fffbeb',
                border: `2px solid ${isBlocked ? '#ef4444' : '#f59e0b'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
              }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{isBlocked ? '⛔' : '⚠️'}</span>
                <div>
                  <strong style={{ fontSize: '15px', color: isBlocked ? '#991b1b' : '#92400e', display: 'block' }}>
                    {isBlocked ? 'FacilityKart Services Permanently Blocked (Strike 2)' : 'FacilityKart Services Suspended (Strike 1)'}
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: isBlocked ? '#7f1d1d' : '#78350f', lineHeight: 1.5 }}>
                    {isBlocked
                      ? 'Due to repeated rule violations, all home repair, cleaning, shifting, and delivery service bookings are permanently terminated.'
                      : 'All service bookings are restricted while your account is suspended. Open the NestAI chatbot to submit an unblock appeal.'}
                  </p>
                </div>
              </div>
            )}

            <div className="pk-facility-grid">
              {/* HomeService */}
              <div className={`pk-facility-card ${isRestricted ? 'opacity-70' : ''}`}>
                <div className="pk-facility-icon-wrap" style={{ background: isRestricted ? '#f1f5f9' : '#fff7ed', color: isRestricted ? '#64748b' : '#ea580c' }}>
                  {isRestricted ? '🔒' : '🛠️'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    HomeService <span style={{ fontSize: '12px', color: '#6b7280' }}>(Home &amp; Repair)</span>
                  </h3>
                  <span
                    style={{
                      background: isRestricted ? '#f1f5f9' : '#ffedd5',
                      color: isRestricted ? '#64748b' : '#ea580c',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    ₹249 Visit
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0', flex: 1 }}>
                  Plumbing, electrical, appliance &amp; carpenter repairs with transparent upfront pricing.
                </p>
                <button
                  type="button"
                  disabled={isRestricted}
                  className="pk-book-service-btn"
                  style={{
                    background: isRestricted ? '#94a3b8' : '#ea580c',
                    cursor: isRestricted ? 'not-allowed' : 'pointer',
                    opacity: isRestricted ? 0.75 : 1
                  }}
                  onClick={() => {
                    if (handleRestrictedAction('HomeService booking')) return;
                    showToast('HomeService technician request booked successfully!');
                  }}
                >
                  {isRestricted ? '🔒 Booking Disabled' : 'Book HomeService'}
                </button>
              </div>

              {/* HouseKeeping */}
              <div className={`pk-facility-card ${isRestricted ? 'opacity-70' : ''}`}>
                <div className="pk-facility-icon-wrap" style={{ background: isRestricted ? '#f1f5f9' : '#f0fdf4', color: isRestricted ? '#64748b' : '#14532d' }}>
                  {isRestricted ? '🔒' : '🧹'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    HouseKeeping <span style={{ fontSize: '12px', color: '#6b7280' }}>(Household Help)</span>
                  </h3>
                  <span
                    style={{
                      background: isRestricted ? '#f1f5f9' : '#dcfce7',
                      color: isRestricted ? '#64748b' : '#14532d',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    ₹1,499
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0', flex: 1 }}>
                  Daily or deep home cleaning, dish &amp; laundry help, and move-in sanitization.
                </p>
                <button
                  type="button"
                  disabled={isRestricted}
                  className="pk-book-service-btn"
                  style={{
                    background: isRestricted ? '#94a3b8' : '#14532d',
                    cursor: isRestricted ? 'not-allowed' : 'pointer',
                    opacity: isRestricted ? 0.75 : 1
                  }}
                  onClick={() => {
                    if (handleRestrictedAction('HouseKeeping booking')) return;
                    showToast('HouseKeeping slot reserved successfully!');
                  }}
                >
                  {isRestricted ? '🔒 Booking Disabled' : 'Book HouseKeeping'}
                </button>
              </div>

              {/* DoorDrop */}
              <div className={`pk-facility-card ${isRestricted ? 'opacity-70' : ''}`}>
                <div className="pk-facility-icon-wrap" style={{ background: isRestricted ? '#f1f5f9' : '#eff6ff', color: isRestricted ? '#64748b' : '#1e3a8a' }}>
                  {isRestricted ? '🔒' : '📦'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    DoorDrop <span style={{ fontSize: '12px', color: '#6b7280' }}>(Daily Deliveries)</span>
                  </h3>
                  <span
                    style={{
                      background: isRestricted ? '#f1f5f9' : '#dbeafe',
                      color: isRestricted ? '#64748b' : '#1e3a8a',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    From ₹49
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0', flex: 1 }}>
                  Morning essentials, groceries, tiffins &amp; parcels delivered right to your doorstep.
                </p>
                <button
                  type="button"
                  disabled={isRestricted}
                  className="pk-book-service-btn"
                  style={{
                    background: isRestricted ? '#94a3b8' : '#1e3a8a',
                    cursor: isRestricted ? 'not-allowed' : 'pointer',
                    opacity: isRestricted ? 0.75 : 1
                  }}
                  onClick={() => {
                    if (handleRestrictedAction('DoorDrop delivery schedule')) return;
                    showToast('DoorDrop schedule activated for your address!');
                  }}
                >
                  {isRestricted ? '🔒 Delivery Disabled' : 'Schedule DoorDrop'}
                </button>
              </div>

              {/* GharSafar */}
              <div className={`pk-facility-card ${isRestricted ? 'opacity-70' : ''}`}>
                <div className="pk-facility-icon-wrap" style={{ background: isRestricted ? '#f1f5f9' : '#eff6ff', color: isRestricted ? '#64748b' : '#1e3a8a' }}>
                  {isRestricted ? '🔒' : '🚚'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    GharSafar <span style={{ fontSize: '12px', color: '#6b7280' }}>(Shifting &amp; Pack)</span>
                  </h3>
                  <span
                    style={{
                      background: isRestricted ? '#f1f5f9' : '#dbeafe',
                      color: isRestricted ? '#64748b' : '#1e3a8a',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    From ₹2,999
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0', flex: 1 }}>
                  Insured local shifting within city limits with multi-layer bubble &amp; carton packing.
                </p>
                <button
                  type="button"
                  disabled={isRestricted}
                  className="pk-book-service-btn"
                  style={{
                    background: isRestricted ? '#94a3b8' : '#1e3a8a',
                    cursor: isRestricted ? 'not-allowed' : 'pointer',
                    opacity: isRestricted ? 0.75 : 1
                  }}
                  onClick={() => {
                    if (handleRestrictedAction('GharSafar shifting quote')) return;
                    showToast('GharSafar shifting quote generated!');
                  }}
                >
                  {isRestricted ? '🔒 Shifting Disabled' : 'Get Shifting Quote'}
                </button>
              </div>

              {/* LifeLine */}
              <div className={`pk-facility-card ${isRestricted ? 'opacity-70' : ''}`} style={{ gridColumn: 'span 2' }}>
                <div className="pk-facility-icon-wrap" style={{ background: isRestricted ? '#f1f5f9' : '#fef2f2', color: isRestricted ? '#64748b' : '#b91c1c' }}>
                  {isRestricted ? '🔒' : '🚨'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    LifeLine <span style={{ fontSize: '12px', color: '#6b7280' }}>(Emergency Support)</span>
                  </h3>
                  <span
                    style={{
                      background: isRestricted ? '#f1f5f9' : '#fee2e2',
                      color: isRestricted ? '#64748b' : '#b91c1c',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    24/7 Priority
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0', flex: 1 }}>
                  Round-the-clock urgent assistance for lockouts, power/water hazards, and local
                  emergency coordination.
                </p>
                <button
                  type="button"
                  disabled={isRestricted}
                  className="pk-book-service-btn"
                  style={{
                    background: isRestricted ? '#94a3b8' : '#ea580c',
                    maxWidth: '280px',
                    cursor: isRestricted ? 'not-allowed' : 'pointer',
                    opacity: isRestricted ? 0.75 : 1
                  }}
                  onClick={() => {
                    if (handleRestrictedAction('LifeLine Emergency Desk')) return;
                    showToast('LifeLine Emergency Desk notified! We are reaching out.');
                  }}
                >
                  {isRestricted ? '🔒 Support Disabled' : 'Activate LifeLine Support'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PILLAR 3: BUDGETKART VIEW                                                 */}
        {/* ========================================================================= */}
        {activePillar === 'BudgetKart' && (
          <div>
            <div className="pk-section-head">
              <div>
                <div className="pk-tag-row">
                  <span className="pk-tag-orange">BudgetKart</span>
                  {isRestricted && (
                    <span style={{
                      background: isBlocked ? '#fee2e2' : '#fef3c7',
                      color: isBlocked ? '#991b1b' : '#92400e',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '9999px',
                      border: `1px solid ${isBlocked ? '#fca5a5' : '#fde68a'}`,
                      marginLeft: '8px'
                    }}>
                      {isBlocked ? '⛔ Expenses Blocked' : '⚠️ Expenses Suspended'}
                    </span>
                  )}
                </div>
                <h2 className="pk-section-title">Smart Rent, Deposit &amp; Utility Tracker</h2>
                <p className="pk-section-desc">
                  Track monthly living costs, split bills with flatmates, and download HRA rent receipts.
                </p>
              </div>

              <button
                type="button"
                className="pk-view-all-btn"
                onClick={() => setActivePillar('SearchKart')}
              >
                <span>← Back to SearchKart Homes</span>
              </button>
            </div>

            {isRestricted && (
              <div style={{
                marginBottom: '24px',
                padding: '16px 20px',
                borderRadius: '16px',
                background: isBlocked ? '#fef2f2' : '#fffbeb',
                border: `2px solid ${isBlocked ? '#ef4444' : '#f59e0b'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
              }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{isBlocked ? '⛔' : '⚠️'}</span>
                <div>
                  <strong style={{ fontSize: '15px', color: isBlocked ? '#991b1b' : '#92400e', display: 'block' }}>
                    {isBlocked ? 'BudgetKart Features Permanently Blocked (Strike 2)' : 'BudgetKart Features Suspended (Strike 1)'}
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: isBlocked ? '#7f1d1d' : '#78350f', lineHeight: 1.5 }}>
                    {isBlocked
                      ? 'Expense logging, flatmate split settlements, and HRA receipts are permanently disabled for blocked accounts.'
                      : 'Expense tracking, receipt downloads, and bill settlements are disabled while your account is suspended. Open NestAI to appeal.'}
                  </p>
                </div>
              </div>
            )}

            <div className="pk-budget-dashboard-grid">
              {/* Left Column: Monthly Living Budget Box */}
              <div className="pk-budget-summary-box">
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fed7aa', textTransform: 'uppercase' }}>
                  Monthly Living Budget
                </span>
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 900 }}>
                    ₹{monthlyTrackedExpense.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    / ₹{monthlyBudgetLimit.toLocaleString('en-IN')} limit
                  </span>
                </div>

                <div className="pk-progress-bar-shell" style={{ height: '12px', marginTop: '16px' }}>
                  <div
                    className="pk-progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((monthlyTrackedExpense / monthlyBudgetLimit) * 100)
                      )}%`,
                    }}
                  />
                </div>

                <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.6, marginTop: '14px' }}>
                  {expenseLedger.length === 0
                    ? 'Track your monthly rent, electricity, Wi-Fi and living expenses here.'
                    : `Includes ${expenseLedger.map((e) => `${e.label} (₹${e.amount.toLocaleString('en-IN')})`).join(', ')}.`}
                </p>

                <div
                  style={{
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 12px', color: '#fed7aa' }}>
                    Add Living Expense
                  </h4>
                  <form onSubmit={handleQuickAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder={isRestricted ? '🔒 Expense tracking disabled' : 'Expense Name (e.g. Wi-Fi bill, Groceries)'}
                      className="pk-quick-input"
                      disabled={isRestricted}
                      style={{ opacity: isRestricted ? 0.6 : 1, cursor: isRestricted ? 'not-allowed' : 'text' }}
                      value={quickLabel}
                      onChange={(e) => setQuickLabel(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        className="pk-quick-input"
                        style={{ flex: 1, opacity: isRestricted ? 0.6 : 1, cursor: isRestricted ? 'not-allowed' : 'text' }}
                        value={quickAmount}
                        disabled={isRestricted}
                        onChange={(e) => setQuickAmount(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={isRestricted}
                        className="pk-quick-add-btn"
                        style={{
                          padding: '8px 20px',
                          opacity: isRestricted ? 0.6 : 1,
                          cursor: isRestricted ? 'not-allowed' : 'pointer',
                          background: isRestricted ? '#64748b' : undefined
                        }}
                      >
                        {isRestricted ? 'Locked' : '+ Add Expense'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Quick Actions & Split Ledger */}
              <div className="pk-budget-ledger-box">
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 16px' }}>
                  Quick Actions &amp; Split Ledger
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  <div
                    style={{
                      background: '#FAF8F4',
                      border: '1px solid #EBE3D3',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: isRestricted ? 0.75 : 1
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: '#1E3A8A', margin: 0 }}>
                        November Rent Receipt
                      </p>
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>
                        HRA Tax Exemption Ready
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isRestricted}
                      style={{
                        background: isRestricted ? '#94a3b8' : '#1E3A8A',
                        color: '#ffffff',
                        border: 0,
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: isRestricted ? 'not-allowed' : 'pointer',
                        opacity: isRestricted ? 0.75 : 1
                      }}
                      onClick={() => {
                        if (handleRestrictedAction('HRA Rent Receipt download')) return;
                        showToast('HRA Rent Receipt PDF downloaded successfully!');
                      }}
                    >
                      {isRestricted ? '🔒 Locked' : 'Download'}
                    </button>
                  </div>

                  <div
                    style={{
                      background: '#FAF8F4',
                      border: '1px solid #EBE3D3',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: isRestricted ? 0.75 : 1
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: '#14532D', margin: 0 }}>
                        Flatmate Utility Split
                      </p>
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>
                        2 roommates settled • 0 pending
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isRestricted}
                      style={{
                        background: isRestricted ? '#94a3b8' : '#14532D',
                        color: '#ffffff',
                        border: 0,
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: isRestricted ? 'not-allowed' : 'pointer',
                        opacity: isRestricted ? 0.75 : 1
                      }}
                      onClick={() => {
                        if (handleRestrictedAction('Flatmate bill split')) return;
                        showToast('All flatmate dues are settled for this cycle!');
                      }}
                    >
                      {isRestricted ? '🔒 Locked' : 'View Split'}
                    </button>
                  </div>
                </div>

                {/* Ledger Items */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: 0 }}>
                    Tracked Entries Ledger
                  </h4>
                  {expenseLedger.length > 0 && (
                    <button
                      type="button"
                      disabled={isRestricted}
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: isRestricted ? '#94a3b8' : '#b91c1c',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: isRestricted ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => {
                        if (handleRestrictedAction('Clearing tracked expenses')) return;
                        setExpenseLedger([]);
                        try {
                          localStorage.setItem('prent_tracked_expenses', JSON.stringify([]));
                        } catch { }
                        showToast('Cleared all tracked entries');
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {expenseLedger.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '36px 16px',
                      background: '#FAF8F4',
                      borderRadius: '16px',
                      border: '1.5px dashed #d8cba9',
                    }}
                  >
                    <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🧾</span>
                    <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>
                      No tracked entries yet
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#6b7280' }}>
                      Add your monthly rent or bills using the "Add Living Expense" form on the left.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {expenseLedger.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: '#FAF8F4',
                          borderRadius: '12px',
                          border: '1px solid #EBE3D3',
                        }}
                      >
                        <div>
                          <b style={{ fontSize: '13px', color: '#111827', display: 'block' }}>{item.label}</b>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>
                            {item.category} • {item.date}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 900, color: '#1E3A8A' }}>
                            ₹{item.amount.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            title="Remove entry"
                            onClick={() => handleRemoveExpense(item.id)}
                            style={{
                              background: '#f3f4f6',
                              border: 0,
                              borderRadius: '50%',
                              width: '22px',
                              height: '22px',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '11px',
                              color: '#6b7280',
                              cursor: 'pointer',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="pk-footer-root">
        <div className="pk-footer-grid">
          {/* Col 1: Brand & Badges */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1f4d3f 0%, #2d6a55 100%)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '18px',
                }}
              >
                ⌂
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span style={{ fontSize: '17px', fontWeight: 900, color: '#34d399' }}>POINT</span>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.22em', color: '#93c5fd' }}>
                  KEY
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.6, margin: '14px 0 16px', maxWidth: '340px' }}>
              Verified rental homes, trusted everyday services, and smart monthly expense tracking
              designed for modern living.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: '#1e293b', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700 }}>
                ✓ Verified Rentals
              </span>
              <span style={{ background: '#1e293b', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700 }}>
                ✓ HRA Ready
              </span>
              <span style={{ background: '#1e293b', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700 }}>
                ✓ 24/7 LifeLine
              </span>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div>
            <h4 className="pk-footer-title">Platform</h4>
            <ul className="pk-footer-list">
              <li>
                <button type="button" onClick={() => setActivePillar('SearchKart')}>
                  SearchKart
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePillar('FacilityKart')}>
                  FacilityKart
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePillar('BudgetKart')}>
                  BudgetKart
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActivePillar('SearchKart');
                    setTimeout(() => {
                      document.getElementById('rentFaqSection')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Rent Q&amp;A
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Homes */}
          <div>
            <h4 className="pk-footer-title">Homes</h4>
            <ul className="pk-footer-list">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Flats');
                    scrollToListings();
                  }}
                >
                  Flats &amp; Apartments
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Rooms');
                    scrollToListings();
                  }}
                >
                  Private &amp; Studio Rooms
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('PG');
                    scrollToListings();
                  }}
                >
                  Co-Living &amp; PG
                </button>
              </li>
              <li>
                <button type="button" onClick={resetFilters}>
                  All Verified Homes
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Services & Support */}
          <div>
            <h4 className="pk-footer-title">Services &amp; Support</h4>
            <ul className="pk-footer-list">
              <li>
                <button type="button" onClick={() => setActivePillar('FacilityKart')}>
                  HomeService &amp; HouseKeeping
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePillar('FacilityKart')}>
                  DoorDrop &amp; GharSafar Shifting
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePillar('FacilityKart')}>
                  LifeLine 24/7 Emergency
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => showToast('NestAI Assistant is ready at bottom right!')}
                >
                  Ask NestAI Assistant
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pk-footer-bottom">
          <p>© 2026 PointKey. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => showToast('Rental Terms opened')}>
              Rental Terms
            </span>
            <span style={{ cursor: 'pointer' }} onClick={() => showToast('Privacy Policy opened')}>
              Privacy
            </span>
            <span style={{ cursor: 'pointer' }} onClick={() => showToast('Support desk online')}>
              Support
            </span>
          </div>
        </div>
      </footer>

      {/* FLOATING NESTAI / HOMEMATE CHATBOT (BOTTOM RIGHT) */}
      <HomeMateChatbot
        onOpenSearchFilters={() => scrollToListings()}
        properties={properties}
      />

      {/* NON-BLOCKING TOAST NOTIFICATION */}
      {toastVisible && (
        <div className="pk-toast-banner">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EA580C' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION DOCK */}
      <BottomNav />
    </div>
  );
}
