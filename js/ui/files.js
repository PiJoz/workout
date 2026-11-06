// Pliki: udostępnianie, zapis w Pobranych (most Androida albo pobranie), wczytywanie .txt.

import { categoryById, TYPES } from '../data.js';
import * as store from '../store.js';
import { parseWorkouts } from '../txt.js';
import { escapeHtml as h, FORMS, longDate, plural, shortDate } from '../util.js';
import { $, catDot, closeSheet, go, openSheet, render, sheetEl, sheetHeader, toast, ui } from '../ui/core.js';

// Aplikacja Android (APK, android/): WebView nie ma Web Share, pobierania plików ani pewnego
// schowka - robi to Android przez ten most. W przeglądarce go nie ma.
export const native = window.WorkoutAndroid;

// Udostępnianie pliku: systemowe "Udostępnij" (telefon), pobranie albo kopiowanie tekstu.
export function shareFile(text, filename, mime = 'text/plain', title = 'Udostępnij trening') {
  const file = () => new File([text], filename, { type: mime });
  const canShareFile = (() => {
    try { return navigator.canShare && navigator.canShare({ files: [file()] }); }
    catch { return false; }
  })();
  openSheet(`${sheetHeader(title)}
    <pre class="txt-preview">${h(text.replace(/^﻿/, ''))}</pre>
    ${navigator.share || native ? '<button class="primary block" data-action="do-share">Udostępnij…</button>' : ''}
    <div class="row">
      <button class="secondary" data-action="do-download">Pobierz ${h(filename)}</button>
      <button class="secondary" data-action="do-copy">Kopiuj tekst</button>
    </div>`);
  sheetEl.onclick = async (ev) => {
    const a = ev.target.closest('[data-action]')?.dataset.action;
    if (native && a === 'do-share') {
      if (!native.share(filename, mime, text)) toast('Nie udało się udostępnić');
    } else if (native && a === 'do-download') {
      toast(native.save(filename, mime, text) ? `Zapisano w Pobranych: ${filename}` : 'Nie udało się zapisać pliku');
    } else if (native && a === 'do-copy') {
      toast(native.copy(text.replace(/^﻿/, '')) ? 'Skopiowano do schowka' : 'Nie udało się skopiować');
    } else if (a === 'do-share') {
      try {
        if (canShareFile) await navigator.share({ files: [file()], title: filename });
        else await navigator.share({ title: filename, text });
      } catch (e) {
        if (e.name !== 'AbortError') toast('Nie udało się udostępnić: ' + e.message);
      }
    } else if (a === 'do-download') {
      downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
    } else if (a === 'do-copy') {
      try {
        await navigator.clipboard.writeText(text.replace(/^﻿/, ''));
        toast('Skopiowano do schowka');
      } catch {
        toast('Nie udało się skopiować');
      }
    }
  };
}

// Pobranie pliku w przeglądarce (w APK robi to native.save / native.saveBase64).
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Plik binarny do Pobranych; false = nie zapisano. Most Androida przenosi tylko tekst - stąd base64.
export function saveBinary(bytes, filename) {
  if (!native) {
    downloadBlob(new Blob([bytes], { type: 'application/octet-stream' }), filename);
    return true;
  }
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return Boolean(native.saveBase64?.(filename, 'application/octet-stream', btoa(bin)));
}

export function startImport(target) {
  ui.importTarget = target;
  const input = $('#file-input');
  input.value = '';
  input.click();
}

