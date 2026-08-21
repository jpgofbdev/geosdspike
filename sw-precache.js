/* ============================================================
   GeoSD — Service Worker de pré-cache du fond de carte PMTiles.

   Principe : la bibliothèque `pmtiles` fait des requêtes HTTP avec
   en-tête `Range` vers un fichier régional (ex. CVL.pmtiles), que ce
   soit en ligne ou hors ligne — son code ne change jamais. Ce Service
   Worker intercepte uniquement ces requêtes précises et, si une copie
   de la région demandée existe en IndexedDB (téléchargée via le
   module geosd-offline-map.js), découpe le fichier stocké avec
   Blob.slice() pour reconstruire une vraie réponse 206 — indiscernable
   pour `pmtiles` d'une réponse réseau. Sinon, laisse passer vers le
   réseau normalement (repli transparent, y compris si la région
   demandée n'a jamais été téléchargée).

   Base IndexedDB partagée avec geosd-offline-map.js (mêmes noms de
   base et de magasin) : ce fichier ne fait que la lire, c'est
   geosd-offline-map.js qui l'alimente lors d'un téléchargement.
   ============================================================ */
const PMTILES_BASE_URL = 'https://tiles.jpg-cvl-dev.fr/tiles/';
const DB_NAME = 'geosd_pmtiles_offline';
const STORE_NAME = 'regions';

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

// Extrait le code région (ex. "CVL") d'une URL de tuileset, ou null si
// l'URL ne correspond pas au schéma attendu — dans ce cas la requête
// n'est pas concernée par ce Service Worker et suit son chemin normal.
function regionCodeFromUrl(url) {
  if (url.indexOf(PMTILES_BASE_URL) !== 0) return null;
  const rest = url.slice(PMTILES_BASE_URL.length);
  const match = /^([A-Za-z0-9_-]+)\.pmtiles/.exec(rest);
  return match ? match[1] : null;
}

self.addEventListener('fetch', event => {
  const code = regionCodeFromUrl(event.request.url);
  if (!code) return; // pas une requête de tuileset régional : ne pas intercepter
  event.respondWith(handlePmtilesRequest(event.request, code));
});

async function handlePmtilesRequest(request, code) {
  let blob;
  try {
    blob = await idbGet(code);
  } catch (err) {
    blob = null;
  }

  if (!blob) {
    // Région pas (ou plus) téléchargée localement : laisser passer
    // vers le réseau normalement (repli transparent).
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
