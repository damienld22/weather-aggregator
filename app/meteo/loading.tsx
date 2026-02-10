/**
 * État de chargement pour la route /meteo
 * Affiché automatiquement pendant que page.tsx charge les données
 */

import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return <LoadingSpinner />;
}
