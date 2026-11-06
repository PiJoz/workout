// Kategorie, typy pomiaru i wbudowana biblioteka ćwiczeń.

export const CATEGORIES = [
  { id: 'abs', name: 'Abs', color: '#f59e0b' },
  { id: 'plecy', name: 'Plecy', color: '#3b82f6' },
  { id: 'biceps', name: 'Biceps', color: '#8b5cf6' },
  { id: 'cardio', name: 'Cardio', color: '#ef4444' },
  { id: 'klatka', name: 'Klatka', color: '#10b981' },
  { id: 'nogi', name: 'Nogi', color: '#ec4899' },
  { id: 'ramiona', name: 'Ramiona', color: '#06b6d4' },
  { id: 'triceps', name: 'Triceps', color: '#a3a33a' },
];

// Każdy typ mówi, jakie pola ma seria.
export const TYPES = {
  weight_reps: { name: 'Ciężar / Powtórzenia', fields: ['weight', 'reps'] },
  reps: { name: 'Powtórzenia', fields: ['reps'] },
  weight_time: { name: 'Ciężar / Czas', fields: ['weight', 'time'] },
  time: { name: 'Czas', fields: ['time'] },
  distance_time: { name: 'Dystans / Czas', fields: ['distance', 'time'] },
  distance: { name: 'Dystans', fields: ['distance'] },
};

export const FIELD_LABELS = {
  weight: 'Ciężar (kg)',
  reps: 'Powtórzenia',
  time: 'Czas (mm:ss)',
  distance: 'Dystans (km)',
};

const WR = 'weight_reps';
const R = 'reps';
const T = 'time';
const DT = 'distance_time';
const WT = 'weight_time';

