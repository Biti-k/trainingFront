import { useState } from 'react';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseList } from './ExerciseList';
import { ExerciseCatalogPicker } from './ExerciseCatalogPicker';

export function ExerciseLayout() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog');

  const successExercises = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className={`btn ${tab === 'catalog' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('catalog')}>
          Browse Catalog
        </button>
        <button className={`btn ${tab === 'custom' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('custom')}>
          Create Custom
        </button>
      </div>

      {tab === 'catalog' ? (
        <ExerciseCatalogPicker onAdded={successExercises} />
      ) : (
        <ExerciseForm onSuccess={successExercises} />
      )}
      <ExerciseList key={refreshTrigger} />
    </>
  );
}
