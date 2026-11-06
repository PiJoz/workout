// Jednostki. Dane są ZAWSZE zapisane w kg i km (także w plikach .txt), a przeliczane
// tylko do wyświetlenia i z pola edycji. Dzięki temu zmiana ustawienia nie zmienia danych.

export const KG_PER_LB = 0.45359237;
export const KM_PER_MI = 1.609344;

export const DEFAULT_UNITS = { weight: 'kg', distance: 'km' };

// Krok przycisków −/+ przy ciężarze: najmniejsza typowa para talerzy.
export const WEIGHT_STEP = { kg: 2.5, lb: 5 };

// dim: 'weight' (kg), 'distance' (km), 'pace' (s/km), 'speed' (km/h); reszta bez zmian.
function factor(dim, units) {
  switch (dim) {
    case 'weight': return units.weight === 'lb' ? 1 / KG_PER_LB : 1;
    case 'distance': return units.distance === 'mi' ? 1 / KM_PER_MI : 1;
    case 'pace': return units.distance === 'mi' ? KM_PER_MI : 1;
    case 'speed': return units.distance === 'mi' ? 1 / KM_PER_MI : 1;
    default: return 1;
  }
}

export function toDisplay(value, dim, units = DEFAULT_UNITS) {
  if (value === null || value === undefined) return value;
  return value * factor(dim, units);
}

export function fromDisplay(value, dim, units = DEFAULT_UNITS) {
  if (value === null || value === undefined) return value;
  return value / factor(dim, units);
}

export function unitsFromSettings(settings) {
  return { weight: settings.weightUnit, distance: settings.distanceUnit };
}
