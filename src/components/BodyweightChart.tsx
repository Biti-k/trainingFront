import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

export function BodyweightChart() {
  const [data, setData] = useState<any[]>([]);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.bodyweight(days).then((d: any[]) => {
      setData(d);
      setLoading(false);
    }).catch(console.error);
  }, [days]);

  if (loading) return <p className="text-muted" style={{padding: '2rem', textAlign: 'center'}}>Loading...</p>;

  return (
    <div className="glass" style={{padding: '1.5rem'}}>
      <div className="flex-between" style={{flexWrap: 'wrap', gap: '0.75rem'}}>
        <h2 style={{ marginBottom: 0 }}>Bodyweight</h2>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          style={{padding: '0.5rem 2.5rem 0.5rem 0.75rem', minWidth: '100px'}}
        >
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
            <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString()} stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <Tooltip labelFormatter={(l: string) => new Date(l).toLocaleDateString()} contentStyle={{ background: 'rgba(5, 46, 22, 0.9)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
            <Line type="monotone" dataKey="bodyweight" stroke="var(--green-500)" strokeWidth={2} dot={false} name="Bodyweight" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted" style={{textAlign: 'center', padding: '2rem'}}>No bodyweight data. Log bodyweight when adding workouts.</p>
      )}
    </div>
  );
}
