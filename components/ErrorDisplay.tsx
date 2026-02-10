/**
 * Composant d'affichage des erreurs avec bouton de réessai
 */

'use client';

import type { ScraperError } from '@/lib/scraper/types';

interface Props {
  error: Error | ScraperError;
  reset?: () => void;
}

export default function ErrorDisplay({ error, reset }: Props) {
  const isScraperError = 'type' in error;

  // Déterminer le titre selon le type d'erreur
  const title = isScraperError
    ? error.type === 'NETWORK_ERROR'
      ? 'Erreur de connexion'
      : error.type === 'PARSE_ERROR'
        ? 'Erreur de traitement'
        : 'Erreur de chargement'
    : 'Erreur inattendue';

  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-red-50 p-6 shadow-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {/* Icône d'erreur */}
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-red-800">{title}</h3>
          <p className="mt-2 text-sm text-red-700">{error.message}</p>

          {/* Afficher l'erreur originale en développement */}
          {process.env.NODE_ENV === 'development' &&
            isScraperError &&
            error.originalError && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                  Détails techniques
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900">
                  {error.originalError.stack || error.originalError.message}
                </pre>
              </details>
            )}

          {/* Bouton de réessai */}
          {reset && (
            <button
              onClick={reset}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
