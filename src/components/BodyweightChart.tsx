import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { Select } from './ui/Select';
import { parseDateOnly, formatDate } from '../utils/date';

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
        <Select
          value={String(days)}
          onChange={(v) => setDays(parseInt(v))}
          options={[
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
            { value: '365', label: '1 year' },
          ]}
          style={{ minWidth: '100px' }}
        />
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
            <XAxis dataKey="date" tickFormatter={(d: string) => formatDate(parseDateOnly(d))} stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <Tooltip labelFormatter={(l: string) => formatDate(parseDateOnly(l))} contentStyle={{ background: 'rgba(5, 46, 22, 0.9)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
            <Line type="monotone" dataKey="bodyweight" stroke="var(--green-500)" strokeWidth={2} dot={false} name="Bodyweight" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted" style={{textAlign: 'center', padding: '2rem'}}>No bodyweight data. Log bodyweight when adding workouts.</p>
      )}
    </div>
  );
}
