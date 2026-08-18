import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ExerciseCatalogItem } from '../types';
import { Select } from './ui/Select';

const MUSCLE_GROUPS = [
  'Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Chest', 'Forearms',
  'Glutes', 'Hamstrings', 'Lats', 'Lower Back', 'Middle Back', 'Neck', 'Quadriceps',
  'Shoulders', 'Traps', 'Triceps',
];

export function ExerciseCatalogPicker({ onAdded }: { onAdded?: () => void }) {
  const [items, setItems] = useState<ExerciseCatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load(searchValue = search, muscleGroupValue = muscleGroup) {
    setLoading(true);
    try {
      const data = await api.catalog.list({
        search: searchValue || undefined,
        muscleGroup: muscleGroupValue || undefined,
        limit: 15,
      });
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  async function handleAdd(catalogId: number) {
    setAddingId(catalogId);
    try {
      await api.exercises.createFromCatalog(catalogId);
      onAdded?.();
    } catch (e) {
      console.error(e);
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h2>Browse Exercise Catalog</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={muscleGroup}
          onChange={(v) => {
            setMuscleGroup(v);
            load(search, v);
          }}
          options={[
            { value: '', label: 'All muscle groups' },
            ...MUSCLE_GROUPS.map((m) => ({ value: m, label: m })),
          ]}
          style={{ minWidth: '180px' }}
        />
        <button type="submit" className="btn btn-ghost">Search</button>
      </form>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {items.map((item) => (
            <div key={item.id} className="glass" style={{ padding: '0.75rem' }}>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />
              )}
              <p style={{ fontWeight: 600, margin: '0.5rem 0 0.25rem' }}>{item.name}</p>
              {item.muscle_group && <span className="badge">{item.muscle_group}</span>}
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={addingId === item.id}
                onClick={() => handleAdd(item.id)}
              >
                {addingId === item.id ? 'Adding...' : 'Add'}
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="text-muted">No exercises found</p>}
        </div>
      )}
    </div>
  );
}
