// Kalendarz: miesiąc, podgląd dnia, akcje przytrzymanego dnia, kopiowanie z kalendarza.

import { CATEGORIES, categoryById } from '../data.js';
import { bestSet } from '../stats.js';
import * as store from '../store.js';
import { formatExerciseList, formatWorkouts } from '../txt.js';
import { dateKey, escapeHtml as h, FORMS, longDate, MONTHS, plural, shortDate, todayKey, WEEKDAYS_SHORT } from '../util.js';
import { catDot, closeSheet, formatSet, go, openSheet, render, sheetEl, sheetHeader, toast, ui, viewEl } from '../ui/core.js';
import { shareFile } from '../ui/files.js';
import { templateNameForm } from '../views/templates.js';

// Siatka miesiąca - wspólna dla zakładki Kalendarz i okna "Kopiuj z kalendarza".
// disabled(key, entries): dzień, którego nie da się wybrać.
export function monthGrid(month, { action, selected, disabled = () => false }) {
  const [y, m] = month.split('-').map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7; // poniedziałek pierwszy
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = todayKey();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push('<span class="cal-cell empty"></span>');
  let trained = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(new Date(y, m - 1, d));
    const entries = store.getDay(key);
    const cats = [...new Set(entries.map((e) => store.getExercise(e.exerciseId)?.category).filter(Boolean))];
    if (entries.length) trained++;
    cells.push(`<button class="cal-cell ${key === today ? 'today' : ''} ${key === selected ? 'selected' : ''} ${entries.length ? 'has' : ''}"
      data-action="${action}" data-date="${key}" ${disabled(key, entries) ? 'disabled' : ''}
      aria-label="${h(longDate(key))}${entries.length ? `, ${entries.length} ćw.` : ''}">
      <span>${d}</span><span class="dots">${cats.slice(0, 4).map(catDot).join('')}</span></button>`);
  }
  return {
    trained,
    html: `<div class="cal">${WEEKDAYS_SHORT.map((w) => `<span class="cal-wd">${w}</span>`).join('')}${cells.join('')}</div>`,
  };
}

export function monthHead(month, prevAction, nextAction) {
  const [y, m] = month.split('-').map(Number);
  return `<header class="day-head">
      <button class="icon" data-action="${prevAction}" aria-label="Poprzedni miesiąc">‹</button>
      <div class="day-title"><strong class="cap">${MONTHS[m - 1]} ${y}</strong></div>
      <button class="icon" data-action="${nextAction}" aria-label="Następny miesiąc">›</button>
    </header>`;
}

export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  return dateKey(new Date(y, m - 1 + delta, 1)).slice(0, 7);
}

// Pod siatką: podsumowanie miesiąca i podgląd wybranego dnia - zamiast pustego ekranu.
// Stuknięcie w dzień go wybiera (podgląd), drugie stuknięcie albo przycisk otwiera dzień.
export function renderCalendar() {
  const inMonth = (d) => d && d.startsWith(ui.month);
  const monthDates = store.datesWithWorkouts().filter(inMonth);
  // Domyślnie oglądany dzień, jeśli coś w nim było; inaczej ostatni trening w miesiącu
  // (podgląd pustego dnia nic nie mówi).
  if (!inMonth(ui.calSel)) {
    ui.calSel = monthDates.includes(ui.date) ? ui.date : monthDates[monthDates.length - 1] || (inMonth(ui.date) ? ui.date : null);
  }
  const grid = monthGrid(ui.month, { action: 'cal-day', selected: ui.calSel });

  const entries = monthDates.flatMap((d) => store.getDay(d));
  const sets = entries.reduce((n, e) => n + e.sets.length, 0);
  const perCat = {};
  for (const e of entries) {
    const c = store.getExercise(e.exerciseId)?.category;
    if (c) perCat[c] = (perCat[c] || 0) + 1;
  }
  const topCat = Object.entries(perCat).sort((a, b) => b[1] - a[1])[0];

  viewEl.innerHTML = `
    ${monthHead(ui.month, 'prev-month', 'next-month')}
    ${grid.html}
    <div class="month-stats">
      <div><strong>${grid.trained}</strong><small>${plural(grid.trained, FORMS.workout).replace(/^\d+ /, '')}</small></div>
      <div><strong>${sets}</strong><small>${plural(sets, FORMS.set).replace(/^\d+ /, '')}</small></div>
      <div><strong>${topCat ? `${catDot(topCat[0])}${h(categoryById(topCat[0]).name)}` : '-'}</strong><small>najczęściej</small></div>
    </div>
    ${ui.calSel ? calDayCard(ui.calSel) : '<p class="muted center small">Brak treningów w tym miesiącu.</p>'}
    ${monthDates.length ? '<p class="muted small center">Przytrzymaj dzień z treningiem, żeby go przenieść albo usunąć.</p>' : ''}
    ${ui.month !== todayKey().slice(0, 7) ? '<button class="link center" data-action="this-month">Bieżący miesiąc</button>' : ''}
    <div class="legend">${CATEGORIES.map((c) => `<span>${catDot(c.id)}${h(c.name)}</span>`).join('')}</div>`;
}

