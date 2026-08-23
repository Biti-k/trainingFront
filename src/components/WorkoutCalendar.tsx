import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Exercise, Workout } from '../types';
import { WorkoutForm } from './WorkoutForm';
import { formatDate } from '../utils/date';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const startOffset = firstDayOfMonth.getDay();

  const days: Date[] = [];
  for (let i = startOffset - 1; i >= 0; i -= 1) {
    days.push(new Date(year, monthIndex, -i));
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(year, monthIndex, day));
  }

  const trailing = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= trailing; i += 1) {
    days.push(new Date(year, monthIndex + 1, i));
  }

  return days;
}

export function WorkoutCalendar() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creatingWorkout, setCreatingWorkout] = useState(false);

  useEffect(() => {
    loadWorkouts();
    const handler = () => loadWorkouts();
    window.addEventListener('workout-saved', handler);
    return () => window.removeEventListener('workout-saved', handler);
  }, []);

  async function loadWorkouts() {
    setLoading(true);
    try {
      const [data, exercisesData] = await Promise.all([
        api.workouts.list(0, 200),
        api.exercises.list(),
      ]);
      setWorkouts(data);
      setExercises(exercisesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const workoutsByDate = useMemo(() => {
    return workouts.reduce<Record<string, Workout[]>>((acc, workout) => {
      if (!workout.date) return acc;
      const key = workout.date.slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(workout);
      return acc;
    }, {});
  }, [workouts]);

  const exerciseById = useMemo(() => {
    return Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise])) as Record<number, Exercise>;
  }, [exercises]);

  const selectedKey = selectedDate ? formatDateKey(selectedDate) : '';
  const selectedWorkouts = selectedDate ? (workoutsByDate[selectedKey] || []) : [];
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  function getWorkoutTags(workout: Workout) {
    const tags = new Set<string>();
    workout.sets.forEach((set) => {
      const exercise = exerciseById[set.exercise_id];
      if (exercise?.muscle_group) {
        tags.add(exercise.muscle_group);
      } else if (exercise?.name) {
        tags.add(exercise.name);
      }
    });
    return Array.from(tags).slice(0, 2);
  }

  function getDayTags(workoutsForDay: Workout[]) {
    const tags = new Set<string>();
    workoutsForDay.forEach((workout) => {
      getWorkoutTags(workout).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).slice(0, 2);
  }

  function changeMonth(direction: 'prev' | 'next') {
    setCurrentMonth((month) => {
      const nextMonth = new Date(month);
      nextMonth.setMonth(month.getMonth() + (direction === 'next' ? 1 : -1));
      return startOfMonth(nextMonth);
    });
  }

  function selectDay(day: Date) {
    setSelectedDate(day);
    setShowModal(true);
    setCreatingWorkout(false);
  }

  function closeModal() {
    setShowModal(false);
    setCreatingWorkout(false);
  }

  const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(currentMonth);

  if (loading) {
    return <p style={{ padding: '2rem', textAlign: 'center' }}>Loading workouts...</p>;
  }

  return (
    <div className="glass" style={{ padding: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Training Calendar</h2>
          <p className="text-green-50" style={{ margin: 0 }}>Click any day to view workouts and volume details.</p>
        </div>
        <div className="flex-between" style={{ gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => changeMonth('prev')}>Previous</button>
          <div style={{ fontWeight: 600, color: 'var(--green-100)' }}>{monthLabel}</div>
          <button type="button" className="btn btn-ghost" onClick={() => changeMonth('next')}>Next</button>
        </div>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="calendar-weekday">{weekday}</div>
        ))}
        {calendarDays.map((day) => {
          const dayKey = formatDateKey(day);
          const workoutsForDay = workoutsByDate[dayKey] || [];
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = dayKey === formatDateKey(new Date());
          const isSelected = dayKey === selectedKey;
          const dayTags = getDayTags(workoutsForDay);

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={`calendar-day ${isCurrentMonth ? '' : 'calendar-day--other'} ${workoutsForDay.length ? 'calendar-day--active' : ''} ${isSelected ? 'calendar-day--selected' : ''}`}
              onClick={() => selectDay(day)}
            >
              <div>
                <div className="calendar-day-number">{day.getDate()}</div>
                {workoutsForDay.length > 0 ? (
                  <div className="calendar-day-badge">{workoutsForDay.length}</div>
                ) : (
                  <div className="calendar-day-empty" />
                )}
              </div>
              {dayTags.length > 0 && (
                <div className="calendar-day-tags">
                  {dayTags.map((tag) => (
                    <span key={tag} className="calendar-tag">{tag}</span>
                  ))}
                </div>
              )}
              {isToday && <div className="calendar-day-today">Today</div>}
            </button>
          );
        })}
      </div>

      <div className="calendar-details glass" style={{ marginTop: '1.5rem', padding: '1.5rem' }} />

      {showModal && selectedDate && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className={`modal-content ${creatingWorkout ? 'modal-content--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Workouts on {formatDate(selectedDate)}</h3>
                {selectedWorkouts.length > 0 && (
                  <div className="calendar-day-tags" style={{ marginTop: '0.5rem' }}>
                    {getDayTags(selectedWorkouts).map((tag) => (
                      <span key={tag} className="calendar-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            {creatingWorkout ? (
              <WorkoutForm
                initialDate={selectedDate}
                onSuccess={() => setCreatingWorkout(false)}
              />
            ) : (
              <>
                {selectedWorkouts.length === 0 ? (
                  <p>No workouts logged on this date.</p>
                ) : (
                  <div className="calendar-workout-list">
                    {selectedWorkouts.map((workout) => {
                      const totalVolume = workout.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
                      const workoutExercises = Array.from(
                        new Set(
                          workout.sets.map((set) => exerciseById[set.exercise_id]?.name || `Exercise #${set.exercise_id}`),
                        ),
                      );
                      return (
                        <button
                          key={workout.id}
                          type="button"
                          className="glass calendar-workout-item"
                          onClick={() => window.location.href = `/workout-detail?id=${workout.id}`}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--green-100)' }}>Workout {workout.id}</div>
                            <div >Sets: {workout.sets.length} • Volume: {Math.round(totalVolume)} kg • Bodyweight: {workout.bodyweight ? `${workout.bodyweight} kg` : '—'}</div>
                            <div className="calendar-day-tags" style={{ marginTop: '0.75rem' }}>
                              {workoutExercises.slice(0, 3).map((name) => (
                                <span key={name} className="calendar-tag">{name}</span>
                              ))}
                            </div>
                          </div>
                          {workout.notes && <div  style={{ marginTop: '0.5rem' }}>{workout.notes}</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setCreatingWorkout(true)}
                >
                  + Log a workout for this day
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
