/**
 * Composant principal d'affichage des prévisions de pluie
 */

import type { RainForecast } from '@/lib/scraper/types';
import {
  formatDate,
  formatRainAmount,
  getRainIntensityColor,
  getRainIntensityBg,
} from '@/lib/utils/format';

interface Props {
  data: RainForecast;
}

export default function RainForecastTable({ data }: Props) {
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Prévisions de pluie - {data.location}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Mis à jour le {formatDate(data.fetchedAt)}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Source: meteociel.fr • Les valeurs indiquent la quantité de pluie sur
          3 heures
        </p>
      </header>

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
                        Quantité
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {entries.map((entry, index) => (
                      <tr
                        key={`${day}-${entry.hour}-${index}`}
                        className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${getRainIntensityBg(entry.amount)}`}
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 sm:px-6">
                          {entry.hour}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400 sm:px-6">
                          {entry.timeRange}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-4 text-right text-sm font-medium sm:px-6 ${getRainIntensityColor(entry.amount)}`}
                        >
                          {formatRainAmount(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statistiques du jour */}
            <div className="mt-2 flex justify-end space-x-4 text-xs text-gray-600 dark:text-gray-400">
              <span>
                Total:{' '}
                {entries.reduce((sum, e) => sum + e.amount, 0).toFixed(1)} mm
              </span>
              <span>
                Max: {Math.max(...entries.map((e) => e.amount)).toFixed(1)} mm
              </span>
            </div>
          </section>
        ))}
      </div>

      {/* Légende */}
      <footer className="mt-8 rounded-lg bg-blue-50 p-4 dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          💡 Comment lire ce tableau ?
        </h3>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Chaque ligne indique la quantité de pluie tombée sur les{' '}
          <strong>3 heures précédentes</strong>. Par exemple, la ligne
          &quot;22h&quot; indique la pluie entre 19h et 22h.
        </p>
      </footer>
    </div>
  );
}
