import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, ListChecks, CalendarClock, ShieldAlert, Wallet, Star, AlertTriangle, Ban, X, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import Footer from '../../components/common/Footer';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/common/Toast';
import OwnerFaceLivenessModal from '../../components/ai/OwnerFaceLivenessModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * =============================================================================
 * OWNER DASHBOARD (OwnerHome.jsx)
 * =============================================================================
 * ওনার ড্যাশবোর্ডে ২-স্ট্রাইক এনফোর্সমেন্ট:
 * - যদি ওনার কোনো নিয়ম ভাঙে (যেমন: AI ভুয়া রুমের ছবি, অফ-প্ল্যাটফর্ম পেমেন্ট দাবি,
 *   বা অতিরিক্ত ভাড়া দাবি), তাহলে এডমিন অ্যাকাউন্ট সাসপেন্ড (Strike 1) করে।
 * - Strike 1 এ থাকাকালীন 'Add Property' উইজার্ড সম্পূর্ণ ডিজেবল থাকবে।
 * - ওনার ড্যাশবোর্ড থেকে অঙ্গীকারনামা সাইন করে এডমিনের কাছে আপিল পাঠাতে পারবে।
 * - এডমিন ম্যানুয়ালি যাচাই করে অ্যাপ্রুভ করলে প্রপার্টি অ্যাড ও অন্যান্য ফিচার আনলক হবে।
 * - Strike 2 এ স্থায়ীভাবে পার্মানেন্ট ব্লক হবে।
 * =============================================================================
 */

