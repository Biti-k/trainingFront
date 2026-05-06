import { useState } from 'react';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseList } from './ExerciseList';

interface ExerciseLayoutProps {
  profileId: number;
}

export default function ExerciseLayout({ profileId }: ExerciseLayoutProps) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const successExercises = () => {
        setRefreshTrigger(prev => prev + 1);
    }

    return (
        <>
            <ExerciseForm profileId={profileId} onSuccess={successExercises}/>
            <ExerciseList profileId={profileId} key={refreshTrigger}/>
        </>
    );
}
