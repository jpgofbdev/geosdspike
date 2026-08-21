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

### Étape 7 — Hypothèse sur-zoom (`maxDataZoom`)

**Observé (test réel, règle minimale `transportation` en rouge) :**
toujours rien, sans la moindre erreur — ni erreur de construction de
la couche, ni erreur interne à `protomaps-leaflet`. `CVL.pmtiles` se
charge bien (206 confirmés dans l'onglet Réseau). Le message de log de
debug affichait encore « eau en rouge » dans la capture fournie — texte
resté obsolète par erreur lors du passage à la règle « routes » à
l'étape 6 bis (corrigé maintenant, la logique elle-même utilisait bien
`transportation`).

**Piste retenue :** dans les traces fournies, les tuiles OSM en échec à
côté sont au niveau **zoom 19** — un zoom très profond (échelle
parcelle). Les tuilesets vectoriels type OpenMapTiles montent
généralement au-delà rarement du zoom natif 14. Sans sur-zoom (agrandir
côté client la tuile la plus profonde disponible plutôt que d'aller en
chercher une qui n'existe pas), demander une zone à un niveau que
l'archive ne couvre pas donnerait exactement ce qui est observé : rien,
sans erreur.

**Fait :** ajout de l'option `maxDataZoom: 14` à `P.leafletLayer(...)`
pour déclencher le sur-zoom automatique de `protomaps-leaflet`
au-delà du zoom natif de l'archive. Valeur 14 = hypothèse la plus
courante pour ce type de schéma, **non confirmée pour `CVL.pmtiles`
spécifiquement** — à vérifier/ajuster via les métadonnées de l'archive
(le viewer pmtiles.io affiche le zoom max réel).

**Statut :** en attente du résultat de ce test. Si des lignes rouges
apparaissent maintenant, l'hypothèse est confirmée — il faudra alors
lire le vrai zoom max de l'archive (pmtiles.io) pour remplacer la
valeur `14` par la bonne, avant de repasser aux règles complètes. Si
toujours rien, dézoomer manuellement la carte à un niveau nettement
plus large (région/département) sera le test suivant pour trancher
entre "problème de zoom" et "autre chose".

### Étape 8 — Cause racine trouvée : `paintRules`/`labelRules` (camelCase), pas `paint_rules`/`label_rules`

**Observé :** aucun changement, à aucun niveau de zoom, depuis le
début — invalidant l'hypothèse du sur-zoom de l'étape 7.

**Diagnostic final :** demande faite d'inspecter directement l'objet
`protomapsL` en console (`Object.keys(protomapsL)`). Résultat :
`PolygonSymbolizer`, `LineSymbolizer`, `TextSymbolizer`, `leafletLayer`
confirmés — mais aussi `paintRules` et `labelRules`, en **camelCase**.
Les options passées à `P.leafletLayer({...})` depuis l'étape 5
utilisaient `paint_rules`/`label_rules` (snake_case, erreur de ma
part — mélange avec une convention d'une autre lib/version). Ces clés
n'étant pas celles attendues, elles étaient silencieusement ignorées :
la couche se créait avec un jeu de règles vide, d'où un rendu blanc à
tous les niveaux de zoom, sans la moindre erreur — cohérent avec tout
ce qui a été observé depuis l'étape 6.

**Corrigé :** dans l'appel à `P.leafletLayer(...)`, les clés sont
maintenant `paintRules: paint_rules` et `labelRules: label_rules` (les
noms de variables internes n'ont pas changé, seule la clé transmise à
la fonction). `PMTILES_DEBUG_MODE` repassé à `false` : le style complet
de l'étape 5 (occupation du sol, eau, cours d'eau permanents/
intermittents, routes, libellés) est de nouveau actif.

**Non vérifié depuis cet environnement (pas d'accès réseau ici) :** à
confirmer au prochain test réel — normalement le rendu devrait
maintenant se rapprocher nettement du prototype MapLibre. Les deux
réserves de l'étape 5 (rendu des tirets `dash`, libellés qui ne
suivront probablement pas le tracé des lignes) restent d'actualité et
sont les prochains points à observer une fois l'affichage de base
confirmé.

### Étape 9 — Confirmation : le rendu fonctionne

**Observé (test réel) :** rendu conforme aux attentes — routes en
gris, occupation du sol en vert clair, cours d'eau en bleu avec
distinction visible entre tracé principal et affluents, et **les
libellés (L'Yèvre, Canal de Berry, Le Moulon...) suivent bien le tracé
des cours d'eau**, contrairement à la réserve exprimée à l'étape 5 —
`TextSymbolizer` de `protomaps-leaflet` gère donc le placement le long
des lignes mieux qu'anticipé, au moins pour ce cas d'usage. Point 1 du
spike (rendu correct du fond une fois sélectionné) validé sur cette
zone/ce niveau de zoom.

**Reste à vérifier explicitement (voir points 2 à 5 du spike, en tête
de ce document) :**
- Le rendu en tirets des cours d'eau intermittents (pas nécessairement
  présents dans la zone visible sur cette capture — à confirmer sur
  une zone qui en contient).
- Point 2 — cohabitation avec `markersLayer` : cliquer sur la carte
  avec ce fond actif, vérifier que la popup/le formulaire de saisie
  s'ouvrent et fonctionnent normalement par-dessus.
- Point 3 — mode avion, une fois le fond chargé en ligne.
- Point 4 — poids/temps de chargement sur tablette réelle.
- Point 5 — fidélité visuelle fine vs `offline-map-lab` (comparaison
  côte à côte, au-delà du fait que "ça ressemble" globalement).

### Étape 10 — Point 2 validé

**Observé (test réel) :** clic sur la carte avec le fond PMTiles actif
→ la modale de saisie (thématique, sous-type, champs, autocomplétion
commune) s'ouvre normalement par-dessus le fond vectoriel, exactement
comme avec les autres fonds. Aucun conflit détecté entre
`protomaps-leaflet` et `markersLayer`/les gestionnaires de clic
existants.

**Bilan des 5 points du spike à ce stade :**
1. ✅ Rendu correct du fond une fois sélectionné (étape 9).
2. ✅ Cohabitation avec `markersLayer`, popup, formulaire (cette étape).
3. ⏳ Comportement en coupure réseau effective (mode avion) — pas
   encore testé.
4. ⏳ Poids / mode de chargement compatibles avec un usage tablette —
   pas encore testé.
5. ⏳ Fidélité visuelle fine vs `offline-map-lab` — validée
   globalement à l'étape 9, pas encore comparée en détail.

### Étape 11 — Point 3 : le mode avion révèle l'absence de pré-cache

**Observé (test réel, mode avion effectif) :** une fois la connexion
coupée, seules les tuiles déjà visitées en ligne restent affichées —
toute zone non parcourue au préalable reste vide.

**Analyse :** `protomaps-leaflet` lit `CVL.pmtiles` par requêtes HTTP
en plages d'octets (`206 Partial Content`, déjà observés dans l'onglet
Réseau aux étapes précédentes), et ne récupère que ce dont il a besoin
au fur et à mesure du déplacement sur la carte — comportement paresseux
par nature, sans mécanisme de pré-téléchargement ni de mise en cache
explicite dans la configuration actuelle. Le cache HTTP par défaut du
navigateur peut retenir une partie de ce qui a déjà transité, mais rien
ne garantit sa persistance ni sa couverture — ce n'est pas prévu pour
un usage hors connexion.

