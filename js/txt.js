// Trening <-> plik .txt. Format ma być czytelny dla człowieka (wysyłany
// komunikatorem) i jednocześnie dać się wczytać z powrotem bez strat.
//
//   Data: 2026-10-14 (wtorek, 14 października 2026)
//
//   [Klatka] Wyciskanie sztangi na ławce płaskiej | Ciężar / Powtórzenia
//     1. 80 kg × 10
//     2. 85 kg × 8
//     Notatka: ciężko szło
//
//   Własne ćwiczenia:
//   [Plecy] Wiosłowanie TRX | Powtórzenia
//
//   Gotowe treningi:
//
//   Trening: Trening A | z 2026-10-13
//   [Klatka] Wyciskanie sztangi na ławce płaskiej | Ciężar / Powtórzenia
//     1. 50 kg × 12
//
//   Wysłane do Garmin Connect:
//   2026-10-15: 2026-03-20, 2026-10-13*
//
// Sekcja "Własne ćwiczenia" przenosi też ćwiczenia, które nie mają jeszcze
// żadnego treningu - bez niej po wczytaniu kopii zapasowej by przepadły. Tak samo
// gotowe treningi i znaczniki wysłania do Garmina (data wysłania: dni; * = trening
// zmieniony po wysłaniu) - pełna kopia z "Eksportuj wszystko".

import { TYPES, categoryById, categoryByName, typeByName } from './data.js';
import { formatSet, longDate, isValidKey, parseNum, parseTime } from './util.js';
import { KG_PER_LB, KM_PER_MI } from './units.js';

export const TXT_HEADER = 'WORKOUT - trening';
export const CUSTOM_HEADER = 'Własne ćwiczenia:';
export const TEMPLATES_HEADER = 'Gotowe treningi:';
export const GARMIN_HEADER = 'Wysłane do Garmin Connect:';

function exerciseLine(ex) {
  const cat = categoryById(ex.category);
  return `[${cat ? cat.name : ex.category}] ${ex.name} | ${TYPES[ex.type].name}`;
}

function pushEntries(out, entries) {
  for (const e of entries) {
    out.push(exerciseLine(e.exercise));
    e.sets.forEach((s, i) => out.push(`  ${i + 1}. ${formatSet(s, e.exercise.type)}`));
    if (e.note && e.note.trim()) out.push(`  Notatka: ${e.note.trim().replace(/\s*\n\s*/g, ' ')}`);
    out.push('');
  }
}

// days: [{ date, entries: [{ exercise: {name, category, type}, sets, note }] }]
// customExercises: [{name, category, type}] - dopisywane na końcu pliku
// templates: [{ name, from, entries }] (jak dni); garmin: [{ date, at, changed }]
export function formatWorkouts(days, customExercises = [], { templates = [], garmin = [] } = {}) {
  const out = [TXT_HEADER, '='.repeat(TXT_HEADER.length), ''];
  for (const day of days) {
    if (!day.entries.length) continue;
    out.push(`Data: ${day.date} (${longDate(day.date)})`, '');
    pushEntries(out, day.entries);
  }
  if (customExercises.length) out.push(CUSTOM_HEADER, ...customExercises.map(exerciseLine), '');
  if (templates.length) {
    out.push(TEMPLATES_HEADER, '');
    for (const t of templates) {
      out.push(`Trening: ${t.name}${t.from ? ` | z ${t.from}` : ''}`);
      pushEntries(out, t.entries);
    }
  }
  if (garmin.length) {
    const byAt = new Map();
    for (const g of [...garmin].sort((a, b) => a.at.localeCompare(b.at) || a.date.localeCompare(b.date))) {
      if (!byAt.has(g.at)) byAt.set(g.at, []);
      byAt.get(g.at).push(`${g.date}${g.changed ? '*' : ''}`);
    }
    out.push(GARMIN_HEADER, ...[...byAt].map(([at, dates]) => `${at}: ${dates.join(', ')}`), '');
  }
  return out.join('\n').replace(/\n+$/, '\n');
}

