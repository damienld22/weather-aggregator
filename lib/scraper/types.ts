/**
 * Types pour les données météo scrappées depuis meteociel.fr
 */

/**
 * Type des modèles météo supportés
 */
export type WeatherModel = 'GFS' | 'WRF' | 'AROME' | 'ARPEGE' | 'ICON-EU';

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
  lastUpdate?: string;   // Date de dernière actualisation du modèle (ex: "17:01 (run GFS de 12Z)")
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
  arome?: number;        // Quantité de pluie AROME (undefined si pas de donnée)
  arpege?: number;       // Quantité de pluie ARPEGE (undefined si pas de donnée)
  iconeu?: number;       // Quantité de pluie ICON-EU (undefined si pas de donnée)
}

/**
 * Prévisions multi-modèles agrégées
 */
export interface MultiModelForecast {
  location: string;      // "La Bouëxière"
  fetchedAt: Date;       // Date du scraping
  entries: MultiModelRainEntry[];
  gfsLastUpdate?: string; // Date de dernière actualisation GFS
  wrfLastUpdate?: string; // Date de dernière actualisation WRF
  aromeLastUpdate?: string; // Date de dernière actualisation AROME
  arpegeLastUpdate?: string; // Date de dernière actualisation ARPEGE
  iconeuLastUpdate?: string; // Date de dernière actualisation ICON-EU
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
