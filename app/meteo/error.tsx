/**
 * Gestion des erreurs pour la route /meteo
 * Ce composant est affiché automatiquement si page.tsx throw une erreur
 */

'use client'; // OBLIGATOIRE pour error.tsx

import ErrorDisplay from '@/components/ErrorDisplay';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-black">
      <ErrorDisplay error={error} reset={reset} />
    </div>
  );
}
