/**
 * Module de scraping pour meteociel.fr - Modèle WRF
 * Orchestration du fetch HTTP et parsing des données du modèle WRF
 *
 * @see https://www.meteociel.fr/previsions-wrf/12368/la_bouexiere.htm
 */

import { parseRainTable, parseLastUpdate } from './parser';
import { RainForecast, ScraperError } from './types';

const METEOCIEL_WRF_URL =
  'https://www.meteociel.fr/previsions-wrf/12368/la_bouexiere.htm';

/**
 * Récupère et parse les prévisions de pluie depuis meteociel.fr (modèle WRF)
 * @returns Les prévisions de pluie pour La Bouëxière selon le modèle WRF
 * @throws {ScraperError} En cas d'erreur réseau, HTTP ou parsing
 */
export async function fetchRainForecastWRF(): Promise<RainForecast> {
  const startTime = Date.now();

  try {
    console.log('[Scraper WRF] Fetching meteociel.fr/previsions-wrf...');

    // Fetch du HTML avec options pour éviter le cache
    const response = await fetch(METEOCIEL_WRF_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; WeatherAggregator/1.0; +https://github.com/your-repo)',
      },
    });

    if (!response.ok) {
      throw new ScraperError(
        'FETCH_ERROR',
        `Erreur HTTP ${response.status}: ${response.statusText}. Le site meteociel.fr (WRF) pourrait être temporairement indisponible.`
      );
    }

    const html = await response.text();
    console.log(
      `[Scraper WRF] Fetch completed in ${Date.now() - startTime}ms`
    );

    // Parse du HTML
    console.log('[Scraper WRF] Parsing HTML...');
    const entries = parseRainTable(html);
    const lastUpdate = parseLastUpdate(html);

    // Ajouter le modèle aux entrées
    const entriesWithModel = entries.map(entry => ({
      ...entry,
      model: 'WRF' as const,
    }));

    console.log(`[Scraper WRF] Successfully parsed ${entriesWithModel.length} entries`);
    if (lastUpdate) {
      console.log(`[Scraper WRF] Last update: ${lastUpdate}`);
    }

    if (entriesWithModel.length === 0) {
      throw new ScraperError(
        'PARSE_ERROR',
        'Aucune donnée de pluie trouvée dans la page WRF. La structure du site a peut-être changé.'
      );
    }

    return {
      location: 'La Bouëxière',
      fetchedAt: new Date(),
      entries: entriesWithModel,
      lastUpdate,
    };
  } catch (error) {
    // Si c'est déjà une ScraperError, on la relance
    if (error instanceof ScraperError) {
      console.error(`[Scraper WRF] ${error.type}:`, error.message);
      throw error;
    }

    // Erreur réseau (timeout, DNS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ScraperError(
        'NETWORK_ERROR',
        'Impossible de contacter meteociel.fr (WRF). Vérifiez votre connexion internet.',
        error
      );
    }

    // Erreur inconnue
    console.error('[Scraper WRF] Unexpected error:', error);
    throw new ScraperError(
      'FETCH_ERROR',
      'Une erreur inattendue est survenue lors du scraping WRF. Veuillez réessayer plus tard.',
      error instanceof Error ? error : undefined
    );
  }
}