export function calDayCard(date) {
  const entries = store.getDay(date);
  const rows = entries.map((e) => {
    const ex = store.getExercise(e.exerciseId);
    if (!ex) return '';
    const best = bestSet(e.sets, ex.type);
    return `<li>${catDot(ex.category)}<span class="cal-ex">${h(ex.name)}</span>
      <small class="muted">${plural(e.sets.length, FORMS.set)}${best ? ` · ${h(formatSet(best, ex.type))}` : ''}</small></li>`;
  }).join('');
  return `<section class="card cal-day-card">
    <div class="cal-day-head"><strong>${h(longDate(date))}</strong>
      <button class="link" data-action="goto-day" data-date="${date}">${entries.length ? 'Otwórz' : 'Dodaj trening'} ›</button></div>
    ${entries.length ? `<ul class="cal-day-list">${rows}</ul>` : '<p class="muted small">Brak treningu tego dnia.</p>'}
    ${entries.length ? garminNote(date) : ''}
  </section>`;
}

export function garminNote(date) {
  const m = store.garminMark(date);
  if (!m) return '';
  return m.changed
    ? '<p class="garmin-mark changed small">Zmieniony po wysłaniu do Garmin Connect</p>'
    : `<p class="garmin-mark small">✓ Wysłany do Garmin Connect ${h(shortDate(m.at))}</p>`;
}

// Usunięcie wymaga potwierdzenia, a po każdej operacji komunikat ma "Cofnij" (kopia dni sprzed).

