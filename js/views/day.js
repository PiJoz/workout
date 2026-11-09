// Ekran dnia: lista ćwiczeń, dodawanie, edycja serii, zamiana ćwiczenia.

import { CATEGORIES, categoryById, TYPES } from '../data.js';
import * as store from '../store.js';
import { fromDisplay, toDisplay, WEIGHT_STEP } from '../units.js';
import { escapeHtml as h, formatNum, FORMS, longDate, parseNum, plural, stepValue, todayKey } from '../util.js';
import { $, catDot, closeSheet, formatSet, keepFocusVisible, openSheet, render, sheetEl, sheetHeader, toast, ui, units, viewEl } from '../ui/core.js';
import { pickType } from '../views/exercises.js';
import { guideButton, ICON_GUIDE, showGuide } from '../views/guide.js';

export function renderDay() {
  const entries = store.getDay(ui.date);
  const isToday = ui.date === todayKey();
  const cats = [...new Set(entries.map((e) => store.getExercise(e.exerciseId)?.category).filter(Boolean))];

  viewEl.innerHTML = `
    <header class="day-head">
      <button class="icon" data-action="prev-day" aria-label="Poprzedni dzień">‹</button>
      <label class="day-title">
        <span class="day-label">${isToday ? 'Dziś' : ui.date < todayKey() ? 'Minione' : 'Zaplanowane'}</span>
        <strong>${h(longDate(ui.date))}</strong>
        <input type="date" id="date-picker" value="${ui.date}" aria-label="Wybierz datę">
      </label>
      <button class="icon" data-action="next-day" aria-label="Następny dzień">›</button>
    </header>
    ${cats.length ? `<div class="chips">${cats.map((c) => `<span class="chip">${catDot(c)}${h(categoryById(c).name)}</span>`).join('')}</div>` : ''}
    <section class="entries">
      ${entries.length ? entries.map(entryCard).join('') : `
        <div class="empty-day">
          <p>Brak ćwiczeń ${isToday ? 'na dziś' : 'tego dnia'}.</p>
          <p class="muted">Dodaj ćwiczenie albo skopiuj trening z kalendarza.</p>
        </div>`}
    </section>
    ${entries.length > 1 ? '<p class="muted small center">Przytrzymaj ćwiczenie, żeby przesunąć je w górę lub w dół.</p>' : ''}
    <button class="primary block" data-action="add">+ Dodaj ćwiczenie</button>
    <button class="secondary block" data-action="copy-from-cal">Kopiuj z kalendarza</button>
    ${entries.length ? '<button class="secondary block" data-action="export-day">Eksportuj trening</button>' : ''}`;

  $('#date-picker').addEventListener('change', (ev) => {
    if (ev.target.value) {
      ui.date = ev.target.value;
      render();
    }
  });
}

export function entryCard(e) {
  const ex = store.getExercise(e.exerciseId);
  if (!ex) return '';
  const cat = categoryById(ex.category);
  return `
    <article class="card entry" data-action="edit" data-id="${e.id}" style="--cat:${cat.color}">
      <div class="entry-head">
        <h3>${h(ex.name)}</h3>
        <span class="muted small">${h(cat.name)}</span>
        ${guideButton(ex)}
      </div>
      ${e.sets.length ? `<ol class="sets">${e.sets.map((s) => `<li>${h(formatSet(s, ex.type))}</li>`).join('')}</ol>`
        : '<p class="muted small">Brak serii - stuknij, żeby wpisać.</p>'}
    </article>`;
}

// Przytrzymanie i puszczenie bez ruchu otwiera to menu; przytrzymanie z ruchem to przeciąganie.

export function entryActions(entryId) {
  const entry = store.getDay(ui.date).find((e) => e.id === entryId);
  const ex = entry && store.getExercise(entry.exerciseId);
  if (!ex) return;
  const many = store.getDay(ui.date).length > 1;
  openSheet(`${sheetHeader(ex.name)}
    <p class="muted center">${plural(entry.sets.length, FORMS.set)} · ${h(TYPES[ex.type].name)}</p>
    <button class="secondary block" data-action="ea-swap">Zamień na inne ćwiczenie</button>
    <button class="danger block" data-action="ea-delete">Usuń z treningu</button>
    ${many ? '<p class="muted small center">Kolejność: przytrzymaj kartę i przesuń palcem.</p>' : ''}`);
  sheetEl.onclick = (ev) => {
    const a = ev.target.closest('[data-action]')?.dataset.action;
    if (a === 'ea-swap') {
      swapPicker(entryId);
    } else if (a === 'ea-delete') {
      const before = store.snapshotDays([ui.date]);
      store.deleteEntry(ui.date, entryId);
      closeSheet();
      render();
      toast(`Usunięto „${ex.name}”`, {
        action: 'Cofnij',
        onAction: () => { store.replaceDays(before); render(); },
      });
    }
  };
}

