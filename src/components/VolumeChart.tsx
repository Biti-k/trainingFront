import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import type { Exercise } from '../types';

export function VolumeChart() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.exercises.list().then(setExercises).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedExercise) return;
    setLoading(true);
    api.analytics.volume(selectedExercise, 90).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [selectedExercise]);

  const chartData = data.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString(),
    volume: d.total_volume,
    weight: d.max_weight,
  }));

  return (
    <div className="card">
      <div className="flex-between">
        <h2 style={{ marginBottom: 0 }}>Volume by Date</h2>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          style={{ padding: '0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)' }}
        >
          <option value="">Select exercise...</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.name}>{ex.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
            <Area type="monotone" dataKey="volume" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} name="Volume (kg)" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted">Select an exercise to see volume data</p>
      )}
    </div>
  );
}
