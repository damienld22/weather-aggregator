/**
 * Page principale des prévisions météo
 * Server Component qui fetch les données de plusieurs modèles à chaque visite
 */

import { fetchMultiModelForecast } from '@/lib/scraper/aggregator';
import MultiModelRainForecastTable from '@/components/MultiModelRainForecastTable';
import type { Metadata } from 'next';

// Forcer le rendu dynamique (pas de cache)
// Cela garantit que les données sont fraîches à chaque visite
export const dynamic = 'force-dynamic';

// Métadonnées de la page pour le SEO
export const metadata: Metadata = {
  title: 'Prévisions de pluie - La Bouëxière | Weather Aggregator',
  description:
    'Prévisions détaillées de pluie pour La Bouëxière, comparaison des modèles GFS et WRF depuis Meteociel',
  keywords: [
    'météo',
    'pluie',
    'prévisions',
    'La Bouëxière',
    'meteociel',
    'GFS',
    'WRF',
  ],
};

/**
 * Page météo - Server Component async
 * Le scraping multi-modèles se fait ici, côté serveur, à chaque requête
 * Les modèles GFS et WRF sont récupérés en parallèle pour optimiser les performances
 */
export default async function MeteoPage() {
  // Fetch des données multi-modèles (s'exécute sur le serveur)
  // En cas d'erreur, elle sera attrapée par error.tsx
  const forecast = await fetchMultiModelForecast();

  return <MultiModelRainForecastTable data={forecast} />;
}
