// Wspólne dla wszystkich ekranów: stan widoku, nawigacja, "wstecz" (Android), okna, komunikaty.

import { categoryById } from '../data.js';
import * as store from '../store.js';
import { unitsFromSettings } from '../units.js';
import { escapeHtml as h, formatSet as formatSetIn, todayKey } from '../util.js';

// Jednostki z ustawień - wszystko, co widzi użytkownik, idzie przez te dwie funkcje.
export const units = () => unitsFromSettings(store.getSettings());
export const formatSet = (set, type) => formatSetIn(set, type, units());

export const ui = {
  view: 'day',
  date: todayKey(),
  month: todayKey().slice(0, 7),
  progressExercise: null,
  progressMetric: null,
  importTarget: 'day', // 'day' = dni bez daty idą do oglądanego dnia
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const viewEl = $('#view');
export const sheetEl = $('#sheet');

export function go(view) {
  ui.view = view;
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  render();
  window.scrollTo(0, 0);
  syncBackGuard();
}

// Bez tego systemowe "wstecz" w zainstalowanej aplikacji zamyka ją całą - także w trakcie
// wpisywania serii. Dopóki coś jest otwarte (okno albo zakładka inna niż "Dzień"), w historii
// leży jeden wpis-strażnik; "wstecz" go zdejmuje, a my zamykamy okno albo wracamy do "Dzień".
// Dopiero na "Dzień" bez okna strażnika nie ma i "wstecz" wychodzi z aplikacji.
export let ignorePops = 0;
export let guardQueued = false;

export function syncBackGuard() {
  if (guardQueued) return;
  guardQueued = true;
  // Po całej obsłudze zdarzenia, nie w jej trakcie: zamknięcie okna i zmiana zakładki w jednym
  // kliknięciu (np. po wczytaniu pliku) to jedna zmiana historii, a nie dwie ścigające się.
  setTimeout(() => {
    guardQueued = false;
    const need = !sheetEl.hidden || ui.view !== 'day';
    const has = history.state?.workoutGuard === true;
    if (need && !has) history.pushState({ workoutGuard: true }, '');
    else if (!need && has) {
      ignorePops++;
      history.back();
    }
  }, 0);
}

window.addEventListener('popstate', () => {
  if (ignorePops) {
    ignorePops--;
    return;
  }
  if (!sheetEl.hidden) closeSheet();
  else if (ui.view !== 'day') go('day');
  syncBackGuard();
});

// Ekrany rejestruje app.js (registerViews) - core nie importuje widoków, więc nie ma pętli importów.
export const views = {};

export function registerViews(map) {
  Object.assign(views, map);
}

export function render() {
  views[ui.view]();
}

// Motyw "system" = bez atrybutu, decyduje prefers-color-scheme w CSS.
export function applyTheme() {
  const { theme } = store.getSettings();
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  document.querySelector('meta[name=theme-color]').setAttribute('content', surface || '#111827');
  window.WorkoutAndroid?.setBarColor(surface || '#111827'); // APK: paski systemu w kolorze motywu
}

export function catDot(catId) {
  const c = categoryById(catId);
  return `<span class="dot" style="background:${c ? c.color : '#888'}"></span>`;
}

export function openSheet(html) {
  sheetEl.onclick = null; // handler poprzedniego arkusza nie może przeżyć jego zamknięcia
  sheetEl.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet-body" role="dialog" aria-modal="true">${html}</div>`;
  sheetEl.hidden = false;
  document.body.classList.add('no-scroll');
  const first = sheetEl.querySelector('[autofocus]');
  if (first) first.focus();
  syncBackGuard();
}

export function closeSheet() {
  sheetEl.hidden = true;
  sheetEl.onclick = null;
  sheetEl.innerHTML = '';
  document.body.classList.remove('no-scroll');
  syncBackGuard();
}

export function sheetHeader(title, back) {
  return `<div class="sheet-head">
    ${back ? `<button class="icon" data-action="${back}" aria-label="Wstecz">‹</button>` : '<span></span>'}
    <h2>${h(title)}</h2>
    <button class="icon" data-action="close-sheet" aria-label="Zamknij">✕</button>
  </div>`;
}

export let toastTimer;
// action/onAction: przycisk w komunikacie (np. "Cofnij"); taki komunikat wisi dłużej.
export function toast(msg, { action, onAction } = {}) {
  const el = $('#toast');
  el.textContent = msg;
  if (action) {
    const b = Object.assign(document.createElement('button'), { className: 'toast-action', textContent: action, type: 'button' });
    b.addEventListener('click', () => {
      el.hidden = true;
      onAction();
    });
    el.append(b);
  }
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, action ? 7000 : 3500);
}
