import { useState } from 'react';
import { api } from '../services/api';

export function ExerciseForm({ onSuccess }: { onSuccess?: () => void }) {
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
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h2>Add Exercise</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Barbell Squat" />
        </div>
        <div className="form-group">
          <label>Muscle Group</label>
          <input type="text" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} placeholder="e.g. Legs, Chest, Back" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional notes..." />
        </div>
        <button type="submit" className="btn btn-primary">Add Exercise</button>
      </form>
    </div>
  );
}
