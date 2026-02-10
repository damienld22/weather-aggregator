/**
 * Module de scraping pour meteociel.fr - Modèle ARPEGE
 * Orchestration du fetch HTTP et parsing des données du modèle ARPEGE
 * Les données ARPEGE sont fournies par heure, et agrégées en tranches de 3h
 *
 * @see https://www.meteociel.fr/previsions-arpege-1h/12368/la_bouexiere.htm
 */

import * as cheerio from 'cheerio';
import { RainForecast, RainForecastEntry, ScraperError } from './types';

const METEOCIEL_ARPEGE_URL =
  'https://www.meteociel.fr/previsions-arpege-1h/12368/la_bouexiere.htm';

/**
 * Récupère et parse les prévisions de pluie depuis meteociel.fr (modèle ARPEGE)
 * Les données horaires sont agrégées en tranches de 3h pour correspondre aux autres modèles
 * @returns Les prévisions de pluie pour La Bouëxière selon le modèle ARPEGE
 * @throws {ScraperError} En cas d'erreur réseau, HTTP ou parsing
 */
export async function fetchRainForecastARPEGE(): Promise<RainForecast> {
  const startTime = Date.now();

  try {
    console.log('[Scraper ARPEGE] Fetching meteociel.fr/previsions-arpege-1h...');

    // Fetch du HTML avec options pour éviter le cache
    const response = await fetch(METEOCIEL_ARPEGE_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; WeatherAggregator/1.0; +https://github.com/your-repo)',
      },
    });

    if (!response.ok) {
      throw new ScraperError(
        'FETCH_ERROR',
        `Erreur HTTP ${response.status}: ${response.statusText}. Le site meteociel.fr (ARPEGE) pourrait être temporairement indisponible.`
      );
    }

    const html = await response.text();
    console.log(
      `[Scraper ARPEGE] Fetch completed in ${Date.now() - startTime}ms`
    );

    // Parse du HTML
    console.log('[Scraper ARPEGE] Parsing HTML...');
    const hourlyEntries = parseARPEGEHourlyData(html);
    console.log(`[Scraper ARPEGE] Parsed ${hourlyEntries.length} hourly entries`);

    // Agréger en tranches de 3h
    const aggregatedEntries = aggregateTo3Hours(hourlyEntries);
    console.log(
      `[Scraper ARPEGE] Aggregated to ${aggregatedEntries.length} 3-hour entries`
    );

    // Extraire la date de dernière mise à jour
    const lastUpdate = parseLastUpdate(html);

    // Ajouter le modèle aux entrées
    const entriesWithModel = aggregatedEntries.map(entry => ({
      ...entry,
      model: 'ARPEGE' as const,
    }));

    console.log(`[Scraper ARPEGE] Successfully parsed ${entriesWithModel.length} entries`);
    if (lastUpdate) {
      console.log(`[Scraper ARPEGE] Last update: ${lastUpdate}`);
    }

    if (entriesWithModel.length === 0) {
      throw new ScraperError(
        'PARSE_ERROR',
        'Aucune donnée de pluie trouvée dans la page ARPEGE. La structure du site a peut-être changé.'
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
      console.error(`[Scraper ARPEGE] ${error.type}:`, error.message);
      throw error;
    }

    // Erreur réseau (timeout, DNS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ScraperError(
        'NETWORK_ERROR',
        'Impossible de contacter meteociel.fr (ARPEGE). Vérifiez votre connexion internet.',
        error
      );
    }

    // Erreur inconnue
    console.error('[Scraper ARPEGE] Unexpected error:', error);
    throw new ScraperError(
      'FETCH_ERROR',
      'Une erreur inattendue est survenue lors du scraping ARPEGE. Veuillez réessayer plus tard.',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Interface pour les données horaires (1h) avant agrégation
 */
interface HourlyEntry {
  day: string;
  hour: number;      // 0-23
  amount: number;    // mm de pluie sur cette heure
}

/**
 * Parse les données horaires ARPEGE depuis le HTML
 */
function parseARPEGEHourlyData(html: string): HourlyEntry[] {
  try {
    const $ = cheerio.load(html, { decodeEntities: false });
    const entries: HourlyEntry[] = [];
    let currentDay = '';

    // Trouver le tableau qui contient "Pluiesur 1h"
    let targetTableElement: cheerio.Element | null = null;

    $('table').each((_, table) => {
      const tableText = $(table).text();
      if (tableText.includes('Pluiesur 1h') || tableText.includes('Pluie sur 1h')) {
        const $table = $(table);
        // Vérifier que c'est un tableau de données (pas juste l'en-tête)
        let hasData = false;
        $table.find('tr').each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length > 0) {
            const firstCell = $(cells.eq(0)).text().trim();
            // Vérifier si on a des données de jour (Mar, Mer, Jeu, etc.)
            if (/^(Lun|Mar|Mer|Jeu|Ven|Sam|Dim)\d+$/.test(firstCell)) {
              hasData = true;
            }
          }
        });
        if (hasData && !targetTableElement) {
          targetTableElement = table;
        }
      }
    });

    if (!targetTableElement) {
      throw new ScraperError(
        'PARSE_ERROR',
        'Impossible de trouver le tableau ARPEGE de prévisions de pluie'
      );
    }

    const targetTable = $(targetTableElement);

    // Parser le tableau trouvé
    targetTable.find('tr').each((_rowIndex: number, row: cheerio.Element) => {
      const cells = $(row).find('td');

      // Ignorer les lignes d'en-tête et les lignes vides
      if (cells.length === 0) {
        return; // continue
      }

      const firstCell = $(cells.eq(0)).text().trim();
      const firstCellRowspan = $(cells.eq(0)).attr('rowspan');

      // Vérifier si cette ligne commence un nouveau jour (avec rowspan)
      const isDayStart = firstCellRowspan && parseInt(firstCellRowspan) > 1;

      if (isDayStart) {
        // Nouvelle journée : [0]=Jour, [1]=Heure, [7]=Pluie
        currentDay = firstCell;
        const hourText = $(cells.eq(1)).text().trim();
        const rainText = $(cells.eq(7)).text().trim();

        const entry = parseHourlyEntry(currentDay, hourText, rainText);
        if (entry) {
          entries.push(entry);
        }
      } else if (currentDay && /^\d{2}:\d{2}$/.test(firstCell)) {
        // Suite de la même journée : [0]=Heure, [6]=Pluie
        const hourText = firstCell;
        const rainText = $(cells.eq(6)).text().trim();

        const entry = parseHourlyEntry(currentDay, hourText, rainText);
        if (entry) {
          entries.push(entry);
        }
      }
      // Ignorer les autres lignes (en-têtes, etc.)
    });

    if (entries.length === 0) {
      throw new ScraperError(
        'PARSE_ERROR',
        'Aucune donnée de pluie trouvée dans le tableau ARPEGE. La structure de la page a peut-être changé.'
      );
    }

    return entries;
  } catch (error) {
    if (error instanceof ScraperError) {
      throw error;
    }

    throw new ScraperError(
      'PARSE_ERROR',
      `Erreur lors du parsing du HTML ARPEGE: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Parse une entrée horaire individuelle
 */
function parseHourlyEntry(
  day: string,
  hourText: string,
  rainText: string
): HourlyEntry | null {
  // Parser l'heure
  const hourMatch = hourText.match(/(\d+):(\d+)/);
  if (!hourMatch) {
    return null;
  }

  const hour = parseInt(hourMatch[1]);

  // Parser la quantité de pluie
  let amount = 0;
  if (rainText !== '--' && rainText !== '') {
    const rainMatch = rainText.match(/(\d+\.?\d*)\s*mm/i);
    if (rainMatch) {
      amount = parseFloat(rainMatch[1]);
    }
  }

  return {
    day,
    hour,
    amount,
  };
}

/**
 * Agrège les données horaires en tranches de 3h
 * Les tranches cibles sont : 01h, 04h, 07h, 10h, 13h, 16h, 19h, 22h
 * Soit les tranches : 22h-01h, 01h-04h, 04h-07h, 07h-10h, 10h-13h, 13h-16h, 16h-19h, 19h-22h
 * (alignées avec les autres modèles GFS/WRF/AROME)
 */
function aggregateTo3Hours(hourlyEntries: HourlyEntry[]): RainForecastEntry[] {
  const result: RainForecastEntry[] = [];

  // 1. Créer un index global (jour, heure) -> entry
  const globalIndex = new Map<string, HourlyEntry>();
  for (const entry of hourlyEntries) {
    const key = `${entry.day}-${entry.hour}`;
    globalIndex.set(key, entry);
  }

  // 2. Obtenir la liste des jours uniques dans l'ordre
  const days = Array.from(new Set(hourlyEntries.map(e => e.day)));

  // 3. Pour chaque jour, créer les tranches de 3h
  // Inclut la tranche 22h-01h qui chevauche minuit
  const targetHours = [1, 4, 7, 10, 13, 16, 19, 22];

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const prevDay = i > 0 ? days[i - 1] : null;

    for (const endHour of targetHours) {
      // Pour une tranche se terminant à endHour, on cumule les heures précédentes
      // Par exemple pour 04h : on cumule les données de 02h, 03h, 04h
      // Pour 01h : on cumule les données de 23h (jour précédent), 00h, 01h
      const hours = [endHour - 2, endHour - 1, endHour];

      let totalAmount = 0;
      let hasData = false;

      for (const h of hours) {
        let targetHour = h;
        let targetDay = day;

        // Si l'heure est négative (cas de la tranche 22h-01h),
        // récupérer depuis le jour précédent
        if (h < 0) {
          targetHour = h + 24; // -1 devient 23
          if (prevDay) {
            targetDay = prevDay;
          } else {
            // Pas de jour précédent, skip cette heure
            continue;
          }
        }

        const key = `${targetDay}-${targetHour}`;
        const entry = globalIndex.get(key);
        if (entry) {
          totalAmount += entry.amount;
          hasData = true;
        }
      }

      if (hasData) {
        let startHour = endHour - 3;
        if (startHour < 0) {
          startHour += 24;
        }
        const endHourFormatted = `${endHour.toString().padStart(2, '0')}h`;
        const timeRange = `${startHour.toString().padStart(2, '0')}h-${endHourFormatted}`;

        result.push({
          day: formatDay(day),
          hour: endHourFormatted,
          amount: totalAmount,
          timeRange,
        });
      }
    }
  }

  return result;
}

/**
 * Formate le jour depuis le format court (Mar10) vers le format long (Mardi 10)
 */
function formatDay(shortDay: string): string {
  const dayMap: Record<string, string> = {
    Lun: 'Lundi',
    Mar: 'Mardi',
    Mer: 'Mercredi',
    Jeu: 'Jeudi',
    Ven: 'Vendredi',
    Sam: 'Samedi',
    Dim: 'Dimanche',
  };

  const match = shortDay.match(/^(Lun|Mar|Mer|Jeu|Ven|Sam|Dim)(\d+)$/);
  if (match) {
    const dayName = dayMap[match[1]] || match[1];
    const dayNum = match[2];
    return `${dayName} ${dayNum}`;
  }

  return shortDay;
}

/**
 * Extrait la date de dernière actualisation du modèle ARPEGE
 * Recherche le texte "Réactualisé à HH:MM (run ARPEGE de XXZ)"
 * @param html - Le HTML brut de la page
 * @returns La date d'actualisation ou undefined si non trouvée
 */
function parseLastUpdate(html: string): string | undefined {
  try {
    // Recherche directe dans le HTML brut pour gérer l'encodage
    // Pattern flexible pour gérer "Réactualisé" avec différents encodages
    const pattern = /R[eé]actualis[eé]\s+[aà]\s+(\d{2}:\d{2})\s*\(run\s+(\w+)\s+de\s+(\d+Z)\)/i;
    const match = html.match(pattern);

    if (match) {
      const time = match[1];      // "16:12"
      const model = match[2];     // "ARPEGE"
      const run = match[3];       // "12Z"
      const result = `${time} (run ${model} de ${run})`;
      return result;
    }

    // Essayer une recherche plus simple si le pattern complet ne matche pas
    const simplePattern = /(\d{2}:\d{2})\s*\(run\s+(\w+)\s+de\s+(\d+Z)\)/i;
    const simpleMatch = html.match(simplePattern);

    if (simpleMatch) {
      const time = simpleMatch[1];
      const model = simpleMatch[2];
      const run = simpleMatch[3];
      return `${time} (run ${model} de ${run})`;
    }

    return undefined;
  } catch (error) {
    console.warn('[Parser ARPEGE] Failed to extract last update date:', error);
    return undefined;
  }
}
