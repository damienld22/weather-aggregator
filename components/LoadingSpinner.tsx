/**
 * Composant d'affichage du chargement avec spinner animé
 */

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* Spinner animé */}
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>

        {/* Texte de chargement */}
        <p className="mt-4 text-lg text-gray-600">
          Chargement des prévisions météo...
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Récupération des données depuis meteociel.fr
        </p>
      </div>
    </div>
  );
}
