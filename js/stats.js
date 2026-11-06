// Miary postępu dla jednego wpisu (jednego dnia z danym ćwiczeniem).
// fn liczy zawsze w kg/km/s; metricView() przelicza i opisuje w jednostkach z ustawień.

import { addDays, formatNum, formatTime } from './util.js';
import { TIME_STEPS } from './charts.js';
import { toDisplay } from './units.js';

const sum = (a) => a.reduce((x, y) => x + y, 0);
const max = (a) => (a.length ? Math.max(...a) : 0);
const vals = (sets, k) => sets.map((s) => s[k]).filter((v) => v !== null && v !== undefined && !isNaN(v));

// Epley; dla 1 powtórzenia to po prostu ciężar.
export function oneRepMax(weight, reps) {
  if (!weight || !reps) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

// dim: weight | distance | pace | speed | time | count. W nazwie {w} i {d} to jednostki.
export const METRICS = {
  weight_reps: [
    { id: 'max_weight', name: 'Maks. ciężar ({w})', dim: 'weight', fn: (s) => max(vals(s, 'weight')) },
    { id: 'e1rm', name: 'Szacowany 1RM ({w})', dim: 'weight', fn: (s) => max(s.map((x) => oneRepMax(x.weight, x.reps))) },
    { id: 'volume', name: 'Objętość ({w} × powt.)', dim: 'weight', fn: (s) => sum(s.map((x) => (x.weight || 0) * (x.reps || 0))) },
    { id: 'max_reps', name: 'Maks. powtórzeń', dim: 'count', fn: (s) => max(vals(s, 'reps')) },
  ],
  reps: [
    { id: 'max_reps', name: 'Maks. powtórzeń w serii', dim: 'count', fn: (s) => max(vals(s, 'reps')) },
    { id: 'total_reps', name: 'Suma powtórzeń', dim: 'count', fn: (s) => sum(vals(s, 'reps')) },
  ],
  weight_time: [
    { id: 'max_weight', name: 'Maks. ciężar ({w})', dim: 'weight', fn: (s) => max(vals(s, 'weight')) },
    { id: 'max_time', name: 'Najdłuższy czas', dim: 'time', fn: (s) => max(vals(s, 'time')) },
  ],
  time: [
    { id: 'max_time', name: 'Najdłuższy czas', dim: 'time', fn: (s) => max(vals(s, 'time')) },
    { id: 'total_time', name: 'Łączny czas', dim: 'time', fn: (s) => sum(vals(s, 'time')) },
  ],
  distance_time: [
    { id: 'distance', name: 'Dystans ({d})', dim: 'distance', fn: (s) => sum(vals(s, 'distance')) },
    { id: 'time', name: 'Czas', dim: 'time', fn: (s) => sum(vals(s, 'time')) },
    {
      id: 'pace',
      name: 'Tempo (min/{d})',
      dim: 'pace',
      lowerIsBetter: true,
      fn: (s) => {
        const d = sum(vals(s, 'distance'));
        const t = sum(vals(s, 'time'));
        return d && t ? t / d : 0;
      },
    },
    {
      id: 'speed',
      name: 'Prędkość ({d}/h)',
      dim: 'speed',
      fn: (s) => {
        const d = sum(vals(s, 'distance'));
        const t = sum(vals(s, 'time'));
        return d && t ? d / (t / 3600) : 0;
      },
    },
  ],
  distance: [
    { id: 'distance', name: 'Dystans ({d})', dim: 'distance', fn: (s) => sum(vals(s, 'distance')) },
    { id: 'max_distance', name: 'Najdłuższa seria ({d})', dim: 'distance', fn: (s) => max(vals(s, 'distance')) },
  ],
};

// Jak pokazać miarę w danych jednostkach. fmt: z jednostką (kafelki, dymki);
// axis: bez jednostki, bo "1460 kg" czy "4:40 /km" nie mieści się przy osi.
export function metricView(metric, units) {
  const name = metric.name.replace('{w}', units.weight).replace('{d}', units.distance);
  const convert = (v) => toDisplay(v, metric.dim, units);
  switch (metric.dim) {
    case 'weight':
      return { name, convert, fmt: (v) => `${formatNum(v)} ${units.weight}`, axis: formatNum };
    case 'distance':
      return { name, convert, fmt: (v) => `${formatNum(v)} ${units.distance}`, axis: formatNum };
    case 'pace':
      return { name, convert, fmt: (v) => `${formatTime(v)} /${units.distance}`, axis: formatTime, steps: TIME_STEPS };
    case 'speed':
      return { name, convert, fmt: (v) => `${formatNum(v)} ${units.distance}/h`, axis: formatNum };
    case 'time':
      return { name, convert, fmt: formatTime, axis: formatTime, steps: TIME_STEPS };
    default:
      return { name, convert, fmt: formatNum, axis: formatNum };
  }
}

// history: [{date, entry}] -> [{date, value}] z jednym punktem na dzień
// (kilka wpisów tego samego ćwiczenia w jednym dniu liczy się razem).
export function series(history, metric) {
  const byDate = new Map();
  for (const { date, entry } of history) {
    byDate.set(date, [...(byDate.get(date) || []), ...entry.sets]);
  }
  return [...byDate.entries()]
    .map(([date, sets]) => ({ date, value: metric.fn(sets) }))
    .filter((p) => p.value > 0);
}

// Najlepsza seria wpisu - do skrótu dnia w kalendarzu. Klucz porównania wg typu, np. ciężar,
// a przy równym ciężarze więcej powtórzeń; przy dystansie równym dystansie krótszy czas.
const BEST_KEY = {
  weight_reps: (s) => [s.weight || 0, s.reps || 0],
  reps: (s) => [s.reps || 0],
  weight_time: (s) => [s.weight || 0, s.time || 0],
  time: (s) => [s.time || 0],
  distance_time: (s) => [s.distance || 0, -(s.time || 0)],
  distance: (s) => [s.distance || 0],
};

export function bestSet(sets, type) {
  const key = BEST_KEY[type];
  return sets.reduce((best, s) => {
    if (!best) return s;
    const a = key(s);
    const b = key(best);
    const i = a.findIndex((v, k) => v !== b[k]);
    return i >= 0 && a[i] > b[i] ? s : best;
  }, null);
}

export const RANGES = [
  { id: '1m', name: '1 mies.', days: 30 },
  { id: '3m', name: '3 mies.', days: 91 },
  { id: '1y', name: 'Rok', days: 365 },
  { id: 'all', name: 'Wszystko', days: null },
];

export function filterRange(points, rangeId, today) {
  const r = RANGES.find((x) => x.id === rangeId);
  if (!r || r.days === null) return points;
  const since = addDays(today, -r.days);
  return points.filter((p) => p.date >= since);
}
