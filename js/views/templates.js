// Gotowe treningi (szablony): lista, podgląd, wstawienie w dzień, nazwa.

import * as store from '../store.js';
import { escapeHtml as h, FORMS, longDate, plural, shortDate } from '../util.js';
import { $, catDot, closeSheet, formatSet, go, openSheet, render, sheetEl, sheetHeader, toast, ui } from '../ui/core.js';

// Powstają z dnia w kalendarzu (przytrzymaj dzień -> "Zapisz jako gotowy trening"). Wstawia się je
// w dzień z okna "+ Dodaj ćwiczenie" (Treningi) albo z zakładki "Ćwiczenia" - zawsze dopisane,
// z seriami z szablonu do poprawienia.

export const TEMPLATE_HINT = 'Nowy gotowy trening: w kalendarzu przytrzymaj dzień z treningiem i wybierz „Zapisz jako gotowy trening”.';

export function templateSummary(t) {
  const sets = t.entries.reduce((n, e) => n + e.sets.length, 0);
  return `${plural(t.entries.length, FORMS.exercise)} · ${plural(sets, FORMS.set)}`;
}

// Lista gotowych treningów; back: dokąd wraca "wstecz" z podglądu ('' = bez powrotu).
export function templateList(back) {
  const list = store.templates();
  if (!list.length) return '<p class="muted">Nie ma jeszcze gotowych treningów.</p>';
  return `<ul class="tpl-list">${list.map((t) => `<li><button class="tpl-row" data-action="tpl-open" data-id="${t.id}" data-back="${back}">
      <strong>${h(t.name)}</strong>
      <small class="muted">${templateSummary(t)}</small>
      <span class="tpl-dots">${t.entries.map((e) => catDot(store.getExercise(e.exerciseId)?.category)).join('')}</span>
    </button></li>`).join('')}</ul>`;
}

// Z okna "+ Dodaj ćwiczenie": wybór gotowego treningu dla dnia z ekranu głównego.
export function pickTemplate() {
  openSheet(`${sheetHeader('Gotowe treningi', 'add')}
    ${templateList('tpl-pick')}
    <p class="muted small">${TEMPLATE_HINT}</p>`);
}

// Podgląd: ćwiczenia z seriami, wstawienie w wybrany dzień (domyślnie dzień z ekranu głównego),
// zmiana nazwy, usunięcie.
export function templateSheet(id, back = '') {
  const t = store.getTemplate(id);
  if (!t) return closeSheet();
  const st = { date: ui.date };
  openSheet('');
  const body = sheetEl.querySelector('.sheet-body');
  const draw = () => {
    const there = store.getDay(st.date).length;
    body.innerHTML = `${sheetHeader(t.name, back)}
      <p class="muted center">${templateSummary(t)}${t.from ? ` · z ${h(shortDate(t.from))}` : ''}</p>
      <ul class="copy-list">${t.entries.map((e) => {
        const ex = store.getExercise(e.exerciseId);
        return ex ? `<li><span>${catDot(ex.category)} <strong>${h(ex.name)}</strong><br>
          <small class="muted">${e.sets.map((s) => h(formatSet(s, ex.type))).join(', ')}</small></span></li>` : '';
      }).join('')}</ul>
      <label class="setting"><span>Wstaw do dnia</span><input type="date" id="tpl-date" value="${st.date}"></label>
      <p class="muted small">${h(longDate(st.date))}: ${there
        ? `jest już ${plural(there, FORMS.exercise)} - gotowy trening zostanie dopisany.`
        : 'pusty dzień.'} Serie możesz potem zmienić.</p>
      <button class="primary block" data-action="tpl-apply">Wstaw trening</button>
      <div class="row">
        <button class="secondary" data-action="tpl-rename">Zmień nazwę</button>
        <button class="danger" data-action="tpl-delete">Usuń</button>
      </div>`;
    body.querySelector('#tpl-date').addEventListener('change', (ev) => {
      if (ev.target.value) {
        st.date = ev.target.value;
        draw();
      }
    });
  };
  sheetEl.onclick = (ev) => {
    const a = ev.target.closest('[data-action]')?.dataset.action;
    if (a === 'tpl-apply') {
      const before = store.snapshotDays([st.date]);
      const n = store.applyTemplate(id, st.date);
      ui.date = st.date;
      closeSheet();
      go('day');
      toast(`Wstawiono „${t.name}”: ${plural(n, FORMS.exercise)}`, {
        action: 'Cofnij',
        onAction: () => { store.replaceDays(before); render(); toast('Cofnięto wstawienie'); },
      });
    } else if (a === 'tpl-rename') {
      templateNameForm({ id, back });
    } else if (a === 'tpl-delete') {
      const undo = store.deleteTemplate(id);
      closeSheet();
      render();
      toast(`Usunięto „${t.name}”`, {
        action: 'Cofnij',
        onAction: () => { store.restoreTemplate(undo); render(); toast('Przywrócono gotowy trening'); },
      });
    }
  };
  draw();
}

// Nazwa gotowego treningu: nowy z dnia (date) albo zmiana nazwy (id; potem wraca do podglądu).
export function templateNameForm({ date = null, id = null, back = '' }) {
  const t = id ? store.getTemplate(id) : null;
  const entries = date ? store.getDay(date) : [];
  openSheet(`${sheetHeader(t ? 'Zmień nazwę' : 'Zapisz jako gotowy trening')}
    <form id="tpl-form" class="form">
      ${date ? `<p class="muted">${h(longDate(date))}: ${templateSummary({ entries })}</p>` : ''}
      <label>Nazwa<input name="name" required maxlength="60" autofocus value="${h(t ? t.name : `Trening ${shortDate(date)}`)}"></label>
      <p class="error" id="tpl-error" hidden></p>
      <button class="primary block" type="submit">Zapisz</button>
    </form>`);
  $('#tpl-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = new FormData(ev.target).get('name');
    try {
      if (t) {
        store.renameTemplate(id, name);
        templateSheet(id, back);
        render();
      } else {
        const saved = store.saveTemplate(date, name);
        closeSheet();
        render();
        toast(`Zapisano „${saved.name}” - jest w „+ Dodaj ćwiczenie” → Treningi`);
      }
    } catch (err) {
      const el = $('#tpl-error');
      el.textContent = err.message;
      el.hidden = false;
    }
  });
}
