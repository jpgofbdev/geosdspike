# geosdspike — hors connexion Leaflet + PMTiles

**Statut : expérimentation isolée. Ne fait pas partie de GeoSD.**
Dépôt et projet Claude séparés du projet GeoSD principal — voir ce dépôt
comme jetable : soit le résultat est concluant et vient nourrir une
décision documentée dans GeoSD, soit il est abandonné sans laisser de
trace dans le projet réel.

## Point de départ

Fichiers portés depuis GeoSD (production), à la date de ce spike :
- `geosd-terrain-saisie.html` — l'application terrain la plus exigeante
  (clic sur la carte → popup → formulaire), choisie comme cas de test
  car c'est elle qui doit prouver que le fond PMTiles cohabite avec des
  marqueurs interactifs.
- `geosd-themes.js` — dépendance requise (THEMES, TERRITOIRES,
  `addBaseLayerSwitcher`, `loadLeaflet`...) : `geosd-terrain-saisie.html`
  ne fonctionne pas seul.
- `geosd-common.css` + `geosd-tokens.css` — dépendances requises pour
  l'affichage.

`geosd-admin.html` et `geosd-terrain-consultation.html` volontairement
**non portés** : hors périmètre du spike (l'admin n'a pas de besoin
hors-ligne ; la consultation partage le même enjeu de fond de carte que
la saisie, sans complexité supplémentaire à valider en premier).

## Ce que ce spike doit établir

1. Rendu du fond `protomaps-leaflet` (ou `leafletRasterLayer` de
   `pmtiles`) **sur tablette Android réelle**, pas seulement en
   développement desktop.
2. Cohabitation du fond PMTiles avec la couche de marqueurs interactive
   existante (`markersLayer`, popup, formulaire de saisie).
3. Comportement en coupure réseau **effective** (mode avion), pas
   seulement onglet resté ouvert.
4. Poids et mode de distribution du fichier `.pmtiles` régional dans un
   contexte proche de GeoSD (livré à côté du HTML, pas de serveur dédié).
5. Fidélité visuelle par rapport au prototype MapLibre initial
   (`offline-map-lab`), pour juger si l'écart est acceptable.

## Verdict attendu en fin de spike

Une conclusion écrite explicite — « ça tient, sous ces conditions » ou
« ça ne tient pas, pour telle raison précise » — avant tout retour vers
le dépôt GeoSD. Voir `JOURNAL_DECISIONS.md` de GeoSD pour le format
attendu de ce type d'arbitrage.

## Ne pas faire

- Ne pas modifier ces fichiers dans le dépôt GeoSD original en
  parallèle du spike.
- Ne pas réintégrer de code ici vers GeoSD avant que le verdict
  ci-dessus soit tranché.
