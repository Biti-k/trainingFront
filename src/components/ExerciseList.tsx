import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Exercise } from '../types';

interface ExerciseListProps {
  profileId: number;
}

export default function ExerciseList({ profileId }: ExerciseListProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadExercises();
  }, [profileId]);

  async function loadExercises(muscleGroup?: string) {
    try {
      const data = await api.exercises.list(profileId, muscleGroup);
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
      await api.exercises.delete(id, profileId);
      loadExercises(filter || undefined);
    } catch (e) {
      console.error(e);
    }
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    loadExercises(filter || undefined);
  }

  if (loading) return <p className="text-muted p-8 text-center">Loading...</p>;

  return (
    <>
      <form onSubmit={handleFilter} className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Filter by muscle group..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-group flex-1 min-w-[200px]"
        />
        <button type="submit" className="btn btn-ghost">Filter</button>
        <button type="button" className="btn btn-ghost" onClick={() => { setFilter(''); loadExercises(); }}>Clear</button>
      </form>

      <div className="glass p-6">
        <div className="table-container">
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
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ex.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {exercises.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-muted text-center p-8">No exercises found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
