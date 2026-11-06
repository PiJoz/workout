// Proste wykresy SVG - bez bibliotek, żeby aplikacja działała offline.

import { escapeHtml, parseKey, shortDate } from './util.js';

// Mała przestrzeń współrzędnych: na telefonie (~340 px) tekst 13 px wychodzi
// na ~11 px. Przy 640 px opis osi miał ~6 px i był nieczytelny.
const W = 400;
const H = 230;
const PAD = { l: 58, r: 10, t: 12, b: 30 }; // l: mieści "1:02:03"
const CHAR_W = 7.2; // przybliżona szerokość znaku przy font-size 13

// Kroki osi czasu w sekundach - "co 50 s" (0:50, 1:40) jest poprawne, ale nieczytelne.
export const TIME_STEPS = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200];

function niceTicks(min, maxV, count = 4, integer = false, steps = null) {
  if (min === maxV) {
    min = min > 0 ? 0 : min - 1;
    maxV = maxV + (maxV ? Math.abs(maxV) * 0.1 : 1);
  }
  const raw = (maxV - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  let step = steps
    ? steps.find((s) => s >= raw) || steps[steps.length - 1]
    : [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  if (integer) step = Math.max(1, Math.ceil(step)); // liczba dni to nie 0,5
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(maxV / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

const dayNo = (key) => Math.round(parseKey(key).getTime() / 86400000);

// points: [{date, value}] posortowane po dacie.
// Oś X jest proporcjonalna do czasu: przerwa w treningach widać jako przerwę.
export function lineChart(points, { fmt = String, axis = fmt, steps = null, color = 'var(--accent)' } = {}) {
  if (!points.length) return '<p class="empty">Brak danych do wykresu.</p>';
  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values), 4, false, steps);
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const d0 = dayNo(points[0].date);
  const span = dayNo(points[points.length - 1].date) - d0;
  const x = (i) => PAD.l + (span === 0 ? iw / 2 : ((dayNo(points[i].date) - d0) / span) * iw);
  const y = (v) => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih;

  const grid = ticks
    .map((t) => `<line class="grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(t)}" y2="${y(t)}"/>
      <text class="axis" x="${PAD.l - 8}" y="${y(t) + 4}" text-anchor="end">${escapeHtml(axis(t))}</text>`)
    .join('');

  // Podpisy od najnowszego wstecz; kolejny tylko, gdy jest dość miejsca od poprzedniego.
  // Najnowszy jest wyrównany do prawej, więc zajmuje miejsce na lewo od swojego punktu.
  // Szerokość z długości podpisu - data z innego roku ("25.09.25") jest dłuższa niż "25.09".
  const labels = [];
  let leftEdge = Infinity;
  for (let i = points.length - 1; i >= 0; i--) {
    const text = shortDate(points[i].date);
    const w = text.length * CHAR_W + 6;
    const last = i === points.length - 1 && span > 0;
    const right = last ? x(i) : x(i) + w / 2;
    if (right > leftEdge - 4) continue;
    labels.push(`<text class="axis" x="${x(i)}" y="${H - 12}" text-anchor="${last ? 'end' : 'middle'}">${text}</text>`);
    leftEdge = right - w;
  }

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${path} L${x(points.length - 1).toFixed(1)},${PAD.t + ih} L${x(0).toFixed(1)},${PAD.t + ih} Z`;
  const dots = points
    .map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="4" fill="${color}">
      <title>${shortDate(p.date)}: ${escapeHtml(fmt(p.value))}</title></circle>`)
    .join('');

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMid meet">
    ${grid}
    <path d="${area}" fill="${color}" opacity="0.12"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}${labels.join('')}
  </svg>`;
}

// bars: [{label, value, color?}]
export function barChart(bars, { fmt = String, color = 'var(--accent)', integer = false } = {}) {
  if (!bars.length) return '<p class="empty">Brak danych do wykresu.</p>';
  const ticks = niceTicks(0, Math.max(1, ...bars.map((b) => b.value)), 4, integer);
  const hi = ticks[ticks.length - 1];
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const bw = iw / bars.length;
  const y = (v) => PAD.t + ih - (v / hi) * ih;
  const grid = ticks
    .map((t) => `<line class="grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(t)}" y2="${y(t)}"/>
      <text class="axis" x="${PAD.l - 8}" y="${y(t) + 4}" text-anchor="end">${escapeHtml(fmt(t))}</text>`)
    .join('');
  // Co który podpis, żeby się nie nakładały (nazwy partii są dłuższe niż daty).
  const longest = Math.max(...bars.map((b) => b.label.length));
  const every = Math.max(1, Math.ceil(((longest + 1) * CHAR_W) / bw));
  const rects = bars
    .map((b, i) => {
      const bx = PAD.l + i * bw + bw * 0.15;
      const h = (b.value / hi) * ih;
      return `<rect x="${bx}" y="${PAD.t + ih - h}" width="${bw * 0.7}" height="${h}" rx="3" fill="${b.color || color}">
          <title>${escapeHtml(b.label)}: ${escapeHtml(fmt(b.value))}</title></rect>
        ${i % every === 0 ? `<text class="axis" x="${bx + bw * 0.35}" y="${H - 12}" text-anchor="middle">${escapeHtml(b.label)}</text>` : ''}`;
    })
    .join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMid meet">${grid}${rects}</svg>`;
}

// Poziome słupki w HTML - każda etykieta zawsze widoczna, niezależnie od szerokości.
// bars: [{label, value, color?}]
export function hBarChart(bars, { fmt = String, color = 'var(--accent)' } = {}) {
  const top = Math.max(1, ...bars.map((b) => b.value));
  return `<div class="hbars">${bars
    .map((b) => `<div class="hbar"><span class="hbar-label">${escapeHtml(b.label)}</span>
      <span class="hbar-track"><span class="hbar-fill" style="width:${(b.value / top) * 100}%;background:${b.color || color}"></span></span>
      <span class="hbar-value">${escapeHtml(fmt(b.value))}</span></div>`)
    .join('')}</div>`;
}
