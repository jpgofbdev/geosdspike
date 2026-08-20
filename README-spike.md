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

### Étape 3 — Écart constaté : `CVL.pmtiles` est vectoriel, pas raster

**Attendu :** afficher `CVL.pmtiles` via `pmtiles` + `leafletRasterLayer`
(choix volontaire de commencer par la version la plus simple, cf.
consigne initiale du spike — explicitement pas `protomaps-leaflet`
pour ce premier essai).

**Observé :** erreur à l'exécution —

```
Error: archive contains MVT vector tiles, but leafletRasterLayer is for
displaying raster tiles. See https://github.com/protomaps/PMTiles/tree/main/js
for details.
```

`CVL.pmtiles` (et vraisemblablement les autres fichiers régionaux du
même serveur, non vérifié individuellement) contient des tuiles
vectorielles (MVT), pas des tuiles raster pré-rendues. `leafletRasterLayer`
ne peut structurellement pas les afficher : ce n'est pas un problème de
configuration mais une incompatibilité de format.

**Ajustement :** remplacement de `pmtiles` + `leafletRasterLayer` par
`protomaps-leaflet` (`protomapsL.leafletLayer(...)`), qui lit le format
PMTiles en interne et sait rendre du vectoriel dans Leaflet. Toujours
uniquement dans `addBaseLayerSwitcher`, toujours en chargement paresseux
via le même protocole CDN-avec-repli. Thème `light` (fourni nativement
par la lib) utilisé comme point de départ, non encore comparé
visuellement à `offline-map-lab` (point 5, toujours ouvert).

**Conséquence pour la suite du spike :** cet écart ne change rien aux 5
points à vérifier, mais déplace une partie de la question du point 4
(poids/mode de chargement) — le vectoriel se comporte différemment du
raster en usage hors connexion (rendu à la volée côté client vs. tuiles
pré-rendues), à garder en tête en testant le mode avion (point 3).

**Statut à ce stade :** changement de lib effectué, non encore revérifié
en conditions réelles (pas d'accès réseau/tablette depuis cet
environnement) — à confirmer que l'erreur a bien disparu et que le
fond s'affiche correctement avant de passer au point 2.

### Étape 4 — Rendu très différent du prototype MapLibre (point 5)

**Observé (test réel sur le dépôt GitHub Pages) :** l'erreur de
l'étape 3 a bien disparu, le fond PMTiles se charge et s'affiche, mais
le rendu ne montre que l'hydrographie (cours d'eau/plans d'eau en
bleu clair) sur fond gris uni — pas de routes, pas de bâti, pas
d'occupation du sol, aucun libellé. Écart important par rapport au
prototype `offline-map-lab` (MapLibre).

