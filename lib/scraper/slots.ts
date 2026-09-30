/**
 * Conversion des heures locales meteociel en instants absolus, et découpage en créneaux de 3h
 *
 * Meteociel affiche les heures en heure de Paris : les créneaux de 3h des modèles
 * tombent sur 00Z/03Z/06Z…, soit 01h/04h/07h en hiver et 02h/05h/08h en été.
 * Tout est donc calculé en UTC puis ré-étiqueté en heure de Paris.
 */

import type { RainForecastEntry } from './types';

const TIME_ZONE = 'Europe/Paris';
const HOUR_MS = 3_600_000;
const SLOT_MS = 3 * HOUR_MS;

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  hourCycle: 'h23',
});

const weekdayFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  weekday: 'long',
});

function parisParts(timestamp: number) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(timestamp).map(p => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    hour: Number(parts.hour),
  };
}

function parisOffsetMs(timestamp: number): number {
  const { year, month, day, hour } = parisParts(timestamp);
  return Date.UTC(year, month, day, hour) - Math.floor(timestamp / HOUR_MS) * HOUR_MS;
}

/**
 * Convertit un couple (jour du mois, heure) affiché par meteociel en timestamp UTC
 * Le mois et l'année, absents de la page, sont ceux qui placent la date au plus près de `reference`
 */
export function localToTimestamp(dayOfMonth: number, hour: number, reference: Date): number {
  const ref = parisParts(reference.getTime());

  const candidates = [-1, 0, 1].map(delta => Date.UTC(ref.year, ref.month + delta, dayOfMonth, hour));
  const localWallClock = candidates.reduce((best, c) =>
    Math.abs(c - reference.getTime()) < Math.abs(best - reference.getTime()) ? c : best
  );

  const guess = localWallClock - parisOffsetMs(localWallClock);
  return localWallClock - parisOffsetMs(guess);
}

/**
 * Étiquette en heure de Paris un créneau de 3h se terminant à `endTimestamp`
 */
export function describeSlot(
  endTimestamp: number
): Pick<RainForecastEntry, 'timestamp' | 'day' | 'hour' | 'timeRange'> {
  const end = parisParts(endTimestamp);
  const start = parisParts(endTimestamp - SLOT_MS);
  const weekday = weekdayFormatter.format(endTimestamp);
  const pad = (h: number) => `${h.toString().padStart(2, '0')}h`;

  return {
    timestamp: endTimestamp,
    day: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${end.day}`,
    hour: pad(end.hour),
    timeRange: `${pad(start.hour)}-${pad(end.hour)}`,
  };
}

/**
 * Cumule des pluies horaires (chaque valeur couvre l'heure qui précède `timestamp`)
 * sur la grille UTC 00Z/03Z/06Z… utilisée par les modèles à pas de 3h
 */
export function aggregateHourlyTo3Hours(
  hourly: Array<{ timestamp: number; amount: number }>
): RainForecastEntry[] {
  const totals = new Map<number, number>();
  for (const { timestamp, amount } of hourly) {
    const slotEnd = Math.ceil(timestamp / SLOT_MS) * SLOT_MS;
    totals.set(slotEnd, (totals.get(slotEnd) ?? 0) + amount);
  }

  return Array.from(totals, ([slotEnd, amount]) => ({ ...describeSlot(slotEnd), amount })).sort(
    (a, b) => a.timestamp - b.timestamp
  );
}
