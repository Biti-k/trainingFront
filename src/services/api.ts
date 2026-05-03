const API_BASE = 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  exercises: {
    list: (muscleGroup?: string) => {
      const q = muscleGroup ? `?muscle_group=${muscleGroup}` : '';
      return request(`/exercises/${q}`);
    },
    get: (id: number) => request(`/exercises/${id}`),
    create: (data: { name: string; muscle_group?: string; description?: string }) =>
      request('/exercises/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name: string; muscle_group?: string; description?: string }) =>
      request(`/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/exercises/${id}`, { method: 'DELETE' }),
  },
  workouts: {
    list: (skip = 0, limit = 50) => request(`/workouts/?skip=${skip}&limit=${limit}`),
    get: (id: number) => request(`/workouts/${id}`),
    create: (data: any) => request('/workouts/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/workouts/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    summary: () => request('/analytics/summary'),
    volume: (exerciseName?: string, days = 90) => {
      const q = exerciseName ? `?exercise_name=${exerciseName}&days=${days}` : `?days=${days}`;
      return request(`/analytics/volume${q}`);
    },
    progression: (exerciseName?: string) => {
      const q = exerciseName ? `?exercise_name=${exerciseName}` : '';
      return request(`/analytics/progression${q}`);
    },
    bodyweight: (days = 90) => request(`/analytics/bodyweight?days=${days}`),
    strength: (exerciseName: string) => request(`/analytics/strength/${exerciseName}`),
  },
};
