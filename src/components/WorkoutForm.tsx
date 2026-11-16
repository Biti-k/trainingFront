import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import type { Exercise, Set as WorkoutSet, Workout } from '../types';
import { ExercisePickerWizard } from './workout/ExercisePickerWizard';
import { parseDateOnly, formatDateLong } from '../utils/date';

// Inputs are kept as strings so "82.5" / "" can be typed freely on a phone.
interface SetRow {
  weight: string;
  reps: string;
  rpe: string;
  notes: string;
  showMore?: boolean;
}

interface ExerciseBlock {
  key: string;
  exercise_id: number;
  sets: SetRow[];
}

interface LastPerformance {
  date: string | null;
  sets: WorkoutSet[];
}

const DRAFT_KEY = 'workout-draft:v1';
const WEIGHT_STEP = 2.5;

let keySeq = 0;
const newKey = () => `b${Date.now()}-${keySeq++}`;

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));
const emptySet = (): SetRow => ({ weight: '', reps: '', rpe: '', notes: '' });
const fromApiSet = (s: WorkoutSet): SetRow => ({ weight: fmt(s.weight), reps: fmt(s.reps), rpe: fmt(s.rpe), notes: '' });

function bump(value: string, delta: number, min = 0) {
  const n = parseFloat(value.replace(',', '.'));
  const next = Math.max(min, (isNaN(n) ? 0 : n) + delta);
  return String(Math.round(next * 100) / 100);
}

/** "3×8 @ 80 kg" when every set matched, otherwise "80×8, 85×6, …". */
function summarizeSets(sets: WorkoutSet[]) {
  if (sets.length === 0) return '';
  const same = sets.every((s) => s.weight === sets[0].weight && s.reps === sets[0].reps);
  if (same) return `${sets.length}×${sets[0].reps} @ ${sets[0].weight} kg`;
  return sets.map((s) => `${s.weight}×${s.reps}`).join(', ');
}

/** Group a workout's sets into exercise blocks, in the order each exercise first appears. */
function blocksFromWorkout(workout: Workout): ExerciseBlock[] {
  const blocks: ExerciseBlock[] = [];
  const byExercise = new Map<number, ExerciseBlock>();
  for (const s of [...workout.sets].sort((a, b) => a.order - b.order)) {
    let block = byExercise.get(s.exercise_id);
    if (!block) {
      block = { key: newKey(), exercise_id: s.exercise_id, sets: [] };
      byExercise.set(s.exercise_id, block);
      blocks.push(block);
    }
    block.sets.push({ ...fromApiSet(s), notes: s.notes || '' });
  }
  return blocks;
}

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeDraft(value: unknown) {
  try {
    if (value) localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable — drafts are a convenience only */
  }
}

