/**
 * Types pour les données météo scrappées depuis meteociel.fr
 */

/**
 * Type des modèles météo supportés
 */
export type WeatherModel = 'GFS' | 'WRF';

export interface RainForecastEntry {
  day: string;           // "Mardi 11", "Mercredi 12"
  hour: string;          // "22h"
  amount: number;        // 0.3 (en mm)
  timeRange: string;     // "19h-22h" (période de 3h)
  model?: WeatherModel;  // Optionnel : identifie le modèle source
}

export interface RainForecast {
  location: string;      // "La Bouëxière"
  fetchedAt: Date;       // Date du scraping
  entries: RainForecastEntry[];
}

/**
 * Entrée de prévisions avec plusieurs modèles météo
 */
export interface MultiModelRainEntry {
  day: string;           // "Mardi 11", "Mercredi 12"
  hour: string;          // "22h"
  timeRange: string;     // "19h-22h" (période de 3h)
  gfs?: number;          // Quantité de pluie GFS (undefined si pas de donnée)
  wrf?: number;          // Quantité de pluie WRF (undefined si pas de donnée)
}

/**
 * Prévisions multi-modèles agrégées
 */
export interface MultiModelForecast {
  location: string;      // "La Bouëxière"
  fetchedAt: Date;       // Date du scraping
  entries: MultiModelRainEntry[];
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
