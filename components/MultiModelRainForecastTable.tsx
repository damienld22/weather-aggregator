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
  const hasAROME = data.entries.some(e => e.arome !== undefined);
  const hasARPEGE = data.entries.some(e => e.arpege !== undefined);

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
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          {data.gfsLastUpdate && (
            <span className="rounded bg-blue-100 px-2 py-1 dark:bg-blue-900/30">
              <strong>GFS:</strong> {data.gfsLastUpdate}
            </span>
          )}
          {data.wrfLastUpdate && (
            <span className="rounded bg-purple-100 px-2 py-1 dark:bg-purple-900/30">
              <strong>WRF:</strong> {data.wrfLastUpdate}
            </span>
          )}
          {data.aromeLastUpdate && (
            <span className="rounded bg-green-100 px-2 py-1 dark:bg-green-900/30">
              <strong>AROME:</strong> {data.aromeLastUpdate}
            </span>
          )}
          {data.arpegeLastUpdate && (
            <span className="rounded bg-orange-100 px-2 py-1 dark:bg-orange-900/30">
              <strong>ARPEGE:</strong> {data.arpegeLastUpdate}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Source: meteociel.fr • Les valeurs indiquent la quantité de pluie sur
          3 heures
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
      {!hasAROME && (
        <div className="mb-6 rounded-lg bg-yellow-100 p-4 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          ⚠️ Les données du modèle AROME sont temporairement indisponibles.
        </div>
      )}
      {!hasARPEGE && (
        <div className="mb-6 rounded-lg bg-yellow-100 p-4 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          ⚠️ Les données du modèle ARPEGE sont temporairement indisponibles.
        </div>
      )}

      {/* Tableaux par jour */}
      <div className="space-y-8">
        {Object.entries(byDay).map(([day, entries]) => {
          // Calculer les totaux pour ce jour
          const gfsTotal = entries.reduce((sum, e) => sum + (e.gfs ?? 0), 0);
          const wrfTotal = entries.reduce((sum, e) => sum + (e.wrf ?? 0), 0);
          const aromeTotal = entries.reduce((sum, e) => sum + (e.arome ?? 0), 0);
          const arpegeTotal = entries.reduce((sum, e) => sum + (e.arpege ?? 0), 0);

          return (
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
                          Période (3h)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                          GFS {hasGFS && `(Total: ${gfsTotal.toFixed(1)} mm)`}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                          WRF {hasWRF && `(Total: ${wrfTotal.toFixed(1)} mm)`}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                          AROME {hasAROME && `(Total: ${aromeTotal.toFixed(1)} mm)`}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-6">
                          ARPEGE {hasARPEGE && `(Total: ${arpegeTotal.toFixed(1)} mm)`}
                        </th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {entries.map((entry, index) => (
                      <tr
                        key={`${day}-${entry.hour}-${index}`}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 sm:px-6">
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
                          className={`whitespace-nowrap px-4 py-4 text-right text-sm font-medium sm:px-6 ${
                            entry.arome !== undefined
                              ? getRainIntensityColor(entry.arome)
                              : 'text-gray-400'
                          }`}
                        >
                          {formatOptionalRain(entry.arome)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-4 text-right text-sm font-medium sm:px-6 ${
                            entry.arpege !== undefined
                              ? getRainIntensityColor(entry.arpege)
                              : 'text-gray-400'
                          }`}
                        >
                          {formatOptionalRain(entry.arpege)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </section>
          );
        })}
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
            <p>
              <strong>AROME</strong> : Modèle français de Météo-France, très haute
              résolution (~1.3 km), prévisions à court terme (48h)
            </p>
            <p>
              <strong>ARPEGE</strong> : Modèle global de Météo-France,
              résolution variable (~10 km sur la France), prévisions à 4 jours
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
  if (mm === undefined) return '/';
  return formatRainAmount(mm);
}
