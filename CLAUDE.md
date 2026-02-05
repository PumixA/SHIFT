# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## DIRECTIVE PRIORITAIRE - À APPLIQUER À CHAQUE PROMPT

### 1. TOUJOURS consulter `.agent/` avant toute action

Avant d'implémenter, modifier ou analyser quoi que ce soit:

1. Lire `.agent/AGENT.md` pour les règles globales
2. Lire `.agent/spec/requirement.md` pour les exigences fonctionnelles
3. Lire `.agent/wiki/domain.md` pour le glossaire métier (nommage correct)
4. Lire `.agent/tech/stack.md` pour les versions exactes (éviter les API dépréciées)
5. Consulter `.agent/spec/features/*.feature` pour les comportements attendus (Gherkin)

### 2. TOUJOURS mettre à jour `.agent/` après toute modification

Chaque modification de code DOIT déclencher une mise à jour de la documentation:

| Type de modification       | Fichiers `.agent/` à mettre à jour         |
| -------------------------- | ------------------------------------------ |
| Nouvelle fonctionnalité    | `spec/requirement.md` + nouveau `.feature` |
| Changement d'architecture  | `spec/design.md`                           |
| Nouveau terme métier       | `wiki/domain.md`                           |
| Nouvelle dépendance        | `tech/stack.md`                            |
| Nouvelle ressource externe | `links/resources.md`                       |

### 3. Principes du Protocole IA-First (2025)

- **Machine Readability First**: La documentation doit être structurée, sémantiquement dense, sans contexte tacite
- **Spécifications Gherkin**: Tout comportement doit être décrit en `.feature` (Given/When/Then)
- **Documentation-as-Code**: La doc est versionnée, revue, et synchronisée avec le code
- **Blue-Green Deployment**: `main` = production, `dev` = pre-production
- **Conventional Commits**: Format `<type>(<scope>): <description>` (sujet tout en minuscules)

### 4. Workflow Git avec validation utilisateur

#### Actions AUTOMATIQUES (pas de permission requise)

- `git add <fichiers>` - Ajouter les fichiers modifiés
- `git commit` - Commiter avec un message Conventional Commits

#### Actions AVEC PERMISSION (demander avant d'exécuter)

- **Changement de branche** : TOUJOURS demander avant `git checkout` ou `git checkout -b`
- **Push** : TOUJOURS demander avant `git push`

> **IMPORTANT** : Ne jamais enchaîner checkout/push sans interruption. Attendre la validation utilisateur entre chaque étape sensible.

#### Format de commit OBLIGATOIRE

```
<type>(<scope>): <description en minuscules>

[corps optionnel]

Co-Authored-By: Claude <assistant>@anthropic.com <noreply@anthropic.com>
```

