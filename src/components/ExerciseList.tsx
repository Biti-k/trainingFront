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

  if (loading) return <p className="text-muted" style={{padding: '2rem', textAlign: 'center'}}>Loading...</p>;

  return (
    <>
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Filter by muscle group..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-ghost">Filter</button>
        <button type="button" className="btn btn-ghost" onClick={() => { setFilter(''); loadExercises(); }}>Clear</button>
      </form>

      <div className="glass" style={{padding: '1.5rem'}}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Muscle Group</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr key={ex.id}>
                  <td>
                    {ex.image_url ? (
                      <img
                        src={ex.image_url}
                        alt=""
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--glass-border)',
                          boxShadow: 'var(--shadow-green-sm)',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 'var(--radius-md)',
                          border: '1px dashed var(--glass-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.375rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        🏋️
                      </div>
                    )}
                  </td>
                  <td>{ex.name}</td>
                  <td>{ex.muscle_group ? <span className="badge">{ex.muscle_group}</span> : '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ex.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {exercises.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-muted" style={{textAlign: 'center', padding: '2rem'}}>No exercises found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