export function WorkoutForm({
  onSuccess,
  workout,
  initialDate,
}: {
  onSuccess?: () => void;
  workout?: Workout | null;
  initialDate?: Date;
}) {
  const isEditing = !!workout;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => toDateInputValue(initialDate ?? new Date()));
  const [bodyweight, setBodyweight] = useState('');
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const hydrated = useRef(false);
  const lastBlockRef = useRef<HTMLDivElement | null>(null);
  const scrollToNewBlock = useRef(false);

  useEffect(() => {
    Promise.all([api.exercises.list(), api.workouts.list(0, 30).catch(() => [] as Workout[])])
      .then(([ex, ws]) => {
        setExercises(ex);
        setHistory(ws);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Load the workout being edited, or restore an unsaved draft.
  useEffect(() => {
    if (workout) {
      setDate(workout.date ? workout.date.slice(0, 10) : toDateInputValue(new Date()));
      setBodyweight(workout.bodyweight ? String(workout.bodyweight) : '');
      setNotes(workout.notes || '');
      setBlocks(blocksFromWorkout(workout));
    } else if (!hydrated.current) {
      const draft = readDraft();
      if (draft?.blocks?.length) {
        if (!initialDate && draft.date) setDate(draft.date);
        setBodyweight(draft.bodyweight || '');
        setNotes(draft.notes || '');
        setBlocks(draft.blocks);
        setDraftRestored(true);
      }
    }
    hydrated.current = true;
  }, [workout]);

  // Autosave new workouts so a locked phone or reload in the gym loses nothing.
  useEffect(() => {
    if (isEditing || !hydrated.current) return;
    writeDraft(blocks.length ? { date, bodyweight, notes, blocks } : null);
  }, [isEditing, date, bodyweight, notes, blocks]);

  useEffect(() => {
    if (scrollToNewBlock.current && lastBlockRef.current) {
      lastBlockRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scrollToNewBlock.current = false;
    }
  }, [blocks.length]);

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  // Most recent previous performance of each exercise (excluding the workout being edited).
  const lastPerformance = useMemo(() => {
    const map = new Map<number, LastPerformance>();
    const sorted = [...history]
      .filter((w) => w.id !== workout?.id)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    for (const w of sorted) {
      const sets = [...w.sets].sort((a, b) => a.order - b.order);
      for (const s of sets) {
        if (!map.has(s.exercise_id)) {
          map.set(s.exercise_id, { date: w.date, sets: sets.filter((x) => x.exercise_id === s.exercise_id) });
        }
      }
    }
    return map;
  }, [history, workout?.id]);

  const recentIds = useMemo(() => [...lastPerformance.keys()], [lastPerformance]);

  // ── Block / set mutations ──
  function updateBlock(key: string, fn: (b: ExerciseBlock) => ExerciseBlock) {
    setBlocks((prev) => prev.map((b) => (b.key === key ? fn(b) : b)));
  }

  function addExercise(ex: Exercise) {
    setPickerOpen(false);
    const existing = blocks.find((b) => b.exercise_id === ex.id);
    if (existing) {
      addSet(existing.key);
      return;
    }
    const last = lastPerformance.get(ex.id);
    const first = last?.sets[0] ? fromApiSet(last.sets[0]) : emptySet();
    scrollToNewBlock.current = true;
    setBlocks((prev) => [...prev, { key: newKey(), exercise_id: ex.id, sets: [first] }]);
  }

  /** New set = copy of the previous set, since most sets repeat the same weight/reps. */
  function addSet(blockKey: string) {
    updateBlock(blockKey, (b) => {
      const prev = b.sets[b.sets.length - 1];
      const next = prev ? { weight: prev.weight, reps: prev.reps, rpe: prev.rpe, notes: '' } : emptySet();
      return { ...b, sets: [...b.sets, next] };
    });
  }

  function repeatLastSession(blockKey: string, exerciseId: number) {
    const last = lastPerformance.get(exerciseId);
    if (!last) return;
    updateBlock(blockKey, (b) => ({ ...b, sets: last.sets.map(fromApiSet) }));
  }

  function updateSet(blockKey: string, index: number, patch: Partial<SetRow>) {
    updateBlock(blockKey, (b) => ({ ...b, sets: b.sets.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));
  }

  function removeSet(blockKey: string, index: number) {
    setBlocks((prev) =>
      prev
        .map((b) => (b.key === blockKey ? { ...b, sets: b.sets.filter((_, i) => i !== index) } : b))
        .filter((b) => b.sets.length > 0),
    );
  }

  function removeBlock(blockKey: string) {
    setBlocks((prev) => prev.filter((b) => b.key !== blockKey));
  }

  function moveBlock(blockKey: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.key === blockKey);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function discardDraft() {
    writeDraft(null);
    setBlocks([]);
    setBodyweight('');
    setNotes('');
    setDraftRestored(false);
  }

  // ── Submit ──
  const flatSets = blocks.flatMap((b) =>
    b.sets.map((s) => ({
      exercise_id: b.exercise_id,
      weight: parseFloat(s.weight.replace(',', '.')) || 0,
      reps: parseInt(s.reps, 10) || 0,
      rpe: s.rpe ? parseFloat(s.rpe.replace(',', '.')) : null,
      notes: s.notes.trim() || null,
    })),
  );
  const validSets = flatSets.filter((s) => s.reps > 0 && s.weight >= 0);
  const skipped = flatSets.length - validSets.length;
  const totalVolume = validSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (validSets.length === 0) {
      setError('Add at least one set with reps.');
      return;
    }
    const workoutData = {
      date: `${date}T00:00:00.000Z`,
      bodyweight: bodyweight ? parseFloat(bodyweight.replace(',', '.')) : null,
      notes: notes || null,
      sets: validSets.map((s, i) => ({ ...s, order: i + 1 })),
    };
    setSaving(true);
    try {
      if (isEditing && workout?.id) {
        await api.workouts.update(workout.id, workoutData);
      } else {
        await api.workouts.create(workoutData);
        writeDraft(null);
        setBlocks([]);
        setBodyweight('');
        setNotes('');
        setDraftRestored(false);
        // Refresh history so "last time" hints include what was just logged.
        api.workouts.list(0, 30).then(setHistory).catch(() => {});
      }
      window.dispatchEvent(new Event('workout-saved'));
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted p-8 text-center">Loading…</p>;

  return (
    <div className="glass wf">
      <form onSubmit={handleSubmit}>
        <div className="wf-head">
          <div>
            <h2 className="wf-title">{isEditing ? 'Edit workout' : 'Log workout'}</h2>
            <button type="button" className="wf-date-toggle" onClick={() => setShowDetails((v) => !v)}>
              {formatDateLong(parseDateOnly(date))}
              {bodyweight && ` · ${bodyweight} kg`}
              <span className="wf-caret">{showDetails ? '▴' : '▾'}</span>
            </button>
          </div>
          {draftRestored && !isEditing && (
            <div className="wf-draft">
              Draft restored
              <button type="button" className="wf-link" onClick={discardDraft}>Discard</button>
            </div>
          )}
        </div>

        {showDetails && (
          <div className="wf-details">
            <div className="form-group">
              <label>Date</label>
              <input type="date" lang="en-GB" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Bodyweight (kg)</label>
              <input type="text" inputMode="decimal" value={bodyweight} onChange={(e) => setBodyweight(e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group wf-details-notes">
              <label>Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it go?" />
            </div>
          </div>
        )}

        {error && <p className="wf-error">{error}</p>}

        {blocks.length === 0 && (
          <div className="wf-empty">
            <p>Start by adding your first exercise.</p>
          </div>
        )}

        {blocks.map((block, bi) => {
          const ex = exerciseById.get(block.exercise_id);
          const last = lastPerformance.get(block.exercise_id);
          return (
            <div key={block.key} className="wf-block" ref={bi === blocks.length - 1 ? lastBlockRef : undefined}>
              <div className="wf-block-head">
                {ex?.image_url ? (
                  <img className="wf-block-img" src={ex.image_url} alt="" />
                ) : (
                  <div className="wf-block-img wf-block-img--empty">🏋️</div>
                )}
                <div className="wf-block-info">
                  <div className="wf-block-name">{ex?.name ?? `Exercise #${block.exercise_id}`}</div>
                  {last ? (
                    <button
                      type="button"
                      className="wf-last"
                      onClick={() => repeatLastSession(block.key, block.exercise_id)}
                      title="Replace these sets with last session's sets"
                    >
                      Last: {summarizeSets(last.sets)} · <u>repeat</u>
                    </button>
                  ) : (
                    ex?.muscle_group && <div className="wf-block-sub">{ex.muscle_group}</div>
                  )}
                </div>
                <div className="wf-block-actions">
                  <button type="button" className="wf-icon" onClick={() => moveBlock(block.key, -1)} disabled={bi === 0} aria-label="Move up">↑</button>
                  <button type="button" className="wf-icon" onClick={() => moveBlock(block.key, 1)} disabled={bi === blocks.length - 1} aria-label="Move down">↓</button>
                  <button type="button" className="wf-icon wf-icon--danger" onClick={() => removeBlock(block.key)} aria-label="Remove exercise">✕</button>
                </div>
              </div>

              <div className="wf-sets">
                <div className="wf-set wf-set--labels">
                  <span>Set</span>
                  <span>kg</span>
                  <span>Reps</span>
                  <span />
                </div>
                {block.sets.map((s, si) => (
                  <div key={si} className="wf-set-wrap">
                    <div className="wf-set">
                      <span className="wf-set-num">{si + 1}</span>
                      <div className="wf-stepper">
                        <button type="button" onClick={() => updateSet(block.key, si, { weight: bump(s.weight, -WEIGHT_STEP) })} aria-label="Less weight">−</button>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={s.weight}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateSet(block.key, si, { weight: e.target.value })}
                          aria-label={`Set ${si + 1} weight`}
                        />
                        <button type="button" onClick={() => updateSet(block.key, si, { weight: bump(s.weight, WEIGHT_STEP) })} aria-label="More weight">+</button>
                      </div>
                      <div className="wf-stepper">
                        <button type="button" onClick={() => updateSet(block.key, si, { reps: bump(s.reps, -1) })} aria-label="Fewer reps">−</button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={s.reps}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateSet(block.key, si, { reps: e.target.value.replace(/\D/g, '') })}
                          aria-label={`Set ${si + 1} reps`}
                        />
                        <button type="button" onClick={() => updateSet(block.key, si, { reps: bump(s.reps, 1) })} aria-label="More reps">+</button>
                      </div>
                      <div className="wf-set-actions">
                        <button
                          type="button"
                          className={`wf-icon ${s.rpe || s.notes ? 'wf-icon--on' : ''}`}
                          onClick={() => updateSet(block.key, si, { showMore: !(s.showMore ?? !!s.notes) })}
                          aria-label={`Set ${si + 1} RPE and note`}
                        >
                          {s.rpe ? `@${s.rpe}` : '⋯'}
                        </button>
                        <button type="button" className="wf-icon wf-icon--danger" onClick={() => removeSet(block.key, si)} aria-label="Remove set">✕</button>
                      </div>
                    </div>
                    {(s.showMore ?? !!s.notes) && (
                      <div className="wf-set-more">
                        <label className="wf-rpe-label">
                          RPE
                          <input
                            className="wf-rpe"
                            type="text"
                            inputMode="decimal"
                            value={s.rpe}
                            placeholder="–"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => updateSet(block.key, si, { rpe: e.target.value })}
                            aria-label={`Set ${si + 1} RPE`}
                          />
                        </label>
                        <input
                          className="wf-set-notes"
                          type="text"
                          value={s.notes}
                          placeholder="Note for this set"
                          onChange={(e) => updateSet(block.key, si, { notes: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" className="btn btn-ghost wf-add-set" onClick={() => addSet(block.key)}>
                + Add set{block.sets.length > 0 && <span className="text-muted wf-add-set-hint">(copy of set {block.sets.length})</span>}
              </button>
            </div>
          );
        })}

        <button type="button" className="btn btn-ghost wf-add-exercise" onClick={() => setPickerOpen(true)}>
          + Add exercise
        </button>

        <div className="wf-footer">
          <div className="wf-summary">
            <strong>{validSets.length}</strong> sets · <strong>{Math.round(totalVolume)}</strong> kg
            {skipped > 0 && <span className="text-muted"> · {skipped} without reps</span>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving || validSets.length === 0}>
            {saving ? 'Saving…' : isEditing ? 'Update workout' : 'Save workout'}
          </button>
        </div>
      </form>

      {pickerOpen && createPortal(
        <ExercisePickerWizard
          exercises={exercises}
          recentIds={recentIds}
          inWorkoutIds={blocks.map((b) => b.exercise_id)}
          onPick={addExercise}
          onExerciseCreated={(ex) => setExercises((prev) => (prev.some((p) => p.id === ex.id) ? prev : [...prev, ex]))}
          onClose={() => setPickerOpen(false)}
        />,
        document.body,
      )}
    </div>
  );
}
