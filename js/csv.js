// Eksport do arkusza kalkulacyjnego. Jedna seria = jeden wiersz.
// Pod polskiego Excela: średnik jako separator, przecinek dziesiętny, BOM (inaczej
// "ć" wychodzi jako krzaki) i CRLF. Czas zawsze h:mm:ss - "25:30" Excel czyta jako 25 godzin.

import { TYPES, categoryById } from './data.js';
import { formatNum } from './util.js';
import { toDisplay } from './units.js';

function hms(sec) {
  if (sec === null || sec === undefined) return '';
  sec = Math.round(sec);
  const pad = (n) => String(n).padStart(2, '0');
  return `${Math.floor(sec / 3600)}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;
}

// Tekst z pliku od kogoś trafia do komórki: "=..." Excel wykonałby jako formułę.
function cell(text) {
  let s = String(text ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\r\n]/.test(s) || s.startsWith("'") ? `"${s.replace(/"/g, '""')}"` : s;
}

// days: [{ date, entries: [{ exercise: {name, category, type}, sets }] }]
export function formatCsv(days, units) {
  const rows = [[
    'Data', 'Partia', 'Ćwiczenie', 'Typ', 'Seria',
    `Ciężar (${units.weight})`, 'Powtórzenia', `Dystans (${units.distance})`, 'Czas',
  ].join(';')];
  for (const day of days) {
    for (const e of day.entries) {
      const cat = categoryById(e.exercise.category);
      e.sets.forEach((s, i) => {
        rows.push([
          day.date,
          cell(cat ? cat.name : e.exercise.category),
          cell(e.exercise.name),
          cell(TYPES[e.exercise.type].name),
          i + 1,
          formatNum(toDisplay(s.weight, 'weight', units)),
          s.reps ?? '',
          formatNum(toDisplay(s.distance, 'distance', units)),
          hms(s.time),
        ].join(';'));
      });
    }
  }
  return '﻿' + rows.join('\r\n') + '\r\n';
}
