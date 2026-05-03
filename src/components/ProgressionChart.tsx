import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';

export function ProgressionChart() {
  const [data, setData] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.progression().then((p) => {
      setData(p);
      if (p.length > 0) setSelectedExercise(p[0].exercise_name);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted">Loading...</p>;

  const selected = data.find((d) => d.exercise_name === selectedExercise);

  const chartData = selected?.volume_trend.map((v: number, i: number) => ({
    session: i + 1,
    volume: v,
  })) || [];

  return (
    <div className="card">
      <div className="flex-between">
        <h2 style={{ marginBottom: 0 }}>Volume Progression</h2>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          style={{ padding: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)' }}
        >
          {data.map((d) => (
            <option key={d.exercise_name} value={d.exercise_name}>{d.exercise_name}</option>
          ))}
        </select>
      </div>

      {selected ? (
        <>
          <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0', fontSize: '0.875rem' }}>
            <span>Max: <strong>{selected.max_weight} kg</strong></span>
            <span>Avg: <strong>{selected.avg_weight} kg</strong></span>
            <span>Est. 1RM: <strong>{selected.estimated_1rm || '—'} kg</strong></span>
            <span>Sessions: <strong>{selected.sessions}</strong></span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="session" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
              <Bar dataKey="volume" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <p className="text-muted">No progression data</p>
      )}
    </div>
  );
}
