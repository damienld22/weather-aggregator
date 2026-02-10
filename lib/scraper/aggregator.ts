/**
 * Module d'agrégation multi-modèles
 * Orchestre le scraping de plusieurs modèles météo et fusionne les données
 */

import { fetchRainForecast } from './meteociel';
import { fetchRainForecastWRF } from './meteociel-wrf';
import { fetchRainForecastAROME } from './meteociel-arome';
import { fetchRainForecastARPEGE } from './meteociel-arpege';
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

  // Fetch parallèle des quatre modèles pour optimiser les performances
  // Utilisation de Promise.allSettled pour graceful degradation
  const [gfsResult, wrfResult, aromeResult, arpegeResult] = await Promise.allSettled([
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
  ]);

  const gfsData = gfsResult.status === 'fulfilled' ? gfsResult.value : null;
  const wrfData = wrfResult.status === 'fulfilled' ? wrfResult.value : null;
  const aromeData = aromeResult.status === 'fulfilled' ? aromeResult.value : null;
  const arpegeData = arpegeResult.status === 'fulfilled' ? arpegeResult.value : null;

  console.log(
    `[Aggregator] Fetch completed in ${Date.now() - startTime}ms`,
    `(GFS: ${gfsData ? 'OK' : 'FAILED'}, WRF: ${wrfData ? 'OK' : 'FAILED'}, AROME: ${aromeData ? 'OK' : 'FAILED'}, ARPEGE: ${arpegeData ? 'OK' : 'FAILED'})`
  );

  // Si tous les modèles échouent, lever une erreur
  if (!gfsData && !wrfData && !aromeData && !arpegeData) {
    throw new Error(
      'Impossible de récupérer les données météo. Tous les modèles (GFS, WRF, AROME et ARPEGE) sont indisponibles.'
    );
  }

  // Merger les données
  const mergedEntries = mergeForecasts(gfsData, wrfData, aromeData, arpegeData);

  console.log(`[Aggregator] Merged ${mergedEntries.length} entries`);

  return {
    location: 'La Bouëxière',
    fetchedAt: new Date(),
    entries: mergedEntries,
    gfsLastUpdate: gfsData?.lastUpdate,
    wrfLastUpdate: wrfData?.lastUpdate,
    aromeLastUpdate: aromeData?.lastUpdate,
    arpegeLastUpdate: arpegeData?.lastUpdate,
  };
}

/**
 * Fusionne les prévisions de quatre modèles en alignant sur jour + heure
 * Gestion des cas où un modèle a des données que les autres n'ont pas
 */
function mergeForecasts(
  gfsData: RainForecast | null,
  wrfData: RainForecast | null,
  aromeData: RainForecast | null,
  arpegeData: RainForecast | null
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
        arome: undefined,
        arpege: undefined,
      });
    }
  }

  // Ajouter/fusionner les données WRF
  if (wrfData) {
    for (const entry of wrfData.entries) {
      const key = makeKey(entry.day, entry.hour);
      const existing = merged.get(key);

      if (existing) {
        // Fusionner avec l'entrée existante
        existing.wrf = entry.amount;
      } else {
        // Créer une nouvelle entrée (WRF uniquement)
        merged.set(key, {
          day: entry.day,
          hour: entry.hour,
          timeRange: entry.timeRange,
          gfs: undefined,
          wrf: entry.amount,
          arome: undefined,
          arpege: undefined,
        });
      }
    }
  }

  // Ajouter/fusionner les données AROME
  if (aromeData) {
    for (const entry of aromeData.entries) {
      const key = makeKey(entry.day, entry.hour);
      const existing = merged.get(key);

      if (existing) {
        // Fusionner avec l'entrée existante
        existing.arome = entry.amount;
      } else {
        // Créer une nouvelle entrée (AROME uniquement)
        merged.set(key, {
          day: entry.day,
          hour: entry.hour,
          timeRange: entry.timeRange,
          gfs: undefined,
          wrf: undefined,
          arome: entry.amount,
          arpege: undefined,
        });
      }
    }
  }

  // Ajouter/fusionner les données ARPEGE
  if (arpegeData) {
    for (const entry of arpegeData.entries) {
      const key = makeKey(entry.day, entry.hour);
      const existing = merged.get(key);

      if (existing) {
        // Fusionner avec l'entrée existante
        existing.arpege = entry.amount;
      } else {
        // Créer une nouvelle entrée (ARPEGE uniquement)
        merged.set(key, {
          day: entry.day,
          hour: entry.hour,
          timeRange: entry.timeRange,
          gfs: undefined,
          wrf: undefined,
          arome: undefined,
          arpege: entry.amount,
        });
      }
    }
  }

  // Convertir la Map en tableau et trier chronologiquement
  // Le tri est basé sur l'ordre d'apparition (les dates sont déjà dans l'ordre)
  return Array.from(merged.values());
}
