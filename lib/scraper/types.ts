/**
 * Types pour les données météo scrappées depuis meteociel.fr
 */

export interface RainForecastEntry {
  day: string;           // "Mardi 11", "Mercredi 12"
  hour: string;          // "22h"
  amount: number;        // 0.3 (en mm)
  timeRange: string;     // "19h-22h" (période de 3h)
}

export interface RainForecast {
  location: string;      // "La Bouëxière"
  fetchedAt: Date;       // Date du scraping
  entries: RainForecastEntry[];
}

export type ScraperErrorType = 'FETCH_ERROR' | 'PARSE_ERROR' | 'NETWORK_ERROR';

export class ScraperError extends Error {
  type: ScraperErrorType;
  originalError?: Error;

  constructor(type: ScraperErrorType, message: string, originalError?: Error) {
    super(message);
    this.type = type;
    this.originalError = originalError;
    this.name = 'ScraperError';
  }
}
