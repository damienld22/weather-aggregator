/**
 * Utilitaires de formatage pour l'affichage des données météo
 */

/**
 * Formate une date en français avec jour et heure
 * @param date - La date à formater
 * @returns La date formatée (ex: "lundi 10 février à 14:30")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formate une quantité de pluie en mm
 * @param mm - Quantité de pluie en millimètres
 * @returns La quantité formatée (ex: "0.3 mm", "Aucune")
 */
export function formatRainAmount(mm: number): string {
  if (mm === 0) return 'Aucune';
  if (mm < 0.1) return '< 0.1 mm';
  return `${mm.toFixed(1)} mm`;
}

/**
 * Retourne une classe Tailwind CSS selon l'intensité de la pluie
 * @param mm - Quantité de pluie en millimètres
 * @returns Classe CSS Tailwind pour la couleur
 */
export function getRainIntensityColor(mm: number): string {
  if (mm === 0) return 'text-gray-400';
  if (mm < 1) return 'text-blue-400';
  if (mm < 5) return 'text-blue-600';
  if (mm < 10) return 'text-blue-800';
  return 'text-blue-950 font-bold';
}

/**
 * Retourne une classe Tailwind CSS de fond selon l'intensité de la pluie
 * @param mm - Quantité de pluie en millimètres
 * @returns Classe CSS Tailwind pour le fond
 */
export function getRainIntensityBg(mm: number): string {
  if (mm === 0) return 'bg-white';
  if (mm < 1) return 'bg-blue-50';
  if (mm < 5) return 'bg-blue-100';
  if (mm < 10) return 'bg-blue-200';
  return 'bg-blue-300';
}
