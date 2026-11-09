// Stan aplikacji w localStorage. Jedyne miejsce, które go czyta i zapisuje.

import { CATEGORIES, DEFAULT_EXERCISES, TYPES, baseName, slug } from './data.js';
import { todayKey, uid } from './util.js';

// Strona testów ustawia własny klucz, żeby nie dotykać prawdziwych danych. Bez niej - nic.
const KEY = globalThis.WORKOUT_STORAGE_KEY || 'workout.v1';

const DEFAULT_SETTINGS = { weightUnit: 'kg', distanceUnit: 'km', theme: 'system', chartRange: '3m' };
const SETTING_VALUES = {
  weightUnit: ['kg', 'lb'],
  distanceUnit: ['km', 'mi'],
  theme: ['system', 'light', 'dark'],
  chartRange: ['1m', '3m', '1y', 'all'],
};

let state = load();

function empty() {
  return { version: 1, customExercises: [], workouts: {}, settings: { ...DEFAULT_SETTINGS }, garmin: { sent: {} }, templates: [] };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const s = JSON.parse(raw);
    return { ...empty(), ...s, settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) }, garmin: { sent: { ...s.garmin?.sent } } };
  } catch {
    return empty();
  }
}

let batching = false;

function save() {
  if (batching) return; // import zapisuje raz, na końcu
  localStorage.setItem(KEY, JSON.stringify(state));
}

// Inna karta zapisała dane (zdarzenie "storage"). Bez ponownego wczytania następny zapis
// w tej karcie nadpisałby jej zmiany starym stanem z pamięci.
export function reloadFromStorage(key) {
  if (key !== KEY && key !== null) return false;
  state = load();
  return true;
}

// --- ustawienia ---

export function getSettings() {
  return { ...state.settings };
}

export function setSetting(key, value) {
  if (!SETTING_VALUES[key]?.includes(value)) throw new Error(`Niepoprawne ustawienie ${key}=${value}`);
  state.settings[key] = value;
  save();
}

// --- ćwiczenia ---

export function allExercises() {
  return [...DEFAULT_EXERCISES, ...state.customExercises];
}

