import { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/common/Toast';
import UserActivityModal from '../../components/admin/UserActivityModal';
import api from '../../services/api';
import { Ban, Trash2, CheckCircle2, UserX, AlertTriangle, ShieldAlert, FileText, X, Eye } from 'lucide-react';

/**
 * =============================================================================
 * MANAGE TENANTS (ManageTenants.jsx)
 * =============================================================================
 * পয়েন্টকি এডমিন প্যানেল: টেন্যান্টদের ম্যানুয়াল ২-স্ট্রাইক ও আপিল ম্যানেজমেন্ট:
 * - Strike 1 (SUSPENDED): সাময়িক সাসপেন্ড করা। টেন্যান্টের ভিউ ডিটেইলস ও পেমেন্ট বন্ধ থাকে।
 *   টেন্যান্ট চ্যাটবট থেকে রুলস মানার অঙ্গীকারনামা জমা দিতে পারে।
 * - Review Appeal: এডমিন আবেদনকারী টেন্যান্টের অঙ্গীকারনামা পড়ে অ্যাপ্রুভ (ACTIVE) বা রিজেক্ট করতে পারেন।
 * - Strike 2 (BLOCKED): দ্বিতীয়বার নিয়ম ভাঙলে পার্মানেন্ট ব্লক। আর কোনো আপিলের সুযোগ নেই।
 * =============================================================================
 */

const PRESET_TENANT_REASONS = [
  'Off-platform payment attempt / Fraud',
  'Misbehavior or harassment with owner',
  'False identity or fake booking requests',
  'Violation of platform community rules',
  'Damaging property or non-payment dispute',
];

export default function ManageTenants() {
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);

  // মোডাল স্টেট
  const [strikeModalUser, setStrikeModalUser] = useState(null);
  const [selectedStrikeType, setSelectedStrikeType] = useState('1'); // '1' or '2'
  const [selectedReason, setSelectedReason] = useState(PRESET_TENANT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  // আপিল রিভিউ মোডাল স্টেট
  const [reviewAppealUser, setReviewAppealUser] = useState(null);

  // টেন্যান্ট বিস্তারিত ও অ্যাক্টিভিটি মোডাল স্টেট (ভিজিট বুকিং, পেমেন্ট হিস্টোরি ইত্যাদি)
  const [activityUser, setActivityUser] = useState(null);

  const load = () => {
    api.get('/admin/users?role=TENANT')
      .then(({ data }) => {
        let list = data.users || [];
        // যে সকল টেন্যান্ট প্রপার্টি পোস্ট করে TENANT+OWNER বা TENANT+BUILDER হয়েছে তারা ওনার সেকশনে প্রদর্শিত হবে
        list = list.filter((u) => !u.role?.includes('OWNER') && !u.role?.includes('BUILDER'));
        try {
          const localPending = JSON.parse(localStorage.getItem('prent_pending_admin_properties') || '[]');
          const localPosterEmails = new Set(localPending.map((p) => p.owner_email).filter(Boolean));
          const localPosterPhones = new Set(localPending.map((p) => p.owner_phone || p.phone).filter(Boolean));
          const localPosterIds = new Set(localPending.map((p) => p.owner_id).filter(Boolean));
          list = list.filter((u) => !localPosterEmails.has(u.email) && !localPosterPhones.has(u.phone) && !localPosterIds.has(u.id));
        } catch {}
        setUsers(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const handleSync = () => load();
    window.addEventListener('prent_user_updated', handleSync);
    window.addEventListener('prent_new_pending_property', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('prent_user_updated', handleSync);
      window.removeEventListener('prent_new_pending_property', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // স্ট্রাইক ইস্যু করা (Strike 1 বা Strike 2)
  const handleIssueStrike = async () => {
    if (!strikeModalUser) return;
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    const isStrike2 = selectedStrikeType === '2';
    const nextStatus = isStrike2 ? 'BLOCKED' : 'SUSPENDED';

    setActionBusy(true);
    try {
      await api.patch(`/admin/users/${strikeModalUser.id}/status`, {
        account_status: nextStatus,
        strike_count: isStrike2 ? 2 : 1,
        reason: finalReason,
      });

      // লোকাল নোটিফিকেশন টেন্যান্ট-স্পেসিফিক কী-তে সেভ করা হবে যাতে এডমিনের কাছে না যায়
      try {
        const notifItem = {
          id: `notif-${Date.now()}`,
          user_id: strikeModalUser.id,
          type: isStrike2 ? 'ACCOUNT_BLOCKED' : 'ACCOUNT_SUSPENDED',
          title: isStrike2 ? '⛔ Account Permanently Blocked (Strike 2)' : '⚠️ Account Suspended by Admin (Strike 1)',
          message: isStrike2
            ? `Admin has permanently blocked your account: "${finalReason}". All platform privileges are terminated.`
            : `Admin has suspended your account (Strike 1) for: "${finalReason}". View Details and payments are disabled. Open NestAI to submit rules appeal.`,
          is_read: false,
          created_at: new Date().toISOString(),
        };
        const userNotifsKey = `prent_user_notifications_${strikeModalUser.id}`;
        const existingNotifs = JSON.parse(localStorage.getItem(userNotifsKey) || '[]');
        existingNotifs.unshift(notifItem);
        localStorage.setItem(userNotifsKey, JSON.stringify(existingNotifs));
        localStorage.removeItem('prent_user_notifications');
      } catch {}

      setToast({
        type: 'success',
        message: isStrike2
          ? `Strike 2 issued: ${strikeModalUser.full_name} is permanently blocked.`
          : `Strike 1 issued: ${strikeModalUser.full_name} suspended with appeal option.`,
      });
      setStrikeModalUser(null);
      setCustomReason('');
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to issue strike' });
    } finally {
      setActionBusy(false);
    }
  };

  // এডমিন কর্তৃক আপিল রিভিউ (APPROVE বা REJECT)
  const handleReviewAppealDecision = async (decision) => {
    if (!reviewAppealUser) return;
    setActionBusy(true);
    try {
      await api.patch(`/admin/users/${reviewAppealUser.id}/status`, {
        appeal_decision: decision,
      });
      setToast({
        type: 'success',
        message: decision === 'APPROVE'
          ? `Appeal approved! ${reviewAppealUser.full_name}'s access restored (Strike 1 on record).`
          : `Appeal rejected. ${reviewAppealUser.full_name} remains suspended.`,
      });
      setReviewAppealUser(null);
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to process appeal' });
    } finally {
      setActionBusy(false);
    }
  };

  // সরাসরি একটিভ বা ডিলিট করা
  const setStatus = async (id, account_status) => {
    const verb = account_status === 'DELETED' ? 'mark as deleted' : account_status.toLowerCase();
    if (!window.confirm(`Are you sure you want to ${verb} this tenant?`)) return;
    try {
      await api.patch(`/admin/users/${id}/status`, { account_status, strike_count: 0 });
      setToast({ type: 'success', message: `Tenant marked as ${account_status.toLowerCase()}` });
      load();
    } catch {
      setToast({ type: 'error', message: 'Action failed' });
    }
  };

  // পার্মানেন্ট ডিলিট
  const permanentDelete = async (id, name) => {
    const ok = window.confirm(
      `PERMANENTLY delete ${name}?\n\nThis completely erases the user and all associated data from the database.\nThis action is IRREVERSIBLE.`
    );
    if (!ok) return;
    try {
      await api.delete(`/admin/users/${id}/permanent`);
      setToast({ type: 'success', message: 'User permanently deleted from database' });
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Permanent delete failed' });
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Manage Tenants</h1>
            <p className="text-xs text-slate-500">
              Admin Manual 2-Strike Penalty &amp; Reinstatement Appeal Controls.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              Strike 1 = Suspended (Can Appeal)
            </span>
            <span className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800">
              Strike 2 = Permanent Ban (No Appeal)
            </span>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-3">Tenant Details</th>
                <th className="px-3">Phone</th>
                <th className="px-3">Strike Status</th>
                <th className="px-3">Appeals</th>
                <th className="px-3">Rating</th>
                <th className="px-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const strike = Number(u.strike_count || 0);
                const isSuspended = u.account_status === 'SUSPENDED';
                const isBlocked = u.account_status === 'BLOCKED';
                const hasPendingAppeal = isSuspended && u.unblock_appeal_status === 'SUBMITTED';

                return (
                  <tr key={u.id} className="bg-white shadow-sm transition hover:shadow-md hover:bg-slate-50/50">
                    <td className="rounded-l-xl px-3 py-3 cursor-pointer" onClick={() => setActivityUser(u)}>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-bold text-slate-800 hover:text-sky-700 flex items-center gap-1.5 flex-wrap">
                            {u.full_name}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-extrabold border border-slate-300">
                              TENANT
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 font-semibold border border-sky-200">
                              View Activity 👁️
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 cursor-pointer" onClick={() => setActivityUser(u)}>{u.phone}</td>
                    
                    {/* স্ট্রাইক ও অ্যাকাউন্ট স্ট্যাটাস */}
                    <td className="px-3 py-3">
                      {isBlocked ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                            <Ban size={11} /> Strike 2: Permanent Ban
                          </span>
                          {u.block_reason && (
                            <span className="text-[10px] text-rose-700 max-w-[200px] truncate" title={u.block_reason}>
                              {u.block_reason}
                            </span>
                          )}
                        </div>
                      ) : isSuspended ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                            <AlertTriangle size={11} /> Strike 1: Suspended
                          </span>
                          {u.block_reason && (
                            <span className="text-[10px] text-amber-800 max-w-[200px] truncate" title={u.block_reason}>
                              {u.block_reason}
                            </span>
                          )}
                        </div>
                      ) : strike === 1 ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <Badge tone="green">Active</Badge>
                          <span className="text-[10px] font-semibold text-amber-700">1 Warning on Record</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> Clean (0 Strikes)
                        </span>
                      )}
                    </td>

                    {/* আপিল অগ্রগতি কলাম */}
                    <td className="px-3 py-3">
                      {hasPendingAppeal ? (
                        <button
                          onClick={() => setReviewAppealUser(u)}
                          className="inline-flex animate-pulse items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-200"
                        >
                          <FileText size={12} /> Review Appeal 🚨
                        </button>
                      ) : u.unblock_appeal_status === 'APPROVED' ? (
                        <span className="text-[11px] font-semibold text-emerald-600">✓ Appeal Approved</span>
                      ) : u.unblock_appeal_status === 'REJECTED' ? (
                        <span className="text-[11px] font-semibold text-rose-500">✕ Appeal Rejected</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-slate-600">{Number(u.average_rating || 0).toFixed(1)} ★</td>

                    {/* এডমিন অ্যাকশন বাটন */}
                    <td className="rounded-r-xl px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* অ্যাক্টিভিটি ও ফুল ডিটেইলস বাটন */}
                        <button
                          onClick={() => setActivityUser(u)}
                          title="View Full Tenant Activity & Records"
                          className="flex items-center gap-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1.5 text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
                        >
                          <Eye size={13} className="text-sky-700" />
                          <span>Activity</span>
                        </button>

                        {/* স্ট্রাইক ইস্যু বাটন */}
                        <button
                          onClick={() => {
                            setStrikeModalUser(u);
                            setSelectedStrikeType(isSuspended || strike >= 1 ? '2' : '1');
                          }}
                          title="Issue Strike Penalty"
                          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                        >
                          <ShieldAlert size={14} className="text-amber-600" />
                          <span>Penalty</span>
                        </button>

                        {/* রিয়্যাক্টিভেট বাটন */}
                        {(isSuspended || isBlocked) && (
                          <button
                            onClick={() => setStatus(u.id, 'ACTIVE')}
                            title="Directly restore to Active"
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}

                        {/* ডিলিট ও পার্মানেন্ট ডিলিট */}
                        <button
                          onClick={() => setStatus(u.id, 'DELETED')}
                          title="Mark Deleted"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => permanentDelete(u.id, u.full_name)}
                          title="Erase permanently from DB"
                          className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-50 ring-1 ring-rose-200"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* =====================================================================
          ADMIN STRIKE ISSUANCE MODAL (ম্যানুয়াল স্ট্রাইক পেনাল্টি মোডাল)
          ===================================================================== */}
      {strikeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-rose-600" size={22} />
                <h3 className="text-base font-extrabold text-slate-900">
                  Issue Strike Penalty
                </h3>
              </div>
              <button
                onClick={() => setStrikeModalUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p>
                  <strong>Target Tenant:</strong> {strikeModalUser.full_name} ({strikeModalUser.phone})
                </p>
                <p className="mt-1">
                  <strong>Current Status:</strong> {strikeModalUser.account_status} · (Current Strikes: {strikeModalUser.strike_count || 0})
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select Penalty Level:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStrikeType('1')}
                    className={`rounded-xl border p-3 text-left transition ${
                      selectedStrikeType === '1'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-amber-800">⚠️ Strike 1 (Suspension)</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Details &amp; payments locked. User can appeal via chatbot.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStrikeType('2')}
                    className={`rounded-xl border p-3 text-left transition ${
                      selectedStrikeType === '2'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-rose-800">⛔ Strike 2 (Permanent Ban)</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Final ban. Zero appeals allowed.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Violation Reason:
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 bg-white"
                >
                  {PRESET_TENANT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Custom Notes / Specific Infraction (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Demanded direct cash deposit, refused to use app"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStrikeModalUser(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={handleIssueStrike}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
                  selectedStrikeType === '2'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionBusy ? 'Applying...' : `Confirm Issue Strike ${selectedStrikeType}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ADMIN REVIEW APPEAL MODAL (আনব্লক আপিল বিবেচনা মোডাল)
          ===================================================================== */}
      {reviewAppealUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-amber-600" size={22} />
                <h3 className="text-base font-extrabold text-slate-900">
                  Review Unblock Appeal
                </h3>
              </div>
              <button
                onClick={() => setReviewAppealUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1">
                <p>
                  <strong>Applicant:</strong> {reviewAppealUser.full_name} ({reviewAppealUser.phone})
                </p>
                <p>
                  <strong>Original Suspension Reason:</strong>{' '}
                  <span className="text-amber-800 font-semibold">{reviewAppealUser.block_reason || 'Rule violation'}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  <strong>Submission Date:</strong>{' '}
                  {reviewAppealUser.unblock_appeal_date
                    ? new Date(reviewAppealUser.unblock_appeal_date).toLocaleString()
                    : 'Recent'}
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="font-bold text-amber-950 mb-1">
                  Tenant&apos;s Signed Reinstatement Pledge &amp; Statement:
                </p>
                <div className="rounded-lg bg-white p-3 text-xs italic text-slate-800 border border-amber-200 shadow-inner max-h-36 overflow-y-auto whitespace-pre-wrap">
                  &ldquo;{reviewAppealUser.unblock_appeal_text || 'I agree to strictly abide by all rules.'}&rdquo;
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Note: Approving this appeal restores full access to the tenant, but their Strike 1 status will remain recorded. If they violate rules a 2nd time, Strike 2 will permanently terminate the account.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setReviewAppealUser(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleReviewAppealDecision('REJECT')}
                  className="rounded-xl bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-200"
                >
                  {actionBusy ? '...' : 'Reject Appeal'}
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleReviewAppealDecision('APPROVE')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  {actionBusy ? '...' : '✓ Approve & Restore Access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* টেন্যান্ট ফুল অ্যাক্টিভিটি মোডাল (ভিজিট বুকিং, পেমেন্ট হিস্টোরি, লিস্টিংস ইত্যাদি) */}
      <UserActivityModal
        isOpen={Boolean(activityUser)}
        onClose={() => setActivityUser(null)}
        user={activityUser}
        mode="TENANT"
        onRefresh={load}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <BottomNav />
    </div>
  );
}