**Diagnostic (pas encore confirmé — à vérifier) :** le thème `light`
intégré à `protomaps-leaflet` est câblé sur les noms de couches du
schéma *basemap* standard de Protomaps (`landuse`, `water`, `roads`,
`buildings`, `physical_line`, `places`...). Si `CVL.pmtiles` utilise un
schéma de couches différent (probable, vu que le tuileset alimentait à
l'origine un style MapLibre sur mesure), la plupart des règles de style
du thème ne correspondent à aucune couche réelle du fichier — seule
l'eau s'affiche, sans doute par coïncidence de nom de couche entre les
deux schémas.

**Bloqué en attente d'info pour corriger proprement :** il faut
connaître le schéma réel de couches de `CVL.pmtiles` (liste des noms
de layers, éventuellement via le viewer pmtiles.io ou `pmtiles show`
en CLI) et/ou récupérer le `style.json` du prototype MapLibre
`offline-map-lab`, pour construire des `PaintRule`/`LabelRule`
`protomaps-leaflet` sur mesure au lieu du thème générique. Pas de
correction tentée à l'aveugle tant que cette info n'est pas disponible.

### Étape 5 — Règles de style sur mesure (remplace le thème générique)

**Info reçue :** schéma de couches réel du tuileset (confirmé par
inspection pmtiles.io) — `aerodrome_label`, `aeroway`, `boundary`,
`building`, `housenumber`, `landcover`, `landuse`, `mountain_peak`,
`park`, `place`, `poi`, `transportation`, `transportation_name`,
`water`, `water_name`, `waterway`. Schéma proche d'OpenMapTiles. Plus
le `style.json` MapLibre exact du prototype `offline-map-lab`.

**Fait :** remplacement de `theme: 'light'` par des `paint_rules` /
`label_rules` construites à la main dans `addBaseLayerSwitcher`,
couche par couche, en transposant fidèlement le `style.json` fourni :
`landuse` (fond beige clair, minzoom 6), `landcover` filtré par
`class` (bois en vert, prairie/parc en vert clair, minzoom 10), `water`
(bleu plein), `waterway` scindé en deux règles filtrées par
`class`/`intermittent` (cours d'eau permanents en bleu soutenu,
fossés/intermittents en tirets plus clairs, largeurs interpolées par
zoom via une petite fonction `pmtilesLerp` qui reproduit les
expressions `interpolate`/`linear` du style d'origine), `transportation`
(routes grises), puis labels pour `waterway` (deux variantes,
mêmes filtres que les lignes), `transportation_name` (coalesce
`name:fr`/`name`) et `place` (idem, taille interpolée par zoom).
Fond de carte mis à blanc (`backgroundColor:'#ffffff'`) pour
correspondre à la couche `bg` du style d'origine.

**Toujours dans le seul périmètre de `addBaseLayerSwitcher`** — rien
d'autre modifié dans le fichier.

**Deux réserves explicites, non vérifiables depuis cet environnement
(pas d'accès réseau ici), à confirmer au test réel :**
1. Le rendu en tirets des cours d'eau intermittents (option `dash` du
   `LineSymbolizer`) — nom d'option supposé d'après la doc de la lib,
   pas testé en conditions réelles.
2. Le suivi du tracé par les libellés de cours d'eau/routes.
   `symbol-placement:"line"` (MapLibre) n'a probablement pas
   d'équivalent garanti dans `protomaps-leaflet` : ces libellés
   s'afficheront vraisemblablement à un point plutôt que le long de la
   ligne. Dégradation acceptée pour ce premier essai — à confirmer ou
   infirmer au test, et à noter comme écart connu si c'est bien le cas.

**Non couvert volontairement pour rester au plus près du style
d'origine (qui ne les utilisait pas non plus) :** `building`,
`housenumber`, `poi`, `aeroway`, `aerodrome_label`, `mountain_peak`,
`boundary`, `water_name`. Pourraient être ajoutés dans un essai
ultérieur si la fidélité au prototype MapLibre le demande.

**Statut :** changement effectué, non encore revérifié en conditions
réelles.

### Étape 6 — Diagnostic : rien ne s'affiche avec le style complet

**Observé (test réel) :** avec les règles complètes de l'étape 5, plus
rien ne s'affiche du tout (même plus l'eau, qui s'affichait à l'étape 4
avec le thème générique) — juste le fond blanc (`backgroundColor`).
Aucune erreur en console.

**Hypothèse :** une exception silencieuse dans une des fonctions
passées aux règles (`filter`, `width` en fonction de zoom, `font` en
fonction de zoom, `dash`...) fait probablement avorter tout le rendu
de la tuile côté `protomaps-leaflet`, sans remonter d'erreur exploitable
en console — ce type de lib avale souvent les exceptions internes au
lieu de les propager. Sans accès réseau pour tester ici, deviner quelle
fonction précisément pose problème serait peu fiable.

**Action :** bascule temporaire sur un jeu de règles minimal
(`PMTILES_DEBUG_MODE = true` en tête du bloc, dans
`addBaseLayerSwitcher`) : une seule règle, `water` en rouge vif, sans
filtre ni fonction. Objectif : confirmer si le rattachement de base
(`dataLayer` ↔ couche réelle du tuileset) fonctionne au moins pour le
cas le plus simple possible, avant de réintroduire progressivement les
filtres et fonctions un par un. Les règles complètes de l'étape 5 sont
conservées dans le code (`paint_rules_full` / `label_rules_full`),
prêtes à être réactivées en repassant `PMTILES_DEBUG_MODE` à `false`.

**Prochain test attendu :** si l'eau apparaît en rouge → le câblage de
base fonctionne, le problème vient d'une des fonctions plus élaborées
(à réintroduire une par une pour isoler laquelle). Si rien n'apparaît
même en rouge → problème plus en amont (nom de couche, zoom/étendue de
la vue, chargement du fichier lui-même) — vérifier alors l'onglet
Réseau du navigateur pour confirmer que `CVL.pmtiles` est bien
téléchargé (requêtes avec statut 200, pas d'erreur CORS).

**Statut :** en attente du résultat de ce test avant de poursuivre.

### Étape 6 bis — Ajustement du diagnostic (routes plutôt qu'eau)

**Constat sur le test réel :** `CVL.pmtiles` répond en **206** (requêtes
par plages d'octets) dans l'onglet Réseau — le fichier est bien
accessible et lu, pas de souci réseau/CORS à ce niveau. Mais la vue
testée était très zoomée sur un point précis, où il n'y a
vraisemblablement aucune eau à proximité immédiate : la règle de
diagnostic `water` (localisée par nature) n'était donc pas le bon choix
pour confirmer que le rattachement de base fonctionne — son absence de
rendu ne prouve rien dans ce cas précis.

**Ajustement :** règle de diagnostic remplacée par `transportation`
(les routes), quasi omniprésentes, beaucoup plus fiable comme test de
présence à n'importe quel endroit de la carte.

**Prochain test attendu :** si des lignes rouges (routes) apparaissent
→ le rattachement de base fonctionne, le problème vient bien d'une des
fonctions plus élaborées du style complet (à réintroduire une par une).
Si toujours rien → creuser plus profondément (vérifier la console pour
le message d'avertissement `PMTILES_DEBUG_MODE actif`, confirmant que
le bon code est bien déployé, et éventuellement dézoomer pour retrouver
une vue proche de celle de l'étape 4 où l'eau s'affichait).