export function dayActions(date) {
  const entries = store.getDay(date);
  if (!entries.length) return;
  const sets = entries.reduce((n, e) => n + e.sets.length, 0);
  const summary = `${plural(entries.length, FORMS.exercise)} · ${plural(sets, FORMS.set)}`;
  const names = entries.map((e) => store.getExercise(e.exerciseId)).filter(Boolean)
    .map((ex) => `<li>${catDot(ex.category)}<span class="cal-ex">${h(ex.name)}</span></li>`).join('');
  const st = { view: 'menu', month: date.slice(0, 7), target: null };
  openSheet('');
  const body = sheetEl.querySelector('.sheet-body');

  const draw = () => {
    if (st.view === 'menu') {
      body.innerHTML = `${sheetHeader(longDate(date))}
        <p class="muted center">${summary}</p>
        <ul class="cal-day-list">${names}</ul>
        <button class="secondary block" data-action="dm-export">Eksportuj trening</button>
        <button class="secondary block" data-action="dm-template">Zapisz jako gotowy trening</button>
        <button class="secondary block" data-action="dm-move">Przenieś na inny dzień</button>
        <button class="danger block" data-action="dm-delete">Usuń trening</button>`;
    } else if (st.view === 'export') {
      body.innerHTML = `${sheetHeader('Eksportuj trening', 'dm-menu')}
        <p class="muted center">${h(longDate(date))} · ${summary}</p>
        <button class="primary block" data-action="dm-export-full">Z wynikami (serie, ciężary)</button>
        <button class="secondary block" data-action="dm-export-list">Tylko lista ćwiczeń</button>
        <p class="muted small">Plik z wynikami da się wczytać z powrotem (Ustawienia → Wczytaj trening).
          Sama lista to plan do wysłania komuś - bez serii.</p>`;
    } else if (st.view === 'delete') {
      body.innerHTML = `${sheetHeader('Usunąć trening?', 'dm-menu')}
        <p>Trening z <strong>${h(longDate(date))}</strong> (${summary}) zostanie usunięty.</p>
        <button class="danger block" data-action="dm-delete-yes">Usuń trening</button>
        <button class="secondary block" data-action="dm-menu">Anuluj</button>`;
    } else {
      const grid = monthGrid(st.month, { action: 'dm-pick', selected: st.target, disabled: (key) => key === date });
      const there = st.target ? store.getDay(st.target).length : 0;
      body.innerHTML = `${sheetHeader('Przenieś trening', 'dm-menu')}
        <p class="muted center">Z: <strong>${h(longDate(date))}</strong></p>
        ${monthHead(st.month, 'dm-prev', 'dm-next')}
        ${grid.html}
        ${st.target ? `<p class="center">Na: <strong>${h(longDate(st.target))}</strong></p>
          ${there ? `<p class="warning">Ten dzień ma już trening (${plural(there, FORMS.exercise)}) - przeniesione ćwiczenia zostaną dopisane.</p>` : ''}
          <button class="primary block" data-action="dm-move-yes">Przenieś</button>`
        : '<p class="muted center">Wybierz dzień docelowy.</p>'}`;
    }
  };

  sheetEl.onclick = (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;
    const a = btn.dataset.action;
    if (a === 'dm-template') {
      templateNameForm({ date });
    } else if (a === 'dm-export-full') {
      shareFile(formatWorkouts(store.exportDays([date])), `trening-${date}.txt`);
    } else if (a === 'dm-export-list') {
      shareFile(formatExerciseList(store.exportDays([date])), `cwiczenia-${date}.txt`, 'text/plain', 'Lista ćwiczeń');
    } else if (a === 'dm-menu' || a === 'dm-delete' || a === 'dm-move' || a === 'dm-export') {
      st.view = { 'dm-menu': 'menu', 'dm-delete': 'delete', 'dm-move': 'move', 'dm-export': 'export' }[a];
      draw();
    } else if (a === 'dm-prev' || a === 'dm-next') {
      st.month = shiftMonth(st.month, a === 'dm-next' ? 1 : -1);
      draw();
    } else if (a === 'dm-pick') {
      st.target = btn.dataset.date;
      draw();
      body.querySelector('[data-action=dm-move-yes]')?.scrollIntoView({ block: 'nearest' });
    } else if (a === 'dm-delete-yes') {
      const before = store.snapshotDays([date]);
      store.deleteDay(date);
      closeSheet();
      render();
      toast(`Usunięto trening z ${shortDate(date)}`, {
        action: 'Cofnij',
        onAction: () => { store.replaceDays(before); render(); toast('Przywrócono trening'); },
      });
    } else if (a === 'dm-move-yes') {
      const to = st.target;
      const before = store.snapshotDays([date, to]);
      store.moveDay(date, to);
      ui.calSel = to;
      ui.month = to.slice(0, 7);
      closeSheet();
      render();
      toast(`Przeniesiono trening na ${shortDate(to)}`, {
        action: 'Cofnij',
        onAction: () => {
          store.replaceDays(before);
          ui.calSel = date;
          ui.month = date.slice(0, 7);
          render();
          toast('Cofnięto przeniesienie');
        },
      });
    }
  };
  draw();
}

