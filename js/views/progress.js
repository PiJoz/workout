// Zakładka "Postęp": wykresy i historia ćwiczenia.

import { barChart, hBarChart, lineChart } from '../charts.js';
import { CATEGORIES, categoryById } from '../data.js';
import { filterRange, METRICS, metricView, RANGES, series } from '../stats.js';
import * as store from '../store.js';
import { addDays, dateKey, escapeHtml as h, parseKey, shortDate, todayKey } from '../util.js';
import { $, formatSet, ui, units, viewEl } from '../ui/core.js';
import { seg } from '../views/settings.js';

export function weekStart(key) {
  const d = parseKey(key);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dateKey(d);
}

export function renderProgress() {
  const dates = store.datesWithWorkouts();
  const today = todayKey();

  // Treningi w tygodniu, ostatnie 12 tygodni.
  const thisWeek = weekStart(today);
  const weeks = Array.from({ length: 12 }, (_, i) => addDays(thisWeek, -7 * (11 - i)));
  const perWeek = weeks.map((w) => ({
    label: shortDate(w),
    value: dates.filter((d) => d >= w && d < addDays(w, 7)).length,
  }));

  // Partie w ostatnich 30 dniach (liczba ćwiczeń).
  const since = addDays(today, -29);
  const perCat = CATEGORIES.map((c) => ({
    label: c.name,
    color: c.color,
    value: dates.filter((d) => d >= since && d <= today)
      .reduce((n, d) => n + store.getDay(d).filter((e) => store.getExercise(e.exerciseId)?.category === c.id).length, 0),
  }));

  const used = store.allExercises().filter((e) => store.usageCount(e.id));
  if (!used.some((e) => e.id === ui.progressExercise)) {
    // Domyślnie ostatnio trenowane ćwiczenie, nie pierwsze alfabetycznie.
    const lastDay = store.getDay(dates[dates.length - 1] || '');
    ui.progressExercise = lastDay[0]?.exerciseId || used[0]?.id || null;
  }

  viewEl.innerHTML = `
    <h1>Postęp</h1>
    ${dates.length ? '' : '<p class="empty">Zapisz pierwszy trening, a pojawią się tu wykresy.</p>'}
    <section class="card">
      <h2>Wybierz ćwiczenie</h2>
      ${used.length ? `<select id="progress-ex">
        ${CATEGORIES.map((c) => {
          const list = used.filter((e) => e.category === c.id);
          return list.length ? `<optgroup label="${h(c.name)}">${list.map((e) => `<option value="${e.id}" ${e.id === ui.progressExercise ? 'selected' : ''}>${h(e.name)}</option>`).join('')}</optgroup>` : '';
        }).join('')}
      </select><div id="progress-ex-body"></div>` : '<p class="muted">Brak zapisanych ćwiczeń.</p>'}
    </section>
    <section class="card">
      <h2>Dni treningowe w tygodniu</h2>
      ${barChart(perWeek, { fmt: (v) => String(v), integer: true })}
      <p class="muted small">Ostatnie 12 tygodni, podpis = poniedziałek.</p>
    </section>
    <section class="card">
      <h2>Partie - ostatnie 30 dni</h2>
      ${hBarChart(perCat, { fmt: (v) => String(v) })}
      <p class="muted small">Liczba ćwiczeń na partię.</p>
    </section>`;

  if (used.length) {
    $('#progress-ex').addEventListener('change', (ev) => {
      ui.progressExercise = ev.target.value;
      ui.progressMetric = null;
      renderExerciseProgress();
    });
    renderExerciseProgress();
  }
}

export function renderExerciseProgress() {
  const ex = store.getExercise(ui.progressExercise);
  const metrics = METRICS[ex.type];
  const metric = metrics.find((m) => m.id === ui.progressMetric) || metrics[0];
  ui.progressMetric = metric.id;
  const view = metricView(metric, units());
  const range = store.getSettings().chartRange;
  const hist = store.history(ex.id);
  const all = series(hist, metric).map((p) => ({ ...p, value: view.convert(p.value) }));
  const pts = filterRange(all, range, todayKey());
  const better = (a, b) => (metric.lowerIsBetter ? b.value < a.value : b.value > a.value);
  // Rekord jest z całej historii; zmiana i liczba treningów - z wybranego okresu.
  const best = all.length ? all.reduce((a, b) => (better(a, b) ? b : a)) : null;
  const last = all[all.length - 1];
  const firstP = pts[0];
  const lastP = pts[pts.length - 1];
  const change = pts.length > 1 ? lastP.value - firstP.value : null;
  const color = categoryById(ex.category).color;
  const rangeName = RANGES.find((r) => r.id === range).name.toLowerCase();

  $('#progress-ex-body').innerHTML = `
    <div class="chips metrics">${metrics.map((m) => `<button class="chip ${m.id === metric.id ? 'active' : ''}" data-action="metric" data-id="${m.id}">${h(metricView(m, units()).name)}</button>`).join('')}</div>
    <div class="seg range" role="group" aria-label="Zakres czasu">${RANGES.map((r) => `<button class="${r.id === range ? 'active' : ''}" data-action="range" data-id="${r.id}">${h(r.name)}</button>`).join('')}</div>
    ${pts.length ? lineChart(pts, { fmt: view.fmt, axis: view.axis, steps: view.steps, color }) : '<p class="empty">Brak treningów w wybranym okresie.</p>'}
    <div class="stats">
      <div><small>Rekord</small><strong>${best ? h(view.fmt(best.value)) : '-'}</strong>${best ? `<small>${shortDate(best.date)}</small>` : ''}</div>
      <div><small>Ostatnio</small><strong>${last ? h(view.fmt(last.value)) : '-'}</strong>${last ? `<small>${shortDate(last.date)}</small>` : ''}</div>
      <div><small>Zmiana</small><strong>${change === null ? '-' : `${change > 0 ? '+' : change < 0 ? '−' : ''}${h(view.fmt(Math.abs(change)))}`}</strong><small>${firstP ? `od ${shortDate(firstP.date)}` : rangeName}</small></div>
      <div><small>Treningi</small><strong>${pts.length}</strong><small>${h(rangeName)}</small></div>
    </div>
    <h3>Historia</h3>
    <ul class="history">
      ${hist.slice(-10).reverse().map(({ date, entry }) => `<li><button class="link" data-action="goto-day" data-date="${date}">${shortDate(date)}</button>
        ${entry.sets.map((s) => h(formatSet(s, ex.type))).join(', ')}</li>`).join('')}
    </ul>`;
}
