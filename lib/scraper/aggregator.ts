/**
 * Module d'agrégation multi-modèles
 * Orchestre le scraping de plusieurs modèles météo et fusionne les données
 */

import { fetchRainForecast } from './meteociel';
import { fetchRainForecastWRF } from './meteociel-wrf';
import { fetchRainForecastAROME } from './meteociel-arome';
import { fetchRainForecastARPEGE } from './meteociel-arpege';
import { fetchRainForecastICONEU } from './meteociel-iconeu';
import { MultiModelForecast, MultiModelRainEntry, RainForecast } from './types';

/**
 * Récupère les prévisions de pluie depuis plusieurs modèles et les agrège
 * Les modèles sont récupérés en parallèle pour optimiser les performances
 *
 * @returns Prévisions agrégées avec données GFS, WRF et AROME alignées
 */
export async function fetchMultiModelForecast(): Promise<MultiModelForecast> {
  const startTime = Date.now();
  console.log('[Aggregator] Fetching forecasts from multiple models...');

  // Fetch parallèle des cinq modèles pour optimiser les performances
  // Utilisation de Promise.allSettled pour graceful degradation
  const [gfsResult, wrfResult, aromeResult, arpegeResult, iconeuResult] = await Promise.allSettled([
    fetchRainForecast().catch(err => {
      console.error('[Aggregator] GFS fetch failed:', err.message);
      return null;
    }),
    fetchRainForecastWRF().catch(err => {
      console.error('[Aggregator] WRF fetch failed:', err.message);
      return null;
    }),
    fetchRainForecastAROME().catch(err => {
      console.error('[Aggregator] AROME fetch failed:', err.message);
      return null;
    }),
    fetchRainForecastARPEGE().catch(err => {
      console.error('[Aggregator] ARPEGE fetch failed:', err.message);
      return null;
    }),
    fetchRainForecastICONEU().catch(err => {
      console.error('[Aggregator] ICON-EU fetch failed:', err.message);
      return null;
    }),
  ]);

  const gfsData = gfsResult.status === 'fulfilled' ? gfsResult.value : null;
  const wrfData = wrfResult.status === 'fulfilled' ? wrfResult.value : null;
  const aromeData = aromeResult.status === 'fulfilled' ? aromeResult.value : null;
  const arpegeData = arpegeResult.status === 'fulfilled' ? arpegeResult.value : null;
  const iconeuData = iconeuResult.status === 'fulfilled' ? iconeuResult.value : null;

  console.log(
    `[Aggregator] Fetch completed in ${Date.now() - startTime}ms`,
    `(GFS: ${gfsData ? 'OK' : 'FAILED'}, WRF: ${wrfData ? 'OK' : 'FAILED'}, AROME: ${aromeData ? 'OK' : 'FAILED'}, ARPEGE: ${arpegeData ? 'OK' : 'FAILED'}, ICON-EU: ${iconeuData ? 'OK' : 'FAILED'})`
  );

  // Si tous les modèles échouent, lever une erreur
  if (!gfsData && !wrfData && !aromeData && !arpegeData && !iconeuData) {
    throw new Error(
      'Impossible de récupérer les données météo. Tous les modèles (GFS, WRF, AROME, ARPEGE et ICON-EU) sont indisponibles.'
    );
  }

  // Merger les données
  const mergedEntries = mergeForecasts({
    gfs: gfsData,
    wrf: wrfData,
    arome: aromeData,
    arpege: arpegeData,
    iconeu: iconeuData,
  });

  console.log(`[Aggregator] Merged ${mergedEntries.length} entries`);

  return {
    location: 'La Bouëxière',
    fetchedAt: new Date(),
    entries: mergedEntries,
    gfsLastUpdate: gfsData?.lastUpdate,
    wrfLastUpdate: wrfData?.lastUpdate,
    aromeLastUpdate: aromeData?.lastUpdate,
    arpegeLastUpdate: arpegeData?.lastUpdate,
    iconeuLastUpdate: iconeuData?.lastUpdate,
  };
}

type ModelKey = 'gfs' | 'wrf' | 'arome' | 'arpege' | 'iconeu';

/**
 * Fusionne les prévisions des modèles en alignant sur l'instant de fin de créneau,
 * puis trie chronologiquement (un modèle peut avoir des créneaux absents des autres)
 */
export function mergeForecasts(
  models: Partial<Record<ModelKey, RainForecast | null>>
): MultiModelRainEntry[] {
  const merged = new Map<number, MultiModelRainEntry>();

  for (const [model, data] of Object.entries(models) as Array<[ModelKey, RainForecast | null]>) {
    for (const entry of data?.entries ?? []) {
      const row = merged.get(entry.timestamp) ?? {
        timestamp: entry.timestamp,
        day: entry.day,
        hour: entry.hour,
        timeRange: entry.timeRange,
      };
      row[model] = entry.amount;
      merged.set(entry.timestamp, row);
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.timestamp - b.timestamp);
}
