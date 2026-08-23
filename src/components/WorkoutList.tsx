import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Workout } from '../types';
import { parseDateOnly, formatDate } from '../utils/date';

export function WorkoutList() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
    const handler = () => loadWorkouts();
    window.addEventListener('workout-saved', handler);
    return () => window.removeEventListener('workout-saved', handler);
  }, []);

  async function loadWorkouts() {
    try {
      const data = await api.workouts.list(0, 100);
      setWorkouts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this workout?')) return;
    try {
      await api.workouts.delete(id);
      loadWorkouts();
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <p className="text-muted" style={{padding: '2rem', textAlign: 'center'}}>Loading...</p>;

  return (
    <div className="glass" style={{padding: '1.5rem'}}>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Exercises</th>
              <th>Sets</th>
              <th>Volume</th>
              <th>Bodyweight</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workouts.map((w) => {
              const totalVolume = w.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
              const exerciseNames = [...new Set(w.sets.map((s) => s.exercise_id))];
              return (
                <tr key={w.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/workout-detail?id=${w.id}`}>
                  <td>{formatDate(parseDateOnly(w.date || ''))}</td>
                  <td>{exerciseNames.length} exercise{exerciseNames.length !== 1 ? 's' : ''}</td>
                  <td>{w.sets.length}</td>
                  <td>{Math.round(totalVolume)} kg</td>
                  <td>{w.bodyweight ? `${w.bodyweight} kg` : '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(w.id || 0); }}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {workouts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted" style={{textAlign: 'center', padding: '2rem'}}>No workouts logged</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
