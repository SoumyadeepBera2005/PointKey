import { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building2,
  Home,
  MapPin,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  IndianRupee,
  AlertTriangle,
  RotateCcw,
  Eye,
  Check,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { formatINR } from '../../utils/currencyFormatter';

export default function UserActivityModal({
  isOpen,
  onClose,
  user: initialUser,
  mode = 'TENANT', // 'TENANT' | 'OWNER'
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState(mode === 'OWNER' ? 'properties' : 'visits');
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState({
    user: null,
    properties: [],
    visitsBooked: [],
    visitsReceived: [],
    paymentsMade: [],
    paymentsReceived: [],
    notifications: [],
  });

  // Action status state
  const [actionMessage, setActionMessage] = useState('');

  const loadData = async () => {
    if (!initialUser?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${initialUser.id}/activity`);
      if (res.data) {
        setActivity(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch user activity from backend:', err);
      // Fallback: build from initialUser & localStorage
      let localProps = [];
      try {
        const p1 = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
        const p2 = JSON.parse(localStorage.getItem('prent_user_posted_properties') || '[]');
        const p3 = JSON.parse(localStorage.getItem('prent_verified_admin_properties') || '[]');
        const allLocal = [...p1, ...p2, ...p3];
        localProps = allLocal.filter(
          (p) =>
            p.owner_id === initialUser.id ||
            p.owner_email === initialUser.email ||
            p.owner_phone === initialUser.phone
        );
      } catch {}

      setActivity({
        user: initialUser,
        properties: localProps,
        visitsBooked: [],
        visitsReceived: [],
        paymentsMade: [],
        paymentsReceived: [],
        notifications: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialUser?.id) {
      setActiveTab(mode === 'OWNER' ? 'properties' : 'visits');
      loadData();
    }
  }, [isOpen, initialUser?.id, mode]);

  if (!isOpen || !initialUser) return null;

  const user = activity.user || initialUser;
  const isSuspended = user.account_status === 'SUSPENDED';
  const isBlocked = user.account_status === 'BLOCKED';
  const strikes = Number(user.strike_count || 0);

  // Property Verification Action directly inside modal
  const handlePropertyVerify = async (propId, decision) => {
    try {
      await api.post(`/admin/properties/${propId}/verify`, { decision });
      setActionMessage(`Property status updated to ${decision.toLowerCase()}!`);
      setTimeout(() => setActionMessage(''), 3000);
      loadData();
      if (onRefresh) onRefresh();
      window.dispatchEvent(new CustomEvent('prent_property_status_changed', { detail: { id: propId, status: decision } }));
    } catch {
      setActionMessage('Failed to update property status');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  // Restore User to ACTIVE
  const handleRestoreUser = async () => {
    try {
      await api.patch(`/admin/users/${user.id}/status`, {
        account_status: 'ACTIVE',
        strike_count: 0,
      });
      setActionMessage('User successfully restored to ACTIVE!');
      setTimeout(() => setActionMessage(''), 3000);
      loadData();
      if (onRefresh) onRefresh();
    } catch {
      setActionMessage('Failed to restore user');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const visitsList = mode === 'OWNER' ? activity.visitsReceived : activity.visitsBooked;
  const paymentsList = mode === 'OWNER' ? activity.paymentsReceived : activity.paymentsMade;
  const propertiesList = activity.properties || [];

  // Calculate total payment amount
  const totalPaymentSum = paymentsList.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#fffdfa] border border-[#d8cba9] rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-6 text-[#17324D] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==============================================================
            HEADER: USER PROFILE & ACTIONS
            ============================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebdcc0] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#17324D] text-white flex items-center justify-center font-black text-xl shadow-md">
              {(user.full_name || user.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-[#17324D] leading-tight">
                  {user.full_name || user.name || 'User Activity'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                  {user.role || mode}
                </span>
                {isBlocked ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                    ⛔ BLOCKED (Strike 2)
                  </span>
                ) : isSuspended ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                    ⚠️ SUSPENDED (Strike 1)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ ACTIVE ({strikes} Strikes)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ID: <span className="font-mono text-slate-700">{user.id}</span> · Joined:{' '}
                {new Date(user.created_at || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isSuspended || isBlocked) && (
              <button
                type="button"
                onClick={handleRestoreUser}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 size={14} /> Restore Active
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f4ebda] hover:bg-[#ebdcc0] text-[#17324D] flex items-center justify-center font-bold transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="my-2 p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold animate-in fade-in">
            {actionMessage}
          </div>
        )}

        {/* ==============================================================
            QUICK STATS SUMMARY CARDS (4 Cards)
            ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
          <div className="bg-[#f9f5eb] border border-[#e8dac0] rounded-2xl p-3">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Contact</span>
            <p className="text-xs font-black text-[#17324D] mt-1 truncate">📞 {user.phone || 'N/A'}</p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">✉️ {user.email || 'N/A'}</p>
          </div>

          <div className="bg-[#f9f5eb] border border-[#e8dac0] rounded-2xl p-3">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
              {mode === 'OWNER' ? 'Visit Requests' : 'Visits Booked'}
            </span>
            <p className="text-xl font-black text-[#17324D] mt-0.5">{visitsList.length}</p>
            <p className="text-[10px] text-slate-500">Scheduled property tours</p>
          </div>

          <div className="bg-[#f9f5eb] border border-[#e8dac0] rounded-2xl p-3">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
              {mode === 'OWNER' ? 'Revenue Received' : 'Payments Done'}
            </span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{formatINR(totalPaymentSum)}</p>
            <p className="text-[10px] text-slate-500">{paymentsList.length} transactions total</p>
          </div>

          <div className="bg-[#f9f5eb] border border-[#e8dac0] rounded-2xl p-3">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Properties</span>
            <p className="text-xl font-black text-sky-800 mt-0.5">{propertiesList.length}</p>
            <p className="text-[10px] text-slate-500">
              {propertiesList.filter((p) => p.verification_status === 'VERIFIED').length} Verified &amp; Live
            </p>
          </div>
        </div>

        {/* ==============================================================
            NAVIGATION TABS
            ============================================================== */}
        <div className="flex items-center gap-1.5 border-b border-[#e8dac0] pb-2 my-2 overflow-x-auto text-xs font-bold">
          {mode === 'OWNER' ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('properties')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'properties'
                    ? 'bg-[#17324D] text-white shadow-xs font-black'
                    : 'bg-[#f4ebda] text-[#17324D] hover:bg-[#ebdcc0]'
                }`}
              >
                <Building2 size={13} /> Posted Properties &amp; Rooms ({propertiesList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'payments'
                    ? 'bg-[#17324D] text-white shadow-xs font-black'
                    : 'bg-[#f4ebda] text-[#17324D] hover:bg-[#ebdcc0]'
                }`}
              >
                <CreditCard size={13} /> Payments Received ({paymentsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('visits')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'visits'
                    ? 'bg-[#17324D] text-white shadow-xs font-black'
                    : 'bg-[#f4ebda] text-[#17324D] hover:bg-[#ebdcc0]'
                }`}
              >
                <Calendar size={13} /> Visit Requests ({visitsList.length})
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('visits')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'visits'
                    ? 'bg-[#17324D] text-white shadow-xs font-black'
                    : 'bg-[#f4ebda] text-[#17324D] hover:bg-[#ebdcc0]'
                }`}
              >
                <Calendar size={13} /> Visit Bookings ({visitsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'payments'
                    ? 'bg-[#17324D] text-white shadow-xs font-black'
                    : 'bg-[#f4ebda] text-[#17324D] hover:bg-[#ebdcc0]'
                }`}
              >
                <CreditCard size={13} /> Payment History ({paymentsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('properties')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'properties'
                    ? 'bg-[#17324D] text-white shadow-xs font-black'
                    : 'bg-[#f4ebda] text-[#17324D] hover:bg-[#ebdcc0]'
                }`}
              >
                <Home size={13} /> Listings Posted ({propertiesList.length})
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-[#17324D] text-white shadow-xs font-black'
                : 'bg-[#f4ebda] text-[#17324D] hover:bg-[#ebdcc0]'
            }`}
          >
            <ShieldAlert size={13} /> Notifications &amp; Penalties ({activity.notifications?.length || 0})
          </button>
        </div>

        {/* ==============================================================
            TAB CONTENT PANES
            ============================================================== */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mt-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 mx-auto border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold">Loading tenant &amp; owner activity records...</p>
            </div>
          ) : (
            <>
              {/* ==========================================================
                  TAB: POSTED PROPERTIES & ROOMS
                  ========================================================== */}
              {activeTab === 'properties' && (
                <div className="space-y-3">
                  {propertiesList.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 bg-white border border-[#ebdcc0] rounded-2xl p-6">
                      <Home size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm">No properties posted by this user yet.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        When this user lists a Flat, PG, or Room, all details and verification status appear here.
                      </p>
                    </div>
                  ) : (
                    propertiesList.map((p) => {
                      let photos = [];
                      try {
                        photos = typeof p.photos === 'string' ? JSON.parse(p.photos) : (Array.isArray(p.photos) ? p.photos : []);
                      } catch {}
                      if (photos.length === 0 && p.cover_url) {
                        photos = [{ label: 'Cover', url: p.cover_url }];
                      }

                      return (
                        <div
                          key={p.id}
                          className="bg-white border border-[#ebdcc0] rounded-2xl p-4 shadow-xs space-y-3"
                        >
                          {/* Property Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-wider">
                                {p.property_code || 'PROP'} · {p.category || 'Listing'}
                              </span>
                              {p.verification_status === 'VERIFIED' ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                                  ✓ Verified &amp; Live
                                </span>
                              ) : p.verification_status === 'UNDER_REVIEW' ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black border border-sky-300">
                                  🔍 Under Review
                                </span>
                              ) : p.verification_status === 'REJECTED' ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300">
                                  ✕ Rejected
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                                  ⏳ Pending Verification
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-black text-emerald-700">
                              {formatINR(p.rent_amount)} / month
                            </span>
                          </div>

                          {/* Title & Location */}
                          <div>
                            <h4 className="text-sm font-black text-[#17324D]">{p.title}</h4>
                            <p className="text-xs text-slate-600 mt-0.5">
                              📍 {p.exact_address ? `${p.exact_address}, ` : ''}{p.locality}, {p.city}
                            </p>
                          </div>

                          {/* Live GPS Coordinates */}
                          {p.lat && p.lng && (
                            <div className="pt-0.5">
                              <a
                                href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition border border-emerald-200"
                              >
                                <MapPin size={13} className="text-emerald-700" />
                                <span>Verified GPS: {p.lat}, {p.lng}</span>
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          )}

                          {/* Photos & Media Preview */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                            {photos.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                {photos.map((ph, idx) => (
                                  <img
                                    key={idx}
                                    src={ph.url}
                                    alt={ph.label || 'Room Angle'}
                                    title={ph.label || 'Room Angle'}
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                                  />
                                ))}
                              </div>
                            )}

                            {p.video_name && (
                              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 text-xs font-bold border border-sky-200 flex items-center gap-1">
                                <Video size={13} /> Walkthrough Video
                              </span>
                            )}

                            {(p.electricity_bill_uploaded || p.electricity_bill_name || p.electricity_bill_url) && (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1">
                                <FileText size={13} /> Electricity Bill Verified
                              </span>
                            )}
                          </div>

                          {/* Property Admin Verification Actions */}
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            {p.verification_status !== 'UNDER_REVIEW' && (
                              <button
                                type="button"
                                onClick={() => handlePropertyVerify(p.id, 'UNDER_REVIEW')}
                                className="px-3 py-1.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 text-xs font-bold transition cursor-pointer"
                              >
                                🔍 Mark Under Review
                              </button>
                            )}
                            {p.verification_status !== 'REJECTED' && (
                              <button
                                type="button"
                                onClick={() => handlePropertyVerify(p.id, 'REJECTED')}
                                className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
                              >
                                ✕ Reject
                              </button>
                            )}
                            {p.verification_status !== 'VERIFIED' && (
                              <button
                                type="button"
                                onClick={() => handlePropertyVerify(p.id, 'VERIFIED')}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <Check size={14} /> Verify &amp; Publish for Tenants
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ==========================================================
                  TAB: PAYMENT HISTORY
                  ========================================================== */}
              {activeTab === 'payments' && (
                <div className="space-y-2.5">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-emerald-900">
                        {mode === 'OWNER' ? 'Total Collected Revenue' : 'Total Tenant Spend'}
                      </p>
                      <p className="text-lg font-black text-emerald-800 mt-0.5">{formatINR(totalPaymentSum)}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-emerald-800 font-bold text-xs border border-emerald-300">
                      {paymentsList.length} Payments
                    </span>
                  </div>

                  {paymentsList.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 bg-white border border-[#ebdcc0] rounded-2xl p-6">
                      <CreditCard size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm">No payment transactions recorded.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Advance booking payments made through the secure escrow gateway will appear here.
                      </p>
                    </div>
                  ) : (
                    paymentsList.map((pm) => (
                      <div
                        key={pm.id}
                        className="bg-white border border-[#ebdcc0] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#17324D]">
                              {formatINR(pm.amount)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {pm.status || 'SUCCESS'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                              Method: {pm.payment_method || 'UPI'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-bold">
                            Property: {pm.property_title || 'Rental Unit'}{' '}
                            {pm.property_code && <span className="font-mono text-slate-500">({pm.property_code})</span>}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            {mode === 'OWNER' ? (
                              <span>Paid by Tenant: {pm.tenant_name || 'Tenant'} · 📞 {pm.tenant_phone || 'N/A'}</span>
                            ) : (
                              <span>To Owner: {pm.owner_name || 'Owner'} · 📞 {pm.owner_phone || 'N/A'}</span>
                            )}
                          </p>
                        </div>

                        <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                          <p className="font-mono text-[10px] text-slate-400">Order: {pm.gateway_order_id || pm.id}</p>
                          <p>{new Date(pm.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ==========================================================
                  TAB: VISIT BOOKINGS
                  ========================================================== */}
              {activeTab === 'visits' && (
                <div className="space-y-2.5">
                  {visitsList.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 bg-white border border-[#ebdcc0] rounded-2xl p-6">
                      <Calendar size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm">No scheduled visits on record.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        When visits are booked between tenant and owner, they will show up here with time slots.
                      </p>
                    </div>
                  ) : (
                    visitsList.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white border border-[#ebdcc0] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#17324D]">
                              {v.property_title || 'Property Visit'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                v.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : v.status === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {v.status || 'REQUESTED'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600">
                            📅 Date: <strong>{new Date(v.visit_date).toLocaleDateString()}</strong> · Slot:{' '}
                            <strong>{v.time_slot}</strong> ({v.time_window})
                          </p>

                          <p className="text-[11px] text-slate-500">
                            {mode === 'OWNER' ? (
                              <span>Visitor Tenant: {v.tenant_name} · 📞 {v.tenant_phone}</span>
                            ) : (
                              <span>Property Owner: {v.owner_name} · 📞 {v.owner_phone}</span>
                            )}
                          </p>
                        </div>

                        <div className="text-right text-[11px] text-slate-400">
                          <p>Booked on {new Date(v.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ==========================================================
                  TAB: NOTIFICATIONS & PENALTIES
                  ========================================================== */}
              {activeTab === 'notifications' && (
                <div className="space-y-2.5">
                  {activity.notifications?.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 bg-white border border-[#ebdcc0] rounded-2xl p-6">
                      <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
                      <p className="font-bold text-sm">Account is clean with zero penalty notices.</p>
                    </div>
                  ) : (
                    activity.notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border ${
                          n.type?.includes('BLOCK')
                            ? 'bg-rose-50 border-rose-200'
                            : n.type?.includes('SUSPEND')
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-white border-[#ebdcc0]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <b className="text-xs font-black text-[#17324D]">{n.title}</b>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
