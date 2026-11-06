// Przytrzymanie: karta ćwiczenia (przesuwanie albo menu), dzień w kalendarzu (akcje).

import * as store from '../store.js';
import { escapeHtml as h } from '../util.js';
import { render, ui, viewEl } from '../ui/core.js';
import { dayActions } from '../views/calendar.js';
import { entryActions } from '../views/day.js';

// Przytrzymanie palca (albo przycisku myszy) przez HOLD_MS bez ruszania. Ruch przed upływem
// HOLD_MS to zwykłe przewijanie (przeglądarka zgłasza wtedy pointercancel albo ruch > HOLD_SLOP).
export const HOLD_MS = 400;
export const HOLD_SLOP = 10; // tyle px palec może drgnąć w trakcie przytrzymania
export let swallowClick = false;

export function watchHold(el, ev, onHold) {
  const x0 = ev.clientX;
  const y0 = ev.clientY;
  let y = y0;
  let timer = 0;
  const stop = () => {
    clearTimeout(timer);
    el.removeEventListener('pointermove', watch);
    el.removeEventListener('pointerup', stop);
    el.removeEventListener('pointercancel', stop);
  };
  const watch = (e) => {
    y = e.clientY;
    if (Math.hypot(e.clientX - x0, e.clientY - y0) > HOLD_SLOP) stop();
  };
  timer = setTimeout(() => { stop(); onHold(y); }, HOLD_MS);
  el.addEventListener('pointermove', watch);
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
}

// Puszczenie palca po przytrzymaniu daje jeszcze "click" - nie może wybrać ani otworzyć dnia.
export function swallowClickAfterRelease() {
  const up = () => {
    swallowClick = true;
    setTimeout(() => { swallowClick = false; }, 300);
  };
  window.addEventListener('pointerup', up, { once: true, capture: true });
  window.addEventListener('pointercancel', () => window.removeEventListener('pointerup', up, true), { once: true, capture: true });
}

viewEl.addEventListener('pointerdown', (ev) => {
  if (ev.button > 0) return;
  if (ui.view === 'day') {
    // Karta ćwiczenia: przytrzymaj i przeciągnij - zmiana kolejności (startDrag); przytrzymaj i puść
    // bez ruchu - menu z zamianą na inne ćwiczenie (entryActions). Jedno ćwiczenie - od razu menu.
    const card = ev.target.closest('.entry');
    if (!card || ev.target.closest('.guide-btn')) return;
    if (viewEl.querySelectorAll('.entry').length >= 2) watchHold(card, ev, (y) => startDrag(card, ev.pointerId, y));
    else {
      watchHold(card, ev, () => {
        navigator.vibrate?.(25);
        swallowClickAfterRelease();
        entryActions(card.dataset.id);
      });
    }
  } else if (ui.view === 'calendar') {
    // Dzień z treningiem: przytrzymaj, żeby przenieść albo usunąć trening (dayActions).
    const cell = ev.target.closest('.cal-cell.has[data-date]');
    if (cell) {
      watchHold(cell, ev, () => {
        navigator.vibrate?.(25);
        swallowClickAfterRelease();
        dayActions(cell.dataset.date);
      });
    }
  }
});

// Przytrzymanie na Androidzie otwiera menu kontekstowe / zaznacza tekst - tu nie.
viewEl.addEventListener('contextmenu', (ev) => {
  if (ev.target.closest('.entry, .cal-cell')) ev.preventDefault();
});

// Puszczenie przycisku myszy po przeciągnięciu to też "click" - nie może otworzyć edycji.
document.addEventListener('click', (ev) => {
  if (!swallowClick) return;
  swallowClick = false;
  ev.stopPropagation();
  ev.preventDefault();
}, true);

// Podczas przeciągania palec nie może przewijać strony (przewija ją tick() przy krawędzi).
export const blockTouchScroll = (ev) => { if (ev.cancelable) ev.preventDefault(); };

export function startDrag(card, pointerId, pointerY) {
  const cards = [...viewEl.querySelectorAll('.entry')];
  const from = cards.indexOf(card);
  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  const rects = cards.map((c) => ({ top: docTop(c), h: c.offsetHeight }));
  const gap = rects[1].top - rects[0].top - rects[0].h;
  const shift = rects[from].h + gap;
  const startY = pointerY + window.scrollY;
  const fingerY0 = pointerY;
  let moved = false; // palec ruszył się po podniesieniu karty - inaczej puszczenie otwiera menu
  let to = from;
  let raf = 0;

  try { card.setPointerCapture(pointerId); } catch { /* ruchy i tak trafiają do karty */ }
  card.classList.add('dragging');
  document.body.classList.add('drag-active');
  document.addEventListener('touchmove', blockTouchScroll, { passive: false });
  navigator.vibrate?.(25); // Android: krótkie "tyk", że karta jest podniesiona

  const layout = () => {
    const dy = pointerY + window.scrollY - startY;
    card.style.transform = `translateY(${dy}px) scale(1.02)`;
    const center = rects[from].top + rects[from].h / 2 + dy;
    to = rects.filter((r, k) => k !== from && r.top + r.h / 2 < center).length;
    cards.forEach((c, k) => {
      if (k === from) return;
      const off = from < to && k > from && k <= to ? -shift : to < from && k >= to && k < from ? shift : 0;
      c.style.transform = off ? `translateY(${off}px)` : '';
    });
  };
  // Przewijanie przy górnej krawędzi i nad dolnym menu - inaczej długiej listy nie przeciągniesz.
  const tick = () => {
    const edge = 70;
    const bottom = window.innerHeight - document.querySelector('nav').offsetHeight;
    const v = pointerY > bottom - edge ? (pointerY - bottom + edge) / 4 : pointerY < edge ? -(edge - pointerY) / 4 : 0;
    if (v) {
      const before = window.scrollY;
      window.scrollBy(0, v);
      if (window.scrollY !== before) layout();
    }
    raf = requestAnimationFrame(tick);
  };
  const move = (e) => {
    pointerY = e.clientY;
    if (Math.abs(pointerY - fingerY0) > HOLD_SLOP) moved = true;
    layout();
  };
  const end = (e) => {
    cancelAnimationFrame(raf);
    card.removeEventListener('pointermove', move);
    card.removeEventListener('pointerup', end);
    card.removeEventListener('pointercancel', end);
    document.removeEventListener('touchmove', blockTouchScroll);
    document.body.classList.remove('drag-active');
    if (e.type === 'pointerup') {
      swallowClick = true;
      setTimeout(() => { swallowClick = false; }, 300); // dotyk po przytrzymaniu nie zawsze daje click
    }
    if (e.type === 'pointerup' && to !== from) {
      store.moveEntryTo(ui.date, card.dataset.id, to);
      render();
    } else {
      cards.forEach((c) => { c.style.transform = ''; });
      card.classList.remove('dragging');
      if (e.type === 'pointerup' && !moved) entryActions(card.dataset.id);
    }
  };
  card.addEventListener('pointermove', move);
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
  layout();
  raf = requestAnimationFrame(tick);
}
