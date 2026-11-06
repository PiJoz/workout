// Ustawienia: jednostki, motyw, trening dnia, kopia zapasowa, Garmin Connect.

import { workoutToFit } from '../fit.js';
import * as store from '../store.js';
import { escapeHtml as h, FORMS, longDate, plural, shortDate } from '../util.js';
import { PRIVACY_DATE, PRIVACY_HTML } from '../privacy.js';
import { $, openSheet, render, sheetHeader, toast, ui, viewEl } from '../ui/core.js';
import { saveBinary } from '../ui/files.js';

// Każdy trening to osobny plik .fit (js/fit.js) w Pobranych; użytkownik wgrywa je w Garmin Connect
// (import jest tylko na stronie, nie w aplikacji Garmina). Wysłane dni mają znacznik (store.garminStatus),
// więc następny eksport bierze tylko nowe treningi.
export const GARMIN_IMPORT_URL = 'https://connect.garmin.com/app/import-data';

// Lista dat do akapitu: kilka pierwszych i "i N innych".
export function dateList(dates, max = 6) {
  const shown = dates.slice(0, max).map(shortDate).join(', ');
  return dates.length > max ? `${shown} i ${plural(dates.length - max, ['inny', 'inne', 'innych'])}` : shown;
}

export function garminDates() {
  const { unsent, changed } = store.garminStatus();
  return [...unsent, ...($('#garmin-changed')?.checked ? changed : [])].sort();
}

export function garminButtonLabel(n) {
  return n ? `Utwórz pliki .fit (${n})` : 'Utwórz pliki .fit';
}

export function garminSection() {
  const { unsent, changed, removed } = store.garminStatus();
  const range = unsent.length > 1 ? ` (${shortDate(unsent[0])} – ${shortDate(unsent.at(-1))})` : unsent.length ? ` (${shortDate(unsent[0])})` : '';
  return `<section class="card">
      <h2>Garmin Connect</h2>
      <p class="muted small">Każdy trening trafia do Pobranych jako osobny plik .fit („Trening siłowy” z seriami).
        Wgrasz je na stronie Garmin Connect: Importuj dane - aplikacja Garmin Connect na telefonie tego nie ma.
        Wysłane treningi są oznaczone i nie trafią do plików drugi raz.</p>
      <p id="garmin-status">${unsent.length
        ? `Do wysłania: <strong>${plural(unsent.length, FORMS.workout)}</strong>${range}`
        : 'Wszystkie treningi są już wysłane.'}</p>
      ${changed.length ? `<label class="check"><input type="checkbox" id="garmin-changed">
        <span>Dołącz zmienione po wysłaniu (${changed.length}): ${dateList(changed)}.
        <span class="muted small">Garmin dostanie nową wersję obok starej - starą usuń w Garmin Connect.</span></span></label>` : ''}
      ${removed.length ? `<p class="muted small">Usunięte albo przeniesione po wysłaniu - w Garmin Connect nadal są:
        ${dateList(removed)}. <button class="link" data-action="garmin-forget">Ukryj</button></p>` : ''}
      <button class="primary block" data-action="garmin-export" ${unsent.length ? '' : 'disabled'}>${garminButtonLabel(unsent.length)}</button>
      <a class="secondary block" href="${GARMIN_IMPORT_URL}" target="_blank" rel="noopener">Otwórz import w Garmin Connect</a>
      ${unsent.length || changed.length ? '<button class="link" data-action="garmin-mark-all">Oznacz wszystkie jako wysłane (bez plików)</button>' : ''}
    </section>`;
}

export function garminExport() {
  const dates = garminDates();
  if (!dates.length) return;
  const { weightUnit } = store.getSettings();
  const saved = [];
  for (const date of dates) {
    const bytes = workoutToFit(date, store.getDay(date), store.getExercise, { weightUnit });
    if (!saveBinary(bytes, `Workout ${date}.fit`)) break;
    saved.push(date);
  }
  if (!saved.length) return toast('Nie udało się zapisać plików .fit');
  const undo = store.markGarminSent(saved);
  render();
  const files = plural(saved.length, ['plik', 'pliki', 'plików']);
  toast(saved.length < dates.length
    ? `Zapisano ${saved.length} z ${dates.length} plików - reszta czeka na następny raz`
    : `Zapisano w Pobranych: ${files} .fit`, {
    action: 'Cofnij',
    onAction: () => { store.restoreGarminMarks(undo); render(); toast('Treningi znów czekają na wysłanie'); },
  });
}

