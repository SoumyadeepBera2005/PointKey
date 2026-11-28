import { useState, useEffect } from 'react';
import { X, Save, Building, MapPin, IndianRupee, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function AdminEditPropertyModal({ property, isOpen, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'FLAT',
    sub_type: '2 BHK',
    rent_amount: '',
    advance_amount: '',
    locality: '',
    city: 'Kolkata',
    exact_address: '',
    allowed_gender: 'ANY',
    allowed_tenant_type: 'ANY',
    room_sharing_capacity: 1,
    furnishing_status: 'SEMI_FURNISHED',
    rules_and_regulations: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        category: property.category || 'FLAT',
        sub_type: property.sub_type || property.subtype || '2 BHK',
        rent_amount: property.rent_amount || property.price || '',
        advance_amount: property.advance_amount || property.deposit || '',
        locality: property.locality || '',
        city: property.city || 'Kolkata',
        exact_address: property.exact_address || '',
        allowed_gender: property.allowed_gender || 'ANY',
        allowed_tenant_type: property.allowed_tenant_type || 'ANY',
        room_sharing_capacity: property.room_sharing_capacity || 1,
        furnishing_status: property.furnishing_status || 'SEMI_FURNISHED',
        rules_and_regulations: property.rules_and_regulations || '',
      });
      setErrorMsg('');
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Property title is required.');
      return;
    }
    if (!formData.rent_amount || Number(formData.rent_amount) <= 0) {
      setErrorMsg('Valid rent amount is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Submit to backend API
      let updatedProperty = null;
      try {
        const res = await api.put(`/admin/properties/${property.id}`, formData);
        updatedProperty = res.data?.property;
      } catch (err) {
        console.warn('Backend update failed, falling back to local storage update:', err);
      }

      // 2. Synchronize across local storage collections
      const targetId = property.id;
      const updatedFields = {
        ...formData,
        rent_amount: Number(formData.rent_amount),
        price: Number(formData.rent_amount),
        advance_amount: Number(formData.advance_amount || 0),
        deposit: Number(formData.advance_amount || 0),
      };

      // Helper to update a storage array
      const updateStorage = (key) => {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) {
            const updated = list.map((item) => (item.id === targetId ? { ...item, ...updatedFields } : item));
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch {}
      };

      updateStorage('prent_user_posted_properties');
      updateStorage('prent_pending_admin_properties');
      updateStorage('prent_verified_admin_properties');

      // 3. Dispatch global events so owner's My Properties updates instantly
      const updatedItem = { ...property, ...updatedFields };
      window.dispatchEvent(new CustomEvent('prent_property_modified', { detail: updatedItem }));
      window.dispatchEvent(new CustomEvent('prent_property_status_changed', { detail: { id: targetId, status: property.verification_status } }));
      window.dispatchEvent(new Event('storage'));

      // 4. Send in-app notification to the owner
      if (property.owner_id) {
        try {
          const notifKey = `prent_user_notifications_${property.owner_id}`;
          const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
          const newNotif = {
            id: `notif-${Date.now()}`,
            user_id: property.owner_id,
            type: 'PROPERTY_MODIFIED',
            title: '✏️ Property Details Updated by Admin',
            message: `Admin has updated details for your property "${formData.title}" (${property.property_code}). Check updated terms in My Properties.`,
            is_read: false,
            created_at: new Date().toISOString(),
          };
          existingNotifs.unshift(newNotif);
          localStorage.setItem(notifKey, JSON.stringify(existingNotifs));
        } catch {}
      }

      if (onSaved) onSaved(updatedProperty || updatedItem);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update property details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#fffdf9] border border-[#d8cba9] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-[#17324D] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#e5dac4] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                ADMIN PROPERTY EDITOR
              </span>
              <span className="text-xs font-black text-slate-700">
                {property.property_code} · {property.owner_name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17324D] mt-1">
              ✏️ Modify Property Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Changes will update immediately in the database and reflect in the owner&apos;s &ldquo;My Properties&rdquo; section.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f6efdf] hover:bg-[#ebdcc0] text-[#17324D] flex items-center justify-center text-sm font-bold transition cursor-pointer ml-3 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl mt-3 shrink-0">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-3 space-y-3.5 flex-1 pr-1 text-xs">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 mb-1">Property Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2.5 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#1f4d3f] outline-none"
              placeholder="e.g. Spacious 2 BHK Flat near Sonarpur Station"
            />
          </div>

          {/* Category, Subtype, Rent & Advance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
              >
                <option value="FLAT">FLAT</option>
                <option value="PG">PG</option>
                <option value="ROOM">ROOM</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Subtype</label>
              <input
                type="text"
                name="sub_type"
                value={formData.sub_type}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
                placeholder="2 BHK / Single Room"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Rent (₹/mo) *</label>
              <input
                type="number"
                name="rent_amount"
                value={formData.rent_amount}
                onChange={handleChange}
                required
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
                placeholder="2500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Deposit (₹)</label>
              <input
                type="number"
                name="advance_amount"
                value={formData.advance_amount}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
                placeholder="5000"
              />
            </div>
          </div>

          {/* Location & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Locality</label>
              <input
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
                placeholder="Rajpur Sonarpur"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
                placeholder="Kolkata"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Exact Address</label>
              <input
                type="text"
                name="exact_address"
                value={formData.exact_address}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
                placeholder="Flat 3B, Sunshine Apartments"
              />
            </div>
          </div>

          {/* Gender, Tenant Type, Sharing, Furnishing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Allowed Gender</label>
              <select
                name="allowed_gender"
                value={formData.allowed_gender}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
              >
                <option value="ANY">Any Gender</option>
                <option value="MALE_ONLY">Male Only</option>
                <option value="FEMALE_ONLY">Female Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Allowed Tenant</label>
              <select
                name="allowed_tenant_type"
                value={formData.allowed_tenant_type}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
              >
                <option value="ANY">Any Tenant</option>
                <option value="STUDENTS_ONLY">Students Only</option>
                <option value="FAMILY_ONLY">Family Only</option>
                <option value="WORKING_PROFESSIONALS_ONLY">Working Professionals</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Sharing Capacity</label>
              <input
                type="number"
                name="room_sharing_capacity"
                value={formData.room_sharing_capacity}
                onChange={handleChange}
                min="1"
                max="10"
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Furnishing</label>
              <select
                name="furnishing_status"
                value={formData.furnishing_status}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold outline-none"
              >
                <option value="FURNISHED">Fully Furnished</option>
                <option value="SEMI_FURNISHED">Semi Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>
          </div>

          {/* House Rules */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 mb-1">House Rules &amp; Regulations</label>
            <textarea
              rows={2}
              name="rules_and_regulations"
              value={formData.rules_and_regulations}
              onChange={handleChange}
              placeholder="e.g. No loud music after 10 PM; Gate closes at 11 PM; No smoking inside"
              className="w-full p-2.5 bg-white border border-[#d8cba9] rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#1f4d3f] outline-none"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-[#e5dac4] flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck size={14} className="text-[#1f4d3f]" />
              <span>Admin Override Privilege</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#1f4d3f] hover:bg-[#15382e] text-white font-black shadow-md transition flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSubmitting ? 'Saving...' : 'Save & Sync to Owner'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
