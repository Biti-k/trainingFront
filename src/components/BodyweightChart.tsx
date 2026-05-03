import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';

export function BodyweightChart() {
  const [data, setData] = useState<any[]>([]);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.bodyweight(days).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div className="card">
      <div className="flex-between">
        <h2 style={{ marginBottom: 0 }}>Bodyweight</h2>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          style={{ padding: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)' }}
        >
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString()} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
            <Legend />
            <Line type="monotone" dataKey="bodyweight" stroke="var(--primary)" strokeWidth={2} dot={false} name="Bodyweight" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted">No bodyweight data. Log bodyweight when adding workouts.</p>
      )}
    </div>
  );
}
