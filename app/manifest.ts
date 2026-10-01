import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Prévisions de pluie - La Bouëxière',
    short_name: 'Pluie',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      { src: '/icon2.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-v2-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-v2-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
