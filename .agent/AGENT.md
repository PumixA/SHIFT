# AGENT.md - Directives Globales pour Agents IA

> Version: 1.2.0
> Dernière mise à jour: 2026-02-05
> Projet: SHIFT - The Board Game

## Identité du Projet

SHIFT est un jeu de plateau multijoueur web avec un système de règles dynamiques qui évoluent pendant la partie. Les joueurs progressent sur un plateau en créant, modifiant et réagissant aux règles en temps réel.

## Stack Technique Obligatoire

### Frontend (client/)

- **Framework**: Next.js 16+ avec App Router (PAS le Pages Router)
- **React**: Version 19+ avec composants fonctionnels UNIQUEMENT
- **UI**: Radix UI pour tous les composants interactifs
- **Styling**: TailwindCSS 4+ (pas de CSS-in-JS)
- **Validation**: Zod pour toutes les validations de schémas
- **État**: React Context API + hooks personnalisés
- **Temps réel**: Socket.io-client

### Backend (server/)

- **Runtime**: Node.js avec TypeScript strict
- **Framework**: Express.js 5+
- **Temps réel**: Socket.io
- **ORM**: Prisma 5+
- **Base de données**: PostgreSQL 16+

## Règles Impératives

### TypeScript

- `strict: true` OBLIGATOIRE dans tsconfig.json
- JAMAIS utiliser `any` - utiliser `unknown` puis type guard si nécessaire
- TOUJOURS définir les types de retour des fonctions
- Préférer `interface` à `type` pour les objets
- Utiliser les enums TypeScript pour les constantes énumérées

### React/Next.js

- JAMAIS de classes React - composants fonctionnels UNIQUEMENT
- TOUJOURS utiliser des hooks personnalisés pour la logique réutilisable
- Préférer Server Components par défaut, 'use client' seulement si nécessaire
- Nommer les composants en PascalCase
- Nommer les hooks avec le préfixe `use`

### Code Style

- Fonctions pures et immutabilité par défaut
- Maximum 50 lignes par fonction (refactorer sinon)
- Maximum 300 lignes par fichier (diviser sinon)
- Noms de variables descriptifs en anglais
- Pas de commentaires évidents - le code doit être auto-documenté
- Commentaires uniquement pour le "pourquoi", pas le "quoi"

### Sécurité

- JAMAIS de credentials en dur dans le code
- Valider TOUTES les entrées utilisateur avec Zod
- Échapper les sorties pour prévenir XSS
- Utiliser les requêtes préparées (Prisma le fait automatiquement)
- JAMAIS exposer les erreurs serveur détaillées au client

### Tests

- Chaque nouvelle fonctionnalité DOIT avoir un test
- Tests unitaires avec Jest
- Tests E2E avec Playwright
- Sélecteurs sémantiques (getByRole, getByLabel) OBLIGATOIRES

## Architecture de Fichiers

```
client/
├── app/           # Routes Next.js App Router
├── components/    # Composants React réutilisables
│   ├── ui/        # Composants UI génériques (Radix)
│   ├── game/      # Composants spécifiques au jeu
│   └── [domain]/  # Composants par domaine métier
├── hooks/         # Hooks React personnalisés
├── contexts/      # Providers React Context
├── lib/           # Utilitaires et helpers
├── services/      # Clients API et Socket
└── types/         # Types TypeScript partagés

server/
├── src/
│   ├── server.ts  # Point d'entrée
│   ├── engine/    # Moteur de jeu (logique pure)
│   ├── services/  # Services métier
│   ├── types/     # Types TypeScript
│   ├── data/      # Données statiques
│   └── config/    # Configuration
└── prisma/        # Schéma et migrations DB
```

## Conventions de Nommage

| Élément             | Convention           | Exemple                  |
| ------------------- | -------------------- | ------------------------ |
| Fichiers composants | kebab-case           | `rule-builder-modal.tsx` |
| Fichiers hooks      | kebab-case avec use- | `use-game-state.ts`      |
| Fichiers services   | PascalCase           | `GameService.ts`         |
| Variables/Fonctions | camelCase            | `calculateScore()`       |
| Constantes          | UPPER_SNAKE_CASE     | `MAX_PLAYERS`            |
| Types/Interfaces    | PascalCase           | `GameState`              |
| Enums               | PascalCase           | `PlayerColor`            |

## Flux de Travail Git (Blue-Green GitFlow)

### Architecture des branches

```
main (production)     ← PR depuis dev ou hotfix/* uniquement
  ↑
dev (pre-production)  ← PR depuis branches de travail
  ↑
feat/*, fix/*, docs/*, refactor/*, test/*, chore/*, hotfix/*
```

### Règles impératives

1. **JAMAIS** push directement sur `main` ou `dev`
2. **TOUJOURS** créer une branche de travail depuis `dev`
3. **TOUJOURS** passer par une PR pour merger
4. **TOUJOURS** faire `git add` + `git commit` + `git push` après chaque modification

### Nommage des branches

| Type          | Pattern                  | Exemple                |
| ------------- | ------------------------ | ---------------------- |
| Feature       | `feat/<description>`     | `feat/rule-editor`     |
| Bug fix       | `fix/<description>`      | `fix/dice-roll-bug`    |
| Documentation | `docs/<description>`     | `docs/api-guide`       |
| Refactoring   | `refactor/<description>` | `refactor/game-engine` |
| Tests         | `test/<description>`     | `test/rule-evaluation` |
| Maintenance   | `chore/<description>`    | `chore/update-deps`    |
| Hotfix        | `hotfix/<description>`   | `hotfix/critical-bug`  |

### Format de Commit (Conventional Commits)

```
<type>(<scope>): <description en minuscules>

[body optionnel]

Co-Authored-By: Claude <assistant>@anthropic.com <noreply@anthropic.com>
```

**Types** : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`

**Scopes** : `client`, `server`, `engine`, `rules`, `board`, `player`, `bot`, `ui`, `auth`, `socket`, `db`, `ci`, `docs`, `deps`

**Règles** :

- Sujet **entièrement en minuscules**
- Maximum 72 caractères
- Pas de point final

### Workflow type

```bash
# 1. Créer une branche depuis dev
git checkout dev && git pull origin dev
git checkout -b feat/ma-feature

# 2. Développer et commiter
git add <fichiers>
git commit -m "feat(scope): description en minuscules"
git push origin feat/ma-feature

# 3. Créer une PR vers dev sur GitHub
# 4. Après merge, supprimer la branche
```

## Contexte Additionnel

- Lire `spec/requirement.md` pour les exigences fonctionnelles
- Lire `spec/design.md` pour l'architecture système
- Lire `wiki/domain.md` pour le glossaire métier
- Lire `tech/stack.md` pour les détails techniques

## Instructions de Réflexion

Avant toute modification complexe:

1. Analyser l'impact sur les fichiers existants
2. Vérifier la cohérence avec les règles ci-dessus
3. Proposer un plan en pseudo-code
4. Implémenter après validation
