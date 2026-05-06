import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import type { Exercise } from '../types';
import { Select } from './ui/Select';

interface VolumeChartProps {
  profileId: number;
}

export default function VolumeChart({ profileId }: VolumeChartProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.exercises.list(profileId).then(setExercises).catch(console.error);
  }, [profileId]);

  useEffect(() => {
    if (!selectedExercise) return;
    setLoading(true);
    api.analytics.volume(profileId, selectedExercise, 90).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [profileId, selectedExercise]);

  const chartData = data.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString(),
    volume: d.total_volume,
    weight: d.max_weight,
  }));

  return (
    <div className="glass" style={{padding: '1.5rem'}}>
      <div className="flex-between" style={{flexWrap: 'wrap', gap: '0.75rem'}}>
        <h2 style={{ marginBottom: 0 }}>Volume by Date</h2>
        <Select
          value={selectedExercise}
          onChange={(v) => setSelectedExercise(v)}
          options={[
            { value: '', label: 'Select exercise...' },
            ...exercises.map((ex) => ({ value: ex.name, label: ex.name })),
          ]}
          style={{ minWidth: '150px' }}
        />
      </div>

      {loading ? (
        <p className="text-muted" style={{textAlign: 'center', padding: '2rem'}}>Loading...</p>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
            <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ background: 'rgba(5, 46, 22, 0.9)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
            <Area type="monotone" dataKey="volume" stroke="var(--green-500)" fill="rgba(34, 197, 94, 0.2)" fillOpacity={1} name="Volume (kg)" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted" style={{textAlign: 'center', padding: '2rem'}}>Select an exercise to see volume data</p>
      )}
    </div>
  );
}