**Conséquence pour le point 3 : ⚠️ ne fonctionne pas nativement.** Pour
un usage terrain réel — un agent qui se déplace dans des zones pas
forcément visitées en ligne au préalable — ce comportement ne suffit
pas : le fond doit être disponible sur des zones jamais parcourues en
ligne, pas seulement sur celles déjà vues.

**Ce qu'il faudrait pour un vrai support hors connexion (non
implémenté à ce stade, nécessite une décision avant de poursuivre) :**
- Un mécanisme de mise en cache explicite — typiquement un Service
  Worker + Cache API — capable de conserver tout ou partie du fichier
  `.pmtiles` indépendamment du cache HTTP incident du navigateur.
- Une étape assumée de préparation avant tournée (« télécharger cette
  zone pour hors-ligne »), plutôt que de compter sur la navigation
  effective de l'agent pour peupler le cache.
- Ceci rejoint directement les points 3 et 4 du README-spike.md
  d'origine (poids/mode de distribution du fichier), qui anticipaient
  déjà cette question de fond.

**Statut :** constat établi, pas de correctif tenté à ce stade — c'est
un choix d'architecture (pas un bug ponctuel), à trancher avant
d'aller plus loin : soit explorer un mécanisme de pré-cache comme
prochaine étape du spike, soit consigner ce point comme limitation
connue dans le verdict final.

### Étape 12 — Test de faisabilité isolé : pré-cache via IndexedDB

