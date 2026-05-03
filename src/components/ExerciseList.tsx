import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Exercise } from '../types';

export function ExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises(muscleGroup?: string) {
    try {
      const data = await api.exercises.list(muscleGroup);
      setExercises(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this exercise?')) return;
    try {
      await api.exercises.delete(id);
      loadExercises(filter || undefined);
    } catch (e) {
      console.error(e);
    }
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    loadExercises(filter || undefined);
  }

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <>
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Filter by muscle group..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)' }}
        />
        <button type="submit" className="btn btn-outline">Filter</button>
        <button type="button" className="btn btn-outline" onClick={() => { setFilter(''); loadExercises(); }}>Clear</button>
      </form>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Muscle Group</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((ex) => (
              <tr key={ex.id}>
                <td>{ex.name}</td>
                <td>{ex.muscle_group ? <span className="badge">{ex.muscle_group}</span> : '—'}</td>
                <td>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(ex.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {exercises.length === 0 && (
              <tr>
                <td colSpan={3} className="text-muted">No exercises found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
