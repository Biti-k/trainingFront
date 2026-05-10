import type { Exercise, Workout, WorkoutSummary, VolumeByDate, ProgressionStats, BodyweightTrend, Profile } from '../types';

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return res.json();
}

export const api = {
  exercises: {
    list: (profileId: number, muscleGroup?: string): Promise<Exercise[]> => {
      const params = new URLSearchParams({ profile_id: String(profileId) });
      if (muscleGroup) params.set('muscle_group', muscleGroup);
      return request(`/exercises/?${params.toString()}`);
    },
    get: (id: number, profileId: number): Promise<Exercise> =>
      request(`/exercises/${id}?profile_id=${profileId}`),
    create: (
      profileId: number,
      data: { name: string; muscle_group?: string; description?: string },
    ) => request<Exercise>(`/exercises/?profile_id=${profileId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (
      id: number,
      profileId: number,
      data: { name: string; muscle_group?: string; description?: string },
    ) =>
      request<Exercise>(`/exercises/${id}?profile_id=${profileId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number, profileId: number) =>
      request(`/exercises/${id}?profile_id=${profileId}`, { method: 'DELETE' }),
  },
  profiles: {
    list: (): Promise<Profile[]> => request('/profiles/'),
    create: (data: { name: string; profile_image?: string | null }) =>
      request<Profile>('/profiles/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) => request<void>(`/profiles/${id}`, { method: 'DELETE' }),
  },
  workouts: {
    list: (profileId: number, skip = 0, limit = 50): Promise<Workout[]> => request(`/workouts/?profile_id=${profileId}&skip=${skip}&limit=${limit}`),
    get: (id: number, profileId: number): Promise<Workout> => request(`/workouts/${id}?profile_id=${profileId}`),
    create: (profileId: number, data: any): Promise<Workout> => request(`/workouts/?profile_id=${profileId}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, profileId: number, data: any): Promise<Workout> =>
      request(`/workouts/${id}?profile_id=${profileId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number, profileId: number) => request(`/workouts/${id}?profile_id=${profileId}`, { method: 'DELETE' }),
  },
  analytics: {
    summary: (profileId: number): Promise<WorkoutSummary> => request(`/analytics/summary?profile_id=${profileId}`),
    volume: (profileId: number, exerciseName?: string, days = 90): Promise<VolumeByDate[]> => {
      const q = exerciseName ? `?profile_id=${profileId}&exercise_name=${exerciseName}&days=${days}` : `?profile_id=${profileId}&days=${days}`;
      return request(`/analytics/volume${q}`);
    },
    progression: (profileId: number, exerciseName?: string): Promise<ProgressionStats[]> => {
      const q = exerciseName ? `?profile_id=${profileId}&exercise_name=${exerciseName}` : `?profile_id=${profileId}`;
      return request(`/analytics/progression${q}`);
    },
    bodyweight: (profileId: number, days = 90): Promise<BodyweightTrend[]> =>
      request(`/analytics/bodyweight?profile_id=${profileId}&days=${days}`),
    strength: (profileId: number, exerciseName: string): Promise<any> =>
      request(`/analytics/strength/${exerciseName}?profile_id=${profileId}`),
  },
};
