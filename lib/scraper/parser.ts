/**
 * Parser pour extraire les données de pluie depuis meteociel.fr
 */

import * as cheerio from 'cheerio';
import type { RainForecastEntry } from './types';
import { ScraperError } from './types';

/**
 * Parse le HTML de meteociel pour extraire les prévisions de pluie
 * @param html - Le HTML brut de la page
 * @returns Tableau des prévisions de pluie
 */
export function parseRainTable(html: string): RainForecastEntry[] {
  try {
    const $ = cheerio.load(html);
    const entries: RainForecastEntry[] = [];
    let currentDay = '';

    // Trouver et parser tous les tableaux qui contiennent "Pluiesur 3h"
    const tables: Array<ReturnType<typeof $>> = [];

    $('table').each((_, table) => {
      const tableText = $(table).text();
      if (tableText.includes('Pluiesur 3h')) {
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
        if (hasData) {
          tables.push($table);
        }
      }
    });

    if (tables.length === 0) {
      throw new ScraperError(
        'PARSE_ERROR',
        'Impossible de trouver le tableau de prévisions de pluie'
      );
    }

    // Prendre le tableau avec le moins de lignes (le plus propre)
    const targetTable = tables.reduce((prev, curr) =>
      curr.find('tr').length < prev.find('tr').length ? curr : prev
    );

    // Parser le tableau trouvé
    targetTable.find('tr').each((_rowIndex, row) => {
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

        const entry = parseEntry(currentDay, hourText, rainText);
        if (entry) {
          entries.push(entry);
        }
      } else if (currentDay && /^\d{2}:\d{2}$/.test(firstCell)) {
        // Suite de la même journée : [0]=Heure, [6]=Pluie
        const hourText = firstCell;
        const rainText = $(cells.eq(6)).text().trim();

        const entry = parseEntry(currentDay, hourText, rainText);
        if (entry) {
          entries.push(entry);
        }
      }
      // Ignorer les autres lignes (en-têtes, etc.)
    });

    if (entries.length === 0) {
      throw new ScraperError(
        'PARSE_ERROR',
        'Aucune donnée de pluie trouvée dans le tableau. La structure de la page a peut-être changé.'
      );
    }

    return entries;
  } catch (error) {
    if (error instanceof ScraperError) {
      throw error;
    }

    throw new ScraperError(
      'PARSE_ERROR',
      `Erreur lors du parsing du HTML: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Parse une entrée individuelle (jour + heure + pluie)
 */
function parseEntry(
  day: string,
  hourText: string,
  rainText: string
): RainForecastEntry | null {
  // Parser l'heure
  const hourMatch = hourText.match(/(\d+):(\d+)/);
  if (!hourMatch) {
    return null;
  }

  const hourNum = parseInt(hourMatch[1]);
  const hour = `${hourNum.toString().padStart(2, '0')}h`;

  // Calculer la période de 3h (l'heure affichée est la fin de la période)
  const startHour = hourNum - 3;
  const timeRange = `${startHour}h-${hour}`;

  // Parser la quantité de pluie
  let amount = 0;
  if (rainText !== '--' && rainText !== '') {
    const rainMatch = rainText.match(/(\d+\.?\d*)\s*mm/i);
    if (rainMatch) {
      amount = parseFloat(rainMatch[1]);
    }
  }

  // Formater le jour (ex: "Mar10" → "Mardi 10")
  const dayFormatted = formatDay(day);

  return {
    day: dayFormatted,
    hour,
    amount,
    timeRange,
  };
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
