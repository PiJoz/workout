// Instrukcje ćwiczeń: przycisk "?" i okno z krokami i zdjęciami.

import { categoryById, TYPES } from '../data.js';
import { GUIDE_SOURCE, guideFor } from '../guides.js';
import { escapeHtml as h } from '../util.js';
import { openSheet, sheetEl, sheetHeader } from '../ui/core.js';

export const ICON_GUIDE = '<svg viewBox="0 0 24 24" aria-hidden="true" class="guide-ico"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6V14"/><circle cx="12" cy="17.2" r=".6" class="dot-fill"/></svg>';

export function guideButton(ex, cls = 'guide-btn') {
  return `<button class="${cls}" data-action="guide" data-id="${ex.id}" aria-label="Instrukcja: ${h(ex.name)}">${ICON_GUIDE}</button>`;
}

// onBack: skąd przyszliśmy (edytor serii); bez niego okno się po prostu zamyka.
export function showGuide(ex, onBack = null) {
  const g = guideFor(ex);
  const cat = categoryById(ex.category);
  const captions = ['1. Pozycja wyjściowa', '2. Ruch'];
  openSheet(`${sheetHeader('Instrukcja', onBack ? 'guide-back' : null)}
    <h3 class="guide-title">${h(ex.name)}</h3>
    <p class="muted small center">${h(cat.name)} · ${h(TYPES[ex.type].name)}</p>
    ${g ? `
      ${g.images.length ? `<div class="guide-imgs">${g.images.map((src, i) => `<figure>
        <img src="${src}" alt="${h(ex.name)} - ${captions[i]}" width="480" height="320">
        <figcaption>${captions[i]}</figcaption></figure>`).join('')}</div>` : ''}
      <h4>Krok po kroku</h4>
      <ol class="guide-steps">${g.steps.map((t) => `<li>${h(t)}</li>`).join('')}</ol>
      ${g.images.length ? `<p class="muted small">${h(GUIDE_SOURCE)}</p>` : ''}`
    : `<p>Nie mam jeszcze instrukcji dla tego ćwiczenia.</p>
      <a class="secondary block guide-yt" target="_blank" rel="noopener"
        href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name} technika ćwiczenia`)}">Szukaj filmu na YouTube</a>
      <p class="muted small">Wymaga internetu.</p>`}`);
  sheetEl.onclick = (ev) => {
    if (onBack && ev.target.closest('[data-action=guide-back]')) onBack();
  };
}
