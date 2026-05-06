export interface Profile {
  id: number;
  name: string;
  created_at: string;
}

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string | null;
  description: string | null;
  created_at: string;
  profile_id: number;
}

export interface Set {
  id?: number;
  exercise_id: number;
  weight: number;
  reps: number;
  rpe: number | null;
  order: number;
  notes: string | null;
}

export interface Workout {
  id?: number;
  date: string | null;
  notes: string | null;
  bodyweight: number | null;
  profile_id: number;
  sets: Set[];
}

export interface VolumeByDate {
  date: string;
  exercise_name: string;
  total_volume: number;
  total_reps: number;
  max_weight: number;
}

export interface ProgressionStats {
  exercise_name: string;
  sessions: number;
  max_weight: number;
  max_weight_date: string | null;
  avg_weight: number;
  volume_trend: number[];
  estimated_1rm: number | null;
}

export interface WorkoutSummary {
  total_workouts: number;
  total_volume: number;
  avg_bodyweight: number | null;
  exercises_count: number;
  date_range: [string, string];
}

export interface BodyweightTrend {
  date: string;
  bodyweight: number;
  sma_7: number;
}
