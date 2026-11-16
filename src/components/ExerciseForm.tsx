import { useState } from 'react';
import { api } from '../services/api';
import { MUSCLE_REGIONS } from '../utils/muscles';

export function ExerciseForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [muscles, setMuscles] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  function toggleMuscle(m: string) {
    setMuscles((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.exercises.create({
        name,
        muscle_group: muscles.length ? muscles.join(', ') : undefined,
        description: description || undefined,
      });
      setName('');
      setMuscles([]);
      setDescription('');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="glass" style={{padding: '1.5rem', marginBottom: '1.5rem'}}>
      <h2>Add Exercise</h2>
      {error && <p style={{ color: 'var(--green-400)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Barbell Squat" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Muscles worked {muscles.length > 0 && <span className="text-muted">· {muscles.join(', ')}</span>}</label>
            <div className="muscle-picker">
              {MUSCLE_REGIONS.map((region) => (
                <div key={region.id} className="muscle-picker-row">
                  <span className="muscle-picker-region">{region.label}</span>
                  <div className="wz-chips">
                    {region.muscles.map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`wz-chip ${muscles.includes(m) ? 'wz-chip--active' : ''}`}
                        aria-pressed={muscles.includes(m)}
                        onClick={() => toggleMuscle(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group" style={{gridColumn: '1 / -1'}}>
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional notes..." />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Add Exercise</button>
      </form>
    </div>
  );
}
