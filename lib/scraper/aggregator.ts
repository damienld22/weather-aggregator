/**
 * Module d'agrégation multi-modèles
 * Orchestre le scraping de plusieurs modèles météo et fusionne les données
 */

import { fetchRainForecast } from './meteociel';
import { fetchRainForecastWRF } from './meteociel-wrf';
import { MultiModelForecast, MultiModelRainEntry, RainForecast } from './types';

/**
 * Récupère les prévisions de pluie depuis plusieurs modèles et les agrège
 * Les modèles sont récupérés en parallèle pour optimiser les performances
 *
 * @returns Prévisions agrégées avec données GFS et WRF alignées
 */
export async function fetchMultiModelForecast(): Promise<MultiModelForecast> {
  const startTime = Date.now();
  console.log('[Aggregator] Fetching forecasts from multiple models...');

  // Fetch parallèle des deux modèles pour optimiser les performances
  // Utilisation de Promise.allSettled pour graceful degradation
  const [gfsResult, wrfResult] = await Promise.allSettled([
    fetchRainForecast().catch(err => {
      console.error('[Aggregator] GFS fetch failed:', err.message);
      return null;
    }),
    fetchRainForecastWRF().catch(err => {
      console.error('[Aggregator] WRF fetch failed:', err.message);
      return null;
    }),
  ]);

  const gfsData = gfsResult.status === 'fulfilled' ? gfsResult.value : null;
  const wrfData = wrfResult.status === 'fulfilled' ? wrfResult.value : null;

  console.log(
    `[Aggregator] Fetch completed in ${Date.now() - startTime}ms`,
    `(GFS: ${gfsData ? 'OK' : 'FAILED'}, WRF: ${wrfData ? 'OK' : 'FAILED'})`
  );

  // Si les deux modèles échouent, lever une erreur
  if (!gfsData && !wrfData) {
    throw new Error(
      'Impossible de récupérer les données météo. Les deux modèles (GFS et WRF) sont indisponibles.'
    );
  }

  // Merger les données
  const mergedEntries = mergeForecasts(gfsData, wrfData);

  console.log(`[Aggregator] Merged ${mergedEntries.length} entries`);

  return {
    location: 'La Bouëxière',
    fetchedAt: new Date(),
    entries: mergedEntries,
  };
}

/**
 * Fusionne les prévisions de deux modèles en alignant sur jour + heure
 * Gestion des cas où un modèle a des données que l'autre n'a pas
 */
function mergeForecasts(
  gfsData: RainForecast | null,
  wrfData: RainForecast | null
): MultiModelRainEntry[] {
  const merged = new Map<string, MultiModelRainEntry>();

  // Créer une clé unique pour chaque créneau horaire
  const makeKey = (day: string, hour: string) => `${day}-${hour}`;

  // Ajouter les données GFS
  if (gfsData) {
    for (const entry of gfsData.entries) {
      const key = makeKey(entry.day, entry.hour);
      merged.set(key, {
        day: entry.day,
        hour: entry.hour,
        timeRange: entry.timeRange,
        gfs: entry.amount,
        wrf: undefined,
      });
    }
  }

  // Ajouter/fusionner les données WRF
  if (wrfData) {
    for (const entry of wrfData.entries) {
      const key = makeKey(entry.day, entry.hour);
      const existing = merged.get(key);

      if (existing) {
        // Fusionner avec l'entrée GFS existante
        existing.wrf = entry.amount;
      } else {
        // Créer une nouvelle entrée (WRF uniquement)
        merged.set(key, {
          day: entry.day,
          hour: entry.hour,
          timeRange: entry.timeRange,
          gfs: undefined,
          wrf: entry.amount,
        });
      }
    }
  }

  // Convertir la Map en tableau et trier chronologiquement
  // Le tri est basé sur l'ordre d'apparition (les dates sont déjà dans l'ordre)
  return Array.from(merged.values());
}