// Wybór ćwiczenia na zamianę: najpierw partia obecnego ćwiczenia, wyszukiwanie we wszystkich.
// Ten sam typ pomiaru - serie zostają; inny - zostają wspólne pola i od razu otwiera się edycja serii.
export function swapPicker(entryId) {
  const entry = store.getDay(ui.date).find((e) => e.id === entryId);
  const cur = entry && store.getExercise(entry.exerciseId);
  if (!cur) return closeSheet();
  const st = { cat: cur.category };
  openSheet(`${sheetHeader('Zamień ćwiczenie', 'ea-back')}
    <p class="muted center">Teraz: <strong>${h(cur.name)}</strong> · ${h(TYPES[cur.type].name)}</p>
    <input type="search" id="swap-search" placeholder="Szukaj we wszystkich partiach…" autocomplete="off">
    <div id="swap-cats" class="chips"></div>
    <ul class="ex-list" id="swap-list"></ul>`);
  const search = $('#swap-search');
  const draw = () => {
    const q = search.value.trim().toLowerCase();
    const list = q
      ? store.allExercises().filter((e) => e.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'pl'))
      : store.exercisesIn(st.cat);
    $('#swap-cats').innerHTML = CATEGORIES.map((c) =>
      `<button class="chip ${!q && c.id === st.cat ? 'active' : ''}" data-action="swap-cat" data-cat="${c.id}">${h(c.name)}</button>`).join('');
    $('#swap-list').innerHTML = list.length ? list.map((e) => `<li><button data-action="swap-pick" data-id="${e.id}" ${e.id === cur.id ? 'disabled' : ''}>
        <span>${h(e.name)}${e.custom ? ' <em class="tag">własne</em>' : ''}${e.id === cur.id ? ' <em class="tag">teraz</em>' : ''}</span>
        <small>${h(TYPES[e.type].name)}${e.type !== cur.type ? ' · inny typ - serie do poprawienia' : ''}</small></button></li>`).join('')
      : '<li class="muted">Nic nie pasuje.</li>';
  };
  search.addEventListener('input', draw);
  sheetEl.onclick = (ev) => {
    const btn = ev.target.closest('[data-action]');
    const a = btn?.dataset.action;
    if (a === 'ea-back') {
      entryActions(entryId);
    } else if (a === 'swap-cat') {
      st.cat = btn.dataset.cat;
      search.value = '';
      draw();
    } else if (a === 'swap-pick') {
      const next = store.getExercise(btn.dataset.id);
      const before = store.snapshotDays([ui.date]);
      store.swapExercise(ui.date, entryId, next.id);
      render();
      if (next.type !== cur.type) editEntry(structuredClone(store.getDay(ui.date).find((e) => e.id === entryId)));
      else closeSheet();
      toast(`Zamieniono na „${next.name}”`, {
        action: 'Cofnij',
        onAction: () => { store.replaceDays(before); closeSheet(); render(); toast('Cofnięto zamianę'); },
      });
    }
  };
  draw();
}

export function pickCategory() {
  const templates = store.templates().length;
  openSheet(`${sheetHeader('Wybierz partię')}
    <button class="cat-tile tpl-tile" style="--cat:var(--accent)" data-action="tpl-pick"><span>Treningi</span>
      <small>${templates ? `gotowe: ${templates}` : 'gotowe zestawy ćwiczeń'} - wstaw cały trening</small></button>
    <div class="cat-grid">
      ${CATEGORIES.map((c) => `<button class="cat-tile" style="--cat:${c.color}" data-action="pick-cat" data-cat="${c.id}">
        <span>${h(c.name)}</span><small>${plural(store.exercisesIn(c.id).length, FORMS.exercise)}</small></button>`).join('')}
    </div>`);
}

export function pickExercise(catId, query = '') {
  const cat = categoryById(catId);
  const list = store.exercisesIn(catId);
  openSheet(`${sheetHeader(cat.name, 'add')}
    <input type="search" id="ex-search" placeholder="Szukaj ćwiczenia…" value="${h(query)}" autocomplete="off">
    <button class="secondary block" data-action="new-custom" data-cat="${catId}">+ Własne ćwiczenie</button>
    <ul class="ex-list" id="ex-list">
      ${list.map((e) => `<li><button data-action="pick-ex" data-id="${e.id}" data-name="${h(e.name.toLowerCase())}">
        <span>${h(e.name)}${e.custom ? ' <em class="tag">własne</em>' : ''}</span>
        <small>${h(TYPES[e.type].name)}</small></button></li>`).join('')}
    </ul>`);
  const search = $('#ex-search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    sheetEl.querySelectorAll('#ex-list li').forEach((li) => {
      li.hidden = q && !li.firstElementChild.dataset.name.includes(q);
    });
  });
}

