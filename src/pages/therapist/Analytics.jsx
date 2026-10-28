import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from '../../axiosInstance';

const Stat = ({ label, value }) => (
  <div className="rounded-xl border bg-white p-4">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-2xl font-semibold">{value}</p>
  </div>
);

export default function Analytics() {
  const [d, setD] = useState(null);
  useEffect(() => { axios.get('/analytics').then((r) => setD(r.data)); }, []);
  if (!d) return <p className="p-6">Loading…</p>;

  const total = d.revenueTrend.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label={`Revenue (last ${d.months} mo)`} value={`₹${total.toLocaleString()}`} />
        <Stat label="Active clients" value={d.activeClients} />
        <Stat label="No-show rate" value={`${d.noShowRate}%`} />
      </div>

      <div className="h-72 rounded-xl border bg-white p-4">
        <h3 className="mb-2 text-sm font-medium">Revenue trend</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={d.revenueTrend}>
            <XAxis dataKey="month" /><YAxis /><Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {d.depth === 'advanced' ? (
        <div className="h-72 rounded-xl border bg-white p-4">
          <h3 className="mb-2 text-sm font-medium">Top clients by revenue</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={d.revenueByClient}>
              <XAxis dataKey="name" /><YAxis /><Tooltip />
              <Bar dataKey="revenue" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-600">
          Advanced analytics (top clients, no-show trends, 12-month history) is available on Premium.
        </div>
      )}
    </div>
  );
}
