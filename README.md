# FitTrack Nutrition

Application web de suivi nutritionnel et sportif, **installable comme une PWA**, entièrement
front-end (aucun backend), construite avec **React 18 + Vite + TypeScript**. Toutes les données
sont stockées en local dans le navigateur via `localStorage` — aucune information n'est envoyée
à un serveur (voir la page **Confidentialité** dans l'application).

## Fonctionnalités

### Cœur de l'application
- **Onboarding** guidé en 4 étapes au premier lancement (ou démarrage avec des données de démo en un clic).
- **Tableau de bord** : objectif clair du jour, calories/macros restantes, poids, prochaine séance, recette du jour, alertes de sécurité éventuelles.
- **Profil** : informations personnelles, objectif, matériel disponible, préférences alimentaires, allergies — avec avertissements en temps réel si l'objectif semble incohérent ou risqué.
- **Nutrition** : journal alimentaire avec aliments prédéfinis (117 aliments, icônes par catégorie), saisie manuelle, **favoris**, **repas récents**, **copie de la veille**, et totaux du jour.
- **Plan alimentaire hebdomadaire** : génération automatique sur 7 jours (adaptée objectif/préférences/allergies), remplacement d'un repas en un clic, **liste de courses** agrégée.
- **Recettes** : 20 recettes filtrées/triées selon le profil et les macros restantes (calories, protéines, glucides, lipides), badge « Recommandé pour vous ».
- **Programme** : génération automatique selon objectif/niveau/matériel, principes d'entraînement (échauffement, RPE, décharge), programmes pour les autres activités physiques (Padel, Course, Vélo, EVA Esport, Natation) avec recette de récupération liée.
- **Mode séance en direct** : déroulé exercice par exercice, validation série par série, timer de repos, ressenti final, sauvegarde automatique dans l'historique.
- **Bibliothèque d'exercices** : 21 exercices détaillés (niveau, erreurs fréquentes, variantes facile/difficile, conseils de sécurité).
- **Activités** : journal des séances avec calcul des calories brûlées (MET ou distance kcal/km), statistiques hebdomadaires.
- **Calendrier** : planification des séances façon agenda, créneaux libres à la minute.
- **Progression** : graphiques (poids, calories, protéines, séances), **bilan hebdomadaire automatique** (points forts/à améliorer, conseil pour la semaine), **suggestion d'ajustement automatique** des calories/macros bornée à des valeurs sûres.
- **Paramètres** : export/import JSON complet des données, réinitialisation.
- **Confidentialité** : explication claire des données stockées et du fonctionnement 100% local.

### Fonctionnalités intelligentes
- **Scanner code-barres** (page Nutrition) : recherche d'un produit via [OpenFoodFacts](https://world.openfoodfacts.org/) par code-barres (caméra via `@zxing/library`, qui fonctionne sur tous les navigateurs avec caméra — Chrome, Firefox, Safari iOS/macOS compris — chargée à la demande uniquement quand le scanner est ouvert ; sinon saisie manuelle toujours possible) — nom, calories, protéines, glucides, lipides, fibres, sel, Nutri-Score, allergènes, ingrédients ; ajout direct au repas et/ou aux favoris. Fallback géré pour produit introuvable, caméra indisponible, API hors service ou données incomplètes.
- **Ajout de repas par voix** (page Nutrition) : reconnaissance vocale du navigateur (Web Speech API) ou saisie texte équivalente, analyse automatique en aliments + quantités, écran de confirmation/correction avant ajout réel.
- **Mode restaurant / repas libre** (page Nutrition) : estimation rapide basse/moyenne/haute pour 12 types de repas difficiles à calculer (pizza, burger, kebab, buffet...), avec un conseil bienveillant pour équilibrer la suite de la journée.
- **Analyse intelligente** (coach anti-stagnation) : analyse des 14 et 30 derniers jours (stagnation du poids, déficit insuffisant/trop agressif, protéines basses, activité insuffisante, manque de régularité, données insuffisantes) avec recommandations toujours bornées à des valeurs sûres.
- **Récupération** : saisie quotidienne (sommeil, fatigue, courbatures, stress, motivation, faim, douleur), score sur 100 et recommandation de séance (intense/normale/légère/repos), utilisée pour adapter la suggestion du Dashboard.
- **Progression automatique par exercice** : historique, record personnel, meilleure série, volume total et recommandation (+répétitions, +série, maintien ou réduction) par exercice, alimentée par le mode séance en direct et affichée dans le Programme et la Bibliothèque d'exercices.

Les calculs nutritionnels et caloriques (BMR, TDEE, MET, ajustements, alertes, score de
récupération...) sont des **estimations** basées sur des formules générales et ne remplacent
pas un avis médical, diététique ou sportif professionnel — l'application le rappelle
systématiquement à l'écran.

## PWA (Progressive Web App)

L'application est installable sur l'écran d'accueil (Android/Chrome, iOS/Safari, desktop) :
- `public/manifest.json` (nom, icônes, couleurs, mode `standalone`).
- `public/icons/` : icônes PNG générées via `scripts/generate-icons.cjs` (sans dépendance externe).
- `public/sw.js` : service worker (cache de l'app shell + stratégie *stale-while-revalidate*) permettant un fonctionnement hors-ligne basique.
- Le service worker est enregistré automatiquement dans `src/main.tsx`.

Pour régénérer les icônes après un changement de charte graphique :

```bash
node scripts/generate-icons.cjs
```

## Stack technique

- React 18 + TypeScript
- Vite (bundler)
- react-router-dom (navigation)
- recharts (graphiques)
- CSS pur (aucune librairie de style)
- Persistance via `localStorage` uniquement, isolée derrière une couche de services
- APIs navigateur natives (Web Speech API pour la voix, `getUserMedia` pour la caméra), avec
  repli (fallback) systématique si l'API n'est pas supportée par le navigateur.
- `@zxing/library` : seule dépendance ajoutée pour une fonctionnalité avancée — décodage de
  code-barres par analyse d'image, compatible avec tous les navigateurs disposant d'une
  caméra (contrairement à l'API native `BarcodeDetector`, limitée à Chrome/Edge). Chargée en
  *lazy loading* (`React.lazy`) : elle n'est téléchargée que si l'utilisateur ouvre le
  scanner, sans alourdir le chargement initial de l'application.
- [OpenFoodFacts](https://world.openfoodfacts.org/) : seule API externe utilisée (gratuite,
  sans clé), uniquement pour le scanner de produits ; toutes les autres fonctionnalités
  restent 100% locales même si cette API est indisponible.

## Architecture des données (préparée pour une future migration serveur)

Aucun composant ni hook ne touche `localStorage` directement : tout passe par
`src/services/storageService.ts`, seul point de contact avec le stockage du navigateur.
`src/hooks/useAppData.ts` expose les données et leurs setters aux pages via ce service, et
`src/services/backupService.ts` gère la construction/validation des fichiers d'export-import,
indépendamment du mécanisme de stockage. Le jour où l'application devra migrer vers un backend
(ex. Supabase), seule cette couche service nécessitera d'être adaptée (passage à des appels
asynchrones) — les pages et composants n'auront pas à changer.

```
src/
  components/   Composants UI réutilisables (Sidebar, MobileNav, Card, ProgressBar, Gauge,
                Modal, FoodPicker, Layout, Onboarding, SafetyWarnings, BarcodeScanner,
                VoiceMealEntry, FreeMealModal)
  pages/        Pages de l'application (Dashboard, Profile, Nutrition, MealPlan, Recipes,
                Program, LiveSession, ExerciseLibrary, Activities, Calendar, Progress,
                Recovery, SmartAnalysis, Settings, Privacy)
  hooks/        Hooks personnalisés (useLocalStorage, useAppData, useNutritionTargets)
  services/     Couche de persistance et d'accès externe isolée (storageService,
                backupService, openFoodFactsService, barcodeService, speechService)
  utils/        Logique métier (calculations, program, cardioPrograms, recipes, mealPlan,
                weeklyReport, adjustmentEngine, stagnationCoach, recoveryScore,
                exerciseProgression, safetyCheck, voiceMealParser, storage, date,
                activityLabels, foodIcons, profileOptions)
  data/         Données statiques (aliments, recettes, exercices, estimations repas libres)
  types/        Types TypeScript partagés
  styles/       Feuilles de style CSS (variables, global, layout, components)
scripts/        Scripts utilitaires (génération des icônes PWA)
```

## Installation

```bash
npm install
```

## Lancement en développement

```bash
npm run dev
```

L'application est alors accessible sur `http://localhost:5173` (ou le port indiqué dans le terminal).

## Build de production

```bash
npm run build
```

Le résultat est généré dans le dossier `dist/`. Vous pouvez prévisualiser ce build localement avec :

```bash
npm run preview
```

## Déploiement sur Netlify

1. Connectez ce dépôt Git à Netlify (New site from Git).
2. Configurez les paramètres de build :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
3. Le fichier `public/_redirects` (copié automatiquement dans `dist/` lors du build) contient :
   ```
   /*  /index.html  200
   ```
   Cette règle est nécessaire pour que les routes de l'application (gérées côté client par
   react-router-dom, ex. `/profil`, `/nutrition`...) fonctionnent correctement lors d'un accès
   direct à l'URL ou d'un rafraîchissement de page sur Netlify.
4. Déployez. Aucune variable d'environnement n'est nécessaire : l'application n'a pas de backend.

## Données : démarrage, sauvegarde et réinitialisation

Au tout premier lancement, l'application démarre **vide** : un onboarding guidé permet de créer
son profil (ou de charger en un clic un jeu de données de démonstration pour découvrir l'app).

Depuis la page **Paramètres**, vous pouvez à tout moment :
- **Exporter** toutes vos données dans un fichier JSON (sauvegarde ou transfert vers un autre appareil).
- **Importer** un fichier exporté précédemment (le fichier est validé avant d'être appliqué, pour se protéger d'un fichier corrompu ou invalide).
- **Réinitialiser** entièrement l'application (suppression définitive des données locales).
