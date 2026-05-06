import { useState } from 'react';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseList } from './ExerciseList';

export function ExerciseLayout() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const successExercises = () => {
        setRefreshTrigger(prev => prev + 1);
    }

    return (
        <>
            <ExerciseForm onSuccess={successExercises}/>
            <ExerciseList key={refreshTrigger}/>
        </>
    );
}
