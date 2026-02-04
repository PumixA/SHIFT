# Ressources et Liens - SHIFT

> Version: 1.0.0
> Dernière mise à jour: 2026-02-04

## Documentation Officielle

### Frontend

| Technologie | URL | Notes |
|-------------|-----|-------|
| Next.js | https://nextjs.org/docs | App Router, Server Components |
| React | https://react.dev | Hooks, Patterns |
| TypeScript | https://www.typescriptlang.org/docs | Handbook, Reference |
| TailwindCSS | https://tailwindcss.com/docs | Utility Classes |
| Radix UI | https://www.radix-ui.com/primitives/docs | Composants accessibles |
| Framer Motion | https://www.framer.com/motion | Animations |
| Recharts | https://recharts.org/en-US/api | Graphiques |
| Zod | https://zod.dev | Validation |
| React Hook Form | https://react-hook-form.com/docs | Formulaires |

### Backend

| Technologie | URL | Notes |
|-------------|-----|-------|
| Express.js | https://expressjs.com/en/5x/api.html | API Reference v5 |
| Prisma | https://www.prisma.io/docs | ORM, Migrations |
| Socket.io | https://socket.io/docs/v4 | WebSocket Server |
| PostgreSQL | https://www.postgresql.org/docs/16 | Database |

### Infrastructure

| Technologie | URL | Notes |
|-------------|-----|-------|
| Docker | https://docs.docker.com | Containers |
| Docker Compose | https://docs.docker.com/compose | Multi-container |

---

## Guides et Tutoriels

### Architecture

| Ressource | URL | Sujet |
|-----------|-----|-------|
| Next.js App Router | https://nextjs.org/docs/app | Routing moderne |
| Server Components | https://react.dev/reference/rsc/server-components | RSC patterns |
| Prisma Best Practices | https://www.prisma.io/docs/guides | Optimisation |

### Patterns

| Ressource | URL | Sujet |
|-----------|-----|-------|
| React Patterns | https://react.dev/learn | Patterns officiels |
| TypeScript Patterns | https://www.typescriptlang.org/docs/handbook/2/types-from-types.html | Types avancés |

---

## Outils de Développement

### IDE et Extensions

| Outil | URL | Usage |
|-------|-----|-------|
| VS Code | https://code.visualstudio.com | IDE principal |
| Cursor | https://cursor.sh | IDE avec IA |
| Prisma Extension | https://marketplace.visualstudio.com/items?itemName=Prisma.prisma | Syntax highlighting |
| Tailwind IntelliSense | https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss | Autocomplétion |

### Debugging

| Outil | URL | Usage |
|-------|-----|-------|
| React DevTools | https://react.dev/learn/react-developer-tools | Debug React |
| Prisma Studio | `npx prisma studio` | GUI Database |
| Socket.io Admin | https://socket.io/docs/v4/admin-ui | Debug WebSocket |

---

## APIs et Services

### Internes

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/games` | GET | Liste des parties |
| `/api/games/:id` | GET | Détails partie |
| `/api/users` | POST | Création utilisateur |
| `/api/users/:id` | GET | Profil utilisateur |
| `/api/friends` | GET/POST | Gestion amis |
| `/api/rule-packs` | GET | Packs de règles |

### WebSocket Events

Voir `spec/design.md` pour la liste complète des événements Socket.io.

---

## Références de Code

### Fichiers Clés

| Fichier | Chemin | Responsabilité |
|---------|--------|----------------|
| Main Game | `client/components/shift-game.tsx` | Composant principal |
| Game Engine | `server/src/engine/processor.ts` | Logique de jeu |
| Rule Evaluator | `server/src/engine/rule-evaluator.ts` | Évaluation règles |
| Game Context | `client/contexts/GameContext.tsx` | État global |
| Socket Service | `client/services/socket.ts` | Client WebSocket |
| Prisma Schema | `server/prisma/schema.prisma` | Modèle de données |
| Default Rules | `server/src/data/default-rule-packs.ts` | Règles prédéfinies |

### Hooks Importants

| Hook | Chemin | Usage |
|------|--------|-------|
| useGameState | `client/hooks/use-game-state.ts` | État du jeu |
| useGameControls | `client/hooks/use-game-controls.ts` | Contrôles joueur |
| useRuleManagement | `client/hooks/use-rule-management.ts` | CRUD règles |
| useBotAI | `client/hooks/use-bot-ai.ts` | Logique IA |

---

## Standards et Conventions

### Commits

| Type | Description | Exemple |
|------|-------------|---------|
| feat | Nouvelle fonctionnalité | `feat(rules): add shield effect` |
| fix | Correction de bug | `fix(game): prevent double roll` |
| docs | Documentation | `docs(readme): update setup` |
| refactor | Refactoring | `refactor(engine): extract evaluator` |
| test | Tests | `test(rules): add trigger tests` |

### Code Style

- ESLint: `eslint.config.mjs`
- Prettier: `.prettierrc`
- TypeScript: `tsconfig.json`

---

## Communauté et Support

### Issues et Bugs

- GitHub Issues: (à configurer)
- Bug Report Template: `.github/ISSUE_TEMPLATE/bug_report.md`

### Contribution

- Pull Request Template: `.github/pull_request_template.md`
- Contributing Guide: `CONTRIBUTING.md` (à créer)

---

## Monitoring et Performance

### Métriques Recommandées

| Métrique | Cible | Outil |
|----------|-------|-------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| WebSocket Latency | < 100ms | Custom |

### Logging

| Niveau | Usage |
|--------|-------|
| ERROR | Erreurs bloquantes |
| WARN | Comportements anormaux |
| INFO | Événements importants |
| DEBUG | Détails développement |

---

## Sécurité

### Références OWASP

| Vulnérabilité | Prévention |
|---------------|------------|
| Injection | Prisma parameterized queries |
| XSS | React auto-escaping, sanitization |
| CSRF | SameSite cookies |
| Broken Auth | Server-side validation |

### Checklist

- [ ] Validation entrées (Zod)
- [ ] Échappement sorties
- [ ] Requêtes préparées
- [ ] Rate limiting
- [ ] HTTPS en production
