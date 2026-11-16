// Body regions used by the exercise picker. Each region groups the specific
// muscle names used by the exercise catalog (and copied into user exercises).
export interface MuscleRegion {
  id: string;
  label: string;
  muscles: string[];
}

export const MUSCLE_REGIONS: MuscleRegion[] = [
  { id: 'chest', label: 'Chest', muscles: ['Chest'] },
  { id: 'back', label: 'Back', muscles: ['Lats', 'Middle Back', 'Lower Back', 'Traps'] },
  { id: 'shoulders', label: 'Shoulders', muscles: ['Shoulders', 'Neck'] },
  { id: 'arms', label: 'Arms', muscles: ['Biceps', 'Triceps', 'Forearms'] },
  { id: 'legs', label: 'Legs', muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abductors', 'Adductors'] },
  { id: 'core', label: 'Core', muscles: ['Abdominals'] },
];

export const OTHER_REGION: MuscleRegion = { id: 'other', label: 'Other', muscles: [] };

// Common ways people write muscles by hand → canonical muscle or region label.
// Keys are normalized (lowercase, singular).
const ALIASES: Record<string, string> = {
  pec: 'Chest', pecs: 'Chest', pectoral: 'Chest',
  lat: 'Lats', 'upper back': 'Middle Back', 'mid back': 'Middle Back', rhomboid: 'Middle Back',
  'lower-back': 'Lower Back', 'erector spinae': 'Lower Back', trap: 'Traps', trapezius: 'Traps',
  shoulder: 'Shoulders', delt: 'Shoulders', deltoid: 'Shoulders',
  bicep: 'Biceps', bi: 'Biceps', tricep: 'Triceps', tri: 'Triceps', forearm: 'Forearms', wrist: 'Forearms', grip: 'Forearms', arm: 'Arms',
  quad: 'Quadriceps', quadricep: 'Quadriceps', hamstring: 'Hamstrings', ham: 'Hamstrings',
  glute: 'Glutes', gluteus: 'Glutes', butt: 'Glutes', calf: 'Calves', calve: 'Calves',
  abductor: 'Abductors', adductor: 'Adductors', leg: 'Legs',
  ab: 'Abdominals', abs: 'Abdominals', abdominal: 'Abdominals', oblique: 'Abdominals', core: 'Core',
};

function normalize(s: string) {
  const t = s.trim().toLowerCase().replace(/\s+/g, ' ');
  return t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t;
}

const muscleIndex = new Map<string, { muscle: string; region: MuscleRegion }>();
const regionIndex = new Map<string, MuscleRegion>();
for (const region of MUSCLE_REGIONS) {
  regionIndex.set(normalize(region.label), region);
  for (const m of region.muscles) muscleIndex.set(normalize(m), { muscle: m, region });
}

/**
 * Parse a free-text muscle group ("Arms, forearm", "chest/triceps", "Quads") into the
 * specific canonical muscles and regions it mentions, in the order written.
 */
export function parseMuscleGroup(value: string | null | undefined): { muscles: string[]; regions: MuscleRegion[] } {
  const muscles: string[] = [];
  const regions: MuscleRegion[] = [];
  if (!value) return { muscles, regions };
  const parts = value.split(/[,/;+&|]|\band\b/i).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    let key = normalize(part);
    if (ALIASES[key] || ALIASES[part.trim().toLowerCase()]) key = normalize(ALIASES[key] ?? ALIASES[part.trim().toLowerCase()]);
    const m = muscleIndex.get(key);
    if (m) {
      if (!muscles.includes(m.muscle)) muscles.push(m.muscle);
      if (!regions.includes(m.region)) regions.push(m.region);
      continue;
    }
    const r = regionIndex.get(key);
    if (r && !regions.includes(r)) regions.push(r);
  }
  return { muscles, regions };
}

/** The region an exercise belongs to. A specific muscle wins over a region label. */
export function regionForMuscle(muscle: string | null | undefined): MuscleRegion {
  const { muscles, regions } = parseMuscleGroup(muscle);
  if (muscles.length) return muscleIndex.get(normalize(muscles[0]))!.region;
  return regions[0] ?? OTHER_REGION;
}

/** Whether an exercise's muscle group mentions this specific canonical muscle. */
export function mentionsMuscle(muscleGroup: string | null | undefined, muscle: string) {
  return parseMuscleGroup(muscleGroup).muscles.includes(muscle);
}
