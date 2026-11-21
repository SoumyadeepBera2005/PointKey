import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#046A38', '#10B981', '#059669', '#34d399', '#065f46', '#a7f3d0'];

export default function AnalyticsCharts({ monthly = [] }) {
  const data = monthly.length ? monthly.map((m) => ({ month: m.month, revenue: Number(m.revenue), transactions: Number(m.transactions) })) : [
    { month: '—', revenue: 0, transactions: 0 },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass-card p-4">
        <h3 className="mb-2 text-sm font-bold text-slate-700">Monthly Revenue (₹)</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#046A38" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass-card p-4">
        <h3 className="mb-2 text-sm font-bold text-slate-700">Transaction Share by Month</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="transactions" nameKey="month" innerRadius={45} outerRadius={75} paddingAngle={4}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
