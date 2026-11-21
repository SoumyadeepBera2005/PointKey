import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, PlusCircle } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Toast from '../../components/common/Toast';
import api from '../../services/api';

const ROOM_MATERIALS = ['Bed', 'Table', 'Chair', 'Light', 'Fan', 'Gas', 'Oven'];
const TRANSPORT = ['Bus', 'Auto', 'Toto', 'Rickshaw'];

export default function AddPropertyWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    title: '', category: 'ROOM', sub_type: 'PERSONAL_ROOM',
    allowed_gender: 'ANY', allowed_tenant_type: 'ANY', room_sharing_capacity: 1,
    bathroom_type: 'COMMON', kitchen_available: true, food_included: false,
    rent_amount: '', advance_amount: '', contract_months: 6,
    water_bill_included: false, electricity_bill_included: false,
    size_sqft: '', roof_floor_type: '', rules_and_regulations: '', allow_parents_friends: true,
    locality: '', city: 'Kolkata', exact_address: '', lat: '22.5735', lng: '88.4335',
    room_materials: [], market: '', atm: '', station: '', transport: [],
  });

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm({ ...form, [k]: v });
  };
  const toggleArr = (key, item) => setForm({ ...form, [key]: form[key].includes(item) ? form[key].filter((x) => x !== item) : [...form[key], item] });

  const submit = async () => {
    setBusy(true);
    try {
      const { room_materials, market, atm, station, transport, ...rest } = form;
      const payload = {
        ...rest,
        rent_amount: Number(form.rent_amount),
        advance_amount: Number(form.advance_amount),
        contract_months: Number(form.contract_months),
        size_sqft: form.size_sqft ? Number(form.size_sqft) : undefined,
        room_materials,
        nearby_landmarks: { market, atm, station, transport },
        lat: Number(form.lat),
        lng: Number(form.lng),
      };
      const { data } = await api.post('/properties', payload);
      setToast({ type: 'success', message: `Listing ${data.property?.property_code || ''} created — pending admin verification.` });
      setTimeout(() => navigate('/owner/listings'), 1500);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Could not create listing' });
    } finally {
      setBusy(false);
    }
  };

  const subTypes = form.category === 'FLAT' ? ['1BHK', '2BHK', '3BHK'] : ['PERSONAL_ROOM', 'SHARED_ROOM'];

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="glass-card p-6">
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-800"><PlusCircle className="text-trust" /> Add Property</h1>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition ${step >= s ? 'bg-trust' : 'bg-slate-200'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Input label="Title" value={form.title} onChange={set('title')} placeholder="Cozy single room near Salt Lake" /></div>
              <label className="block"><span className="label">Category</span>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, sub_type: e.target.value === 'FLAT' ? '2BHK' : 'PERSONAL_ROOM' })}>
                  <option value="ROOM">Room</option><option value="PG">PG</option><option value="FLAT">Flat</option>
                </select>
              </label>
              <label className="block"><span className="label">Sub-type</span>
                <select className="input" value={form.sub_type} onChange={set('sub_type')}>
                  {subTypes.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </label>
              <label className="block"><span className="label">Allowed gender</span>
                <select className="input" value={form.allowed_gender} onChange={set('allowed_gender')}><option>ANY</option><option>MALE</option><option>FEMALE</option></select>
              </label>
              <label className="block"><span className="label">Allowed tenant type</span>
                <select className="input" value={form.allowed_tenant_type} onChange={set('allowed_tenant_type')}><option>ANY</option><option>STUDENT</option><option>WORKING_PROFESSIONAL</option><option>FAMILY</option></select>
              </label>
              <label className="block"><span className="label">Sharing capacity</span>
                <input type="number" min={1} max={4} className="input" value={form.room_sharing_capacity} onChange={set('room_sharing_capacity')} />
              </label>
              <label className="block"><span className="label">Bathroom</span>
                <select className="input" value={form.bathroom_type} onChange={set('bathroom_type')}><option>COMMON</option><option>PRIVATE</option></select>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600"><input type="checkbox" checked={form.kitchen_available} onChange={set('kitchen_available')} /> Kitchen available</label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600"><input type="checkbox" checked={form.food_included} onChange={set('food_included')} /> Food included</label>
            </div>
          )}

          {step === 2 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Input label="Rent / month (₹)" type="number" value={form.rent_amount} onChange={set('rent_amount')} placeholder="8500" />
              <Input label="Advance / deposit (₹)" type="number" value={form.advance_amount} onChange={set('advance_amount')} placeholder="17000" />
              <label className="block"><span className="label">Contract months</span>
                <select className="input" value={form.contract_months} onChange={set('contract_months')}>{[1, 2, 3, 4, 5, 6, 11].map((m) => <option key={m} value={m}>{m} months</option>)}</select>
              </label>
              <Input label="Size (sqft)" type="number" value={form.size_sqft} onChange={set('size_sqft')} placeholder="120" />
              <Input label="Roof & floor type" value={form.roof_floor_type} onChange={set('roof_floor_type')} placeholder="RCC / 2nd floor" />
              <div className="flex flex-col gap-2 justify-end">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600"><input type="checkbox" checked={form.water_bill_included} onChange={set('water_bill_included')} /> Water bill included</label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600"><input type="checkbox" checked={form.electricity_bill_included} onChange={set('electricity_bill_included')} /> Electricity bill included</label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600"><input type="checkbox" checked={form.allow_parents_friends} onChange={set('allow_parents_friends')} /> Parents/friends allowed</label>
              </div>
              <div className="sm:col-span-2">
                <span className="label">Room materials</span>
                <div className="flex flex-wrap gap-2">{ROOM_MATERIALS.map((m) => (
                  <button key={m} type="button" onClick={() => toggleArr('room_materials', m)} className={`pill ${form.room_materials.includes(m) ? 'pill-active' : ''}`}>{m}</button>
                ))}</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Input label="Locality" value={form.locality} onChange={set('locality')} placeholder="Salt Lake Sector V" />
              <Input label="City" value={form.city} onChange={set('city')} />
              <div className="sm:col-span-2"><Input label="Exact address (hidden from tenants until payment)" value={form.exact_address} onChange={set('exact_address')} placeholder="BD-12, Salt Lake Sector V" /></div>
              <Input label="Latitude" value={form.lat} onChange={set('lat')} />
              <Input label="Longitude" value={form.lng} onChange={set('lng')} />
              <Input label="Near market" value={form.market} onChange={set('market')} placeholder="150m" />
              <Input label="Near ATM" value={form.atm} onChange={set('atm')} placeholder="100m" />
              <Input label="Near metro / rail" value={form.station} onChange={set('station')} placeholder="1.1km" />
              <div className="sm:col-span-2">
                <span className="label">Transport types</span>
                <div className="flex flex-wrap gap-2">{TRANSPORT.map((t) => (
                  <button key={t} type="button" onClick={() => toggleArr('transport', t)} className={`pill ${form.transport.includes(t) ? 'pill-active' : ''}`}>{t}</button>
                ))}</div>
              </div>
              <div className="sm:col-span-2"><label className="block"><span className="label">House rules</span><textarea className="input min-h-[80px]" value={form.rules_and_regulations} onChange={set('rules_and_regulations')} placeholder="No smoking…" /></label></div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 1 ? <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button> : <span />}
            {step < 3
              ? <Button onClick={() => setStep(step + 1)}>Next</Button>
              : <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={18} /> : 'Submit for verification'}</Button>}
          </div>
        </div>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