export function timeParts(sec) {
  if (sec === null || sec === undefined || sec === '') return ['', ''];
  return [String(Math.floor(sec / 60)), String(Math.round(sec % 60)).padStart(2, '0')];
}

export function fieldLabel(f) {
  const u = units();
  return { weight: `Ciężar (${u.weight})`, reps: 'Powtórzenia', time: 'Czas (min:s)', distance: `Dystans (${u.distance})` }[f];
}

// Nagłówek kolumn nad seriami - jednostka jest tu, a nie przy każdym polu (miejsce na −/+).
export function setHead(type) {
  const fields = TYPES[type].fields;
  return `<li class="set-row set-head" style="--cols:${fields.length}"><span></span>
    ${fields.map((f) => `<span>${h(fieldLabel(f))}</span>`).join('')}<span></span></li>`;
}

export function setRow(set, type, i) {
  const fields = TYPES[type].fields;
  const u = units();
  const inputs = fields.map((f) => {
    if (f === 'time') {
      const [m, s] = timeParts(set.time);
      return `<span class="time-in">
        <input inputmode="numeric" data-f="min" value="${m}" placeholder="min" aria-label="Minuty">
        <b>:</b><input inputmode="numeric" data-f="sec" value="${s}" placeholder="sek" aria-label="Sekundy"></span>`;
    }
    if (f === 'reps') {
      return stepper(f, set.reps ?? '', 'numeric', '');
    }
    // Ciężar i dystans są zapisane w kg/km. data-orig trzyma dokładną wartość: jeśli pole
    // nie zostało zmienione, zapis jej nie przelicza (176,37 lb -> 79,9998 kg).
    const v = set[f];
    const shown = formatNum(toDisplay(v, f, u));
    const orig = v === null || v === undefined ? '' : String(v);
    return f === 'weight'
      ? stepper(f, shown, 'decimal', orig)
      : `<span class="num-in"><input inputmode="decimal" data-f="${f}" value="${h(shown)}" data-orig="${orig}" data-shown="${h(shown)}"
          aria-label="${h(fieldLabel(f))}"></span>`;
  });
  return `<li class="set-row" style="--cols:${fields.length}"><span class="set-no">${i + 1}</span>${inputs.join('')}
    <button type="button" class="icon small" data-action="del-set" aria-label="Usuń serię">✕</button></li>`;
}

export function stepper(f, shown, mode, orig) {
  const what = f === 'weight' ? `${formatNum(WEIGHT_STEP[units().weight])} ${units().weight}` : '1 powtórzenie';
  return `<span class="stepper">
    <button type="button" data-action="step" data-d="-1" aria-label="Odejmij ${what}">−</button>
    <input inputmode="${mode}" data-f="${f}" value="${h(String(shown))}" data-orig="${orig}" data-shown="${h(String(shown))}"
      aria-label="${h(fieldLabel(f))}">
    <button type="button" data-action="step" data-d="1" aria-label="Dodaj ${what}">+</button></span>`;
}

export function readSets(type) {
  const fields = TYPES[type].fields;
  const u = units();
  const sets = [];
  let bad = false;
  // Tylko lista serii - nagłówek kolumn też ma klasę .set-row (wspólna siatka), ale nie ma pól.
  sheetEl.querySelectorAll('#set-list .set-row').forEach((row) => {
    row.classList.remove('invalid');
    const set = {};
    let any = false;
    let rowBad = false;
    for (const f of fields) {
      if (f === 'time') {
        const m = row.querySelector('[data-f=min]').value.trim();
        const s = row.querySelector('[data-f=sec]').value.trim();
        if (!m && !s) { set.time = null; continue; }
        const mm = m ? Number(m) : 0;
        const ss = s ? Number(s) : 0;
        if (!Number.isInteger(mm) || !Number.isInteger(ss) || mm < 0 || ss < 0 || ss >= 60) rowBad = true;
        set.time = mm * 60 + ss;
        any = true;
      } else {
        const input = row.querySelector(`[data-f=${f}]`);
        const raw = input.value.trim();
        if (!raw) { set[f] = null; continue; }
        const n = parseNum(raw);
        if (n === null || (f === 'reps' && !Number.isInteger(n))) rowBad = true;
        if (f === 'reps' || n === null) set[f] = n;
        else if (raw === input.dataset.shown && input.dataset.orig) set[f] = Number(input.dataset.orig);
        else set[f] = fromDisplay(n, f, u);
        any = true;
      }
    }
    if (rowBad) { row.classList.add('invalid'); bad = true; }
    if (any) sets.push(set);
  });
  return { sets, bad };
}

