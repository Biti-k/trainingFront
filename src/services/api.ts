import type { Exercise, ExerciseCatalogItem, Workout, WorkoutSummary, VolumeByDate, ProgressionStats, BodyweightTrend } from '../types';

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? (window as any).__SESSION_TOKEN__ : undefined;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Not authenticated');
  }
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
    list: (muscleGroup?: string): Promise<Exercise[]> => {
      const params = new URLSearchParams();
      if (muscleGroup) params.set('muscle_group', muscleGroup);
      const qs = params.toString();
      return request(`/exercises/${qs ? `?${qs}` : ''}`);
    },
    get: (id: number): Promise<Exercise> => request(`/exercises/${id}`),
    create: (
      data: { name: string; muscle_group?: string; description?: string; image_url?: string },
    ) => request<Exercise>('/exercises/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (
      id: number,
      data: { name: string; muscle_group?: string; description?: string; image_url?: string },
    ) =>
      request<Exercise>(`/exercises/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request(`/exercises/${id}`, { method: 'DELETE' }),
    createFromCatalog: (catalogId: number): Promise<Exercise> =>
      request(`/exercises/from-catalog/${catalogId}`, { method: 'POST' }),
  },
  catalog: {
    list: (params: {
      search?: string;
      muscleGroup?: string;
      category?: string;
      equipment?: string;
      skip?: number;
      limit?: number;
    } = {}): Promise<ExerciseCatalogItem[]> => {
      const q = new URLSearchParams();
      if (params.search) q.set('search', params.search);
      if (params.muscleGroup) q.set('muscle_group', params.muscleGroup);
      if (params.category) q.set('category', params.category);
      if (params.equipment) q.set('equipment', params.equipment);
      q.set('skip', String(params.skip ?? 0));
      q.set('limit', String(params.limit ?? 50));
      return request(`/exercise-catalog/?${q.toString()}`);
    },
  },
  workouts: {
    list: (skip = 0, limit = 50): Promise<Workout[]> => request(`/workouts/?skip=${skip}&limit=${limit}`),
    get: (id: number): Promise<Workout> => request(`/workouts/${id}`),
    create: (data: any): Promise<Workout> => request('/workouts/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any): Promise<Workout> =>
      request(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/workouts/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    summary: (): Promise<WorkoutSummary> => request('/analytics/summary'),
    volume: (exerciseName?: string, days = 90): Promise<VolumeByDate[]> => {
      const q = exerciseName ? `?exercise_name=${exerciseName}&days=${days}` : `?days=${days}`;
      return request(`/analytics/volume${q}`);
    },
    progression: (exerciseName?: string): Promise<ProgressionStats[]> => {
      const q = exerciseName ? `?exercise_name=${exerciseName}` : '';
      return request(`/analytics/progression${q}`);
    },
    bodyweight: (days = 90): Promise<BodyweightTrend[]> =>
      request(`/analytics/bodyweight?days=${days}`),
    strength: (exerciseName: string): Promise<any> =>
      request(`/analytics/strength/${exerciseName}`),
  },
};