export default function OwnerHome() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showVerify, setShowVerify] = useState(false);
  const [toast, setToast] = useState(null);

  // আপিল মোডাল স্টেট
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  useEffect(() => {
    api.get('/properties/owner/my-listings').then(({ data }) => setListings(data.listings || [])).catch(() => {});
    api.get('/visits/owner-requests').then(({ data }) => setRequests(data.requests || [])).catch(() => {});
  }, []);

  const isVerified = user?.verification_status === 'VERIFIED';
  const isSuspended = user?.account_status === 'SUSPENDED';
  const isBlocked = user?.account_status === 'BLOCKED';
  const pendingRequests = requests.filter((r) => r.status === 'REQUESTED').length;

  const handleAddPropertyClick = () => {
    if (isSuspended) {
      setShowAppealModal(true);
      setToast({
        type: 'error',
        message: '⚠️ Add Property is disabled: Your account is suspended (Strike 1). Submit an appeal to reinstate.',
      });
      return;
    }
    if (isBlocked) {
      setToast({
        type: 'error',
        message: '⛔ Account permanently blocked (Strike 2) due to repeated rule violations.',
      });
      return;
    }
    navigate('/owner/add-property');
  };

  const handleSubmitAppeal = async () => {
    if (!agreedToTerms) return;
    setSubmittingAppeal(true);
    try {
      const payload = {
        statement:
          appealText.trim() ||
          'I have read and solemnly pledge to adhere to all PointKey platform rules and regulations. I will not upload AI fake images or demand off-platform payments. I acknowledge that any second violation results in permanent Strike 2 ban.',
      };
      await api.post('/auth/unblock-appeal', payload);
      await refreshUser();
      setShowAppealModal(false);
      setAppealText('');
      setToast({
        type: 'success',
        message: 'Reinstatement appeal submitted! PointKey Admin will manually review your application.',
      });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to submit appeal' });
    } finally {
      setSubmittingAppeal(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-5">
        
        {/* ===================================================================
            STRIKE 1 & STRIKE 2 SUSPENSION NOTICES (OWNER)
            =================================================================== */}
        {isSuspended && (
          <div className="mb-5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm animate-in fade-in">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={26} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-black uppercase text-white tracking-wider">
                      Strike 1 Penalty (Suspended)
                    </span>
                    <span className="text-xs font-bold text-amber-900">
                      Property Creation &amp; Actions Restricted
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-amber-800">
                    <strong>Violation Reason:</strong> {user.block_reason || 'AI fake room images or demanding direct off-platform payments.'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    Under PointKey policy, you cannot add new properties until an Admin reviews and approves your signed undertaking.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {user.unblock_appeal_status === 'SUBMITTED' ? (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Appeal Under Admin Review</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowAppealModal(true)}
                    className="!bg-amber-600 hover:!bg-amber-700 text-white font-bold text-xs"
                  >
                    📝 Submit Unblock Appeal
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {isBlocked && (
          <div className="mb-5 rounded-2xl border-2 border-rose-500 bg-rose-50 p-4 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-3">
              <Ban className="mt-0.5 shrink-0 text-rose-600" size={26} />
              <div>
                <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase text-white tracking-wider">
                  Strike 2 Penalty (Permanent Ban)
                </span>
                <p className="mt-1 text-xs text-rose-900 font-bold">
                  Account Permanently Blocked by Admin
                </p>
                <p className="mt-0.5 text-xs text-rose-800">
                  <strong>Reason:</strong> {user.block_reason || 'Repeated fraudulent practices (AI photos, off-platform payments, or overcharging).'}.
                </p>
                <p className="mt-0.5 text-[11px] text-rose-700">
                  In accordance with PointKey community zero-tolerance policies, repeated violations result in irreversible account termination. No appeals are permitted.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isVerified && !isSuspended && !isBlocked && (
          <div className="mb-4 flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
            <ShieldAlert className="shrink-0 text-amber-500" size={28} />
            <div className="flex-1">
              <p className="font-bold text-amber-800">Get verified to stand out</p>
              <p className="text-xs text-amber-700">Complete the face + Govt ID check. Verified owner badges get 3× more visit requests and enable verified listings.</p>
            </div>
            <Button className="!bg-amber-500 hover:!bg-amber-600" onClick={() => setShowVerify(true)}>Verify now</Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: ListChecks, label: 'My Listings', value: listings.length, to: '/owner/listings', tone: 'text-forest bg-forest/15' },
            { icon: CalendarClock, label: 'Pending Requests', value: pendingRequests, to: '/owner/requests', tone: 'text-navy bg-navy/10' },
            { icon: Wallet, label: 'Booked', value: listings.filter((l) => l.booking_status === 'BOOKED').length, to: '/owner/listings', tone: 'text-orange bg-orange/15' },
            { icon: Star, label: 'Avg Rating', value: user?.average_rating ? Number(user.average_rating).toFixed(1) : '—', to: '/owner/profile', tone: 'text-amber-600 bg-amber-50' },
          ].map(({ icon: Icon, label, value, to, tone }) => (
            <Link key={label} to={to} className="glass-card bg-beige border border-beige-border p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></span>
              <p className="mt-2 text-2xl font-black text-navy">{value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">{label}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-navy">Quick actions</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleAddPropertyClick}
            className={`glass-card bg-beige border border-beige-border flex items-center gap-4 p-5 text-left transition hover:border-forest hover:shadow-lg ${
              isSuspended || isBlocked ? 'opacity-65' : ''
            }`}
          >
            <PlusCircle size={30} className={isSuspended || isBlocked ? 'text-slate-400' : 'text-forest'} />
            <span>
              <span className="block font-extrabold text-navy">
                {isSuspended ? 'Add Property (Suspended)' : isBlocked ? 'Add Property (Blocked)' : 'Add Property'}
              </span>
              <span className="text-xs text-slate-600">
                {isSuspended ? 'Disabled due to rule violation. Click to appeal.' : 'Room, PG or Flat — with timestamped photos'}
              </span>
            </span>
          </button>
          <button onClick={() => navigate('/owner/requests')} className="glass-card bg-beige border border-beige-border flex items-center gap-4 p-5 text-left transition hover:border-forest hover:shadow-lg">
            <CalendarClock size={30} className="text-navy" />
            <span><span className="block font-extrabold text-navy">Visit Requests</span><span className="text-xs text-slate-600">{pendingRequests} awaiting your confirmation</span></span>
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-800">My listings</h2>
            <Link to="/owner/listings" className="text-xs font-bold text-trust hover:underline">View all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.slice(0, 3).map((l) => (
              <Link key={l.id} to="/owner/listings" className="glass-card overflow-hidden transition hover:shadow-lg">
                {l.cover_url && <img src={l.cover_url} alt={l.title} className="h-32 w-full object-cover" loading="lazy" />}
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-slate-800">{l.property_code} · {l.title}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    <Badge tone={l.booking_status === 'BOOKED' ? 'red' : 'green'}>{l.booking_status}</Badge>
                    <Badge tone={l.verification_status === 'VERIFIED' ? 'green' : 'amber'}>{l.verification_status}</Badge>
                  </div>
                </div>
              </Link>
            ))}
            {listings.length === 0 && <p className="text-sm text-slate-400">No listings yet — add your first property.</p>}
          </div>
        </div>
      </main>

      {/* =====================================================================
          OWNER UNBLOCK APPEAL & RULES UNDERTAKING MODAL
          ===================================================================== */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Landlord Reinstatement Undertaking
                </h3>
                <p className="text-xs text-slate-500">
                  PointKey Platform Rules &amp; Anti-Fraud Pledge (1st Warning)
                </p>
              </div>
              <button
                onClick={() => setShowAppealModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <strong>⚠️ Warning (Strike 1):</strong> This is your <u>First and Only Warning</u>. If reinstated and you violate any policy again (such as fake AI photos, requesting off-platform payments, or overcharging), your account will be <strong>Permanently Banned (Strike 2)</strong> with zero appeals allowed.
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-1.5 text-slate-600">
                <p className="font-bold text-slate-800">PointKey Landlord Obligations:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li><strong>Real Photos Only:</strong> Strictly no AI-generated, copied, or misleading room images. All pictures must be taken on-site.</li>
                  <li><strong>App-Only Payments:</strong> All booking advance and payments must be processed via PointKey. Never solicit cash or off-platform direct transfers.</li>
                  <li><strong>No Extra Rent Demands:</strong> Rent and deposit must strictly match the price listed in the app.</li>
                  <li><strong>Honest Room Availability:</strong> If a room is confirmed in the app, it must be honored on-site without bait-and-switch.</li>
                </ul>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Your Pledge &amp; Statement to Admin:
                </label>
                <textarea
                  rows={3}
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                  placeholder="I pledge to follow all PointKey rules, provide only real photos, and process all payments through the platform..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-forest focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 accent-forest"
                />
                <span>
                  I have read, understood, and solemnly pledge to follow all PointKey rules and regulations. I acknowledge that any second violation will permanently terminate my owner account.
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowAppealModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!agreedToTerms || submittingAppeal}
                onClick={handleSubmitAppeal}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submittingAppeal ? 'Submitting...' : 'Submit Reinstatement Appeal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerify && <OwnerFaceLivenessModal onClose={() => setShowVerify(false)} />}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <Footer />
      <BottomNav />
    </div>
  );
}
