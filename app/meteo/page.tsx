/**
 * Page principale des prévisions météo
 * Server Component qui fetch les données à chaque visite
 */

import { fetchRainForecast } from '@/lib/scraper/meteociel';
import RainForecastTable from '@/components/RainForecastTable';
import type { Metadata } from 'next';

// Forcer le rendu dynamique (pas de cache)
// Cela garantit que les données sont fraîches à chaque visite
export const dynamic = 'force-dynamic';

// Métadonnées de la page pour le SEO
export const metadata: Metadata = {
  title: 'Prévisions de pluie - La Bouëxière | Weather Aggregator',
  description:
    'Prévisions détaillées de pluie pour La Bouëxière, agrégation depuis Meteociel',
  keywords: ['météo', 'pluie', 'prévisions', 'La Bouëxière', 'meteociel'],
};

/**
 * Page météo - Server Component async
 * Le scraping se fait ici, côté serveur, à chaque requête
 */
export default async function MeteoPage() {
  // Fetch des données (s'exécute sur le serveur)
  // En cas d'erreur, elle sera attrapée par error.tsx
  const forecast = await fetchRainForecast();

  return <RainForecastTable data={forecast} />;
}
