/**
 * Composant d'affichage des prévisions de pluie multi-modèles
 * Affiche côte à côte les données GFS et WRF
 */

import type { MultiModelForecast } from '@/lib/scraper/types';
import {
  formatDate,
  formatRainAmount,
  getRainIntensityColor,
} from '@/lib/utils/format';

interface Props {
  data: MultiModelForecast;
}

export default function MultiModelRainForecastTable({ data }: Props) {
  // Grouper les entrées par jour
  const byDay = data.entries.reduce(
    (acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = [];
      }
      acc[entry.day].push(entry);
      return acc;
    },
    {} as Record<string, typeof data.entries>
  );

  // Vérifier si au moins un modèle a des données
  const hasGFS = data.entries.some(e => e.gfs !== undefined);
  const hasWRF = data.entries.some(e => e.wrf !== undefined);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Prévisions de pluie - {data.location}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Mis à jour le {formatDate(data.fetchedAt)}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Source: meteociel.fr • Modèles: GFS et WRF • Les valeurs indiquent la
          quantité de pluie sur 3 heures
        </p>
      </header>

      {/* Alertes si un modèle est indisponible */}
      {!hasGFS && (
        <div className="mb-6 rounded-lg bg-yellow-100 p-4 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          ⚠️ Les données du modèle GFS sont temporairement indisponibles.
        </div>
      )}
      {!hasWRF && (
        <div className="mb-6 rounded-lg bg-yellow-100 p-4 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          ⚠️ Les données du modèle WRF sont temporairement indisponibles.
        </div>
      )}

      {/* Tableaux par jour */}
      <div className="space-y-8">
        {Object.entries(byDay).map(([day, entries]) => (
          <section key={day}>
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
              {day}
            </h2>

            {/* Tableau responsive */}
            <div className="overflow-hidden rounded-lg shadow-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                        Heure
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                        Période (3h)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                        GFS
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                        WRF
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                        Écart
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {entries.map((entry, index) => {
                      const difference = calculateDifference(entry.gfs, entry.wrf);
                      const diffColor = getDifferenceColor(difference);

                      return (
                        <tr
                          key={`${day}-${entry.hour}-${index}`}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 sm:px-6">
                            {entry.hour}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400 sm:px-6">
                            {entry.timeRange}
                          </td>
                          <td
                            className={`whitespace-nowrap px-4 py-4 text-right text-sm font-medium sm:px-6 ${
                              entry.gfs !== undefined
                                ? getRainIntensityColor(entry.gfs)
                                : 'text-gray-400'
                            }`}
                          >
                            {formatOptionalRain(entry.gfs)}
                          </td>
                          <td
                            className={`whitespace-nowrap px-4 py-4 text-right text-sm font-medium sm:px-6 ${
                              entry.wrf !== undefined
                                ? getRainIntensityColor(entry.wrf)
                                : 'text-gray-400'
                            }`}
                          >
                            {formatOptionalRain(entry.wrf)}
                          </td>
                          <td
                            className={`whitespace-nowrap px-4 py-4 text-right text-sm font-medium sm:px-6 ${diffColor}`}
                          >
                            {formatDifference(difference)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statistiques du jour */}
            <div className="mt-2 flex justify-end space-x-6 text-xs text-gray-600 dark:text-gray-400">
              {hasGFS && (
                <div className="space-x-2">
                  <span className="font-medium">GFS:</span>
                  <span>
                    Total:{' '}
                    {entries
                      .reduce((sum, e) => sum + (e.gfs ?? 0), 0)
                      .toFixed(1)}{' '}
                    mm
                  </span>
                  <span>
                    Max:{' '}
                    {Math.max(...entries.map(e => e.gfs ?? 0)).toFixed(1)} mm
                  </span>
                </div>
              )}
              {hasWRF && (
                <div className="space-x-2">
                  <span className="font-medium">WRF:</span>
                  <span>
                    Total:{' '}
                    {entries
                      .reduce((sum, e) => sum + (e.wrf ?? 0), 0)
                      .toFixed(1)}{' '}
                    mm
                  </span>
                  <span>
                    Max:{' '}
                    {Math.max(...entries.map(e => e.wrf ?? 0)).toFixed(1)} mm
                  </span>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Légende */}
      <footer className="mt-8 space-y-4">
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            💡 Comment lire ce tableau ?
          </h3>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Chaque ligne indique la quantité de pluie tombée sur les{' '}
            <strong>3 heures précédentes</strong>. Par exemple, la ligne
            &quot;22h&quot; indique la pluie entre 19h et 22h.
          </p>
        </div>

        <div className="rounded-lg bg-purple-50 p-4 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            📊 À propos des modèles
          </h3>
          <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <p>
              <strong>GFS (Global Forecast System)</strong> : Modèle global
              américain, mise à jour toutes les 6h, résolution ~13 km
            </p>
            <p>
              <strong>WRF (Weather Research and Forecasting)</strong> : Modèle
              haute résolution (~3 km), plus précis localement
            </p>
            <p className="mt-2">
              <strong>Écart</strong> : La différence entre les deux modèles.
              Un écart important (🔴) indique une incertitude sur les
              prévisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Formate une quantité de pluie optionnelle
 */
function formatOptionalRain(mm: number | undefined): string {
  if (mm === undefined) return 'N/A';
  return formatRainAmount(mm);
}

/**
 * Calcule la différence absolue entre deux valeurs optionnelles
 */
function calculateDifference(
  gfs: number | undefined,
  wrf: number | undefined
): number | null {
  if (gfs === undefined || wrf === undefined) return null;
  return Math.abs(gfs - wrf);
}

/**
 * Formate la différence entre modèles
 */
function formatDifference(diff: number | null): string {
  if (diff === null) return '—';
  if (diff < 0.1) return '✓';
  return `${diff.toFixed(1)} mm`;
}

/**
 * Retourne une couleur selon l'importance de la différence
 */
function getDifferenceColor(diff: number | null): string {
  if (diff === null) return 'text-gray-400';
  if (diff < 0.5) return 'text-green-600'; // Accord excellent
  if (diff < 2) return 'text-yellow-600'; // Désaccord modéré
  return 'text-red-600'; // Désaccord important
}
