/**
 * Module de scraping pour meteociel.fr - Modèle AROME
 * Orchestration du fetch HTTP et parsing des données du modèle AROME
 *
 * @see https://www.meteociel.fr/previsions-arome/12368/la_bouexiere.htm
 */

import { parseRainTable, parseLastUpdate } from './parser';
import { RainForecast, ScraperError } from './types';

const METEOCIEL_AROME_URL =
  'https://www.meteociel.fr/previsions-arome/12368/la_bouexiere.htm';

/**
 * Récupère et parse les prévisions de pluie depuis meteociel.fr (modèle AROME)
 * @returns Les prévisions de pluie pour La Bouëxière selon le modèle AROME
 * @throws {ScraperError} En cas d'erreur réseau, HTTP ou parsing
 */
export async function fetchRainForecastAROME(): Promise<RainForecast> {
  const startTime = Date.now();

  try {
    console.log('[Scraper AROME] Fetching meteociel.fr/previsions-arome...');

    // Fetch du HTML avec options pour éviter le cache
    const response = await fetch(METEOCIEL_AROME_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; WeatherAggregator/1.0; +https://github.com/your-repo)',
      },
    });

    if (!response.ok) {
      throw new ScraperError(
        'FETCH_ERROR',
        `Erreur HTTP ${response.status}: ${response.statusText}. Le site meteociel.fr (AROME) pourrait être temporairement indisponible.`
      );
    }

    const html = await response.text();
    console.log(
      `[Scraper AROME] Fetch completed in ${Date.now() - startTime}ms`
    );

    // Parse du HTML
    console.log('[Scraper AROME] Parsing HTML...');
    const entries = parseRainTable(html);
    const lastUpdate = parseLastUpdate(html);

    // Ajouter le modèle aux entrées
    const entriesWithModel = entries.map(entry => ({
      ...entry,
      model: 'AROME' as const,
    }));

    console.log(`[Scraper AROME] Successfully parsed ${entriesWithModel.length} entries`);
    if (lastUpdate) {
      console.log(`[Scraper AROME] Last update: ${lastUpdate}`);
    }

    if (entriesWithModel.length === 0) {
      throw new ScraperError(
        'PARSE_ERROR',
        'Aucune donnée de pluie trouvée dans la page AROME. La structure du site a peut-être changé.'
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
      console.error(`[Scraper AROME] ${error.type}:`, error.message);
      throw error;
    }

    // Erreur réseau (timeout, DNS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ScraperError(
        'NETWORK_ERROR',
        'Impossible de contacter meteociel.fr (AROME). Vérifiez votre connexion internet.',
        error
      );
    }

    // Erreur inconnue
    console.error('[Scraper AROME] Unexpected error:', error);
    throw new ScraperError(
      'FETCH_ERROR',
      'Une erreur inattendue est survenue lors du scraping AROME. Veuillez réessayer plus tard.',
      error instanceof Error ? error : undefined
    );
  }
}
