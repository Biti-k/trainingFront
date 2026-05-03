import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Workout, Exercise, Set } from '../types';
import { WorkoutForm } from './WorkoutForm';

interface GroupedSet {
  exercise: Exercise;
  sets: (Set & { setNumber: number })[];
}

export function WorkoutDetail() {
  const [workoutId, setWorkoutId] = useState('');
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setWorkoutId(new URLSearchParams(window.location.search).get('id') || '');
  }, []);

  useEffect(() => {
    if (!workoutId) return;
    Promise.all([
      api.workouts.get(parseInt(workoutId)) as Promise<Workout>,
      api.exercises.list() as Promise<Exercise[]>,
    ])
      .then(([w, ex]) => {
        setWorkout(w);
        setExercises(ex);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [workoutId]);

  if (loading) return <p className="text-muted">Loading...</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!workout) return <p className="text-muted">Workout not found</p>;

  if (editing) {
    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <a href="/workouts" className="btn btn-outline" style={{ marginBottom: '1rem' }}>
            Back to Workouts
          </a>
        </div>
        <WorkoutForm
          workout={workout}
          onSuccess={() => {
            setEditing(false);
            Promise.all([
              api.workouts.get(parseInt(workoutId)) as Promise<Workout>,
              api.exercises.list() as Promise<Exercise[]>,
            ]).then(([w, ex]) => {
              setWorkout(w);
              setExercises(ex);
            });
          }}
        />
      </div>
    );
  }

  const getExerciseName = (exerciseId: number): string => {
    const ex = exercises.find((e) => e.id === exerciseId);
    return ex ? ex.name : `Exercise #${exerciseId}`;
  };

  const groupedSets: GroupedSet[] = [];
  const exerciseMap = new Map<number, GroupedSet>();

  const sortedSets = [...workout.sets].sort((a, b) => a.order - b.order);

  for (const set of sortedSets) {
    if (!exerciseMap.has(set.exercise_id)) {
      const exercise: Exercise = {
        id: set.exercise_id,
        name: getExerciseName(set.exercise_id),
        muscle_group: null,
        description: null,
        created_at: '',
      };
      const group: GroupedSet = { exercise, sets: [] };
      exerciseMap.set(set.exercise_id, group);
      groupedSets.push(group);
    }
    const group = exerciseMap.get(set.exercise_id)!;
    group.sets.push({ ...set, setNumber: group.sets.length + 1 });
  }

  const totalVolume = workout.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <a href="/workouts" className="btn btn-outline" style={{ marginBottom: '1rem' }}>
          Back to Workouts
        </a>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Workout Details</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {new Date(workout.date || '').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit</button>
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-value">{workout.sets.length}</div>
              <div className="stat-label">Total Sets</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round(totalVolume)} kg</div>
              <div className="stat-label">Total Volume</div>
            </div>
            {workout.bodyweight && (
              <div className="stat-card">
                <div className="stat-value">{workout.bodyweight} kg</div>
                <div className="stat-label">Bodyweight</div>
              </div>
            )}
          </div>
        </div>

        {workout.notes && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
            <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</strong>
            <p style={{ marginTop: '0.25rem' }}>{workout.notes}</p>
          </div>
        )}
      </div>

      {groupedSets.map((group) => (
        <div className="card" key={group.exercise.id} style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{group.exercise.name}</span>
            {group.exercise.muscle_group && (
              <span className="badge">{group.exercise.muscle_group}</span>
            )}
          </h3>
          <table>
            <thead>
              <tr>
                <th>Set</th>
                <th>Weight (kg)</th>
                <th>Reps</th>
                <th>RPE</th>
                <th>Volume</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {group.sets.map((set) => (
                <tr key={set.id || set.setNumber}>
                  <td>{set.setNumber}</td>
                  <td>{set.weight}</td>
                  <td>{set.reps}</td>
                  <td>{set.rpe ?? '—'}</td>
                  <td>{Math.round(set.weight * set.reps)} kg</td>
                  <td className="text-muted">{set.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