export function exercisesIn(category) {
  return allExercises()
    .filter((e) => e.category === category)
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

export function getExercise(id) {
  return allExercises().find((e) => e.id === id);
}

export function customExercises() {
  return [...state.customExercises];
}

// Tylko w obrębie partii: "X" pod Nogami w pliku to nie to samo co "X" pod Plecami.
export function findExercise(name, category) {
  const n = name.trim().toLowerCase();
  return allExercises().find((e) => e.category === category && e.name.toLowerCase() === n);
}

// Wspólne dla dodawania i edycji. selfId: edytowane ćwiczenie nie jest swoim duplikatem.
function validExercise({ name, category, type }, selfId = null) {
  name = (name || '').trim();
  if (!name) throw new Error('Podaj nazwę ćwiczenia.');
  if (!CATEGORIES.some((c) => c.id === category)) throw new Error('Wybierz partię.');
  if (!TYPES[type]) throw new Error('Wybierz typ pomiaru.');
  const dup = allExercises().find((e) => e.id !== selfId && e.category === category && e.name.toLowerCase() === name.toLowerCase());
  if (dup) throw new Error('Takie ćwiczenie już istnieje w tej partii.');
  return { name, category, type };
}

export function addCustomExercise(fields) {
  const v = validExercise(fields);
  const ex = { id: `custom:${v.category}:${slug(v.name)}-${uid()}`, ...v, custom: true };
  state.customExercises.push(ex);
  save();
  return ex;
}

// Tylko własne ćwiczenia: nazwa i partia. Id się nie zmienia, więc treningi zostają przy
// ćwiczeniu. Typu nie zmienia się w miejscu - to robi typeVariant(), bez usuwania danych.
export function updateCustomExercise(id, fields) {
  const ex = state.customExercises.find((e) => e.id === id);
  if (!ex) throw new Error('Można edytować tylko własne ćwiczenia.');
  if (fields.type && fields.type !== ex.type) throw new Error('Typ zmienia się przez „Zmień typ” - powstaje nowe ćwiczenie.');
  const v = validExercise({ ...fields, type: ex.type }, id);
  Object.assign(ex, v);
  save();
  return ex;
}


// Zmiana typu = osobne ćwiczenie w spisie, z typem w nazwie ("Plank (Ciężar / Powtórzenia)").
// Oryginał i jego treningi się nie zmieniają. Istniejący wariant jest używany ponownie,
// a powrót do typu oryginału zwraca oryginał.
// planTypeVariant niczego nie tworzy: mówi, które ćwiczenie byłoby użyte albo jak nazwie się nowe.
export function planTypeVariant(id, newType) {
  const ex = getExercise(id);
  if (!ex) throw new Error('Nie ma takiego ćwiczenia.');
  if (!TYPES[newType]) throw new Error('Nieznany typ pomiaru.');
  if (ex.type === newType) return { existing: ex, name: ex.name };
  const base = baseName(ex);
  const same = allExercises().filter((e) => e.category === ex.category && e.type === newType);
  const existing =
    same.find((e) => e.name.toLowerCase() === base.toLowerCase()) ||
    same.find((e) => baseName(e).toLowerCase() === base.toLowerCase());
  if (existing) return { existing, name: existing.name };
  const wanted = `${base} (${TYPES[newType].name})`;
  const taken = (n) => allExercises().some((e) => e.category === ex.category && e.name.toLowerCase() === n.toLowerCase());
  let name = wanted;
  for (let i = 2; taken(name); i++) name = `${wanted} ${i}`;
  return { existing: null, name };
}

export function typeVariant(id, newType) {
  const plan = planTypeVariant(id, newType);
  return plan.existing || addCustomExercise({ name: plan.name, category: getExercise(id).category, type: newType });
}

export function usageCount(exerciseId) {
  return Object.values(state.workouts).reduce((n, entries) => n + entries.filter((e) => e.exerciseId === exerciseId).length, 0);
}

export function deleteCustomExercise(id) {
  if (usageCount(id)) throw new Error('Tego ćwiczenia używają zapisane treningi - najpierw usuń je z treningów.');
  const template = state.templates.find((t) => t.entries.some((e) => e.exerciseId === id));
  if (template) throw new Error(`Tego ćwiczenia używa gotowy trening „${template.name}” - najpierw usuń ten trening.`);
  state.customExercises = state.customExercises.filter((e) => e.id !== id);
  save();
}

// --- treningi ---

export function getDay(date) {
  return state.workouts[date] || [];
}

export function datesWithWorkouts() {
  return Object.keys(state.workouts).filter((d) => state.workouts[d].length).sort();
}

export function saveEntry(date, entry) {
  const day = [...getDay(date)];
  const i = day.findIndex((e) => e.id === entry.id);
  if (i >= 0) day[i] = entry;
  else day.push({ ...entry, id: entry.id || uid() });
  state.workouts[date] = day;
  save();
}

export function deleteEntry(date, entryId) {
  state.workouts[date] = getDay(date).filter((e) => e.id !== entryId);
  if (!state.workouts[date].length) delete state.workouts[date];
  save();
}

// --- cały dzień (przytrzymanie dnia w kalendarzu) ---

// Kopia dni do cofnięcia operacji: { data: [wpisy] } (pusta lista = dnia nie było).
// Zamiana ćwiczenia we wpisie (id i miejsce w dniu zostają). Serie zostają; przy innym typie
// pomiaru - tylko pola, które nowy typ ma (ciężar/powtórzenia -> powtórzenia: same powtórzenia).
// Seria bez żadnego wspólnego pola znika; gdy nie zostanie żadna - jedna pusta do wypełnienia.
export function swapExercise(date, entryId, exerciseId) {
  const ex = getExercise(exerciseId);
  if (!ex) throw new Error('Nie ma takiego ćwiczenia.');
  const day = getDay(date);
  const entry = day.find((e) => e.id === entryId);
  if (!entry) throw new Error('Nie ma takiego ćwiczenia w tym dniu.');
  const fields = TYPES[ex.type].fields;
  const sets = entry.sets
    .map((set) => Object.fromEntries(Object.entries(set).filter(([k]) => fields.includes(k))))
    .filter((set) => Object.keys(set).length);
  const keep = sets.length || !entry.sets.length ? sets : [{}]; // zaplanowane (bez serii) zostaje bez serii
  state.workouts[date] = day.map((e) => (e === entry ? { ...e, exerciseId, sets: keep } : e));
  save();
}

export function snapshotDays(dates) {
  return Object.fromEntries(dates.map((d) => [d, structuredClone(getDay(d))]));
}

export function replaceDays(snapshot) {
  for (const [date, entries] of Object.entries(snapshot)) {
    if (entries.length) state.workouts[date] = structuredClone(entries);
    else delete state.workouts[date];
  }
  save();
}

// Zwraca liczbę usuniętych ćwiczeń.
export function deleteDay(date) {
  const n = getDay(date).length;
  delete state.workouts[date];
  save();
  return n;
}

// Przenosi cały trening; na dzień, który ma już trening, dopisuje go na końcu. Wpisy zachowują id.
export function moveDay(from, to) {
  if (from === to) throw new Error('To ten sam dzień.');
  const moved = getDay(from);
  if (!moved.length) throw new Error('Tego dnia nie ma treningu.');
  state.workouts[to] = [...getDay(to), ...moved];
  delete state.workouts[from];
  save();
  return moved.length;
}

// Przytrzymaj i przeciągnij: ćwiczenie ląduje na pozycji toIndex (poza zakresem = na brzeg listy).
export function moveEntryTo(date, entryId, toIndex) {
  const day = [...getDay(date)];
  const i = day.findIndex((e) => e.id === entryId);
  if (i < 0) return;
  const j = Math.max(0, Math.min(day.length - 1, toIndex));
  if (i === j) return;
  day.splice(j, 0, ...day.splice(i, 1));
  state.workouts[date] = day;
  save();
}

// Wszystkie wystąpienia ćwiczenia, od najstarszego.
export function history(exerciseId) {
  return datesWithWorkouts().flatMap((date) =>
    getDay(date).filter((e) => e.exerciseId === exerciseId).map((entry) => ({ date, entry })),
  );
}

// Kopiuje wybrane ćwiczenia z jednego dnia na drugi. Dopisuje, nigdy nie nadpisuje.
// Serie są kopiowane (nie współdzielone) - edycja kopii nie zmienia źródła.
// Dopisuje kopie ćwiczeń (nowe id, kopie serii) na koniec dnia - nic nie nadpisuje.
// Jedno miejsce dla kopiowania z kalendarza i wstawiania gotowego treningu.
function appendEntries(date, entries) {
  state.workouts[date] = [
    ...getDay(date),
    ...entries.map((e) => ({ id: uid(), exerciseId: e.exerciseId, sets: structuredClone(e.sets), note: '' })),
  ];
  save();
  return entries.length;
}

export function copyDay(fromDate, toDate, entryIds) {
  if (fromDate === toDate) throw new Error('Nie można skopiować dnia na ten sam dzień.');
  const picked = getDay(fromDate).filter((e) => entryIds.includes(e.id));
  return picked.length ? appendEntries(toDate, picked) : 0;
}

// --- gotowe treningi (szablony): ćwiczenia z seriami do wstawienia w dowolny dzień ---
// { id, name, from: dzień, z którego powstał, entries: [{ exerciseId, sets }] }. Na zewnątrz
// tylko kopie - zmiana dnia po wstawieniu nie zmienia szablonu i odwrotnie.

function validTemplateName(name, selfId = null) {
  name = (name || '').trim();
  if (!name) throw new Error('Podaj nazwę treningu.');
  if (state.templates.some((t) => t.id !== selfId && t.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Gotowy trening o tej nazwie już jest.');
  }
  return name;
}

export function templates() {
  return structuredClone(state.templates);
}

export function getTemplate(id) {
  const t = state.templates.find((x) => x.id === id);
  return t && structuredClone(t);
}

export function saveTemplate(date, name) {
  const entries = getDay(date);
  if (!entries.length) throw new Error('Ten dzień nie ma treningu.');
  const t = { id: uid(), name: validTemplateName(name), from: date,
    entries: entries.map((e) => ({ exerciseId: e.exerciseId, sets: structuredClone(e.sets) })) };
  state.templates.push(t);
  save();
  return structuredClone(t);
}

export function renameTemplate(id, name) {
  const t = state.templates.find((x) => x.id === id);
  if (!t) throw new Error('Nie ma takiego treningu.');
  t.name = validTemplateName(name, id);
  save();
}

// Zwraca { template, index } do cofnięcia przez restoreTemplate.
export function deleteTemplate(id) {
  const index = state.templates.findIndex((x) => x.id === id);
  if (index < 0) return null;
  const [template] = state.templates.splice(index, 1);
  save();
  return { template, index };
}

export function restoreTemplate({ template, index }) {
  state.templates.splice(Math.min(index, state.templates.length), 0, template);
  save();
}

// Ostatnie wykonanie ćwiczenia przed danym dniem (wg kalendarza, ten dzień się nie liczy): { date, sets }
// albo null. Ćwiczenie zaplanowane bez serii się nie liczy. Serie to kopie.
export function lastSets(exerciseId, beforeDate) {
  const days = datesWithWorkouts().filter((d) => d < beforeDate);
  for (let i = days.length - 1; i >= 0; i--) {
    const found = getDay(days[i]).filter((e) => e.exerciseId === exerciseId && e.sets.length).pop();
    if (found) return { date: days[i], sets: structuredClone(found.sets) };
  }
  return null;
}

// sets: 'last' - serie z ostatniego wcześniejszego wykonania każdego ćwiczenia (bez historii: z szablonu);
// 'none' - same ćwiczenia, serie do wpisania.
export function applyTemplate(id, date, sets = 'last') {
  const t = state.templates.find((x) => x.id === id);
  if (!t) throw new Error('Nie ma takiego treningu.');
  return appendEntries(date, t.entries.map((e) => ({
    exerciseId: e.exerciseId,
    sets: sets === 'none' ? [] : lastSets(e.exerciseId, date)?.sets ?? e.sets,
  })));
}

// Dni w postaci gotowej do eksportu .txt.
export function exportDays(dates) {
  return dates
    .map((date) => ({
      date,
      entries: getDay(date)
        .map((e) => ({ exercise: getExercise(e.exerciseId), sets: e.sets, note: e.note }))
        .filter((e) => e.exercise),
    }))
    .filter((d) => d.entries.length);
}

// Ćwiczenia z pliku (sekcja "Własne ćwiczenia" i treningi), których brak w aplikacji -
// pokazywane przed wczytaniem. Każde raz, z partią i typem z pliku.
export function missingExercises(parsed) {
  const seen = new Set();
  const out = [];
  const fromEntries = (list) => list.flatMap((x) => x.entries.map((e) => e.exercise));
  for (const ex of [...parsed.exercises, ...fromEntries(parsed.days), ...fromEntries(parsed.templates || [])]) {
    const k = `${ex.category}|${ex.name.trim().toLowerCase()}`;
    if (seen.has(k) || findExercise(ex.name, ex.category)) continue;
    seen.add(k);
    out.push(ex);
  }
  return out;
}

// parsed: wynik parseWorkouts. Dni bez daty (albo wszystkie, gdy forceDate)
// trafiają do targetDate. Brakujące ćwiczenia są dodawane jako własne pod partią z pliku.
// Całość albo nic: zapis raz na końcu (setki wpisów = setki zapisów całej bazy), a przy błędzie
// stan wraca do sprzed importu, zamiast zostać w połowie.
// Seria z pliku w innym typie niż ćwiczenie w aplikacji: zostają pola, które pasują.
function fitSets(ex, sets) {
  const fields = TYPES[ex.type].fields;
  return sets.map((s) => Object.fromEntries(fields.map((f) => [f, s[f] ?? null])));
}

// Wczytanie pliku .txt: dni (dopisane), brakujące ćwiczenia, gotowe treningi (nazwa już jest -
// pominięty) i znaczniki Garmina (dzień ma już znacznik - zostaje). Nic nie jest nadpisywane;
// błąd w połowie = stan sprzed wczytania.
export function importDays(parsed, targetDate, forceDate = false) {
  let entries = 0;
  let templates = 0;
  let garmin = 0;
  const created = [];
  const touched = new Set();
  const snapshot = structuredClone(state);
  batching = true;
  try {
    for (const ex of missingExercises(parsed)) created.push(addCustomExercise(ex));
    for (const d of parsed.days) {
      const date = forceDate || !d.date ? targetDate : d.date;
      for (const e of d.entries) {
        const ex = findExercise(e.exercise.name, e.exercise.category);
        saveEntry(date, { id: uid(), exerciseId: ex.id, sets: fitSets(ex, e.sets), note: e.note || '' });
        touched.add(date);
        entries++;
      }
    }
    for (const t of parsed.templates || []) {
      if (state.templates.some((x) => x.name.toLowerCase() === t.name.toLowerCase())) continue;
      state.templates.push({ id: uid(), name: t.name, from: t.from, entries: t.entries.map((e) => {
        const ex = findExercise(e.exercise.name, e.exercise.category);
        return { exerciseId: ex.id, sets: fitSets(ex, e.sets) };
      }) });
      templates++;
    }
    // Po dniach: podpis treningu liczony z tego, co właśnie wczytane; "*" w pliku = był zmieniony.
    for (const g of parsed.garmin || []) {
      if (state.garmin.sent[g.date]) continue;
      state.garmin.sent[g.date] = { at: g.at, sig: g.changed ? '' : daySignature(g.date) };
      garmin++;
    }
  } catch (err) {
    state = snapshot;
    throw err;
  } finally {
    batching = false;
  }
  save();
  return { entries, created, dates: [...touched].sort(), templates, garmin };
}

// --- Garmin Connect: które treningi już poszły jako pliki .fit ---
// Znacznik dnia to data wysłania i podpis treningu z tamtej chwili. Trening zmieniony po wysłaniu
// (nowa seria, inny ciężar) jest wtedy widać jako zmieniony, zamiast po cichu nie dotrzeć do Garmina.

// Podpis treningu dnia: ćwiczenia i serie w kolejności, pola serii posortowane (kolejność kluczy
// w obiekcie to nie zmiana), skrót FNV-1a - w danych zostaje kilka znaków, nie cały trening.
function daySignature(date) {
  const text = JSON.stringify(getDay(date).map((e) => [e.exerciseId,
    e.sets.map((set) => Object.keys(set).sort().filter((k) => set[k] != null && set[k] !== '').map((k) => [k, set[k]]))]));
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(36);
}

// unsent: treningi bez znacznika; changed: zmienione po wysłaniu (nie trafiają same do następnego
// pliku - Garmin miałby dwie wersje); removed: wysłane, a potem usunięte albo przeniesione.
export function garminStatus() {
  const { sent } = state.garmin;
  // Dzień z samymi zaplanowanymi ćwiczeniami (bez serii) to jeszcze nie trening - nie do Garmina.
  const days = datesWithWorkouts().filter((d) => getDay(d).some((e) => e.sets.length));
  return {
    unsent: days.filter((d) => !sent[d]),
    changed: days.filter((d) => sent[d] && sent[d].sig !== daySignature(d)),
    removed: Object.keys(sent).filter((d) => !getDay(d).length).sort(),
  };
}

export function garminMark(date) {
  const m = state.garmin.sent[date];
  return m ? { at: m.at, changed: m.sig !== daySignature(date) } : null;
}

// Zwraca poprzednie znaczniki tych dni - do cofnięcia przez restoreGarminMarks.
export function markGarminSent(dates, at = todayKey()) {
  const before = Object.fromEntries(dates.map((d) => [d, state.garmin.sent[d] ?? null]));
  for (const d of dates) state.garmin.sent[d] = { at, sig: daySignature(d) };
  save();
  return before;
}

// before: { data: znacznik albo null (= bez znacznika) }.
export function restoreGarminMarks(before) {
  for (const [d, m] of Object.entries(before)) {
    if (m) state.garmin.sent[d] = m;
    else delete state.garmin.sent[d];
  }
  save();
}

// Do pliku .txt ("Eksportuj wszystko"): gotowe treningi w kształcie dni z exportDays.
export function exportTemplates() {
  return state.templates.map((t) => ({
    name: t.name,
    from: t.from,
    entries: t.entries.map((e) => ({ exercise: getExercise(e.exerciseId), sets: e.sets })).filter((e) => e.exercise),
  }));
}

// Znaczniki wysłania do Garmina do pliku .txt; changed = trening zmieniony po wysłaniu.
export function exportGarmin() {
  return Object.entries(state.garmin.sent).map(([date, m]) => ({
    date, at: m.at, changed: getDay(date).length > 0 && m.sig !== daySignature(date),
  }));
}

export function exportAllJson() {
  return JSON.stringify(state, null, 2);
}
