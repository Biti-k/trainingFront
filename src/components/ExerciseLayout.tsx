import { useEffect, useState } from 'react';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseList } from './ExerciseList';

export function ExerciseLayout({ profileId }: { profileId?: number }) {
  const [activeProfileId, setActiveProfileId] = useState<number | null>(profileId ?? null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (profileId) {
      setActiveProfileId(profileId);
      return;
    }
    const storedId = window.localStorage.getItem('activeProfileId');
    if (storedId) {
      setActiveProfileId(parseInt(storedId, 10));
    }
  }, [profileId]);

  const successExercises = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!activeProfileId) {
    return (
      <div className="glass" style={{ padding: '1.5rem' }}>
        <p>Please select a profile to view exercises.</p>
      </div>
    );
  }

  return (
    <>
      <ExerciseForm profileId={activeProfileId} onSuccess={successExercises} />
      <ExerciseList key={refreshTrigger} profileId={activeProfileId} />
    </>
  );
}