export const LIST_HEADER = 'WORKOUT - lista ćwiczeń';

// Sama lista ćwiczeń (bez serii) - do wysłania komuś jako plan. Nie do wczytywania z powrotem.
export function formatExerciseList(days) {
  const out = [LIST_HEADER, '='.repeat(LIST_HEADER.length), ''];
  for (const day of days) {
    if (!day.entries.length) continue;
    out.push(longDate(day.date), '');
    day.entries.forEach((e, i) => {
      const cat = categoryById(e.exercise.category);
      out.push(`${i + 1}. ${e.exercise.name} (${cat ? cat.name : e.exercise.category})`);
    });
    out.push('');
  }
  return out.join('\n').replace(/\n+$/, '\n');
}

const NUM = '(\\d+(?:[.,]\\d+)?)';

export function parseSetLine(text) {
  const set = {};
  let m;
  // Zapisujemy w kg/km; lb i mi (np. z pliku od kogoś) są przeliczane.
  if ((m = text.match(new RegExp(NUM + '\\s*kg', 'i')))) set.weight = parseNum(m[1]);
  else if ((m = text.match(new RegExp(NUM + '\\s*lbs?\\b', 'i')))) set.weight = parseNum(m[1]) * KG_PER_LB;
  if ((m = text.match(new RegExp(NUM + '\\s*km', 'i')))) set.distance = parseNum(m[1]);
  else if ((m = text.match(new RegExp(NUM + '\\s*mi\\b', 'i')))) set.distance = parseNum(m[1]) * KM_PER_MI;
  if ((m = text.match(/[×xX*]\s*(\d+)/)) || (m = text.match(/(\d+)\s*(?:powt|reps?\b)/i))) set.reps = Number(m[1]);
  if ((m = text.match(/(?:^|[\s·])(\d+(?::\d{1,2}){1,2})(?=\s|$)/))) set.time = parseTime(m[1]);
  return set;
}

function inferType(sets) {
  const has = (k) => sets.some((s) => s[k] !== undefined && s[k] !== null);
  if (has('distance')) return has('time') ? 'distance_time' : 'distance';
  if (has('weight')) return has('time') && !has('reps') ? 'weight_time' : 'weight_reps';
  if (has('reps')) return 'reps';
  if (has('time')) return 'time';
  return 'weight_reps';
}

