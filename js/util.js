// Daty, czas i formatowanie serii. Bez DOM - testowane w tests.html.

import { DEFAULT_UNITS, toDisplay } from './units.js';

export const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
export const MONTHS_GEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
export const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
export const WEEKDAYS_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

const pad = (n) => String(n).padStart(2, '0');

// Klucz dnia w czasie lokalnym (nie UTC - inaczej po północy "dziś" to wczoraj).
export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function isValidKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return dateKey(parseKey(key)) === key;
}

export function longDate(key) {
  const d = parseKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

// "25.09" w bieżącym roku, "25.09.25" w innym - historia sięga lat wstecz (np. z FitNotes),
// a sam dzień i miesiąc byłyby wtedy niejednoznaczne.
export function shortDate(key) {
  const d = parseKey(key);
  const s = `${d.getDate()}.${pad(d.getMonth() + 1)}`;
  return d.getFullYear() === new Date().getFullYear() ? s : `${s}.${String(d.getFullYear()).slice(2)}`;
}

// "1:30" -> 90, "1:02:03" -> 3723, "45" -> 45 s. Zwraca null dla śmieci.
export function parseTime(str) {
  if (str === null || str === undefined) return null;
  const s = String(str).trim();
  if (!s) return null;
  if (!/^\d+(:\d{1,2}){0,2}$/.test(s)) return null;
  const parts = s.split(':').map(Number);
  if (parts.slice(1).some((p) => p >= 60)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export function formatTime(sec) {
  if (sec === null || sec === undefined || isNaN(sec)) return '';
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Liczba z przecinkiem lub kropką. Pusta/niepoprawna -> null.
export function parseNum(str) {
  if (str === null || str === undefined) return null;
  const s = String(str).trim().replace(',', '.');
  if (!s || !/^\d*\.?\d+$/.test(s)) return null;
  return Number(s);
}

export function formatNum(n) {
  // isNaN('') jest false, więc pusty string trzeba odrzucić jawnie - inaczej "0".
  if (n === null || n === undefined || n === '' || isNaN(n)) return '';
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

// units: jednostki wyświetlania. Domyślnie kg/km - tak zapisuje plik .txt.
export function formatSet(set, type, units = DEFAULT_UNITS) {
  const parts = [];
  const has = (k) => set[k] !== null && set[k] !== undefined && set[k] !== '';
  const w = () => `${has('weight') ? formatNum(toDisplay(set.weight, 'weight', units)) : 0} ${units.weight}`;
  const d = () => `${has('distance') ? formatNum(toDisplay(set.distance, 'distance', units)) : 0} ${units.distance}`;
  switch (type) {
    case 'weight_reps':
      return `${w()} × ${has('reps') ? set.reps : 0}`;
    case 'reps':
      return `${has('reps') ? set.reps : 0} powt.`;
    case 'weight_time':
      return `${w()} · ${formatTime(set.time || 0)}`;
    case 'time':
      return formatTime(set.time || 0);
    case 'distance_time':
      if (has('distance')) parts.push(d());
      if (has('time')) parts.push(formatTime(set.time));
      return parts.join(' · ') || d();
    case 'distance':
      return d();
    default:
      return '';
  }
}

// Przyciski −/+ przy polu liczby: "80" + 2,5 -> "82,5". Puste/niepoprawne pole liczy
// się jako 0, wynik nigdy nie schodzi poniżej zera.
export function stepValue(raw, delta) {
  const n = parseNum(raw) ?? 0;
  return formatNum(Math.max(0, Math.round((n + delta) * 100) / 100));
}

// Odmiany do plural(), które powtarzają się w wielu miejscach.
export const FORMS = {
  exercise: ['ćwiczenie', 'ćwiczenia', 'ćwiczeń'],
  set: ['seria', 'serie', 'serii'],
  workout: ['trening', 'treningi', 'treningów'],
};

// forms: [1, 2-4, 5+], np. ['ćwiczenie', 'ćwiczenia', 'ćwiczeń']. 12-14 to "5+".
export function plural(n, forms) {
  const d = n % 10;
  const dd = n % 100;
  const form = n === 1 ? forms[0] : d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? forms[1] : forms[2];
  return `${n} ${form}`;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
