import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Workout, Exercise, Set } from '../types';
import { WorkoutForm } from './WorkoutForm';

interface GroupedSet {
  exercise: Exercise;
  sets: (Set & { setNumber: number })[];
}

export default function WorkoutDetail() {
  const [workoutId, setWorkoutId] = useState('');
  const [profileId, setProfileId] = useState<number | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [managingSets, setManagingSets] = useState(false);
  const [addingToExercise, setAddingToExercise] = useState<number | null>(null);
  const [newSetData, setNewSetData] = useState({ weight: '', reps: '', rpe: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('activeProfileId');
    if (stored) {
      setProfileId(parseInt(stored));
    }
    setWorkoutId(new URLSearchParams(window.location.search).get('id') || '');
  }, []);

  useEffect(() => {
    if (!workoutId || !profileId) return;
    Promise.all([
      api.workouts.get(parseInt(workoutId), profileId) as Promise<Workout>,
      api.exercises.list(profileId) as Promise<Exercise[]>,
    ])
      .then(([w, ex]) => {
        setWorkout(w);
        setExercises(ex);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [workoutId, profileId]);

  if (loading) return <p className="text-muted p-8 text-center">Loading...</p>;
  if (error) return <p className="text-green-400 p-8 text-center">{error}</p>;
  if (!workout) return <p className="text-muted p-8 text-center">Workout not found</p>;

  if (editing) {
    return (
      <div>
        <div className="mb-6">
          <a href="/workouts" className="btn btn-ghost mb-4">
            ← Back to Workouts
          </a>
        </div>
        <WorkoutForm
          profileId={profileId!}
          workout={workout}
          onSuccess={() => {
            setEditing(false);
            Promise.all([
              api.workouts.get(parseInt(workoutId), profileId!) as Promise<Workout>,
              api.exercises.list(profileId!) as Promise<Exercise[]>,
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

  const handleAddSet = async (exerciseId: number) => {
    if (!workout || !newSetData.weight || !newSetData.reps) return;
    setActionLoading(true);
    try {
      const maxOrder = Math.max(...workout.sets.map(s => s.order), 0);
      const setData = {
        exercise_id: exerciseId,
        weight: parseFloat(newSetData.weight),
        reps: parseInt(newSetData.reps),
        rpe: newSetData.rpe ? parseFloat(newSetData.rpe) : null,
        order: maxOrder + 1,
        notes: newSetData.notes || null,
      };
      const newSet = await api.sets.create(parseInt(workoutId), setData, profileId!);
      setWorkout({
        ...workout,
        sets: [...workout.sets, newSet],
      });
      setAddingToExercise(null);
      setNewSetData({ weight: '', reps: '', rpe: '', notes: '' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSet = async (setId: number) => {
    if (!confirm('Delete this set?')) return;
    setActionLoading(true);
    try {
      await api.sets.delete(setId, profileId!);
      setWorkout({
        ...workout!,
        sets: workout!.sets.filter(s => s.id !== setId),
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{marginBottom: '1.5rem'}}>
        <a href="/workouts" className="btn btn-ghost" style={{marginBottom: '1rem'}}>
          ← Back to Workouts
        </a>
      </div>

      <div className="glass p-6 mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
          <div>
            <h2 className="mb-2">Workout Details</h2>
            <p className="text-text-muted text-sm">
              {new Date(workout.date || '').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit Workout</button>
            <button className="btn btn-ghost" onClick={() => setManagingSets(!managingSets)}>
              {managingSets ? 'Done Managing' : 'Manage Sets'}
            </button>
          </div>
        </div>

        <div className="stats-grid mb-4">
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

        {workout.notes && (
          <div className="p-3 bg-glass-bg rounded-md border border-glass-border">
            <strong className="text-xs text-text-muted uppercase tracking-wider">Notes</strong>
            <p className="mt-1">{workout.notes}</p>
          </div>
        )}
      </div>

      {groupedSets.map((group) => (
        <div className="glass p-6 mb-4" key={group.exercise.id}>
          <h3 className="mb-4 flex justify-between items-center flex-wrap gap-2">
            <span>{group.exercise.name}</span>
            {group.exercise.muscle_group && (
              <span className="badge">{group.exercise.muscle_group}</span>
            )}
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Set</th>
                  <th>Weight (kg)</th>
                  <th>Reps</th>
                  <th>RPE</th>
                  <th>Volume</th>
                  <th>Notes</th>
                  {managingSets && <th></th>}
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
                    {managingSets && (
                      <td>
                        {set.id !== undefined && (
                          <button
                            className="btn btn-ghost px-2 py-1 text-sm text-green-400"
                            onClick={() => handleDeleteSet(set.id!)}
                            disabled={actionLoading}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {managingSets && (
            <div className="mt-4">
              {addingToExercise === group.exercise.id ? (
                <div className='flex gap-6'>
                  <div className='form-group'>
                    <input
                      type="number"
                      placeholder="Weight"
                      value={newSetData.weight}
                      onChange={(e) => setNewSetData({...newSetData, weight: e.target.value})}
                      className="w-20 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className='form-group'>
                    <input
                      type="number"
                      placeholder="Reps"
                      value={newSetData.reps}
                      onChange={(e) => setNewSetData({...newSetData, reps: e.target.value})}
                      className="w-20 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className='form-group'>
                    <input
                      type="number"
                      placeholder="RPE"
                      value={newSetData.rpe}
                      onChange={(e) => setNewSetData({...newSetData, rpe: e.target.value})}
                      className="w-20 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className='form-group'>
                    <input
                      type="text"
                      placeholder="Notes"
                      value={newSetData.notes}
                      onChange={(e) => setNewSetData({...newSetData, notes: e.target.value})}
                      className="w-[120px] px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary px-3 py-1 text-sm"
                      onClick={() => handleAddSet(group.exercise.id)}
                      disabled={actionLoading || !newSetData.weight || !newSetData.reps}
                    >
                      {actionLoading ? 'Adding...' : 'Add Set'}
                    </button>
                    <button
                      className="btn btn-ghost px-3 py-1 text-sm"
                      onClick={() => {
                        setAddingToExercise(null);
                        setNewSetData({ weight: '', reps: '', rpe: '', notes: '' });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-ghost px-3 py-1 text-sm"
                  onClick={() => setAddingToExercise(group.exercise.id)}
                >
                  + Add Set
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
