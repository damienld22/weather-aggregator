import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <main className="text-center px-4">
        {/* Icône météo */}
        <div className="mb-8 flex justify-center">
          <svg
            className="h-24 w-24 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
            />
          </svg>
        </div>

        {/* Titre */}
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Weather Aggregator
        </h1>

        {/* Description */}
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
          Agrégateur de prévisions météo pour La Bouëxière
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Données en temps réel depuis meteociel.fr
        </p>

        {/* Bouton principal */}
        <Link
          href="/meteo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
            />
          </svg>
          Voir les prévisions de pluie
        </Link>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div className="mb-2 text-3xl">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Données en temps réel
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Prévisions scrappées directement depuis meteociel.fr
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div className="mb-2 text-3xl">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Pluie sur 3 heures
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quantités précises de précipitations par période
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div className="mb-2 text-3xl">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Hyper local
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Prévisions spécifiques pour La Bouëxière (35340)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