const LIBRARY = {
  abs: [
    ['Brzuszki', R],
    ['Spięcia brzucha na maszynie', WR],
    ['Spięcia brzucha na wyciągu', WR],
    ['Plank', T],
    ['Plank boczny', T],
    ['Unoszenie nóg w zwisie', R],
    ['Unoszenie nóg leżąc', R],
    ['Russian twist', WR],
    ['Kółko do ćwiczeń brzucha (ab wheel)', R],
    ['Nożyce', T],
    ['Mountain climbers', T],
    ['Rowerek', R],
    ['Dragon flag', R],
    ['Unoszenie kolan w zwisie', R],
  ],
  plecy: [
    ['Martwy ciąg', WR],
    ['Podciąganie nachwytem', R],
    ['Podciąganie podchwytem', R],
    ['Podciąganie z obciążeniem', WR],
    ['Wiosłowanie sztangą w opadzie', WR],
    ['Wiosłowanie hantlem', WR],
    ['Ściąganie drążka wyciągu górnego', WR],
    ['Wiosłowanie na wyciągu dolnym', WR],
    ['Wiosłowanie T-sztangą', WR],
    ['Hiperekstensje', R],
    ['Pullover na wyciągu', WR],
    ['Podciąganie chwytem neutralnym', R],
    ['Wiosłowanie Pendlaya', WR],
    ['Wiosłowanie na maszynie', WR],
    ['Martwy ciąg z podwyższenia (rack pull)', WR],
    ['Skłony ze sztangą na karku (good morning)', WR],
  ],
  biceps: [
    ['Uginanie ramion ze sztangą', WR],
    ['Uginanie ramion ze sztangą łamaną', WR],
    ['Uginanie ramion z hantlami', WR],
    ['Uginanie młotkowe', WR],
    ['Uginanie na modlitewniku', WR],
    ['Uginanie na wyciągu', WR],
    ['Uginanie koncentryczne', WR],
    ['Uginanie na ławce skośnej', WR],
    ['Uginanie na maszynie', WR],
    ['Uginanie na modlitewniku hantlem', WR],
  ],
  cardio: [
    ['Bieg', DT],
    ['Bieżnia', DT],
    ['Rower', DT],
    ['Rower stacjonarny', DT],
    ['Orbitrek', DT],
    ['Wioślarz', DT],
    ['Pływanie', DT],
    ['Spacer', DT],
    ['Skakanka', T],
    ['Stepper / schody', T],
    ['Burpees', R],
  ],
  klatka: [
    ['Wyciskanie sztangi na ławce płaskiej', WR],
    ['Wyciskanie sztangi na ławce skośnej', WR],
    ['Wyciskanie hantli na ławce płaskiej', WR],
    ['Wyciskanie hantli na ławce skośnej', WR],
    ['Rozpiętki z hantlami', WR],
    ['Krzyżowanie linek wyciągu', WR],
    ['Butterfly (maszyna)', WR],
    ['Wyciskanie na maszynie', WR],
    ['Pompki', R],
    ['Pompki na poręczach (klatka)', R],
    ['Wyciskanie sztangi na ławce ujemnej', WR],
    ['Rozpiętki na ławce skośnej', WR],
    ['Wyciskanie na maszynie na ławce skośnej', WR],
    ['Wyciskanie na maszynie na ławce ujemnej', WR],
  ],
  nogi: [
    ['Przysiad ze sztangą', WR],
    ['Przysiad przedni', WR],
    ['Przysiad bułgarski', WR],
    ['Wypychanie na suwnicy', WR],
    ['Wykroki', WR],
    ['Martwy ciąg rumuński', WR],
    ['Prostowanie nóg na maszynie', WR],
    ['Uginanie nóg na maszynie', WR],
    ['Hip thrust', WR],
    ['Wspięcia na palce', WR],
    ['Przysiad bez obciążenia', R],
    ['Krzesełko przy ścianie', T],
    ['Spacer farmera', WT],
    ['Wspięcia na palce w opadzie (donkey)', WR],
    ['Mostek biodrowy ze sztangą', WR],
    ['Glute-ham raise', R],
    ['Martwy ciąg sumo', WR],
  ],
  ramiona: [
    ['Wyciskanie żołnierskie', WR],
    ['Wyciskanie hantli nad głowę', WR],
    ['Arnoldki', WR],
    ['Wznosy hantli bokiem', WR],
    ['Wznosy hantli przodem', WR],
    ['Odwrotne rozpiętki', WR],
    ['Face pull', WR],
    ['Szrugsy', WR],
    ['Podciąganie sztangi wzdłuż tułowia', WR],
    ['Wyciskanie na maszynie barkowej', WR],
    ['Wyciskanie z podrzutem (push press)', WR],
    ['Wyciskanie sztangi zza karku', WR],
    ['Wznosy hantli bokiem siedząc', WR],
    ['Wznosy bokiem na maszynie', WR],
    ['Odwrotne rozpiętki na maszynie', WR],
    ['Wyciskanie hantla jednorącz stojąc', WR],
    ['Wyciskanie kłody (log press)', WR],
    ['Wyciskanie nad głowę na maszynie Smitha', WR],
    ['Szrugsy na maszynie', WR],
  ],
  triceps: [
    ['Wyciskanie francuskie', WR],
    ['Prostowanie ramion na wyciągu', WR],
    ['Prostowanie ramion zza głowy', WR],
    ['Wyciskanie sztangi wąskim chwytem', WR],
    ['Prostowanie ramienia w opadzie (kickback)', WR],
    ['Pompki na poręczach (triceps)', R],
    ['Pompki diamentowe', R],
    ['Pompki w podporze tyłem', R],
    ['Prostowanie ramion zza głowy na wyciągu', WR],
    ['Wyciskanie francuskie sztangą łamaną', WR],
    ['Dipy na kółkach', R],
    ['Wyciskanie wąskim chwytem na maszynie Smitha', WR],
  ],
};

export function slug(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const DEFAULT_EXERCISES = Object.entries(LIBRARY).flatMap(([category, list]) =>
  list.map(([name, type]) => ({ id: `${category}:${slug(name)}`, name, category, type, custom: false })),
);

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id);
}

// Potoczne nazwy partii w ręcznie pisanych plikach .txt.
const CATEGORY_ALIASES = {
  brzuch: 'abs', 'mięśnie brzucha': 'abs',
  'klatka piersiowa': 'klatka', klata: 'klatka',
  barki: 'ramiona', bark: 'ramiona',
  kondycja: 'cardio',
  noga: 'nogi',
};

export function categoryByName(name) {
  const n = (name || '').trim().toLowerCase();
  const id = CATEGORY_ALIASES[n] || n;
  return CATEGORIES.find((c) => c.name.toLowerCase() === id || c.id === id);
}

export function typeByName(name) {
  const n = (name || '').replace(/\s+/g, '').toLowerCase();
  return Object.keys(TYPES).find((k) => TYPES[k].name.replace(/\s+/g, '').toLowerCase() === n);
}

// "Plank (Czas)" i "Plank (Czas) 2" -> "Plank". Liczone z nazwy, nie zapisywane osobno,
// więc działa też dla wariantu wczytanego z pliku .txt z innego telefonu.
export function baseName(ex) {
  const suffix = ` (${TYPES[ex.type].name})`;
  const m = ex.name.match(/^(.*?)( \d+)?$/);
  return m[1].endsWith(suffix) ? m[1].slice(0, -suffix.length) : ex.name;
}
