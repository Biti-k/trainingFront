import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Exercise, Workout } from '../types';
import { Select } from './ui/Select';

interface SetRow {
  exercise_id: number;
  weight: number;
  reps: number;
  rpe: number | null;
  notes: string;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function WorkoutForm({
  onSuccess,
  workout,
  initialDate,
}: {
  onSuccess?: () => void;
  workout?: Workout | null;
  initialDate?: Date;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [date, setDate] = useState(() => toDateInputValue(initialDate ?? new Date()));
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
      setDate(workout.date ? workout.date.slice(0, 10) : toDateInputValue(new Date()));
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

    const validSets = sets.filter((s) => s.exercise_id && s.weight >= 0 && s.reps > 0);
    if (validSets.length === 0) {
      setError('Add at least one valid set');
      return;
    }

    const workoutData = {
      date: `${date}T00:00:00.000Z`,
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
    return <p className="text-muted p-8 text-center">Add exercises first before logging workouts.</p>;
  }

  return (
    <div className="glass p-6 mb-6">
      <h2>{isEditing ? 'Edit Workout' : 'Log Workout'}</h2>
      {error && <p className="text-green-400 mb-4 text-sm">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Bodyweight (kg)</label>
            <input type="number" step="0.1" value={bodyweight} onChange={(e) => setBodyweight(e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it go?" />
          </div>
        </div>

        <h3 className="my-4 mb-3">Sets</h3>
        {sets.map((set, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3 items-end">
            <div className="form-group mb-0">
              <label>Exercise</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Select
                    value={set.exercise_id ? String(set.exercise_id) : ''}
                    onChange={(v) => updateSet(i, 'exercise_id', parseInt(v))}
                    options={[
                      { value: '', label: 'Select...' },
                      ...exercises.map((ex) => ({ value: String(ex.id), label: ex.name })),
                    ]}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                {(() => {
                  const selected = exercises.find((ex) => ex.id === set.exercise_id);
                  return selected?.image_url ? (
                    <img
                      src={selected.image_url}
                      alt=""
                      style={{
                        width: 44,
                        height: 44,
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: 'var(--shadow-green-sm)',
                        flexShrink: 0,
                      }}
                    />
                  ) : null;
                })()}
              </div>
            </div>
            <div className="form-group mb-0">
              <label>Weight (kg)</label>
              <input type="number" step="0.5" value={set.weight || ''} onChange={(e) => updateSet(i, 'weight', e.target.value === '' ? 0 : parseFloat(e.target.value))}/>
            </div>
            <div className="form-group mb-0">
              <label>Reps</label>
              <input type="number" min="0" value={set.reps || ''} onChange={(e) => updateSet(i, 'reps', parseInt(e.target.value))} required />
            </div>
            <div className="form-group mb-0">
              <label>RPE</label>
              <input type="number" step="0.5" min="1" max="10" value={set.rpe || ''} onChange={(e) => updateSet(i, 'rpe', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
            <div className="form-group mb-0">
              <label>Notes</label>
              <input type="text" value={set.notes} onChange={(e) => updateSet(i, 'notes', e.target.value)} />
            </div>
            <div className='form-group mb-0'>
              {/* <label></label> */}
              <button type="button" className="btn btn-danger btn-sm mt-4" onClick={() => removeSet(i)}>x</button>
            </div>
          </div>
        ))}

        <div className="mt-4 flex gap-2 flex-wrap">
          <button type="button" className="btn btn-ghost" onClick={addSet}>+ Add Set</button>
          <button type="submit" className="btn btn-primary">{isEditing ? 'Update Workout' : 'Save Workout'}</button>
        </div>
      </form>
    </div>
  );
}
