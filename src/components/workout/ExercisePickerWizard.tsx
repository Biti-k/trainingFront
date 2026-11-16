import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import type { Exercise, ExerciseCatalogItem } from '../../types';
import { MUSCLE_REGIONS, OTHER_REGION, mentionsMuscle, parseMuscleGroup, type MuscleRegion } from '../../utils/muscles';

interface Props {
  exercises: Exercise[];
  /** Exercise ids the user trained most recently, newest first. */
  recentIds: number[];
  /** Exercise ids already in the current workout. */
  inWorkoutIds: number[];
  onPick: (exercise: Exercise) => void;
  onExerciseCreated: (exercise: Exercise) => void;
  onClose: () => void;
}

function Thumb({ src }: { src: string | null }) {
  return src ? (
    <img className="wz-thumb" src={src} alt="" loading="lazy" />
  ) : (
    <div className="wz-thumb wz-thumb--empty">🏋️</div>
  );
}

export function ExercisePickerWizard({ exercises, recentIds, inWorkoutIds, onPick, onExerciseCreated, onClose }: Props) {
  const [region, setRegion] = useState<MuscleRegion | null>(null);
  const [muscle, setMuscle] = useState<string>(''); // '' = all muscles of the region
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const byRegion = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const ex of exercises) {
      // "chest/triceps" shows up under both Chest and Arms
      const { regions } = parseMuscleGroup(ex.muscle_group);
      for (const r of regions.length ? regions : [OTHER_REGION]) {
        if (!map.has(r.id)) map.set(r.id, []);
        map.get(r.id)!.push(ex);
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [exercises]);

  const recent = useMemo(
    () => recentIds.map((id) => exercises.find((e) => e.id === id)).filter(Boolean).slice(0, 8) as Exercise[],
    [recentIds, exercises],
  );

  const regions = byRegion.has(OTHER_REGION.id) ? [...MUSCLE_REGIONS, OTHER_REGION] : MUSCLE_REGIONS;
  const query = search.trim().toLowerCase();

  // Reset the catalog results whenever the context changes
  useEffect(() => {
    setCatalog(null);
  }, [region, muscle, query]);

  const visibleExercises = useMemo(() => {
    if (query) return exercises.filter((e) => e.name.toLowerCase().includes(query));
    if (!region) return [];
    const list = byRegion.get(region.id) ?? [];
    if (!muscle) return list;
    return list.filter((e) => mentionsMuscle(e.muscle_group, muscle));
  }, [query, region, muscle, byRegion, exercises]);

  async function loadCatalog() {
    setCatalogLoading(true);
    setError('');
    try {
      let items: ExerciseCatalogItem[];
      if (query) {
        items = await api.catalog.list({ search: query, limit: 40 });
      } else {
        const muscles = muscle ? [muscle] : region!.muscles;
        const results = await Promise.all(muscles.map((m) => api.catalog.list({ muscleGroup: m, limit: 40 })));
        const seen = new Set<number>();
        items = results.flat().filter((i) => !seen.has(i.id) && seen.add(i.id));
        items.sort((a, b) => a.name.localeCompare(b.name));
      }
      const owned = new Set(exercises.map((e) => e.name.toLowerCase()));
      setCatalog(items.filter((i) => !owned.has(i.name.toLowerCase())));
    } catch (e: any) {
      setError(e.message || 'Could not load the catalog');
    } finally {
      setCatalogLoading(false);
    }
  }

  async function pickFromCatalog(item: ExerciseCatalogItem) {
    setAddingId(item.id);
    setError('');
    try {
      const ex = await api.exercises.createFromCatalog(item.id);
      onExerciseCreated(ex);
      onPick(ex);
    } catch (e: any) {
      setError(e.message || 'Could not add the exercise');
      setAddingId(null);
    }
  }

  function renderExerciseRow(ex: Exercise) {
    const already = inWorkoutIds.includes(ex.id);
    return (
      <button key={ex.id} type="button" className="wz-row" onClick={() => onPick(ex)}>
        <Thumb src={ex.image_url} />
        <span className="wz-row-text">
          <span className="wz-row-name">{ex.name}</span>
          {ex.muscle_group && <span className="wz-row-sub">{ex.muscle_group}</span>}
        </span>
        {already ? <span className="badge">In workout</span> : <span className="wz-row-add">+</span>}
      </button>
    );
  }

  function renderCatalog() {
    const canBrowse = query || region;
    if (!canBrowse) return null;
    return (
      <div className="wz-section">
        {catalog === null ? (
          <button type="button" className="btn btn-ghost wz-full" onClick={loadCatalog} disabled={catalogLoading}>
            {catalogLoading ? 'Loading…' : query ? `Search the catalog for “${search.trim()}”` : 'Browse more exercises from the catalog'}
          </button>
        ) : (
          <>
            <div className="wz-section-title">From the catalog</div>
            {catalog.length === 0 && <p className="text-muted">Nothing new found.</p>}
            <div className="wz-list">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="wz-row"
                  onClick={() => pickFromCatalog(item)}
                  disabled={addingId !== null}
                >
                  <Thumb src={item.image_url} />
                  <span className="wz-row-text">
                    <span className="wz-row-name">{item.name}</span>
                    <span className="wz-row-sub">{[item.muscle_group, item.equipment].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="wz-row-add">{addingId === item.id ? '…' : '+'}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const step = query ? 'search' : region ? 'exercise' : 'group';

  return (
    <div className="modal-overlay wz-overlay" onClick={onClose}>
      <div className="modal-content modal-content--wide wz-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Pick an exercise">
        <div className="wz-header">
          {step === 'exercise' ? (
            <button type="button" className="wz-back" onClick={() => { setRegion(null); setMuscle(''); }} aria-label="Back to muscle groups">
              ←
            </button>
          ) : (
            <span className="wz-step">{step === 'search' ? 'Search' : 'Step 1 of 2'}</span>
          )}
          <h3 className="wz-title">
            {step === 'group' && 'Which muscle group?'}
            {step === 'exercise' && region!.label}
            {step === 'search' && 'Results'}
          </h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <input
          className="wz-search"
          type="search"
          placeholder="Search your exercises…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && <p className="wz-error">{error}</p>}

        <div className="wz-body">
          {step === 'group' && (
            <>
              {recent.length > 0 && (
                <div className="wz-section">
                  <div className="wz-section-title">Recent</div>
                  <div className="wz-chips">
                    {recent.map((ex) => (
                      <button key={ex.id} type="button" className="wz-chip" onClick={() => onPick(ex)}>
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="wz-grid">
                {regions.map((r) => {
                  const count = byRegion.get(r.id)?.length ?? 0;
                  return (
                    <button key={r.id} type="button" className="wz-tile" onClick={() => setRegion(r)}>
                      <span className="wz-tile-label">{r.label}</span>
                      <span className="wz-tile-sub">
                        {count > 0 ? `${count} exercise${count === 1 ? '' : 's'}` : 'Browse catalog'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 'exercise' && (
            <>
              {region!.muscles.length > 1 && (
                <div className="wz-chips wz-chips--filter">
                  {['', ...region!.muscles].map((m) => (
                    <button
                      key={m || 'all'}
                      type="button"
                      className={`wz-chip ${muscle === m ? 'wz-chip--active' : ''}`}
                      onClick={() => setMuscle(m)}
                    >
                      {m || 'All'}
                    </button>
                  ))}
                </div>
              )}
              {visibleExercises.length > 0 ? (
                <div className="wz-list">{visibleExercises.map(renderExerciseRow)}</div>
              ) : (
                <p className="text-muted wz-empty">You have no exercises here yet. Pick one from the catalog below.</p>
              )}
              {region!.id !== OTHER_REGION.id && renderCatalog()}
            </>
          )}

          {step === 'search' && (
            <>
              {visibleExercises.length > 0 ? (
                <div className="wz-list">{visibleExercises.map(renderExerciseRow)}</div>
              ) : (
                <p className="text-muted wz-empty">None of your exercises match.</p>
              )}
              {renderCatalog()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