**Types** : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`

**Scopes** : `client`, `server`, `engine`, `rules`, `board`, `player`, `bot`, `ui`, `auth`, `socket`, `db`, `ci`, `docs`, `deps`

**Règles** :

- Le sujet doit être **entièrement en minuscules** (pas de majuscules)
- Maximum 72 caractères pour le sujet
- Pas de point à la fin du sujet

#### Exemples valides

```bash
feat(rules): add swap position effect
fix(client): resolve typescript errors in game viewport
docs(agent): update cicd documentation
chore(deps): bump prisma to 5.23
```

### 5. TOUJOURS suivre le GitFlow

#### Architecture des branches

```
main (production) ← PR depuis dev uniquement (ou hotfix/*)
  ↑
dev (pre-production) ← PR depuis feat/*, fix/*, etc.
  ↑
feat/*, fix/*, docs/*, refactor/*, test/*, chore/*
```

#### Règles de workflow

| Action           | Commande                                              |
| ---------------- | ----------------------------------------------------- |
| Nouvelle feature | `git checkout dev && git checkout -b feat/ma-feature` |
| Bug fix          | `git checkout dev && git checkout -b fix/mon-bug`     |
| Merge vers dev   | Créer une PR sur GitHub                               |
| Release          | PR de `dev` vers `main`                               |
| Hotfix urgent    | `git checkout main && git checkout -b hotfix/urgent`  |

**IMPORTANT** :

- JAMAIS push directement sur `main` ou `dev`
- TOUJOURS créer une branche de travail
- TOUJOURS passer par une PR pour merger

### 6. Checklist obligatoire (chaque prompt)

- [ ] J'ai lu les fichiers `.agent/` pertinents
- [ ] Mon code respecte `tech/stack.md` (versions exactes)
- [ ] Mon nommage respecte `wiki/domain.md` (Ubiquitous Language)
- [ ] J'ai mis à jour `.agent/` si j'ai modifié le comportement
- [ ] J'ai ajouté/modifié le `.feature` correspondant si applicable
- [ ] J'ai fait `git add` et `git commit` après mes modifications
- [ ] J'ai demandé permission avant `git checkout` et `git push`

---

## Project Overview

SHIFT is a multiplayer web-based board game with dynamic rules that evolve during gameplay. Players race across a board while creating, modifying, and reacting to game rules in real-time.

## Tech Stack

- **Client**: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, Radix UI, Socket.io-client
- **Server**: Express.js 5, Socket.io, Prisma ORM, TypeScript
- **Database**: PostgreSQL 16 (Docker)

## Development Commands

```bash
# Start PostgreSQL database
docker-compose up -d

# Client (from project root)
cd client && npm run dev      # Start dev server at localhost:3000
cd client && npm run build    # Production build
cd client && npm run lint     # ESLint
cd client && npm run lint:fix # ESLint with auto-fix
cd client && npm run format   # Prettier format

# Server (from project root)
cd server && npm run dev          # Start dev server at localhost:3001 (nodemon)
cd server && npx prisma db push   # Sync schema to database
cd server && npx prisma studio    # Database GUI
cd server && npx prisma generate  # Regenerate Prisma client
```

## Architecture

### Client Structure

- `app/` - Next.js App Router pages (game, play, profile, friends, history, rulesets, etc.)
- `components/` - React components
  - `ui/` - Radix UI-based component library
  - `game/` - Game-specific components (viewport, rule-builder, chat, etc.)
- `hooks/` - Custom React hooks for game logic:
  - `useGameState` - Main game state management
  - `useGameControls` - Player controls and turn mechanics
  - `useRuleManagement` - Rule CRUD operations
  - `useTurnManagement` - Turn flow control
  - `useBotAI` - AI player logic
  - `useSocketEvents` - Real-time event handling
- `contexts/GameContext.tsx` - Global game state with reducer pattern
- `services/socket.ts` - Socket.io client singleton

### Server Structure

- `src/server.ts` - Main entry point with Socket.io handlers
- `src/engine/` - Game logic engine:
  - `processor.ts` - Main game flow orchestration
  - `rule-evaluator.ts` - Evaluates rule conditions
  - `effect-manager.ts` - Applies rule effects
  - `condition-evaluator.ts` - Parses rule conditions
  - `actions.ts` - Executes game actions
- `src/services/` - Business logic:
  - `GameService.ts` - Game session management
  - `UserService.ts` - User/profile management
  - `FriendService.ts` - Friend system
  - `RulePackService.ts` - Rule pack CRUD
  - `SaveGameService.ts` - Game state persistence
- `src/types/` - TypeScript type definitions (game.ts, rules.ts)
- `src/data/` - Predefined content (default-rule-packs.ts, rule-templates.ts)
- `prisma/schema.prisma` - Database schema

### Data Flow

1. Client sends Socket.io events (roll_dice, create_rule, etc.)
2. Server validates action and runs through game engine
3. Engine evaluates applicable rules and applies effects
4. Server broadcasts updated game state to all players
5. Client GameContext reducer updates local state

### Key Game Concepts

- **Rules**: Have triggers (ON_LAND, ON_DICE_ROLL, etc.), conditions, and effects (MOVE_RELATIVE, MODIFY_SCORE, etc.)
- **Effects**: Temporary player modifiers (DOUBLE_DICE, SHIELD, SPEED_BOOST, etc.)
- **Rule Packs**: Predefined rule collections (Vanilla, Classic, Challenge, etc.)
- **Player Colors**: CYAN, VIOLET, ORANGE, GREEN (turn order)

## Code Conventions

- TypeScript strict mode required; never use `any`
- React: Functional components only, prefer Server Components
- UI: Use Radix UI primitives with TailwindCSS
- Validation: Use Zod for all user input
- Files: kebab-case for components, PascalCase for services
- State: Context + hooks pattern, no useState for global state

## Additional Documentation

The `.agent/` directory contains AI-optimized documentation:

- `AGENT.md` - Global directives and rules
- `spec/requirement.md` - Functional requirements
- `spec/design.md` - System architecture diagrams
- `wiki/domain.md` - Domain glossary (Ubiquitous Language)
- `tech/stack.md` - Exact dependency versions