export function editEntry(entry) {
  const ex = store.getExercise(entry.exerciseId);
  const cat = categoryById(ex.category);
  const isNew = !entry.id;
  // Zapisany wpis po "Zmień typ" zmienia ćwiczenie dopiero przy zapisie - mówimy o tym wprost.
  const savedAs = isNew ? null : store.getExercise(store.getDay(ui.date).find((e) => e.id === entry.id)?.exerciseId);
  openSheet(`${sheetHeader(ex.name, isNew ? `back-cat:${ex.category}` : null)}
    <p class="type-line center"><span class="muted">${h(cat.name)} · ${h(TYPES[ex.type].name)}</span>
      <button type="button" class="link" data-action="editor-change-type">Zmień typ</button>
      <button type="button" class="link" data-action="editor-guide">${ICON_GUIDE} Instrukcja</button></p>
    ${savedAs && savedAs.id !== ex.id ? `<p class="warning">Po zapisaniu ten wpis przejdzie z „${h(savedAs.name)}” do „${h(ex.name)}”.</p>` : ''}
    <form id="entry-form" class="form">
      <ul class="set-list set-header">${setHead(ex.type)}</ul>
      <ol class="set-list" id="set-list">${(entry.sets.length ? entry.sets : [{}]).map((s, i) => setRow(s, ex.type, i)).join('')}</ol>
      <button type="button" class="secondary block" data-action="add-set" data-keep-with-focus>+ Dodaj serię</button>
      <p class="error" id="entry-error" hidden></p>
      <button class="primary block" type="submit">Zapisz</button>
      ${isNew ? '' : '<button type="button" class="danger block" data-action="del-entry">Usuń ćwiczenie z treningu</button>'}
    </form>`);

  const list = $('#set-list');
  const renumber = () => list.querySelectorAll('.set-no').forEach((el, i) => { el.textContent = i + 1; });
  const err = (msg) => { const el = $('#entry-error'); el.textContent = msg; el.hidden = !msg; };

  sheetEl.onclick = (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'add-set') {
      const { sets } = readSets(ex.type);
      const last = sets[sets.length - 1] || {};
      list.insertAdjacentHTML('beforeend', setRow(last, ex.type, list.children.length));
      const inputs = list.lastElementChild.querySelectorAll('input');
      inputs[inputs.length - 1].focus();
      keepFocusVisible(); // klawiatura już otwarta: nowa seria od razu nad nią
    } else if (btn.dataset.action === 'editor-change-type') {
      // Wpisane wartości przechodzą do nowego typu tam, gdzie pola się pokrywają (np. ciężar).
      const draft = { ...entry, sets: readSets(ex.type).sets };
      if (!draft.sets.length) draft.sets = [{}];
      pickType(ex, {
        onPick: (v, created) => {
          if (created) toast(`Dodano do spisu: „${v.name}”`);
          editEntry({ ...draft, exerciseId: v.id });
        },
        onBack: () => editEntry(draft),
      });
    } else if (btn.dataset.action === 'editor-guide') {
      const draft = { ...entry, sets: readSets(ex.type).sets }; // wpisane wartości czekają na powrót
      if (!draft.sets.length) draft.sets = [{}];
      showGuide(ex, () => editEntry(draft));
    } else if (btn.dataset.action === 'step') {
      const input = btn.parentElement.querySelector('input');
      const step = input.dataset.f === 'weight' ? WEIGHT_STEP[units().weight] : 1;
      input.value = stepValue(input.value, Number(btn.dataset.d) * step);
      btn.closest('.set-row').classList.remove('invalid');
    } else if (btn.dataset.action === 'del-set') {
      btn.closest('li').remove();
      renumber();
    } else if (btn.dataset.action === 'del-entry') {
      if (confirm(`Usunąć „${ex.name}” z tego dnia?`)) {
        store.deleteEntry(ui.date, entry.id);
        closeSheet();
        render();
      }
    }
  };

  $('#entry-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const { sets, bad } = readSets(ex.type);
    if (bad) return err('Popraw zaznaczone serie (liczby; sekundy 0–59).');
    if (!sets.length) return err('Wpisz co najmniej jedną serię.');
    // Pola notatki już nie ma; notatka z wcześniej lub z pliku .txt zostaje w danych bez zmian.
    store.saveEntry(ui.date, { id: entry.id, exerciseId: ex.id, sets, note: entry.note || '' });
    closeSheet();
    render();
  });
  const firstInput = list.querySelector('input');
  if (firstInput && (isNew || !entry.sets.length)) firstInput.focus();
}
