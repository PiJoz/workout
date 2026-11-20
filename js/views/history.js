// Historia ćwiczenia: poprzednie treningi z seriami, od najnowszego - żeby przy dodawaniu serii widzieć,
// ile było ostatnio. Przycisk pod "?" na karcie ćwiczenia, w edycji serii i na liście ćwiczeń.

import { bestSet } from '../stats.js';
import * as store from '../store.js';
import { escapeHtml as h, plural, shortDate, todayKey } from '../util.js';
import { formatSet, openSheet, sheetEl, sheetHeader } from '../ui/core.js';

export const ICON_HISTORY = '<svg viewBox="0 0 24 24" aria-hidden="true" class="guide-ico"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 3.5V8h4.5"/><path d="M12 7.5V12l3 2"/></svg>';
const SHOWN = 5; // tyle ostatnich treningów - żeby od razu widzieć, ile było ostatnio

export function historyButton(ex, cls = 'guide-btn') {
  return `<button class="${cls}" data-action="history" data-id="${ex.id}" aria-label="Historia: ${h(ex.name)}">${ICON_HISTORY}</button>`;
}

export function showHistory(ex, onBack = null) {
  const rows = store.history(ex.id).filter(({ entry }) => entry.sets.length).reverse();
  const today = todayKey();
  const best = bestSet(rows.flatMap(({ entry }) => entry.sets), ex.type);
  const bestDate = best && rows.find(({ entry }) => entry.sets.includes(best)).date;
  openSheet(`${sheetHeader('Historia', onBack ? 'hist-back' : null)}
    <h3 class="guide-title">${h(ex.name)}</h3>
    ${rows.length ? `
      <p class="muted small center">${plural(rows.length, ['trening', 'treningi', 'treningów'])} · rekord ${h(formatSet(best, ex.type))} (${h(shortDate(bestDate))})</p>
      <ul class="history-list">${rows.slice(0, SHOWN).map(({ date, entry }) => `<li>
        <strong>${date === today ? 'Dziś' : h(shortDate(date))}</strong>
        <span>${entry.sets.map((s) => h(formatSet(s, ex.type))).join(', ')}</span></li>`).join('')}</ul>
      ${rows.length > SHOWN ? `<p class="muted small center">Starsze treningi: zakładka „Postęp”.</p>` : ''}`
    : '<p class="muted center">Tego ćwiczenia nie ma jeszcze w kalendarzu.</p>'}`);
  sheetEl.onclick = (ev) => {
    if (onBack && ev.target.closest('[data-action=hist-back]')) onBack();
  };
}
