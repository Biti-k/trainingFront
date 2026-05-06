import { ExerciseForm } from './ExerciseForm';
import { ExerciseList } from './ExerciseList';

export function ExerciseLayout() {
    const successExercises = () => {

    }



    return (
        <>
            <ExerciseForm onSuccess={successExercises}/>
            <ExerciseList/>
        </>
    );
}
