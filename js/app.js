// Start aplikacji: ekrany, obsługa przycisków (data-action) i zdarzeń okna. Kod ekranów jest
// w js/views/, wspólne części w js/ui/ - patrz README, „Struktura”.

import { formatCsv } from './csv.js';
import { CATEGORIES } from './data.js';
import * as store from './store.js';
import { formatWorkouts } from './txt.js';
import { addDays, todayKey } from './util.js';
import { $, applyTheme, closeSheet, go, registerViews, render, sheetEl, toast, ui, units } from './ui/core.js';
import { exportDaySheet, onFileChosen, shareFile, startImport } from './ui/files.js';
import { copyFromCalendar, renderCalendar, shiftMonth } from './views/calendar.js';
import { editEntry, pickCategory, pickExercise, renderDay } from './views/day.js';
import { customForm, pickType, renderExercises } from './views/exercises.js';
import { showGuide } from './views/guide.js';
import { renderExerciseProgress, renderProgress } from './views/progress.js';
import { garminExport, garminMarkAll, renderSettings, showPrivacy } from './views/settings.js';
import { pickTemplate, templateSheet } from './views/templates.js';
import './ui/hold.js'; // obsługa przytrzymania (tylko zdarzenia, bez eksportów używanych tutaj)

registerViews({
  day: renderDay, calendar: renderCalendar, progress: renderProgress,
  exercises: renderExercises, settings: renderSettings,
});

document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action]');
  if (!btn) return;
  const { action } = btn.dataset;
  switch (action) {
    case 'prev-day': ui.date = addDays(ui.date, -1); return render();
    case 'next-day': ui.date = addDays(ui.date, 1); return render();
    case 'add': return pickCategory();
    case 'pick-cat': return pickExercise(btn.dataset.cat);
    case 'tpl-pick': return pickTemplate();
    case 'tpl-open': return templateSheet(btn.dataset.id, btn.dataset.back);
    case 'pick-ex': return editEntry({ exerciseId: btn.dataset.id, sets: [{}], note: '' });
    case 'new-custom': return customForm(btn.dataset.cat, `back-cat:${btn.dataset.cat}`);
    case 'manage-custom': return customForm(CATEGORIES[0].id, 'manage');
    case 'edit': {
      const e = store.getDay(ui.date).find((x) => x.id === btn.dataset.id);
      return e && editEntry(structuredClone(e));
    }
    case 'close-sheet': return closeSheet();
    case 'share-day':
      return shareFile(formatWorkouts(store.exportDays([ui.date])), `trening-${ui.date}.txt`);
    case 'export-all':
      return shareFile(formatWorkouts(store.exportDays(store.datesWithWorkouts()), store.customExercises(),
        { templates: store.exportTemplates(), garmin: store.exportGarmin() }),
        `treningi-${todayKey()}.txt`, 'text/plain', 'Eksport wszystkiego');
    case 'export-csv':
      return shareFile(formatCsv(store.exportDays(store.datesWithWorkouts()), units()),
        `treningi-${todayKey()}.csv`, 'text/csv', 'Eksport do Excela');
    case 'privacy': return showPrivacy();
    case 'garmin-export': return garminExport();
    case 'garmin-mark-all': return garminMarkAll();
    case 'garmin-forget': {
      store.restoreGarminMarks(Object.fromEntries(store.garminStatus().removed.map((d) => [d, null])));
      return render();
    }
    case 'import': return startImport('day');
    case 'import-all': return startImport('all');
    case 'prev-month':
    case 'next-month':
      ui.month = shiftMonth(ui.month, action === 'next-month' ? 1 : -1);
      ui.calSel = null; // nowy miesiąc: podgląd ostatniego treningu w nim
      return render();
    case 'copy-from-cal': return copyFromCalendar();
    case 'export-day': return exportDaySheet(ui.date);
    case 'guide': return showGuide(store.getExercise(btn.dataset.id));
    case 'this-month': ui.month = todayKey().slice(0, 7); ui.calSel = null; return render();
    case 'cal-day':
      // Pierwsze stuknięcie: podgląd pod kalendarzem; drugie w ten sam dzień: otwórz dzień.
      if (ui.calSel !== btn.dataset.date) {
        ui.calSel = btn.dataset.date;
        return render();
      }
      ui.date = btn.dataset.date;
      return go('day');
    case 'goto-day':
      ui.date = btn.dataset.date;
      return go('day');
    case 'metric': ui.progressMetric = btn.dataset.id; return renderExerciseProgress();
    case 'range': store.setSetting('chartRange', btn.dataset.id); return renderExerciseProgress();
    case 'edit-custom': return customForm(null, 'manage', store.getExercise(btn.dataset.id));
    case 'list-change-type':
    case 'change-type': {
      const ex = store.getExercise(btn.dataset.id);
      return pickType(ex, {
        onPick: (v, created) => {
          closeSheet();
          toast(created ? `Dodano do spisu: „${v.name}”` : `„${v.name}” już jest w spisie`);
          (ui.openCats = ui.openCats || new Set()).add(v.category);
          render();
        },
        onBack: () => (action === 'change-type' ? customForm(null, 'manage', ex) : closeSheet()),
      });
    }
    case 'set':
      store.setSetting(btn.dataset.key, btn.dataset.value);
      if (btn.dataset.key === 'theme') applyTheme();
      return render();
    case 'del-custom': {
      const ex = store.getExercise(btn.dataset.id);
      if (!confirm(`Usunąć własne ćwiczenie „${ex.name}”?`)) return;
      try { store.deleteCustomExercise(ex.id); render(); } catch (e) { toast(e.message); }
      return;
    }
    default:
      if (action.startsWith('back-cat:')) return pickExercise(action.slice(9));
      if (action === 'manage') return closeSheet();
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && !sheetEl.hidden) closeSheet();
});

document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.view === 'day') ui.date = todayKey(); // zakładka "Dzień" to zawsze dziś
  go(b.dataset.view);
}));

$('#file-input').addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if (f) onFileChosen(f);
});

window.addEventListener('storage', (ev) => {
  if (store.reloadFromStorage(ev.key)) {
    applyTheme();
    render();
  }
});

// Gdy aplikacja wraca z tła następnego dnia, "dziś" ma być nowym dniem.
let lastToday = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const t = todayKey();
  if (t !== lastToday) {
    if (ui.date === lastToday) ui.date = t;
    lastToday = t;
    render();
  }
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

applyTheme();
go('day');
