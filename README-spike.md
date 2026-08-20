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

## Journal des étapes

### Étape 1 — Entrée « Fond PMTiles (test) » dans le switcher

**Fait :** modification de la seule fonction `addBaseLayerSwitcher` dans
`geosd-themes.js`. Ajout d'une entrée « Fond PMTiles (test) » au
sélecteur de fond de carte existant (OSM / Plan IGN / Orthophoto IGN),
via `leafletRasterLayer` du package `pmtiles` (pas `protomaps-leaflet`
pour ce premier essai).

**Dépendance externe ajoutée (signalée comme convenu) :** la
bibliothèque `pmtiles.js` (build UMD), chargée depuis un CDN
(jsdelivr, avec repli sur unpkg) au même endroit et selon le même
protocole que le chargement de Leaflet lui-même (`loadScript` /
`loadFromCandidates`, déjà présents dans le fichier). Aucune autre
dépendance ajoutée.

**Fond utilisé :** `https://tiles.jpg-cvl-dev.fr/tiles/CVL.pmtiles`
(Centre-Val de Loire, comme convenu pour simplifier ce premier test).
Les autres fichiers régionaux disponibles sur le même serveur ne sont
pas branchés à ce stade.

**Comportement attendu :** le fond PMTiles n'apparaît dans le switcher
que quelques instants après le chargement de la page (chargement
asynchrone de la bibliothèque), via `layersControl.addBaseLayer(...)` —
pas de blocage de l'initialisation de la carte. En cas d'échec de
chargement de la bibliothèque (tous les CDN indisponibles) ou d'échec
d'initialisation de la couche, un message est loggé en console
(`SPIKE PMTiles : ...`) et l'application continue de fonctionner
normalement avec les 3 fonds existants — aucune régression attendue
sur le reste de l'appli.

**Non modifié :** `geosd-terrain-saisie.html`, `geosd-common.css`,
`geosd-tokens.css` — inchangés à ce stade.

**Restant à observer (points 1 à 5 du spike, non vérifiables depuis cet
environnement — pas d'accès réseau/tablette ici) :**
1. Rendu effectif du fond une fois sélectionné.
2. Cohabitation avec `markersLayer` (clic, popup, formulaire).
3. Comportement en coupure réseau *effective* (mode avion) — à tester
   après un premier chargement en ligne, pour distinguer un problème de
   cache PMTiles d'un simple problème de connexion.
4. Poids / temps de chargement du `.pmtiles` sur tablette réelle.
5. Fidélité visuelle vs. `offline-map-lab`.

### Étape 2 — Page d'accueil pour tests sur dépôt GitHub Pages

**Fait :** ajout d'un fichier `index.html` à la racine, distinct de
tout ce qui précède (ce n'était pas prévu dans le périmètre initial
« une seule fonction modifiée », mais explicitement demandé pour
disposer d'un point d'entrée sur
`https://jpgofbdev.github.io/geosdspike/`). Cette page :
- rappelle le statut « spike jetable, hors production » ;
- explique ce qui a changé (entrée PMTiles dans le switcher) ;
- donne la marche à suivre pour tester (sélectionner le fond, cliquer
  sur la carte, repasser en mode avion) ;
- pointe vers les 5 points à vérifier ci-dessus ;
- contient un lien vers `geosd-terrain-saisie.html`.

Elle ne modifie ni ne dépend d'aucun des fichiers portés depuis GeoSD ;
elle peut être supprimée sans impact si le dépôt jetable est abandonné.
