import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Exercise, Set, Workout } from '../types';
import { Select } from './ui/Select';

interface SetRow {
  exercise_id: number;
  weight: number;
  reps: number;
  rpe: number | null;
  notes: string;
}

export function WorkoutForm({ onSuccess, workout }: { onSuccess?: () => void; workout?: Workout | null }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyweight, setBodyweight] = useState('');
  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState<SetRow[]>([{ exercise_id: 0, weight: 0, reps: 0, rpe: null, notes: '' }]);
  const [error, setError] = useState('');
  const isEditing = !!workout;

  useEffect(() => {
    api.exercises.list().then(setExercises);
  }, []);

  useEffect(() => {
    if (workout) {
      setBodyweight(workout.bodyweight ? String(workout.bodyweight) : '');
      setNotes(workout.notes || '');
      if (workout.sets.length > 0) {
        setSets(workout.sets.map((s) => ({
          exercise_id: s.exercise_id,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          notes: s.notes || '',
        })));
      }
    }
  }, [workout]);

  function addSet() {
    setSets([...sets, { exercise_id: sets[0]?.exercise_id || 0, weight: 0, reps: 0, rpe: null, notes: '' }]);
  }

  function removeSet(index: number) {
    setSets(sets.filter((_, i) => i !== index));
  }

  function updateSet(index: number, field: keyof SetRow, value: any) {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validSets = sets.filter((s) => s.exercise_id && s.weight > 0 && s.reps > 0);
    if (validSets.length === 0) {
      setError('Add at least one valid set');
      return;
    }

    const workoutData = {
      date: workout?.date || new Date().toISOString(),
      bodyweight: bodyweight ? parseFloat(bodyweight) : null,
      notes: notes || null,
      sets: validSets.map((s, i) => ({
        exercise_id: s.exercise_id,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        order: i + 1,
        notes: s.notes || null,
      })),
    };

    try {
      if (isEditing && workout?.id) {
        await api.workouts.update(workout.id, workoutData);
      } else {
        await api.workouts.create(workoutData);
        setBodyweight('');
        setNotes('');
        setSets([{ exercise_id: 0, weight: 0, reps: 0, rpe: null, notes: '' }]);
      }
      window.dispatchEvent(new Event('workout-saved'));
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (exercises.length === 0) {
    return <p className="text-muted" style={{padding: '2rem', textAlign: 'center'}}>Add exercises first before logging workouts.</p>;
  }

  return (
    <div className="glass" style={{padding: '1.5rem', marginBottom: '1.5rem'}}>
      <h2>{isEditing ? 'Edit Workout' : 'Log Workout'}</h2>
      {error && <p style={{ color: 'var(--green-400)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Bodyweight (kg)</label>
            <input type="number" step="0.1" value={bodyweight} onChange={(e) => setBodyweight(e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it go?" />
          </div>
        </div>

        <h3 style={{ margin: '1rem 0 0.75rem' }}>Sets</h3>
        {sets.map((set, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Exercise</label>
              <Select
                value={set.exercise_id ? String(set.exercise_id) : ''}
                onChange={(v) => updateSet(i, 'exercise_id', parseInt(v))}
                options={[
                  { value: '', label: 'Select...' },
                  ...exercises.map((ex) => ({ value: String(ex.id), label: ex.name })),
                ]}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Weight (kg)</label>
              <input type="number" step="0.5" min="0" value={set.weight || ''} onChange={(e) => updateSet(i, 'weight', parseFloat(e.target.value))} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Reps</label>
              <input type="number" min="0" value={set.reps || ''} onChange={(e) => updateSet(i, 'reps', parseInt(e.target.value))} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>RPE</label>
              <input type="number" step="0.5" min="1" max="10" value={set.rpe || ''} onChange={(e) => updateSet(i, 'rpe', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notes</label>
              <input type="text" value={set.notes} onChange={(e) => updateSet(i, 'notes', e.target.value)} />
            </div>
            <div className='form-group' style={{ marginBottom: 0 }}>
              {/* <label></label> */}
              <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: '1rem' }} onClick={() => removeSet(i)}>x</button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={addSet}>+ Add Set</button>
          <button type="submit" className="btn btn-primary">{isEditing ? 'Update Workout' : 'Save Workout'}</button>
        </div>
      </form>
    </div>
  );
}
