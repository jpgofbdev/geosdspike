/* ============================================================
   SPIKE — Service Worker de pré-cache PMTiles (étape 20, cf.
   README-spike.md). Isolé, hors de l'application GeoSD.

   Principe : `pmtiles` continue de faire des requêtes HTTP avec
   en-tête `Range` vers TARGET_URL, exactement comme en ligne. Ce
   Service Worker intercepte uniquement ces requêtes précises et,
   si une copie locale existe en IndexedDB, découpe le Blob stocké
   avec Blob.slice() pour reconstruire une vraie réponse 206 —
   indiscernable pour `pmtiles` d'une réponse réseau. Sinon, laisse
   passer vers le réseau normalement (repli transparent).

   Même base IndexedDB que test-precache.html (nom de base, de
   magasin et de clé identiques) : c'est elle qui télécharge et
   stocke le fichier, ce Service Worker ne fait que le relire.
   ============================================================ */
const DB_NAME = 'geosd-spike-precache';
const STORE_NAME = 'regions';
const REGION_KEY = 'CVL';
const TARGET_URL = 'https://tiles.jpg-cvl-dev.fr/tiles/CVL.pmtiles';

self.addEventListener('install', () => {
  self.skipWaiting(); // active tout de suite, pas d'attente de fermeture des onglets
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim()); // prend le contrôle des pages déjà ouvertes
});

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function idbGet(key) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

self.addEventListener('fetch', event => {
  // Ne touche qu'aux requêtes vers le fichier ciblé ; tout le reste
  // (page HTML, leaflet.js, etc.) suit son chemin normal, inchangé.
  if (event.request.url.indexOf(TARGET_URL) !== 0) return;
  event.respondWith(handlePmtilesRequest(event.request));
});

async function handlePmtilesRequest(request) {
  let blob;
  try {
    blob = await idbGet(REGION_KEY);
  } catch (err) {
    blob = null;
  }

  if (!blob) {
    // Pas de copie locale : laisser passer vers le réseau (repli).
    return fetch(request);
  }

  const total = blob.size;
  const rangeHeader = request.headers.get('range');

  if (!rangeHeader) {
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(total),
        'Accept-Ranges': 'bytes'
      }
    });
  }

  const match = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
  if (!match) {
    return new Response(blob, { status: 200 });
  }
  const start = Number(match[1]);
  const end = match[2] !== undefined ? Number(match[2]) : total - 1;
  const chunk = blob.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Content-Length': String(chunk.size),
      'Accept-Ranges': 'bytes'
    }
  });
}
