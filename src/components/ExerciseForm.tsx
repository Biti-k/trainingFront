import { useState } from 'react';
import { api } from '../services/api';

interface ExerciseFormProps {
  profileId: number;
  onSuccess?: () => void;
}

export default function ExerciseForm({ profileId, onSuccess }: ExerciseFormProps) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.exercises.create({
        name,
        muscle_group: muscleGroup || undefined,
        description: description || undefined,
        profile_id: profileId,
      });
      setName('');
      setMuscleGroup('');
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
          <div className="form-group">
            <label>Muscle Group</label>
            <input type="text" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} placeholder="e.g. Legs, Chest, Back" />
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
