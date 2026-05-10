import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { Select } from './ui/Select';

export function ProgressionChart() {
  const [data, setData] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profileId = parseInt(window.localStorage.getItem('activeProfileId')!, 10);
    api.analytics.progression(profileId).then((p: any[]) => {
      setData(p);
      if (p.length > 0) setSelectedExercise(p[0].exercise_name);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted" style={{padding: '2rem', textAlign: 'center'}}>Loading...</p>;

  const selected = data.find((d: any) => d.exercise_name === selectedExercise);

  const chartData = selected?.volume_trend.map((v: number, i: number) => ({
    session: i + 1,
    volume: v,
  })) || [];

  return (
    <div className="glass" style={{padding: '1.5rem'}}>
      <div className="flex-between" style={{flexWrap: 'wrap', gap: '0.75rem'}}>
        <h2 style={{ marginBottom: 0 }}>Volume Progression</h2>
        <Select
          value={selectedExercise}
          onChange={(v) => setSelectedExercise(v)}
          options={data.map((d: any) => ({ value: d.exercise_name, label: d.exercise_name }))}
          placeholder="Select exercise..."
          style={{ minWidth: '150px' }}
        />
      </div>

      {selected ? (
        <>
          <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0', fontSize: '0.875rem', flexWrap: 'wrap' }}>
            <span>Max: <strong style={{color: 'var(--green-400)'}}>{selected.max_weight} kg ({selected.max_reps} reps)</strong></span>
            <span>Avg: <strong style={{color: 'var(--green-400)'}}>{selected.avg_weight} kg</strong></span>
            <span>Est. 1RM: <strong style={{color: 'var(--green-400)'}}>{selected.estimated_1rm || '—'} kg</strong></span>
            <span>Sessions: <strong style={{color: 'var(--green-400)'}}>{selected.sessions}</strong></span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="session" stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'rgba(5, 46, 22, 0.9)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
              <Bar dataKey="volume" fill="var(--green-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <p className="text-muted" style={{textAlign: 'center', padding: '2rem'}}>No progression data</p>
      )}
    </div>
  );
}