export function garminMarkAll() {
  const { unsent, changed } = store.garminStatus();
  const dates = [...unsent, ...changed].sort();
  if (!confirm(`Oznaczyć ${plural(dates.length, FORMS.workout)} jako wysłane, bez tworzenia plików? `
    + 'Użyj, jeśli te treningi już są w Garmin Connect.')) return;
  const undo = store.markGarminSent(dates);
  render();
  toast(`Oznaczono jako wysłane: ${plural(dates.length, FORMS.workout)}`, {
    action: 'Cofnij',
    onAction: () => { store.restoreGarminMarks(undo); render(); },
  });
}

export function seg(key, options) {
  const cur = store.getSettings()[key];
  return `<div class="seg" role="group">${options.map(([v, label]) =>
    `<button class="${v === cur ? 'active' : ''}" data-action="set" data-key="${key}" data-value="${v}" aria-pressed="${v === cur}">${h(label)}</button>`).join('')}</div>`;
}

// "Trening dnia" działa na ten sam dzień, co ekran główny (ui.date) - zmiana daty tutaj
// zmienia też dzień na ekranie głównym.
export function showPrivacy() {
  openSheet(`${sheetHeader('Polityka prywatności')}
    <div class="privacy">${PRIVACY_HTML}<p class="muted small">Obowiązuje od: ${PRIVACY_DATE}</p></div>`);
}

export function renderSettings() {
  const hasData = store.datesWithWorkouts().length;
  const dayCount = store.getDay(ui.date).length;
  viewEl.innerHTML = `
    <h1>Ustawienia</h1>
    <section class="card">
      <h2>Jednostki</h2>
      <div class="setting"><span>Ciężar</span>${seg('weightUnit', [['kg', 'kg'], ['lb', 'lb']])}</div>
      <div class="setting"><span>Dystans</span>${seg('distanceUnit', [['km', 'km'], ['mi', 'mi']])}</div>
      <p class="muted small">Zmiana jednostek nie zmienia zapisanych danych - tylko sposób wyświetlania.
        Pliki .txt zawsze zapisują kg i km, żeby dało się je wczytać u każdego.</p>
    </section>
    <section class="card">
      <h2>Motyw</h2>
      ${seg('theme', [['system', 'Systemowy'], ['light', 'Jasny'], ['dark', 'Ciemny']])}
    </section>
    <section class="card">
      <h2>Trening dnia</h2>
      <label class="setting"><span>Dzień</span><input type="date" id="settings-date" value="${ui.date}"></label>
      <p class="muted small">${h(longDate(ui.date))}: ${dayCount ? plural(dayCount, FORMS.exercise) : 'brak ćwiczeń'}.</p>
      <button class="secondary block" data-action="share-day" ${dayCount ? '' : 'disabled'}>Udostępnij trening z tego dnia (.txt)</button>
      <button class="secondary block" data-action="import">Wczytaj trening na ten dzień (.txt)</button>
    </section>
    <section class="card">
      <h2>Kopia zapasowa</h2>
      <p class="muted small">Treningi są zapisane tylko na tym urządzeniu. Eksport .txt to kopia całej historii
        (razem z własnymi ćwiczeniami) - wczytasz ją tutaj albo na innym telefonie.</p>
      <button class="secondary block" data-action="export-all" ${hasData || store.customExercises().length ? '' : 'disabled'}>Eksportuj wszystko (.txt)</button>
      <button class="secondary block" data-action="export-csv" ${hasData ? '' : 'disabled'}>Eksportuj do Excela (.csv)</button>
      <button class="secondary block" data-action="import-all">Wczytaj kopię zapasową (.txt)</button>
    </section>
    ${garminSection()}
    <section class="card">
      <h2>O aplikacji</h2>
      <button class="secondary block" data-action="privacy">Polityka prywatności</button>
      <p class="muted small">Zdjęcia w instrukcjach: free-exercise-db. Workout nie jest
        wyrobem medycznym - w sprawach zdrowia skonsultuj się z lekarzem.</p>
    </section>`;
  $('#garmin-changed')?.addEventListener('change', () => {
    const n = garminDates().length;
    const btn = $('[data-action=garmin-export]');
    btn.textContent = garminButtonLabel(n);
    btn.disabled = !n;
  });
  $('#settings-date').addEventListener('change', (ev) => {
    if (ev.target.value) {
      ui.date = ev.target.value;
      render();
    }
  });
}
