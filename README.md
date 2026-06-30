# FitTrack Nutrition

Application web de suivi nutritionnel et sportif, entièrement front-end (aucun backend),
construite avec **React 18 + Vite + TypeScript**. Toutes les données sont stockées en local
dans le navigateur via `localStorage` — aucune information n'est envoyée à un serveur.

## Fonctionnalités

- **Tableau de bord** : résumé du jour (calories, macros, poids, prochaine séance, recette du jour).
- **Profil** : informations personnelles, objectifs, matériel disponible, préférences alimentaires, allergies.
- **Nutrition** : journal alimentaire (aliments prédéfinis ou saisie manuelle) avec calcul automatique des macros.
- **Recettes** : plus de 20 recettes filtrées/triées selon votre profil et vos macros restantes du jour.
- **Programme** : génération automatique d'un programme d'entraînement selon votre objectif, niveau et matériel.
- **Activités** : journal des séances sportives avec calcul automatique des calories brûlées (estimation MET) et statistiques hebdomadaires.
- **Progression** : suivi du poids et des macronutriments dans le temps via des graphiques (recharts).

Les calculs nutritionnels et caloriques (BMR, TDEE, MET, etc.) sont des **estimations**
basées sur des formules générales (Mifflin-St Jeor, facteurs d'activité, table de MET) et
ne remplacent pas un avis médical, diététique ou sportif professionnel.

## Stack technique

- React 18 + TypeScript
- Vite (bundler)
- react-router-dom (navigation)
- recharts (graphiques)
- CSS pur (aucune librairie de style)
- Persistance via `localStorage` uniquement

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

## Données de démonstration

Au tout premier lancement (aucune donnée en `localStorage`), un profil d'exemple ainsi que
quelques repas, activités et pesées de démonstration sont pré-remplis afin que l'application
ne soit pas vide. Vous pouvez les remplacer librement, ou tout réinitialiser via le bouton
**« Réinitialiser mes données »** dans la page Profil.

## Structure du projet

```
src/
  components/   Composants UI réutilisables (Sidebar, MobileNav, Card, ProgressBar, Gauge, Modal, FoodPicker, Layout)
  pages/        Pages de l'application (Dashboard, Profile, Nutrition, Recipes, Program, Activities, Progress)
  hooks/        Hooks personnalisés (useLocalStorage, useAppData, useNutritionTargets)
  utils/        Logique métier (calculations, program, recipes, storage, date)
  data/         Données statiques (aliments, recettes, exercices)
  types/        Types TypeScript partagés
  styles/       Feuilles de style CSS (variables, global, layout, components)
```