// Zwraca { days: [{ date|null, entries }], exercises: [{name, category, type}], warnings: [] }.
// date === null oznacza wpisy przed pierwszą linią "Data:" - aplikacja wstawia je
// do aktualnie oglądanego dnia. exercises to sekcja "Własne ćwiczenia" (bez serii).
export function parseWorkouts(text) {
  const days = [];
  const exercises = [];
  const templates = [];
  const garmin = [];
  const warnings = [];
  let day = null;
  let entry = null;
  let template = null;
  let mode = 'days'; // 'days' | 'custom' | 'templates' | 'garmin' - sekcja, w której jesteśmy

  const lines = String(text).replace(/^﻿/, '').split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    let m;
    if ((m = line.match(/^Data:\s*(\d{4}-\d{2}-\d{2})/i))) {
      if (!isValidKey(m[1])) {
        warnings.push(`Linia ${i + 1}: niepoprawna data "${m[1]}"`);
        day = null;
        entry = null;
        return;
      }
      day = days.find((d) => d.date === m[1]);
      if (!day) days.push((day = { date: m[1], entries: [] }));
      entry = null;
      mode = 'days';
      return;
    }
    const section = /^Własne ćwiczenia:?$/i.test(line) ? 'custom' : /^Gotowe treningi:?$/i.test(line) ? 'templates'
      : /^Wysłane do Garmin Connect:?$/i.test(line) ? 'garmin' : null;
    if (section) {
      mode = section;
      day = null;
      entry = null;
      template = null;
      return;
    }
    if (mode === 'templates' && (m = line.match(/^Trening:\s*(.+?)(?:\s*\|\s*z\s*(\d{4}-\d{2}-\d{2}))?$/i))) {
      templates.push((template = { name: m[1].trim(), from: m[2] && isValidKey(m[2]) ? m[2] : null, entries: [] }));
      entry = null;
      return;
    }
    if (mode === 'garmin' && (m = line.match(/^(\d{4}-\d{2}-\d{2}):\s*(.*)$/))) {
      const at = m[1];
      for (const [, date, star] of m[2].matchAll(/(\d{4}-\d{2}-\d{2})(\*)?/g)) {
        if (isValidKey(date) && isValidKey(at)) garmin.push({ date, at, changed: Boolean(star) });
        else warnings.push(`Linia ${i + 1}: niepoprawna data "${isValidKey(at) ? date : at}" w znacznikach Garmina - pominięta`);
      }
      return;
    }
    if ((m = line.match(/^\[(.+?)\]\s*(.+?)(?:\s*\|\s*(.+))?$/))) {
      const cat = categoryByName(m[1]);
      const type = m[3] ? typeByName(m[3]) : null;
      if (!cat) {
        // Bez zgadywania: ćwiczenie w złej partii jest gorsze niż pominięte z ostrzeżeniem.
        warnings.push(`Linia ${i + 1}: nieznana partia "${m[1]}" - „${m[2].trim()}” pominięte`);
        entry = null;
        return;
      }
      if (mode === 'custom') {
        if (m[3] && !type) warnings.push(`Linia ${i + 1}: nieznany typ "${m[3]}" - przyjęto Ciężar / Powtórzenia`);
        exercises.push({ name: m[2].trim(), category: cat.id, type: type || 'weight_reps' });
        return;
      }
      if (m[3] && !type) warnings.push(`Linia ${i + 1}: nieznany typ "${m[3]}" - rozpoznany z serii`);
      entry = {
        exercise: { name: m[2].trim(), category: cat.id, type },
        sets: [],
        note: '',
      };
      if (mode === 'templates') {
        if (template) template.entries.push(entry);
        else {
          warnings.push(`Linia ${i + 1}: ćwiczenie poza gotowym treningiem - pominięte`);
          entry = null;
        }
        return;
      }
      if (!day) {
        day = days.find((d) => d.date === null);
        if (!day) days.push((day = { date: null, entries: [] }));
      }
      day.entries.push(entry);
      return;
    }
    if ((m = line.match(/^Notatka:\s*(.*)$/i))) {
      if (entry) entry.note = m[1];
      return;
    }
    if ((m = line.match(/^\d+[.)]\s*(.+)$/))) {
      if (!entry) {
        warnings.push(`Linia ${i + 1}: seria bez ćwiczenia - pominięta`);
        return;
      }
      const set = parseSetLine(m[1]);
      if (!Object.keys(set).length) warnings.push(`Linia ${i + 1}: nie rozpoznano serii "${m[1]}"`);
      else entry.sets.push(set);
      return;
    }
    // Nagłówek, podkreślenie i inne ozdobniki są ignorowane bez ostrzeżenia.
  });

  // Ćwiczenie bez serii odpada; typ z nagłówka albo rozpoznany z serii; serie - tylko pola typu.
  const finish = (entries) => {
    for (const e of entries.filter((x) => !x.sets.length)) warnings.push(`„${e.exercise.name}”: brak serii - pominięte`);
    const kept = entries.filter((x) => x.sets.length);
    for (const e of kept) {
      if (!e.exercise.type) e.exercise.type = inferType(e.sets);
      const fields = TYPES[e.exercise.type].fields;
      e.sets = e.sets.map((s) => Object.fromEntries(fields.map((f) => [f, s[f] ?? null])));
    }
    return kept;
  };
  for (const d of days) d.entries = finish(d.entries);
  for (const t of templates) {
    t.entries = finish(t.entries);
    if (!t.entries.length) warnings.push(`Gotowy trening „${t.name}”: brak ćwiczeń z seriami - pominięty`);
  }
  return { days: days.filter((d) => d.entries.length), exercises, templates: templates.filter((t) => t.entries.length), garmin, warnings };
}