**Décision (suite à discussion) :** explorer un module de gestion
explicite du fond hors-ligne (une région PMTiles entière téléchargée à
la demande, gérée par l'utilisateur — pas un simple cache HTTP
incident). Stockage retenu pour amorcer les tests : **IndexedDB**
(plutôt que Cache Storage), sur la base d'un contexte 100% Chrome /
Chrome-PWA sur Android annoncé par l'équipe — ce qui réduit fortement
les risques historiquement associés à IndexedDB + gros `Blob` (surtout
documentés sur WebKit/Safari, hors périmètre ici). Cache Storage
resterait le choix de repli si le test ci-dessous échoue et qu'il faut
basculer vers un Service Worker interceptant des requêtes `Range`.

**Avant de construire l'interface finale (téléchargement piloté,
jauge d'espace, purge...) :** un test minimal et isolé, dans un fichier
séparé, **`test-precache.html`**, à la racine du dépôt — ne touche à
rien d'autre. Objectif unique : vérifier que `protomaps-leaflet` peut
construire une couche à partir d'un fichier `.pmtiles` stocké
localement (`Blob` en IndexedDB), sans requête réseau vers le fichier
d'origine.

**Ce que fait la page :**
1. Bouton « Télécharger et stocker » : télécharge `CVL.pmtiles` en
   entier (avec suivi de progression), le stocke en IndexedDB
   (`geosd-spike-precache` / store `regions`, clé `CVL`), demande un
   stockage persistant (`navigator.storage.persist()`), affiche le
   quota (`navigator.storage.estimate()`).
2. Bouton « Charger depuis le stockage local » : relit le `Blob` en
   IndexedDB, essaie plusieurs façons de construire une instance
   `protomapsL.PMTiles` à partir de ce `Blob` (aucune ne pouvant être
   garantie sans test réel, cf. déjà l'épisode `paintRules`/
   `labelRules`) — logue clairement laquelle fonctionne, ou affiche le
   code source du constructeur si aucune ne passe, pour lecture
   directe plutôt que nouvelle supposition à l'aveugle.
3. Si une instance est obtenue, tente d'afficher une carte minimale
   (eau + routes) avec cette source locale.
4. Bouton « Purger » pour repartir de zéro.

**Marche à suivre pour le test réel :** télécharger avec le réseau
actif, couper réellement le réseau (mode avion), recharger la page,
puis « Charger depuis le stockage local ». Si la carte s'affiche à ce
moment-là, l'hypothèse (lecture 100% locale, sans Service Worker) est
validée et on peut construire l'interface finale dessus.

**Non modifié :** aucun fichier existant du spike n'est touché par
cette étape — page entièrement à part, jetable si l'hypothèse échoue.

**Statut :** en attente du test réel (pas d'accès réseau depuis cet
environnement pour le faire en amont).

### Étape 13 — Protocole de test corrigé : ne pas recharger la page

**Observé :** après coupure réseau, F5 échoue purement et simplement —
la page ne se recharge pas du tout.

**Diagnostic :** confusion entre deux problèmes distincts. `Blob`
stocké en IndexedDB (les *données* cartographiques) est bien un sujet
à part du cache de *l'application elle-même* (le HTML de
`test-precache.html`, `leaflet.js`, `protomaps-leaflet.js` chargés
depuis un CDN) — rien de tout ça n'est mis en cache par la page de
test, donc un F5 hors connexion échoue avant même d'atteindre le code
qui lit IndexedDB. Ce n'est pas un défaut de l'hypothèse testée.

**Protocole corrigé :** ne pas recharger la page après la coupure
réseau. Garder l'onglet ouvert (HTML/JS déjà en mémoire), couper le
réseau, cliquer directement sur « 2. Charger depuis le stockage
local ». Correspond d'ailleurs mieux au cas d'usage terrain le plus
probable : l'agent ouvre l'application le matin avec du réseau, puis
perd la connexion en cours de tournée sans fermer l'onglet.

**Question distincte, mise de côté pour l'instant :** le cas "tablette
éteinte toute la nuit / onglet fermé, rouvert sans réseau" nécessite en
plus un cache de l'application elle-même (Service Worker/PWA pour
HTML/JS/CSS) — un sujet à part entière, hors du périmètre de ce spike
(qui porte sur le fond de carte), à noter comme question ouverte pour
une éventuelle suite si GeoSD doit un jour fonctionner dès l'ouverture
sans aucun réseau.

**Statut :** en attente du nouveau test (sans rechargement de page).

### Étape 14 — Résultat positif : `new PMTiles(blob)` fonctionne

