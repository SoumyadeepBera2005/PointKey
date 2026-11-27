import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function PointKeyLocker({ onOpenAuth }) {
  const { user } = useAuth();
  const isTenant = user?.role !== 'Owner' && user?.role !== 'Builder';
  const roleLabel = user ? (user.role || 'Tenant') : 'Tenant';

  // Sample or stored bills / records
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'bills' | 'docs' | 'expenses'
  const [currentDate, setCurrentDate] = useState(new Date());

  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('pointkey_locker_records');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 1, title: 'Apartment Monthly Rent - Current Month', kind: 'bills', amount: 8500, date: '2026-11-05', status: 'Paid', category: 'Rent' },
      { id: 2, title: 'CESC Electricity Submeter Bill', kind: 'bills', amount: 920, date: '2026-11-12', status: 'Due', category: 'Utility' },
      { id: 3, title: 'Registered Rental Tenancy Agreement', kind: 'docs', amount: 0, date: '2026-06-01', status: 'Verified', category: 'Legal' },
      { id: 4, title: 'Security Deposit Acknowledgment Receipt', kind: 'docs', amount: 17000, date: '2026-06-01', status: 'Secured', category: 'Deposit' },
      { id: 5, title: 'Broadband Wi-Fi Monthly Setup', kind: 'expenses', amount: 699, date: '2026-11-08', status: 'Paid', category: 'Internet' },
      { id: 6, title: '20L Drinking Water Jar Subscription', kind: 'expenses', amount: 280, date: '2026-11-15', status: 'Paid', category: 'Essentials' },
    ];
  });

  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newKind, setNewKind] = useState('bills');
  const [showAddForm, setShowAddForm] = useState(false);

  const lockerCards = [
    {
      title: 'PickBills',
      num: '01',
      desc: 'Collect and organise rent, electricity, water, gas and service bills in one place.',
      photo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=82',
      accent: '#0f766e',
      icon: 'fa-file-invoice-dollar',
      tabKey: 'bills',
    },
    {
      title: 'DocStore',
      num: '02',
      desc: 'Save agreements, rent receipts, identity papers, police verification & tax documents.',
      photo: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=900&q=82',
      accent: '#4f46e5',
      icon: 'fa-folder-open',
      tabKey: 'docs',
    },
    {
      title: 'Accounting',
      num: '03',
      desc: isTenant
        ? 'Track every living expense, roommate splits, paid amount and pending dues with monthly history.'
        : 'Track tenant rental income, maintenance costs, and property financial performance.',
      photo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=82',
      accent: '#ea580c',
      icon: 'fa-chart-line',
      tabKey: 'expenses',
    },
  ];

  const totalExpense = useMemo(() => {
    return records
      .filter((r) => r.amount > 0)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [records]);

  const paidExpense = useMemo(() => {
    return records
      .filter((r) => r.status === 'Paid')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [records]);

  const dueExpense = totalExpense - paidExpense;

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newEntry = {
      id: Date.now(),
      title: newTitle.trim(),
      amount: Number(newAmount) || 0,
      kind: newKind,
      date: new Date().toISOString().slice(0, 10),
      status: 'Due',
      category: 'General',
    };
    const updated = [newEntry, ...records];
    setRecords(updated);
    try {
      localStorage.setItem('pointkey_locker_records', JSON.stringify(updated));
    } catch {}
    setNewTitle('');
    setNewAmount('');
    setShowAddForm(false);
  };

  const handleDeleteRecord = (id) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    try {
      localStorage.setItem('pointkey_locker_records', JSON.stringify(updated));
    } catch {}
  };

  const handleTogglePaid = (id) => {
    const updated = records.map((r) =>
      r.id === id ? { ...r, status: r.status === 'Paid' ? 'Due' : 'Paid' } : r
    );
    setRecords(updated);
    try {
      localStorage.setItem('pointkey_locker_records', JSON.stringify(updated));
    } catch {}
  };

  const filteredRecords =
    activeTab === 'all'
      ? records
      : records.filter((r) => r.kind === activeTab);

  // Simple Month Days calculation for Calendar preview
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <section id="locker" className="relative overflow-hidden bg-gradient-to-br from-[#f8f5ed] via-white to-[#edf5f0] border-y border-[#E7DDC8] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider">
            <i className="fa-solid fa-lock"></i> POINTKEY LOCKER
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black text-[#0B2545]">
            Locker & Financial Hub
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Keep your bills, rent receipts, legal agreements and living expenses neatly organized — with an intelligent vault customized for your {roleLabel} profile.
          </p>
        </div>

        {/* 3 FEATURE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {lockerCards.map((card) => (
            <div
              key={card.title}
              onClick={() => setActiveTab(card.tabKey)}
              className="group bg-white rounded-3xl overflow-hidden border border-[#E7DDC8] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={card.photo}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div
                  className="w-10 h-10 rounded-2xl absolute top-4 left-4 flex items-center justify-center text-white text-lg shadow-md"
                  style={{ background: card.accent }}
                >
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>
                <span className="absolute top-4 right-4 text-white/90 text-sm font-black tracking-widest bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  {card.num}
                </span>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="text-xl font-black drop-shadow">{card.title}</h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className="text-xs font-black inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{ color: card.accent }}
                  >
                    <span>View {card.title}</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {records.filter((r) => r.kind === card.tabKey).length} records
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* VAULT STATS & RECORD MANAGER */}
        <div className="bg-white rounded-3xl border border-[#E7DDC8] shadow-md p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  {user ? `${user.name || roleLabel}'s Active Vault` : 'Personalized Vault Preview'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#0B2545] mt-1">
                Locker Records & Expense Tracker
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#E85D04] text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <i className={`fa-solid ${showAddForm ? 'fa-xmark' : 'fa-plus'}`}></i>
                <span>{showAddForm ? 'Close' : 'Add Record'}</span>
              </button>
            </div>
          </div>

          {/* ADD RECORD FORM */}
          {showAddForm && (
            <form onSubmit={handleAddRecord} className="mt-6 p-5 rounded-2xl bg-[#FBF7EE] border border-[#E7DDC8] space-y-4">
              <h4 className="text-sm font-black text-[#0B2545]">Add New Bill, Document or Expense</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Record description (e.g. Rent, CESC Bill, WiFi)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#E85D04]"
                />
                <input
                  type="number"
                  placeholder="Amount in ₹ (or 0 for legal doc)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#E85D04]"
                />
                <select
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#0B2545] focus:outline-none focus:border-[#E85D04]"
                >
                  <option value="bills">PickBills (Utility / Rent)</option>
                  <option value="docs">DocStore (Paper / Receipt)</option>
                  <option value="expenses">Accounting (Daily Expense)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E85D04] hover:bg-[#d05303] text-white text-xs font-black shadow-sm"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          )}

          {/* STATS SUMMARY ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Total Tracked
              </span>
              <p className="text-2xl font-black text-[#0B2545] mt-1">
                ₹{totalExpense.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Total Paid
              </span>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                ₹{paidExpense.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E85D04]">
                Pending Due
              </span>
              <p className="text-2xl font-black text-[#E85D04] mt-1">
                ₹{dueExpense.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* TABS SELECTOR */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
            {[
              { key: 'all', label: 'All Records' },
              { key: 'bills', label: 'PickBills' },
              { key: 'docs', label: 'DocStore' },
              { key: 'expenses', label: 'Accounting' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-[#0B2545] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* RECORDS LIST */}
          <div className="space-y-2.5">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No entries saved in this category yet.
              </div>
            ) : (
              filteredRecords.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 hover:border-[#0B2545] bg-white transition shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#0B2545] flex items-center justify-center text-sm font-bold shrink-0">
                      <i
                        className={`fa-solid ${
                          r.kind === 'bills'
                            ? 'fa-receipt'
                            : r.kind === 'docs'
                            ? 'fa-file-shield'
                            : 'fa-wallet'
                        }`}
                      ></i>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#0B2545]">{r.title}</h4>
                      <p className="text-[10px] text-slate-500">
                        {r.date} • {r.category} • <span className="font-bold">{r.status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {r.amount > 0 && (
                      <span className="text-sm font-black text-[#0B2545]">
                        ₹{Number(r.amount).toLocaleString('en-IN')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(r.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black cursor-pointer transition ${
                        r.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800 hover:bg-emerald-100'
                      }`}
                    >
                      {r.status === 'Paid' ? '✓ Paid' : 'Mark Paid'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(r.id)}
                      className="text-slate-400 hover:text-rose-600 text-xs p-1"
                      title="Delete record"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
