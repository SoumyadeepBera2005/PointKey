import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Upload, 
  Camera, 
  Video, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Phone, 
  Mail, 
  Home, 
  Building, 
  Trash2, 
  Navigation,
  Zap
} from 'lucide-react';

export default function PostPropertyModal({ isOpen, onClose, onSuccess }) {
  // Current active step: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState(1);
  const formContainerRef = useRef(null);

  // ==========================================
  // STEP 1: HOUSE DETAILS & LIVE GPS LOCATION
  // ==========================================
  const [listerType, setListerType] = useState('Owner'); // 'Owner' | 'Builder'
  const [category, setCategory] = useState('flat'); // 'flat' | 'pg' | 'room'
  const [subtype, setSubtype] = useState('2 BHK');
  const [title, setTitle] = useState('');
  const [furnishing, setFurnishing] = useState('Semi-furnished'); // 'Fully-furnished' | 'Semi-furnished' | 'Unfurnished'
  const [bathroom, setBathroom] = useState('Private'); // 'Private' | 'Common'
  const [kitchen, setKitchen] = useState('Private Modular'); // 'Private Modular' | 'Shared' | 'No Kitchen'
  const [locality, setLocality] = useState('Rajpur Sonarpur');
  const [city, setCity] = useState('Kolkata');
  const [exactAddress, setExactAddress] = useState('');

  // Live GPS Location
  const [liveLocation, setLiveLocation] = useState(null); // { lat, lng, accuracy, address, timestamp }
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // ==========================================
  // STEP 2: OWNER / BUILDER CONTACT DETAILS
  // ==========================================
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isWhatsappSame, setIsWhatsappSame] = useState(true);
  const [email, setEmail] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');

  // ==========================================
  // STEP 3: PRICING, RULES & MEDIA (3 PHOTOS + 20MB VIDEO + CURRENT BILL)
  // ==========================================
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [maintenance, setMaintenance] = useState('Included in Rent');
  
  // Rules
  const POPULAR_RULES = [
    'Gate closes at 11:00 PM',
    'No smoking inside premises',
    'Bachelors & Students welcome',
    'Family preferred',
    'No loud music after 10 PM',
    '1 Month notice period before leaving',
    'Pets allowed'
  ];
  const [selectedRules, setSelectedRules] = useState(['Gate closes at 11:00 PM', 'No smoking inside premises']);
  const [customRules, setCustomRules] = useState('');

  // 3 Photos from 3 Different Angles (Required)
  const [photoAngle1, setPhotoAngle1] = useState(null); // { file, preview, name }
  const [photoAngle2, setPhotoAngle2] = useState(null);
  const [photoAngle3, setPhotoAngle3] = useState(null);

  // Video Upload (Max 20MB Required)
  const [videoFile, setVideoFile] = useState(null); // { file, preview, name, sizeMB }
  const [videoError, setVideoError] = useState('');

  // Previous Month's Current/Electricity Bill Upload (Required for home verification)
  const [electricityBill, setElectricityBill] = useState(null);
  const [billFileName, setBillFileName] = useState('');
  const [billFileSize, setBillFileSize] = useState('');
  const billInputRef = useRef(null);

  // ==========================================
  // STEP 4: DECLARATION & SUBMISSION
  // ==========================================
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [stepErrors, setStepErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Update WhatsApp automatically if checkbox checked
  useEffect(() => {
    if (isWhatsappSame) {
      setWhatsapp(phone);
    }
  }, [phone, isWhatsappSame]);

  // Adjust default subtype when category changes
  useEffect(() => {
    if (category === 'flat') setSubtype('2 BHK');
    else if (category === 'pg') setSubtype('Single Sharing Bed');
    else if (category === 'room') setSubtype('Single Private Room');
  }, [category]);

  // Try auto-fetching live location on first open
  useEffect(() => {
    if (isOpen && !liveLocation && !isFetchingLocation) {
      fetchLiveLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ==========================================
  // LIVE GPS LOCATION FETCHER
  // ==========================================
  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsFetchingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const lat = Number(latitude.toFixed(6));
        const lng = Number(longitude.toFixed(6));

        let resolvedLocality = locality || 'Rajpur Sonarpur';
        let resolvedCity = city || 'Kolkata';

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.locality || data.city) {
              resolvedLocality = data.locality || data.city;
              resolvedCity = data.city || data.principalSubdivision || 'Kolkata';
              setLocality(resolvedLocality);
              setCity(resolvedCity);
            }
          }
        } catch {
          // Keep default if geocode fails
        }

        const formattedAddress = `${resolvedLocality}, ${resolvedCity}`;
        setLiveLocation({
          lat,
          lng,
          accuracy: Math.round(accuracy),
          address: formattedAddress,
          timestamp: new Date().toLocaleTimeString(),
        });

        // Automatically prefill exactAddress if user hasn't typed one
        if (!exactAddress.trim()) {
          setExactAddress(`Near ${resolvedLocality}, ${resolvedCity}`);
        }

        setStepErrors((prev) => ({ ...prev, liveLocation: '', exactAddress: '' }));
        setIsFetchingLocation(false);
      },
      (err) => {
        setIsFetchingLocation(false);
        if (err.code === 1) {
          setLocationError('Location permission denied! Please allow GPS location in your browser to verify this property.');
        } else if (err.code === 2) {
          setLocationError('Device GPS/Location is OFF. Please switch on device location and click re-fetch.');
        } else {
          setLocationError('Location timed out. Please click here to re-try.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ==========================================
  // FILE HANDLERS
  // ==========================================
  const handleBillUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStepErrors((prev) => ({ ...prev, electricityBill: 'Current bill exceeds 5MB limit. Please upload under 5MB.' }));
      return;
    }
    const sizeKb = Math.round(file.size / 1024);
    setElectricityBill(file);
    setBillFileName(file.name);
    setBillFileSize(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);
    setStepErrors((prev) => ({ ...prev, electricityBill: '' }));
  };

  const handlePhotoUpload = (e, angleKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStepErrors((prev) => ({ ...prev, [angleKey]: 'Please upload an image file (JPG, PNG, WebP).' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStepErrors((prev) => ({ ...prev, [angleKey]: 'Photo file exceeds 10MB limit.' }));
      return;
    }

    const preview = URL.createObjectURL(file);
    const photoData = { file, preview, name: file.name };

    if (angleKey === 'photoAngle1') setPhotoAngle1(photoData);
    else if (angleKey === 'photoAngle2') setPhotoAngle2(photoData);
    else if (angleKey === 'photoAngle3') setPhotoAngle3(photoData);

    setStepErrors((prev) => ({ ...prev, [angleKey]: '' }));
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setVideoError('Invalid file format. Please upload a valid video file (MP4, MOV, WebM).');
      return;
    }

    // Strict 20MB limit as requested
    const maxBytes = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setVideoError(`❌ Selected video size is ${sizeMB} MB, which exceeds the mandatory 20 MB limit. Please compress or select a video under 20MB.`);
      setVideoFile(null);
      e.target.value = '';
      return;
    }

    setVideoError('');
    const preview = URL.createObjectURL(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setVideoFile({ file, preview, name: file.name, sizeMB });
    setStepErrors((prev) => ({ ...prev, video: '' }));
  };

  const toggleRule = (ruleText) => {
    if (selectedRules.includes(ruleText)) {
      setSelectedRules(selectedRules.filter((r) => r !== ruleText));
    } else {
      setSelectedRules([...selectedRules, ruleText]);
    }
  };

  // ==========================================
  // STEP VALIDATIONS (No field can be skipped!)
  // ==========================================
  const validateStep1 = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Property Title is required.';
    if (!locality.trim()) errs.locality = 'Locality / Area is required.';
    
    // If exactAddress is empty, provide a default from locality/GPS or flag error
    if (!exactAddress.trim()) {
      if (liveLocation?.address) {
        setExactAddress(`Near ${liveLocation.address}`);
      } else if (locality.trim()) {
        setExactAddress(`Main Road, ${locality.trim()}`);
      } else {
        errs.exactAddress = 'Exact building/house address is required.';
      }
    }

    if (!liveLocation || !liveLocation.lat) {
      errs.liveLocation = 'Live GPS location is mandatory. Please click "Capture Live GPS Location".';
    }

    setStepErrors(errs);
    if (Object.keys(errs).length > 0) {
      formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full legal name is required.';
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) errs.phone = '10-digit primary mobile number is required.';

    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    if (cleanWhatsapp.length !== 10) errs.whatsapp = '10-digit WhatsApp number is required.';

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      errs.email = 'Valid email address is required.';
    }

    const cleanAlt = alternatePhone.replace(/\D/g, '');
    if (cleanAlt.length !== 10) {
      errs.alternatePhone = '10-digit alternate mobile number is required.';
    }

    setStepErrors(errs);
    if (Object.keys(errs).length > 0) {
      formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    const rentNum = Number(rent);
    if (!rent || isNaN(rentNum) || rentNum <= 500) {
      errs.rent = 'Monthly Rent amount is required (min ₹500).';
    }

    const depNum = Number(deposit);
    if (!deposit || isNaN(depNum) || depNum < 0) {
      errs.deposit = 'Security Deposit is required (enter 0 if none).';
    }

    if (!maintenance.trim()) {
      errs.maintenance = 'Maintenance charges are required (e.g. Included).';
    }

    if (selectedRules.length === 0 && !customRules.trim()) {
      errs.rules = 'Please select at least one property rule.';
    }

    if (!photoAngle1) errs.photoAngle1 = 'Photo Angle 1 (Front/Entrance) is required.';
    if (!photoAngle2) errs.photoAngle2 = 'Photo Angle 2 (Living/Bedroom) is required.';
    if (!photoAngle3) errs.photoAngle3 = 'Photo Angle 3 (Balcony/Kitchen/Side) is required.';

    if (!videoFile) {
      errs.video = 'Room walkthrough video (max 20MB) is required.';
    }

    // Previous Month's Current/Electricity Bill of this home (User's specific requirement in Step 3!)
    if (!electricityBill) {
      errs.electricityBill = "Previous month's electricity/current bill of this home is mandatory for verification.";
    }

    setStepErrors(errs);
    if (Object.keys(errs).length > 0) {
      formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setStepErrors({});
        setCurrentStep(2);
        formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setStepErrors({});
        setCurrentStep(3);
        formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (currentStep === 3) {
      if (validateStep3()) {
        setStepErrors({});
        setCurrentStep(4);
        formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // ==========================================
  // FINAL SUBMISSION (SENT TO ADMIN FOR REVIEW)
  // ==========================================
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!declarationAccepted) {
      setStepErrors({ declaration: 'You must check and confirm the legal declaration before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setStepErrors({});

    const allCombinedRules = [...selectedRules];
    if (customRules.trim()) allCombinedRules.push(customRules.trim());

    const pendingProperty = {
      id: `prop-pending-${Date.now()}`,
      property_code: `${category === 'pg' ? 'PG' : category === 'flat' ? 'F' : 'R'}${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      category: category === 'flat' ? 'FLAT' : category === 'pg' ? 'PG' : 'ROOM',
      sub_type: subtype,
      type: category === 'flat' ? 'Flat' : category === 'pg' ? 'PG' : 'Room',
      subtype: subtype,
      lister_type: listerType, // 'Owner' | 'Builder'
      furnishing_status: furnishing,
      furnishing: furnishing,
      bathroom_type: bathroom,
      bathroom: bathroom,
      kitchen_type: kitchen,
      kitchen: kitchen.includes('No') ? "Don't need" : 'Need',
      
      // Location
      locality: locality.trim(),
      location: `${locality.trim()}, ${city.trim()}`,
      city: city.trim(),
      exact_address: exactAddress.trim() || `Near ${locality.trim()}`,
      lat: liveLocation?.lat || 22.5726,
      lng: liveLocation?.lng || 88.3639,
      live_location_verified: true,
      gps_accuracy_meters: liveLocation?.accuracy || 15,
      gps_timestamp: liveLocation?.timestamp,

      // Contact
      owner_name: fullName.trim(),
      owner_phone: phone.replace(/\D/g, ''),
      phone: phone.replace(/\D/g, ''),
      owner_whatsapp: whatsapp.replace(/\D/g, ''),
      owner_email: email.trim().toLowerCase(),
      alternate_phone: alternatePhone.replace(/\D/g, ''),

      // Pricing & Rules
      rent_amount: Number(rent),
      price: Number(rent),
      advance_amount: Number(deposit),
      deposit: Number(deposit),
      maintenance_charges: maintenance,
      rules_and_regulations: allCombinedRules.join('; '),
      rules: allCombinedRules,

      // Media
      cover_url: photoAngle1?.preview || '/assets/images/hero-slide-1.jpg',
      image: photoAngle1?.preview || '/assets/images/hero-slide-1.jpg',
      photos: [
        { label: 'Angle 1 (Front/Entrance)', name: photoAngle1?.name, url: photoAngle1?.preview },
        { label: 'Angle 2 (Living/Bedroom)', name: photoAngle2?.name, url: photoAngle2?.preview },
        { label: 'Angle 3 (Balcony/Kitchen/Side)', name: photoAngle3?.name, url: photoAngle3?.preview },
      ],
      video_name: videoFile?.name,
      video_size_mb: videoFile?.sizeMB,
      video_url: videoFile?.preview,
      electricity_bill_uploaded: true,
      electricity_bill_name: billFileName,

      // Status
      verification_status: 'PENDING',
      verified: false,
      is_verified: false,
      booking_status: 'UNBOOKED',
      legal_declaration_accepted: true,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    try {
      // 1. Add to Admin Pending Queue
      const existingPending = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
      existingPending.unshift(pendingProperty);
      localStorage.setItem('prent_pending_admin_properties', JSON.stringify(existingPending));

      // 2. Add to user's posted properties
      const userPosted = JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]');
      userPosted.unshift(pendingProperty);
      localStorage.setItem('prent_user_posted_properties', JSON.stringify(userPosted));

      // 3. Dispatch admin notification event
      window.dispatchEvent(new CustomEvent('prent_new_pending_property', { detail: pendingProperty }));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      if (onSuccess) onSuccess(pendingProperty);
    }, 700);
  };

  const handleResetAndClose = () => {
    setCurrentStep(1);
    setSubmitted(false);
    onClose();
  };

  const activeErrorsList = Object.values(stepErrors).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={handleResetAndClose}
    >
      <div
        className="bg-[#fffaf0] border border-[#d8cba9] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-[#17324D] animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f6efdf] hover:bg-[#ebdcc0] text-[#17324D] flex items-center justify-center text-sm font-bold transition cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* ==============================================================
            SUCCESS SCREEN AFTER SUBMITTING TO ADMIN
            ============================================================== */}
        {submitted ? (
          <div className="py-8 px-2 text-center space-y-4 my-auto">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-[#1f4d3f] flex items-center justify-center text-4xl shadow-md border-2 border-emerald-300 animate-in zoom-in-75">
              <CheckCircle2 size={46} className="text-emerald-700" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black tracking-wider uppercase">
                ⏳ Submitted for Admin Verification
              </span>
              <h3 className="text-2xl font-black text-[#17324D]">
                Listing Sent to Admin for Review!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you! Your property listing along with live GPS coordinates, 3-angle photographs, room video, and electricity bill has been submitted to PointKey Administration.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f4ebe0] border border-[#e5dac4] max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 font-black text-[#17324D]">
                <ShieldAlert size={16} className="text-[#FF9A1F]" />
                <span>Zero-Brokerage Security Protocol:</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Once our administration team verifies your ownership details and electricity bill, your property will automatically be approved and become visible to all tenants in search results.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-8 py-3 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              Done &amp; Return to Home
            </button>
          </div>
        ) : (
          <>
            {/* Modal Header & Top Tag */}
            <div className="shrink-0 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#e0ece6] text-[#1f4d3f] text-[10px] font-extrabold uppercase tracking-wide">
                  NO BROKERS • ZERO BROKERAGE DIRECT LISTING
                </span>
                <span className="text-xs font-black text-[#FF9A1F]">
                  Step {currentStep} of 4
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#17324D] mt-1">
                Post Your Property Free
              </h2>
              <p className="text-xs text-slate-600">
                Direct Owner &amp; Builder verified listings. All fields are mandatory to ensure security.
              </p>

              {/* 4-Step Progress Indicator Bar */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[
                  { num: 1, label: 'House & GPS' },
                  { num: 2, label: 'Owner Details' },
                  { num: 3, label: 'Media & Bill' },
                  { num: 4, label: 'Declaration' },
                ].map((s) => (
                  <div key={s.num} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span className={currentStep >= s.num ? 'text-[#1f4d3f]' : 'text-slate-400'}>
                        {s.num}. {s.label}
                      </span>
                      {currentStep > s.num && <Check size={12} className="text-emerald-600 stroke-[3]" />}
                    </div>
                    <div className={`h-1.5 rounded-full transition-all ${
                      currentStep > s.num
                        ? 'bg-emerald-600'
                        : currentStep === s.num
                        ? 'bg-[#FF9A1F]'
                        : 'bg-[#e5dac4]'
                    }`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div ref={formContainerRef} className="overflow-y-auto pr-1 flex-1 space-y-3.5 scroll-smooth">

              {/* ==============================================================
                  STEP 1: HOUSE DETAILS & LIVE LOCATION (MANDATORY GPS)
                  ============================================================== */}
              {currentStep === 1 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* 1. Lister Type: Owner vs Builder */}
                  <div>
                    <label className="block text-xs font-black text-[#17324D] mb-1">
                      1. I am listing as: <span className="text-rose-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-[#f4ebe0] p-1.5 rounded-2xl border border-[#e5dac4]">
                      <button
                        type="button"
                        onClick={() => setListerType('Owner')}
                        className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                          listerType === 'Owner'
                            ? 'bg-[#1f4d3f] text-white shadow-sm'
                            : 'text-[#17324D] hover:bg-white/50'
                        }`}
                      >
                        <Home size={15} />
                        <span>Property Owner</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setListerType('Builder')}
                        className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                          listerType === 'Builder'
                            ? 'bg-[#1f4d3f] text-white shadow-sm'
                            : 'text-[#17324D] hover:bg-white/50'
                        }`}
                      >
                        <Building size={15} />
                        <span>Builder / Developer</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Category & Subtype */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        2. Property Category: <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      >
                        <option value="flat">Full Flat / Apartment</option>
                        <option value="pg">PG / Hostel Bed &amp; Meals</option>
                        <option value="room">Single / Shared Independent Room</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        3. Configuration / Type: <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={subtype}
                        onChange={(e) => setSubtype(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      >
                        {category === 'flat' && (
                          <>
                            <option value="1 BHK">1 BHK Flat</option>
                            <option value="2 BHK">2 BHK Flat</option>
                            <option value="3 BHK">3 BHK Flat</option>
                            <option value="4 BHK">4 BHK Luxury Apartment</option>
                            <option value="Independent House">Independent House / Villa</option>
                          </>
                        )}
                        {category === 'pg' && (
                          <>
                            <option value="Single Sharing Bed">Single Sharing Private Bed</option>
                            <option value="Double Sharing Bed">Double Sharing Bed</option>
                            <option value="Triple Sharing Bed">Triple Sharing Bed</option>
                            <option value="Four Sharing Bed">Four Sharing Budget Bed</option>
                          </>
                        )}
                        {category === 'room' && (
                          <>
                            <option value="Single Private Room">Single Private Room</option>
                            <option value="Double Shared Room">Double Shared Room</option>
                            <option value="1 RK Studio">1 RK Studio Unit</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* 4. Property Title */}
                  <div>
                    <label className="block text-xs font-black text-[#17324D] mb-1">
                      4. Property Title: <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setStepErrors((prev) => ({ ...prev, title: '' }));
                      }}
                      placeholder="e.g. Spacious 2 BHK Luxury Flat near Sector V Metro"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                    />
                    {stepErrors.title && <p className="text-[11px] text-rose-600 font-bold mt-1">{stepErrors.title}</p>}
                  </div>

                  {/* 5. Furnishing, Bathroom & Kitchen */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        5. Furnishing: <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={furnishing}
                        onChange={(e) => setFurnishing(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none"
                      >
                        <option value="Fully-furnished">Fully-furnished</option>
                        <option value="Semi-furnished">Semi-furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        6. Bathroom: <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={bathroom}
                        onChange={(e) => setBathroom(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none"
                      >
                        <option value="Private">Private / Attached</option>
                        <option value="Common">Common / Shared</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        7. Kitchen: <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={kitchen}
                        onChange={(e) => setKitchen(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none"
                      >
                        <option value="Private Modular">Private Modular</option>
                        <option value="Shared Kitchen">Shared Kitchen</option>
                        <option value="No Kitchen">No Kitchen</option>
                      </select>
                    </div>
                  </div>

                  {/* 8. Live GPS Location (MANDATORY REQUIREMENT) */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-[#f4ebe0] border-2 border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-xs text-[#1f4d3f]">
                        <Navigation size={15} className="text-emerald-700 animate-pulse" />
                        <span>8. Live Property Location (GPS Coordinates) <span className="text-rose-600">*</span></span>
                      </div>
                      {liveLocation ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1 border border-emerald-300">
                          <Check size={11} /> GPS Captured
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                          Required
                        </span>
                      )}
                    </div>

                    {/* Location Action Card */}
                    <div 
                      onClick={fetchLiveLocation}
                      className={`p-2.5 rounded-xl border-2 transition cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
                        liveLocation
                          ? 'bg-white border-emerald-500 shadow-xs'
                          : 'bg-white border-dashed border-[#FF9A1F] hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          liveLocation ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-[#FF9A1F]'
                        }`}>
                          <MapPin size={20} />
                        </div>
                        <div className="min-w-0">
                          {isFetchingLocation ? (
                            <p className="text-xs font-bold text-slate-700 animate-pulse">
                              📡 Fetching GPS coordinates...
                            </p>
                          ) : liveLocation ? (
                            <div>
                              <p className="text-xs font-black text-emerald-900 flex items-center gap-1.5 truncate">
                                <span>Lat: {liveLocation.lat}° N, Lng: {liveLocation.lng}° E</span>
                                <span className="text-[10px] text-slate-500 font-semibold">(±{liveLocation.accuracy}m)</span>
                              </p>
                              <p className="text-[11px] text-slate-600 truncate">
                                Area: {liveLocation.address} · {liveLocation.timestamp}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-black text-[#17324D]">
                                Click to Capture Live GPS Location Now
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Make sure device location / GPS is turned ON in browser.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchLiveLocation();
                        }}
                        disabled={isFetchingLocation}
                        className="px-3 py-1.5 rounded-lg bg-[#1f4d3f] hover:bg-[#15382e] text-white text-[11px] font-black shrink-0 transition"
                      >
                        {isFetchingLocation ? 'Fetching...' : liveLocation ? 'Re-fetch GPS' : 'Enable & Fetch'}
                      </button>
                    </div>

                    {locationError && (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-start gap-1.5">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <div>
                          <span>{locationError}</span>
                          <button
                            type="button"
                            onClick={fetchLiveLocation}
                            className="block mt-0.5 underline hover:text-rose-900 cursor-pointer text-[10px]"
                          >
                            Click to re-try location access
                          </button>
                        </div>
                      </div>
                    )}
                    {stepErrors.liveLocation && (
                      <p className="text-[11px] text-rose-600 font-bold">{stepErrors.liveLocation}</p>
                    )}
                  </div>

                  {/* 9. Locality & Exact Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        9. Locality / Area: <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={locality}
                        onChange={(e) => {
                          setLocality(e.target.value);
                          setStepErrors((prev) => ({ ...prev, locality: '' }));
                        }}
                        placeholder="e.g. Rajpur Sonarpur, Salt Lake, New Town"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      />
                      {stepErrors.locality && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{stepErrors.locality}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        10. Exact Building / House Address: <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={exactAddress}
                        onChange={(e) => {
                          setExactAddress(e.target.value);
                          setStepErrors((prev) => ({ ...prev, exactAddress: '' }));
                        }}
                        placeholder="e.g. Flat 3B, Green View Apts, Station Road"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      />
                      {stepErrors.exactAddress && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{stepErrors.exactAddress}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  STEP 2: OWNER OR BUILDER FULL CONTACT DETAILS
                  ============================================================== */}
              {currentStep === 2 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-semibold leading-relaxed">
                    ℹ️ <strong>Contact Integrity:</strong> All contact information is securely stored. Tenants will only be able to view these contact channels after admin approval.
                  </div>

                  {/* 1. Full Legal Name */}
                  <div>
                    <label className="block text-xs font-black text-[#17324D] mb-1">
                      1. {listerType === 'Builder' ? 'Builder / Company Representative Full Name' : 'Owner Full Legal Name'}: <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setStepErrors((prev) => ({ ...prev, fullName: '' }));
                      }}
                      placeholder="e.g. Soumyadeep Bera"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                    />
                    {stepErrors.fullName && <p className="text-[11px] text-rose-600 font-bold mt-1">{stepErrors.fullName}</p>}
                  </div>

                  {/* 2. Primary Mobile Number */}
                  <div>
                    <label className="block text-xs font-black text-[#17324D] mb-1">
                      2. Primary Contact Phone Number (+91): <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none">
                        <Phone size={14} className="text-slate-400" />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(val);
                          setStepErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        placeholder="10-digit mobile number"
                        className="w-full pl-16 pr-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] tracking-wide outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      />
                    </div>
                    {stepErrors.phone && <p className="text-[11px] text-rose-600 font-bold mt-1">{stepErrors.phone}</p>}
                  </div>

                  {/* 3. WhatsApp Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-black text-[#17324D]">
                        3. WhatsApp Number (+91): <span className="text-rose-600">*</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={isWhatsappSame}
                          onChange={(e) => setIsWhatsappSame(e.target.checked)}
                          className="rounded text-[#1f4d3f] focus:ring-0"
                        />
                        <span>Same as primary mobile</span>
                      </label>
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none">
                        <span className="text-emerald-600 font-black text-sm">💬</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        disabled={isWhatsappSame}
                        value={whatsapp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setWhatsapp(val);
                          setStepErrors((prev) => ({ ...prev, whatsapp: '' }));
                        }}
                        placeholder="10-digit WhatsApp number"
                        className="w-full pl-16 pr-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] tracking-wide outline-none focus:ring-2 focus:ring-[#FF9A1F] disabled:bg-slate-100"
                      />
                    </div>
                    {stepErrors.whatsapp && <p className="text-[11px] text-rose-600 font-bold mt-1">{stepErrors.whatsapp}</p>}
                  </div>

                  {/* 4. Email Address */}
                  <div>
                    <label className="block text-xs font-black text-[#17324D] mb-1">
                      4. Official Email Address: <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setStepErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        placeholder="e.g. owner@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      />
                    </div>
                    {stepErrors.email && <p className="text-[11px] text-rose-600 font-bold mt-1">{stepErrors.email}</p>}
                  </div>

                  {/* 5. Alternate Mobile Number (MANDATORY REQUIREMENT) */}
                  <div>
                    <label className="block text-xs font-black text-[#17324D] mb-1">
                      5. Alternate Mobile Number (+91): <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none">
                        <Phone size={14} className="text-slate-400" />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={alternatePhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setAlternatePhone(val);
                          setStepErrors((prev) => ({ ...prev, alternatePhone: '' }));
                        }}
                        placeholder="10-digit secondary contact number"
                        className="w-full pl-16 pr-3.5 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] tracking-wide outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Used if primary number is busy or unreachable during tenant visits.</p>
                    {stepErrors.alternatePhone && <p className="text-[11px] text-rose-600 font-bold mt-1">{stepErrors.alternatePhone}</p>}
                  </div>
                </div>
              )}

              {/* ==============================================================
                  STEP 3: PRICING, RULES & MEDIA (3 PHOTOS + 20MB VIDEO + CURRENT BILL)
                  ============================================================== */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Pricing Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        1. Monthly Rent (₹): <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="500"
                        value={rent}
                        onChange={(e) => {
                          setRent(e.target.value);
                          setStepErrors((prev) => ({ ...prev, rent: '' }));
                        }}
                        placeholder="8500"
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      />
                      {stepErrors.rent && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{stepErrors.rent}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        2. Security Deposit (₹): <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={deposit}
                        onChange={(e) => {
                          setDeposit(e.target.value);
                          setStepErrors((prev) => ({ ...prev, deposit: '' }));
                        }}
                        placeholder="17000"
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      />
                      {stepErrors.deposit && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{stepErrors.deposit}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#17324D] mb-1">
                        3. Maintenance: <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={maintenance}
                        onChange={(e) => {
                          setMaintenance(e.target.value);
                          setStepErrors((prev) => ({ ...prev, maintenance: '' }));
                        }}
                        placeholder="Included or ₹500/mo"
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                      />
                      {stepErrors.maintenance && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{stepErrors.maintenance}</p>}
                    </div>
                  </div>

                  {/* House Rules */}
                  <div>
                    <label className="block text-xs font-black text-[#17324D] mb-1.5">
                      4. Property &amp; House Rules: <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_RULES.map((rule) => {
                        const active = selectedRules.includes(rule);
                        return (
                          <button
                            key={rule}
                            type="button"
                            onClick={() => toggleRule(rule)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              active
                                ? 'bg-[#1f4d3f] text-white shadow-xs'
                                : 'bg-white border border-[#d8cba9] text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {active ? <Check size={12} className="stroke-[3]" /> : <span>+</span>}
                            <span>{rule}</span>
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={customRules}
                      onChange={(e) => setCustomRules(e.target.value)}
                      placeholder="Add any custom rules (e.g. Vegetarian only, 2-wheeler parking only)"
                      className="w-full mt-2 px-3 py-2 rounded-xl bg-white border border-[#d8cba9] text-xs font-bold text-[#17324D] outline-none focus:ring-2 focus:ring-[#FF9A1F]"
                    />
                    {stepErrors.rules && <p className="text-[11px] text-rose-600 font-bold mt-1">{stepErrors.rules}</p>}
                  </div>

                  {/* 5. Upload 3 Photos in 3 Different Angles (MANDATORY REQUIREMENT) */}
                  <div className="p-3.5 rounded-2xl bg-[#f4ebe0] border border-[#e5dac4] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-xs text-[#17324D]">
                        <Camera size={16} className="text-[#FF9A1F]" />
                        <span>5. Upload 3 Photos (3 Different Angles &amp; Sides) <span className="text-rose-600">*</span></span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500">All 3 Required</span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Upload 3 distinct photos: Front/Entrance, Living/Bedroom, and Balcony/Kitchen side.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Photo 1: Front / Entrance */}
                      <div className="bg-white p-2.5 rounded-xl border border-[#d8cba9] text-center space-y-2">
                        <span className="block text-[11px] font-black text-[#17324D]">
                          Angle 1: Front / Entrance
                        </span>
                        {photoAngle1 ? (
                          <div className="relative rounded-lg overflow-hidden border border-emerald-300 group">
                            <img src={photoAngle1.preview} alt="Angle 1" className="w-full h-24 object-cover" />
                            <button
                              type="button"
                              onClick={() => setPhotoAngle1(null)}
                              className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                              ✓ Front View
                            </span>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              id="photo-angle-1"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, 'photoAngle1')}
                              className="hidden"
                            />
                            <label
                              htmlFor="photo-angle-1"
                              className="w-full h-24 rounded-lg border-2 border-dashed border-[#d8cba9] hover:bg-slate-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition p-2"
                            >
                              <Camera size={20} className="text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-600">Upload Front Side</span>
                            </label>
                          </div>
                        )}
                        {stepErrors.photoAngle1 && <p className="text-[10px] text-rose-600 font-bold">{stepErrors.photoAngle1}</p>}
                      </div>

                      {/* Photo 2: Living / Bedroom */}
                      <div className="bg-white p-2.5 rounded-xl border border-[#d8cba9] text-center space-y-2">
                        <span className="block text-[11px] font-black text-[#17324D]">
                          Angle 2: Living / Bedroom
                        </span>
                        {photoAngle2 ? (
                          <div className="relative rounded-lg overflow-hidden border border-emerald-300 group">
                            <img src={photoAngle2.preview} alt="Angle 2" className="w-full h-24 object-cover" />
                            <button
                              type="button"
                              onClick={() => setPhotoAngle2(null)}
                              className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                              ✓ Room View
                            </span>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              id="photo-angle-2"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, 'photoAngle2')}
                              className="hidden"
                            />
                            <label
                              htmlFor="photo-angle-2"
                              className="w-full h-24 rounded-lg border-2 border-dashed border-[#d8cba9] hover:bg-slate-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition p-2"
                            >
                              <Camera size={20} className="text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-600">Upload Room Side</span>
                            </label>
                          </div>
                        )}
                        {stepErrors.photoAngle2 && <p className="text-[10px] text-rose-600 font-bold">{stepErrors.photoAngle2}</p>}
                      </div>

                      {/* Photo 3: Balcony / Kitchen / Other side */}
                      <div className="bg-white p-2.5 rounded-xl border border-[#d8cba9] text-center space-y-2">
                        <span className="block text-[11px] font-black text-[#17324D]">
                          Angle 3: Balcony / Kitchen
                        </span>
                        {photoAngle3 ? (
                          <div className="relative rounded-lg overflow-hidden border border-emerald-300 group">
                            <img src={photoAngle3.preview} alt="Angle 3" className="w-full h-24 object-cover" />
                            <button
                              type="button"
                              onClick={() => setPhotoAngle3(null)}
                              className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                              ✓ Side View
                            </span>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              id="photo-angle-3"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, 'photoAngle3')}
                              className="hidden"
                            />
                            <label
                              htmlFor="photo-angle-3"
                              className="w-full h-24 rounded-lg border-2 border-dashed border-[#d8cba9] hover:bg-slate-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition p-2"
                            >
                              <Camera size={20} className="text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-600">Upload Balcony/Side</span>
                            </label>
                          </div>
                        )}
                        {stepErrors.photoAngle3 && <p className="text-[10px] text-rose-600 font-bold">{stepErrors.photoAngle3}</p>}
                      </div>
                    </div>
                  </div>

                  {/* 6. Upload Room Full Video (Max 20MB MANDATORY REQUIREMENT) */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-[#f4ebe0] border-2 border-amber-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-xs text-[#17324D]">
                        <Video size={16} className="text-[#FF9A1F]" />
                        <span>6. Upload Room Full Video Walkthrough <span className="text-rose-600">*</span></span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300">
                        Max 20 MB Limit
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Record and upload a walkthrough video of the room/flat. File size must not exceed 20MB.
                    </p>

                    {videoFile ? (
                      <div className="bg-white p-3 rounded-xl border border-emerald-300 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-black text-emerald-800 truncate">
                            <Video size={16} />
                            <span className="truncate">{videoFile.name}</span>
                            <span className="text-[10px] text-slate-500 font-bold">({videoFile.sizeMB} MB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoFile(null);
                              setVideoError('');
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                        <video
                          src={videoFile.preview}
                          controls
                          className="w-full max-h-44 rounded-lg bg-black"
                        />
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id="property-video-upload"
                          accept="video/mp4,video/quicktime,video/webm"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="property-video-upload"
                          className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#FF9A1F] bg-white hover:bg-amber-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition text-center"
                        >
                          <Video size={22} className="text-[#FF9A1F]" />
                          <span className="text-xs font-black text-[#17324D]">
                            Click to Select Room Video (MP4 / MOV)
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            Strict Maximum Limit: 20 MB
                          </span>
                        </label>
                      </div>
                    )}

                    {videoError && (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>{videoError}</span>
                      </div>
                    )}
                    {stepErrors.video && <p className="text-[11px] text-rose-600 font-bold">{stepErrors.video}</p>}
                  </div>

                  {/* 7. Previous Month's Current/Electricity Bill (MOVED TO STEP 3 AS REQUESTED!) */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-[#f4ebe0] border-2 border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-xs text-[#17324D]">
                        <Zap size={16} className="text-amber-600" />
                        <span>7. Previous Month&apos;s Current Bill of this Home <span className="text-rose-600">*</span></span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">PDF, JPG, PNG (Max 5MB)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Upload the previous month&apos;s electricity/current bill of this property to authenticate genuine ownership and verify zero brokerage.
                    </p>

                    {electricityBill ? (
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-300">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 truncate">
                          <FileText size={16} />
                          <span className="truncate">{billFileName}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">({billFileSize})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setElectricityBill(null);
                            setBillFileName('');
                            setBillFileSize('');
                            if (billInputRef.current) billInputRef.current.value = '';
                          }}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={billInputRef}
                          type="file"
                          id="electricity-bill-step3"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleBillUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="electricity-bill-step3"
                          className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-[#1f4d3f] bg-white hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-[#17324D] cursor-pointer transition"
                        >
                          <Upload size={16} className="text-emerald-700" />
                          <span>Click to Upload Current / Electricity Bill Document</span>
                        </label>
                      </div>
                    )}

                    {stepErrors.electricityBill && (
                      <p className="text-[11px] text-rose-600 font-bold mt-1">{stepErrors.electricityBill}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ==============================================================
                  STEP 4: REVIEW & LEGAL DECLARATION (SUBMIT TO ADMIN)
                  ============================================================== */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Summary Card */}
                  <div className="p-4 rounded-2xl bg-white border border-[#d8cba9] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#e5dac4]">
                      <h4 className="font-black text-sm text-[#17324D]">
                        📋 Listing Summary Review
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {listerType} • {subtype}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold">Property Title:</span>
                        <span className="font-black text-slate-800">{title}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold">Monthly Rent:</span>
                        <span className="font-black text-emerald-700">₹{rent} / month</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold">Security Deposit:</span>
                        <span className="font-bold text-slate-700">₹{deposit} ({maintenance})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold">Furnishing &amp; Bath:</span>
                        <span className="font-bold text-slate-700">{furnishing} • {bathroom} Bath</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold">Owner / Lister Name:</span>
                        <span className="font-bold text-slate-700">{fullName} ({phone})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold">Alternate Contact:</span>
                        <span className="font-bold text-slate-700">{alternatePhone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px] font-bold">Live GPS &amp; Address:</span>
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-600 shrink-0" />
                          {exactAddress}, {locality}, {city} (Lat: {liveLocation?.lat}, Lng: {liveLocation?.lng})
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px] font-bold">Media Uploaded:</span>
                        <span className="font-bold text-emerald-800 text-[11px]">
                          ✓ 3 Angle Photos &nbsp;|&nbsp; ✓ Room Video ({videoFile?.sizeMB} MB) &nbsp;|&nbsp; ✓ Current Bill ({billFileName})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Legal Declaration Checkbox (SPECIFIC USER REQUIREMENT) */}
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                      <ShieldAlert size={18} className="text-amber-700 shrink-0" />
                      <span>Legal Undertaking &amp; Fraud Prevention Declaration</span>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={declarationAccepted}
                        onChange={(e) => {
                          setDeclarationAccepted(e.target.checked);
                          setStepErrors((prev) => ({ ...prev, declaration: '' }));
                        }}
                        className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-amber-950 font-bold leading-relaxed select-none">
                        I hereby solemnly declare and verify that all details, live GPS coordinates, 3-angle photographs, room walkthrough video, and previous month&apos;s electricity/current bill provided above are <strong>100% genuine, correct, and truthful</strong>. I explicitly acknowledge and agree that in the event of any fraudulent, false, deceptive, or broker-masked information, <strong>strict legal action, police complaint, and permanent account ban (Strike 2) will be taken against me</strong> by PointKey Administration.
                      </span>
                    </label>

                    {stepErrors.declaration && (
                      <p className="text-[11px] text-rose-600 font-black mt-1">
                        ⚠️ {stepErrors.declaration}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-semibold leading-relaxed">
                    ✨ <strong>What happens next:</strong> Upon clicking submit, your property will be transferred directly to the PointKey Admin Verification Queue. Once the admin team reviews and approves your submission, it will be published live for all tenants to explore!
                  </div>
                </div>
              )}
            </div>

            {/* Error Summary Banner right above buttons if anything is missing */}
            {activeErrorsList.length > 0 && (
              <div className="shrink-0 mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-black">Required: </span>
                  <span className="text-[11px] text-rose-700 font-medium">
                    {activeErrorsList.join(' • ')}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Footer Controls (Back / Next / Submit) */}
            <div className="shrink-0 pt-3 border-t border-[#e5dac4] flex items-center justify-between gap-3 mt-2">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStepErrors({});
                    setCurrentStep(currentStep - 1);
                    formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#d8cba9] bg-white hover:bg-slate-50 text-[#17324D] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white text-xs font-black shadow-md flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting || !declarationAccepted}
                  className="px-6 py-3 rounded-xl bg-[#FF9A1F] hover:bg-[#ea580c] text-white text-xs sm:text-sm font-black shadow-md flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Submitting to Admin Queue...</span>
                  ) : (
                    <>
                      <span>Submit Property for Admin Verification</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