// Na oglądany dzień (ui.date). Wybór dnia z treningiem, potem ćwiczeń z tego dnia.
export function copyFromCalendar() {
  const target = ui.date;
  const sources = store.datesWithWorkouts().filter((d) => d !== target);
  if (!sources.length) return toast('Nie ma jeszcze żadnego treningu do skopiowania.');
  const before = sources.filter((d) => d < target);
  // unchecked: odznaczone ćwiczenia wybranego dnia - przeżywają zmianę miesiąca, nie zmianę dnia.
  const st = { month: (before[before.length - 1] || sources[sources.length - 1]).slice(0, 7), from: null, unchecked: new Set() };
  openSheet('');
  const body = sheetEl.querySelector('.sheet-body');

  const draw = () => {
    const grid = monthGrid(st.month, {
      action: 'copy-pick',
      selected: st.from,
      disabled: (key, entries) => !entries.length || key === target,
    });
    const entries = st.from ? store.getDay(st.from) : [];
    const picked = entries.filter((e) => !st.unchecked.has(e.id)).length;
    body.innerHTML = `${sheetHeader('Kopiuj z kalendarza')}
      <p class="muted center">Skopiuj na: <strong>${h(longDate(target))}</strong></p>
      ${monthHead(st.month, 'copy-prev-month', 'copy-next-month')}
      ${grid.html}
      ${st.from ? `
        <h3>${h(longDate(st.from))}</h3>
        <ul class="copy-list">${entries.map((e) => {
          const ex = store.getExercise(e.exerciseId);
          return ex ? `<li><label><input type="checkbox" value="${e.id}" ${st.unchecked.has(e.id) ? '' : 'checked'}>
            <span>${catDot(ex.category)} <strong>${h(ex.name)}</strong><br>
            <small class="muted">${e.sets.map((s) => h(formatSet(s, ex.type))).join(', ')}</small></span></label></li>` : '';
        }).join('')}</ul>
        <p class="muted small">Ćwiczenia zostaną dopisane do ${target === todayKey() ? 'dzisiejszego treningu' : 'treningu z tego dnia'} - nic nie zostanie nadpisane. Serie możesz potem zmienić.</p>
        <button class="primary block" data-action="do-copy" ${picked ? '' : 'disabled'}>Kopiuj (${picked})</button>`
        : '<p class="muted center">Wybierz dzień z treningiem (oznaczony kropkami).</p>'}`;
  };

  sheetEl.onclick = (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;
    const a = btn.dataset.action;
    if (a === 'copy-prev-month' || a === 'copy-next-month') {
      st.month = shiftMonth(st.month, a === 'copy-next-month' ? 1 : -1);
      draw();
    } else if (a === 'copy-pick') {
      if (st.from !== btn.dataset.date) st.unchecked.clear();
      st.from = btn.dataset.date;
      draw();
      body.querySelector('.copy-list')?.scrollIntoView({ block: 'nearest' });
    } else if (a === 'do-copy') {
      const ids = [...body.querySelectorAll('.copy-list input:checked')].map((i) => i.value);
      const n = store.copyDay(st.from, target, ids);
      closeSheet();
      toast(`Skopiowano ${plural(n, FORMS.exercise)} z ${shortDate(st.from)}`);
      render();
    }
  };
  // Licznik na przycisku nadąża za zaznaczeniem; nic nie zaznaczone = nie ma czego kopiować.
  body.addEventListener('change', (ev) => {
    if (ev.target.checked) st.unchecked.delete(ev.target.value); else st.unchecked.add(ev.target.value);
    const btn = body.querySelector('[data-action=do-copy]');
    const n = body.querySelectorAll('.copy-list input:checked').length;
    if (btn) { btn.textContent = `Kopiuj (${n})`; btn.disabled = !n; }
  });
  draw();
}
