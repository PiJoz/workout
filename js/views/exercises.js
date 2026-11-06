// Zakładka "Ćwiczenia": biblioteka, własne ćwiczenia, zmiana typu.

import { CATEGORIES, TYPES } from '../data.js';
import * as store from '../store.js';
import { escapeHtml as h, plural } from '../util.js';
import { $, catDot, closeSheet, openSheet, render, sheetEl, sheetHeader, toast, ui, viewEl } from '../ui/core.js';
import { editEntry } from '../views/day.js';
import { guideButton } from '../views/guide.js';
import { TEMPLATE_HINT, templateList } from '../views/templates.js';

// existing: własne ćwiczenie do edycji (nazwa, partia); bez niego formularz dodaje nowe.
// Typu istniejącego ćwiczenia nie zmienia się tutaj - "Zmień typ" tworzy nowe ćwiczenie.
export function customForm(catId, back, existing = null) {
  const used = existing ? store.usageCount(existing.id) : 0;
  openSheet(`${sheetHeader(existing ? 'Edytuj ćwiczenie' : 'Własne ćwiczenie', back)}
    <form id="custom-form" class="form">
      <label>Nazwa<input name="name" required maxlength="80" autofocus placeholder="np. Wyciskanie na maszynie Smitha"
        value="${existing ? h(existing.name) : ''}"></label>
      <label>Partia<select name="category">
        ${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === (existing ? existing.category : catId) ? 'selected' : ''}>${h(c.name)}</option>`).join('')}
      </select></label>
      ${existing ? `
        <p class="type-line"><span>Typ: <strong>${h(TYPES[existing.type].name)}</strong></span>
          <button type="button" class="link" data-action="change-type" data-id="${existing.id}">Zmień typ</button></p>
        ${used ? `<p class="muted small">Używane w ${plural(used, ['treningu', 'treningach', 'treningach'])} - zmiana nazwy i partii ich nie zmienia.</p>` : ''}`
      : `<fieldset><legend>Co mierzysz?</legend>
        ${Object.entries(TYPES).map(([k, t], i) => `<label class="radio"><input type="radio" name="type" value="${k}" ${i === 0 ? 'checked' : ''}> ${h(t.name)}</label>`).join('')}
      </fieldset>`}
      <p class="error" id="custom-error" hidden></p>
      <button class="primary block" type="submit">Zapisz ćwiczenie</button>
    </form>`);
  $('#custom-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    try {
      if (existing) {
        const ex = store.updateCustomExercise(existing.id, { name: f.get('name'), category: f.get('category') });
        closeSheet();
        toast(`Zapisano „${ex.name}”`);
        render();
        return;
      }
      const ex = store.addCustomExercise({ name: f.get('name'), category: f.get('category'), type: f.get('type') });
      if (back === 'manage') {
        closeSheet();
        toast(`Dodano „${ex.name}”`);
        render();
      } else {
        editEntry({ exerciseId: ex.id, sets: [{}], note: '' });
      }
    } catch (err) {
      const el = $('#custom-error');
      el.textContent = err.message;
      el.hidden = false;
    }
  });
}

// Wybór nowego typu dla ćwiczenia. Wynik to osobne ćwiczenie w spisie (store.typeVariant);
// onPick dostaje je, onBack wraca tam, skąd przyszliśmy.
export function pickType(ex, { onPick, onBack }) {
  const variants = Object.keys(TYPES).map((t) => {
    if (t === ex.type) return { t, state: 'current' };
    const plan = store.planTypeVariant(ex.id, t);
    return { t, state: plan.existing ? 'exists' : 'new', name: plan.name };
  });
  openSheet(`${sheetHeader('Zmień typ', 'type-back')}
    <p class="center"><strong>${h(ex.name)}</strong><br><span class="muted small">teraz: ${h(TYPES[ex.type].name)}</span></p>
    <p class="muted small">Zmiana typu tworzy osobne ćwiczenie w spisie, z typem w nazwie. To ćwiczenie i jego treningi zostają bez zmian.</p>
    <ul class="type-list">${variants.map((v) => `<li>
      <button data-action="pick-type" data-type="${v.t}" ${v.state === 'current' ? 'disabled' : ''}>
        <span>${h(TYPES[v.t].name)}</span>
        <small>${v.state === 'current' ? 'obecny typ' : v.state === 'exists' ? `już w spisie: ${h(v.name)}` : `nowe: ${h(v.name)}`}</small>
      </button></li>`).join('')}</ul>`);
  sheetEl.onclick = (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'type-back') return onBack();
    if (btn.dataset.action !== 'pick-type') return;
    const before = store.allExercises().length;
    const variant = store.typeVariant(ex.id, btn.dataset.type);
    onPick(variant, store.allExercises().length > before);
  };
}

export const ICON_EDIT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
export const ICON_TYPE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13M14 4l4 4-4 4M20 16H7M10 12l-4 4 4 4"/></svg>';
export const ICON_TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';

export function renderExercises() {
  viewEl.innerHTML = `
    <h1>Ćwiczenia</h1>
    <details class="card cat-section tpl-section" style="--cat:var(--accent)" ${ui.tplClosed ? '' : 'open'}>
      <summary><strong>Treningi</strong><span class="muted small">${store.templates().length}</span></summary>
      ${templateList('')}
      <p class="muted small">${TEMPLATE_HINT}</p>
    </details>
    <button class="primary block" data-action="manage-custom">+ Dodaj własne ćwiczenie</button>
    ${CATEGORIES.map((c) => {
      const list = store.exercisesIn(c.id);
      return `<details class="card cat-section" style="--cat:${c.color}" ${ui.openCats?.has(c.id) ? 'open' : ''} data-cat="${c.id}">
        <summary>${catDot(c.id)}<strong>${h(c.name)}</strong><span class="muted small">${list.length}</span></summary>
        <ul class="ex-manage">${list.map((e) => `<li>
          <span>${h(e.name)}${e.custom ? ' <em class="tag">własne</em>' : ''}<br><small class="muted">${h(TYPES[e.type].name)}</small></span>
          <span class="ex-actions">
            ${guideButton(e, 'icon small svg')}
            <button class="icon small svg" data-action="list-change-type" data-id="${e.id}" aria-label="Zmień typ: ${h(e.name)}">${ICON_TYPE}</button>
            ${e.custom ? `<button class="icon small svg" data-action="edit-custom" data-id="${e.id}" aria-label="Edytuj ${h(e.name)}">${ICON_EDIT}</button>
            <button class="icon small svg" data-action="del-custom" data-id="${e.id}" aria-label="Usuń ${h(e.name)}">${ICON_TRASH}</button>` : ''}
          </span>
        </li>`).join('')}</ul>
      </details>`;
    }).join('')}`;
  viewEl.querySelector('.tpl-section').addEventListener('toggle', (ev) => { ui.tplClosed = !ev.target.open; });
  // Otwarte partie zostają otwarte po edycji ćwiczenia.
  viewEl.querySelectorAll('details[data-cat]').forEach((d) => d.addEventListener('toggle', () => {
    ui.openCats = ui.openCats || new Set();
    if (d.open) ui.openCats.add(d.dataset.cat); else ui.openCats.delete(d.dataset.cat);
  }));
}