export async function onFileChosen(file) {
  let text;
  try {
    text = await file.text();
  } catch (e) {
    return toast('Nie udało się odczytać pliku: ' + e.message);
  }
  const parsed = parseWorkouts(text);
  const { days, warnings } = parsed;
  const count = days.reduce((n, d) => n + d.entries.length, 0);
  const missing = store.missingExercises(parsed);
  const warn = warnings.length
    ? `<details class="warnings"><summary>Uwagi (${warnings.length})</summary><ul>${warnings.map((w) => `<li>${h(w)}</li>`).join('')}</ul></details>` : '';
  const newList = missing.length
    ? `<p><strong>Nowe ćwiczenia (${missing.length})</strong> - zostaną dodane do aplikacji:</p>
       <ul class="import-summary">${missing.map((e) => `<li>${catDot(e.category)} ${h(e.name)} <span class="muted">- ${h(categoryById(e.category).name)}, ${h(TYPES[e.type].name)}</span></li>`).join('')}</ul>` : '';
  if (!count && parsed.exercises.length) {
    // Plik z samymi definicjami ćwiczeń.
    openSheet(`${sheetHeader('Wczytaj ćwiczenia')}
      <p>Plik <strong>${h(file.name)}</strong> nie zawiera treningów, tylko własne ćwiczenia (${parsed.exercises.length}).</p>
      ${newList || '<p class="muted">Wszystkie są już w aplikacji.</p>'}${warn}
      ${missing.length ? `<button class="primary block" data-action="do-import">Dodaj ćwiczenia (${missing.length})</button>` : ''}`);
    sheetEl.onclick = (ev) => {
      if (!ev.target.closest('[data-action=do-import]')) return;
      const res = store.importDays(parsed, ui.date);
      closeSheet();
      toast(`Dodano ${res.created.length} ćw.: ${res.created.map((e) => e.name).join(', ')}`);
      render();
    };
    return;
  }
  if (!count) {
    return openSheet(`${sheetHeader('Wczytaj trening')}
      <p>W pliku <strong>${h(file.name)}</strong> nie znaleziono żadnych ćwiczeń.</p>
      <p class="muted">Oczekiwany format: linie „Data: RRRR-MM-DD”, „[Partia] Nazwa ćwiczenia” i ponumerowane serie, np. „1. 80 kg × 10”.</p>${warn}`);
  }

  // Pełna kopia ("Eksportuj wszystko") niesie też gotowe treningi i znaczniki Garmina.
  const known = new Set(store.templates().map((t) => t.name.toLowerCase()));
  const newTemplates = parsed.templates.filter((t) => !known.has(t.name.toLowerCase()));
  const extras = [
    parsed.templates.length ? `Gotowe treningi: ${parsed.templates.length}${newTemplates.length < parsed.templates.length
      ? ` (nowe: ${newTemplates.length}, z tą samą nazwą zostaną pominięte)` : ''}` : '',
    parsed.garmin.length ? `Znaczniki wysłania do Garmin Connect: ${parsed.garmin.length}` : '',
  ].filter(Boolean);
  const dated = days.filter((d) => d.date).map((d) => d.date);
  const undated = days.some((d) => !d.date);
  const summary = days.map((d) => `<li><strong>${d.date ? h(longDate(d.date)) : 'bez daty'}</strong>: ${d.entries.map((e) => h(e.exercise.name)).join(', ')}</li>`).join('');
  let buttons;
  if (ui.importTarget === 'day' && days.length === 1) {
    // Jeden trening: najpierw na wybrany dzień (o to prosi przycisk), albo na datę z pliku.
    const own = dated[0];
    buttons = own && own !== ui.date
      ? `<button class="primary block" data-action="do-import" data-mode="force">Wczytaj na ${h(shortDate(ui.date))} (wybrany dzień)</button>
         <button class="secondary block" data-action="do-import" data-mode="own">Wczytaj na ${h(shortDate(own))} (data z pliku)</button>`
      : `<button class="primary block" data-action="do-import" data-mode="own">Wczytaj na ${h(shortDate(ui.date))}</button>`;
  } else {
    buttons = `<button class="primary block" data-action="do-import" data-mode="own">Wczytaj (${count} ćw.)</button>`;
  }
  openSheet(`${sheetHeader('Wczytaj trening')}
    <p>Plik <strong>${h(file.name)}</strong>: ${plural(count, FORMS.exercise)} w ${days.length} ${days.length === 1 ? 'dniu' : 'dniach'}.</p>
    ${newList}
    ${days.length > 3
      ? `<details><summary>Treningi (${days.length} dni)</summary><ul class="import-summary">${summary}</ul></details>`
      : `<ul class="import-summary">${summary}</ul>`}
    ${undated ? `<p class="muted">Ćwiczenia bez daty trafią na ${h(shortDate(ui.date))}.</p>` : ''}
    ${extras.length ? `<p>${extras.join('<br>')}</p>` : ''}
    <p class="muted">Treningi zostaną dopisane do istniejących - nic nie zostanie nadpisane.</p>
    ${warn}${buttons}`);
  sheetEl.onclick = (ev) => {
    const btn = ev.target.closest('[data-action=do-import]');
    if (!btn) return;
    const res = store.importDays(parsed, ui.date, btn.dataset.mode === 'force');
    closeSheet();
    if (res.dates.length === 1) ui.date = res.dates[0];
    // Lista nowych nazw była w podglądzie; przy wielu w komunikacie wystarczy liczba.
    const added = res.created.length > 3
      ? ` · ${plural(res.created.length, ['nowe ćwiczenie', 'nowe ćwiczenia', 'nowych ćwiczeń'])} w spisie`
      : res.created.length ? ` · dodano nowe: ${res.created.map((e) => e.name).join(', ')}` : '';
    const tpl = res.templates ? ` · ${plural(res.templates, ['gotowy trening', 'gotowe treningi', 'gotowych treningów'])}` : '';
    toast(`Wczytano ${plural(res.entries, FORMS.exercise)} z ${res.dates.length} ${res.dates.length === 1 ? 'dnia' : 'dni'}${added}${tpl}`);
    go(res.dates.length === 1 ? 'day' : ui.view);
  };
}
