# Projet de base - TP3 — IFT359 : Programmation Fonctionnelle

## Prérequis

- [Node.js](https://nodejs.org/) (version LTS recommandée)

## Installation

Une fois Node.js installé, ouvrez un terminal à la racine du projet et exécutez la commande `npm install` pour installer les dépendances nécessaires.

## Structure du projet

- Le code source TypeScript se trouve dans le répertoire `src/` (point d'entrée : `src/index.ts`).
- Le code JavaScript compilé est généré dans le répertoire `dist/`.

## Commandes disponibles

| Commande             | Description                                                                                   |
| :------------------- | :-------------------------------------------------------------------------------------------- |
| `npm run dev`        | Exécute le code TypeScript.                                                                   |
| `npm run dev:watch`  | Exécute et surveille le code TypeScript avec rechargement automatique à chaque sauvegarde.    |
| `npm run build`      | Vérifie les types et compile le projet TypeScript vers JavaScript dans le dossier `dist/src`. |
| `npm start`          | Exécute le code JavaScript compilé (`dist/src/index.js`) avec Node.js.                        |
| `npm run clean`      | Supprime le dossier `dist/` contenant les fichiers compilés.                                  |
| `npm run test`       | Exécute les tests.                                                                            |
| `npm run test:watch` | Exécute les tests et surveille le code TypeScript                                             |