**Observé (test réel) :** premier clic sur « Charger depuis le
stockage local » → `Blob` récupéré (350.8 Mo), `new P.PMTiles(blob)`
réussi directement (pas besoin de l'essai de repli `File`), couche
ajoutée à la carte sans erreur. Un second clic (sur le même
chargement) a échoué avec `Map container is already initialized` —
bug de la page de test elle-même (elle recréait une carte Leaflet dans
le même conteneur au lieu de réutiliser l'existante), sans rapport
avec PMTiles/IndexedDB. Corrigé dans `test-precache.html` (réutilise
la carte existante si déjà créée).

**Portée de la validation :** l'hypothèse centrale — lire un
`.pmtiles` stocké en `Blob` local (IndexedDB) directement via
`new protomapsL.PMTiles(blob)`, sans requête réseau ni Service Worker
— fonctionne. Reste à confirmer avec une certitude totale que le
réseau était bien coupé au moment de ce test précis (l'icône de la
barre de statut Android laissait un doute) — via l'onglet Réseau des
DevTools, filtré sur "CVL", pour vérifier qu'aucune requête n'y
apparaît pendant le test hors-ligne.

**Conséquence :** le stockage IndexedDB retenu à l'étape 12 est
confirmé viable pour ce cas d'usage, sans avoir besoin de basculer sur
Cache Storage + Service Worker. La prochaine étape peut être la
construction de l'interface de gestion explicite du fond hors-ligne
(téléchargement piloté par région, jauge d'espace avec avertissement,
changement de région, purge) telle que discutée, directement sur cette
base.

**Statut :** validation forte, confirmation finale (réseau
effectivement coupé) en attente.

### Étape 15 — Messages OK mais carte blanche : ordre de chargement CSS

**Observé (test réel, hors ligne confirmé) :** tous les messages de
`test-precache.html` positifs (`Blob` récupéré, `PMTiles` construit,
couche ajoutée), mais la zone de carte reste blanche.

**Diagnostic :** dans `test-precache.html`, `leaflet.css` était chargé
après `leaflet.js` (au lieu d'être dans le `<head>`). Piège classique
de Leaflet : si la carte s'initialise avant que la feuille de style
soit appliquée, le dimensionnement interne des tuiles est cassé, ce
qui donne un rendu blanc/vide alors même que les données sont bien là
— sans rapport avec PMTiles/IndexedDB. Sans lien avec l'hypothèse
testée.

**Corrigé :** `leaflet.css` déplacé dans le `<head>`, avant tout
script. Ajout d'un appel `map.invalidateSize()` après la création de
la couche, en filet de sécurité supplémentaire.

**Portée :** cette étape confirme, avec un test réellement hors ligne
cette fois, que l'hypothèse centrale tient (lecture de `PMTiles` depuis
un `Blob` IndexedDB, sans réseau). Il ne restait qu'un bug d'affichage
dans la page de test elle-même.

**Statut :** correctif appliqué, en attente de re-test.

### Étape 16 — Isoler le problème : test en ligne d'abord

**Suggestion pertinente reçue :** tester l'affichage de la couche
construite depuis le stockage local **sans couper le réseau au
préalable**, pour isoler si le problème vient du hors-ligne en tant
que tel ou du branchement `Blob`/`PMTiles`/`leafletLayer` (qui reste
une supposition non vérifiée, comme `paintRules`/`labelRules`
avant lui — l'option exacte pour transmettre une source locale à
`leafletLayer` n'est pas documentée avec certitude).

**Ajouté à `test-precache.html` :**
- Marche à suivre revue : test en ligne d'abord (télécharger, puis
  charger depuis le stockage local sans couper le réseau), coupure
  réseau ensuite pour confirmer que ça donne le même résultat.
- Bascule pour choisir la source transmise à `leafletLayer` : instance
  `PMTiles` déjà construite (comportement précédent) vs `Blob` brut
  directement — les deux sont plausibles selon les cas d'usage
  généralement documentés pour ce type de lib, aucune confirmée pour
  cette version précise sans test.
- Compteurs d'événements `tileload`/`tileerror` sur la couche, avec un
  message après 3 secondes si aucun événement de tuile n'a été détecté
  du tout — signal concret indépendant du rendu visuel, pour savoir si
  la couche essaie ne serait-ce que de charger des tuiles.

**Statut :** en attente du résultat (test en ligne d'abord, avec les
deux options de la bascule si besoin).

### Étape 17 — Ça charge (16 tuiles) mais avec des erreurs de cache internes

**Observé (test réel, en ligne, source = instance PMTiles) :** de
nombreuses erreurs `TypeError: source.getKey is not a function`,
provenant de `SharedPromiseCache.getHeader` à l'intérieur de la
bibliothèque `pmtiles` embarquée dans `protomaps-leaflet` — mais
malgré ces erreurs, le compteur de diagnostic affiche finalement
**16 tuiles chargées, 0 en erreur de tuile**.

**Diagnostic :** la couche interne de cache d'en-tête PMTiles s'attend
à ce que l'objet `source` expose des méthodes (`getKey` notamment,
probablement utilisée pour clé de cache) — un `Blob` brut stocké tel
quel dans notre instance ne les a pas. L'optimisation de cache échoue
donc silencieusement (avec erreur loguée) à chaque tentative, mais la
lecture des données semble malgré tout aboutir par un autre chemin
— cohérent avec le fait que des tuiles finissent par charger. Piste
de performance à surveiller (relecture/re-parsing redondant de
l'en-tête à chaque tuile ?) plutôt que blocage fonctionnel, à confirmer
une fois l'affichage visuel validé.

**Prochain test :** confirmer si la carte affiche effectivement du
contenu malgré ces erreurs, et comparer avec la bascule « Blob brut »
(passer directement le `Blob` à `leafletLayer` plutôt qu'une instance
`PMTiles` pré-construite à la main) — pourrait laisser la bibliothèque
envelopper elle-même la source correctement et éviter ces erreurs.

**Statut :** en attente de confirmation visuelle + test de la variante
Blob brut.

### Étape 18 — Nouvel échec, deux méthodes internes différentes en cause

**Observé (test réel) :** aucune des deux options de la bascule
n'affiche quoi que ce soit, chacune avec une erreur interne différente :
- Instance PMTiles : `source.getKey is not a function`
  (`SharedPromiseCache.getHeader`).
- Blob brut : `this.p.getZxy is not a function`
  (`PmtilesSource.get`).

**Analyse :** deux chemins de code différents dans la bibliothèque,
deux méthodes manquantes différentes sur l'objet source interne — mais
le même symptôme final. Ce n'est plus une question de "quel paramètre
passer" : le support de la lecture depuis un `Blob`/`File` local, dans
cette bibliothèque telle que chargée, ne fonctionne pas correctement à
un niveau qu'on ne peut pas corriger depuis le code applicatif. Le
compteur "X tuiles chargées, 0 en erreur" du test est probablement
trompeur : Leaflet marque une tuile "chargée" dès que la fonction de
dessin s'est exécutée, même si elle a échoué silencieusement à
l'intérieur — pas une preuve que quelque chose s'est réellement
dessiné.

**Décision :** avant de basculer sur l'architecture de repli (Service
Worker interceptant les requêtes `Range`, plus lourde à construire),
un dernier essai à coût quasi nul : épingler `protomaps-leaflet` à une
version précise plutôt que le tag flottant `@2` utilisé jusqu'ici, qui
pouvait pointer vers une version plus récente que celle testée en
premier (et donc potentiellement une régression introduite entretemps
sur ce point précis).

**Fait :** `test-precache.html` charge maintenant
`protomaps-leaflet@2.0.0` (version figée) au lieu de `@2`. Choix de
version non vérifié — première version stable de la branche 2.x,
hypothèse raisonnable plutôt que certitude. Si le CDN renvoie une 404
sur ce numéro précis, il faudra regarder quelles versions existent
réellement (jsdelivr/unpkg listent les versions disponibles d'un
paquet si on navigue à la racine).

**Statut :** en attente du test avec la version épinglée. Si ça
échoue aussi, on passera à l'architecture Service Worker (Plan A) comme
convenu, plutôt que de continuer à deviner des combinaisons de
paramètres.

### Étape 19 — Conclusion : lecture directe d'un Blob non viable dans protomaps-leaflet

**Observé (test réel, `protomaps-leaflet@2.0.0` épinglé) :** même erreur
que sur le tag flottant `@2` — `this.p.getZxy is not a function` dans
`PmtilesSource.get`, avec la variante « Blob brut ».

**Conclusion :** ce n'est pas une régression liée à une version récente
de la bibliothèque — l'échec est reproductible sur une version figée
antérieure. La lecture directe d'un fichier `.pmtiles` local
(`Blob`/`File`, sans URL réseau) est structurellement non fonctionnelle
dans `protomaps-leaflet`, quelle que soit l'approche essayée
(instance `PMTiles` pré-construite, `Blob` brut, versions différentes).
Piste abandonnée — pas la peine de continuer à chercher une meilleure
combinaison de paramètres sur ce chemin.

**Décision :** passage à l'architecture de repli identifiée dès le
départ de cette exploration (voir discussion précédant l'étape 12) :
un **Service Worker** qui intercepte les requêtes réseau que `pmtiles`
fait normalement vers `CVL.pmtiles` (des `GET` avec en-tête `Range`),
et les sert depuis le fichier stocké localement (IndexedDB) en
reconstruisant une réponse HTTP `206 Partial Content` à partir d'un
`Blob.slice()` — sans jamais toucher au code de `protomaps-leaflet`
lui-même, qui continue de croire qu'il parle au réseau normalement.

**Statut :** conclusion actée, architecture de repli à construire —
voir étape suivante.

### Étape 20 — Test isolé du Service Worker (Plan A)

**Fait :** `sw-precache.js`, nouveau fichier à la racine du dépôt,
isolé — intercepte uniquement les requêtes vers
`https://tiles.jpg-cvl-dev.fr/tiles/CVL.pmtiles`. Si une copie du
fichier existe dans la même base IndexedDB que celle déjà utilisée par
`test-precache.html` (nom de base/magasin/clé identiques), découpe le
`Blob` stocké selon l'en-tête `Range` de la requête interceptée
(`Blob.slice()`) et renvoie une vraie réponse `206 Partial Content`.
Sinon, laisse passer vers le réseau normalement. `self.skipWaiting()` +
`clients.claim()` pour prendre le contrôle sans attendre la fermeture
de tous les onglets.

`test-precache.html` mis à jour : bouton « 3. Activer le Service
Worker » (enregistrement), et une troisième option dans la bascule de
source — « Via Service Worker (URL réseau normale) », sélectionnée par
défaut. Dans ce mode, le test ne construit plus rien à la main
(`Blob`, instance `PMTiles`) : il transmet simplement l'URL réseau
normale à `leafletLayer`, exactement comme le fait `geosd-themes.js`
dans l'application principale — c'est le Service Worker qui doit faire
tout le travail en coulisses, de façon complètement transparente pour
le code applicatif.

**Pourquoi ce plan est préférable si le test réussit :** contrairement
au Plan B (lecture directe d'un `Blob`, abandonné à l'étape 19), le
Plan A ne nécessite aucune modification du code qui utilise
`protomaps-leaflet` — ni dans ce test, ni plus tard dans
`geosd-themes.js`. Toute la complexité reste confinée dans
`sw-precache.js`, invisible du reste de l'application.

**Statut :** en attente du test réel (déposer `sw-precache.js` à la
racine du dépôt, à côté de `test-precache.html`, puis suivre la
nouvelle marche à suivre affichée en haut de la page).

### Étape 21 — Le Service Worker n'a jamais pris le contrôle de la page

**Observé (test réel, deux captures) :** en ligne, la carte s'affiche
parfaitement (routes rouges, occupation du sol jaune, eau magenta —
couleurs de diagnostic de l'étape 16, rendu confirmé). Hors ligne,
carte blanche, avec `net::ERR_INTERNET_DISCONNECTED` sur la requête
vers `CVL.pmtiles`. Dans les deux cas, le log affiche « Contrôle de
cette page par un Service Worker : NON ».

**Diagnostic :** le Service Worker n'a jamais pris le contrôle de la
page dans cette session de test — ni en ligne, ni hors ligne. En ligne,
ça ne se voyait pas (la requête partait normalement vers le réseau,
qui répondait). Hors ligne, faute de contrôle, la requête part
directement vers un réseau absent au lieu d'être interceptée et servie
depuis IndexedDB — d'où l'échec. `self.clients.claim()` est censé
donner le contrôle à la page immédiatement après activation sans
recharger, mais ça s'est montré peu fiable en pratique ici.

**Corrigé dans `test-precache.html` :**
- Bandeau d'état toujours visible en haut de page (« Service Worker :
  actif / pas en contrôle »), mis à jour en continu via l'événement
  `controllerchange`, plutôt qu'un simple message noyé dans le journal.
- Consigne renforcée : recharger manuellement (F5) après avoir cliqué
  « Activer le Service Worker », et vérifier que le bandeau passe au
  vert avant de poursuivre — ne plus compter sur `clients.claim()` seul.

**Statut :** en attente du nouveau test, avec vérification explicite du
bandeau vert avant de couper le réseau.
