# Stack Technique - SHIFT

> Version: 1.1.1
> Dernière mise à jour: 2026-02-05

Ce document liste les versions EXACTES des dépendances. Les agents IA DOIVENT utiliser ces versions pour éviter les API dépréciées ou inexistantes.

---

## Frontend (client/)

### Framework Principal

| Package    | Version | Notes                                      |
| ---------- | ------- | ------------------------------------------ |
| next       | ^16.1.6 | App Router UNIQUEMENT, pas de Pages Router |
| react      | ^19.2.4 | Composants fonctionnels + hooks            |
| react-dom  | ^19.2.4 | -                                          |
| typescript | ^5      | Mode strict activé                         |

### UI Components (Radix UI)

| Package                         | Version | Usage                 |
| ------------------------------- | ------- | --------------------- |
| @radix-ui/react-accordion       | 1.2.12  | Panneaux dépliables   |
| @radix-ui/react-alert-dialog    | 1.1.15  | Dialogues d'alerte    |
| @radix-ui/react-aspect-ratio    | 1.1.8   | Aspect ratio          |
| @radix-ui/react-avatar          | 1.1.11  | Avatars utilisateurs  |
| @radix-ui/react-checkbox        | 1.3.3   | Cases à cocher        |
| @radix-ui/react-collapsible     | 1.1.12  | Panneaux collapsibles |
| @radix-ui/react-context-menu    | 2.2.16  | Menus contextuels     |
| @radix-ui/react-dialog          | 1.1.15  | Modales               |
| @radix-ui/react-dropdown-menu   | 2.1.16  | Menus déroulants      |
| @radix-ui/react-hover-card      | 1.1.15  | Cartes hover          |
| @radix-ui/react-label           | 2.1.8   | Labels de formulaire  |
| @radix-ui/react-menubar         | 1.1.16  | Barres de menu        |
| @radix-ui/react-navigation-menu | 1.2.14  | Menus de navigation   |
| @radix-ui/react-popover         | 1.1.15  | Popovers              |
| @radix-ui/react-progress        | 1.1.8   | Barres de progression |
| @radix-ui/react-radio-group     | 1.3.8   | Groupes radio         |
| @radix-ui/react-scroll-area     | 1.2.10  | Zones scrollables     |
| @radix-ui/react-select          | 2.2.6   | Sélecteurs            |
| @radix-ui/react-separator       | 1.1.8   | Séparateurs           |
| @radix-ui/react-slider          | 1.3.6   | Sliders               |
| @radix-ui/react-slot            | 1.2.4   | Composition           |
| @radix-ui/react-switch          | 1.2.6   | Switches toggle       |
| @radix-ui/react-tabs            | 1.1.13  | Onglets               |
| @radix-ui/react-toast           | 1.2.15  | Notifications toast   |
| @radix-ui/react-toggle          | 1.1.10  | Boutons toggle        |
| @radix-ui/react-toggle-group    | 1.1.11  | Groupes toggle        |
| @radix-ui/react-tooltip         | 1.2.8   | Tooltips              |

### Styling

| Package                  | Version  | Notes                     |
| ------------------------ | -------- | ------------------------- |
| tailwindcss              | ^4.1.9   | Configuration Tailwind v4 |
| @tailwindcss/postcss     | ^4.1.9   | Plugin PostCSS Tailwind   |
| postcss                  | ^8.5     | -                         |
| autoprefixer             | ^10.4.24 | Préfixes CSS automatiques |
| class-variance-authority | ^0.7.1   | Variants de classes       |
| clsx                     | ^2.1.1   | Conditionnels de classes  |
| tailwind-merge           | ^3.3.1   | Merge intelligent         |
| tailwindcss-animate      | ^1.0.7   | Animations Tailwind       |
| tw-animate-css           | 1.3.3    | Animations CSS            |

### Formulaires et Validation

| Package             | Version | Notes                 |
| ------------------- | ------- | --------------------- |
| react-hook-form     | ^7.60.0 | Gestion formulaires   |
| zod                 | 3.25.76 | Validation de schémas |
| @hookform/resolvers | ^3.10.0 | Intégration Zod       |

### Animation et Visualisation

| Package              | Version  | Notes                   |
| -------------------- | -------- | ----------------------- |
| framer-motion        | ^11.15.0 | Animations React        |
| recharts             | 2.15.4   | Graphiques statistiques |
| lucide-react         | ^0.454.0 | Icônes SVG              |
| embla-carousel-react | 8.5.1    | Carrousels              |

### Temps Réel

| Package          | Version | Notes            |
| ---------------- | ------- | ---------------- |
| socket.io-client | ^4.8.3  | Client WebSocket |

### Utilitaires

| Package                | Version | Notes                      |
| ---------------------- | ------- | -------------------------- |
| @vercel/analytics      | 1.3.1   | Analytics Vercel           |
| next-themes            | ^0.4.6  | Thème dark/light           |
| react-resizable-panels | ^2.1.7  | Panneaux redimensionnables |
| sonner                 | ^1.7.4  | Notifications              |
| cmdk                   | 1.0.4   | Command palette            |
| input-otp              | ^1.4.2  | Inputs OTP                 |
| vaul                   | ^1.1.2  | Drawers mobile             |
| date-fns               | 4.1.0   | Manipulation dates         |
| react-day-picker       | 9.8.0   | Sélecteur de date          |

---

## Backend (server/)

### Runtime et Framework

| Package    | Version | Notes                |
| ---------- | ------- | -------------------- |
| express    | ^5.2.1  | Framework HTTP       |
| typescript | ^5.9.3  | Mode strict          |
| ts-node    | ^10.9.2 | Exécution TS directe |

### Base de Données

| Package        | Version | Notes             |
| -------------- | ------- | ----------------- |
| @prisma/client | ^5.22.0 | Client ORM        |
| prisma         | ^5.22.0 | CLI et migrations |

**PostgreSQL**: 16-alpine (Docker)

### Temps Réel

| Package   | Version | Notes             |
| --------- | ------- | ----------------- |
| socket.io | ^4.8.3  | Serveur WebSocket |

### Configuration

| Package | Version | Notes                     |
| ------- | ------- | ------------------------- |
| dotenv  | ^17.2.3 | Variables d'environnement |
| cors    | ^2.8.5  | Cross-Origin              |

### Développement

| Package        | Version | Notes         |
| -------------- | ------- | ------------- |
| nodemon        | ^3.1.11 | Hot reload    |
| @types/express | ^5.0.6  | Types Express |
| @types/cors    | ^2.8.19 | Types CORS    |
| @types/node    | ^25.2.0 | Types Node.js |

---

## Structure npm Workspaces

Le projet utilise **npm workspaces** pour gérer les dépendances de manière centralisée.

### Configuration (package.json racine)

```json
{
  "workspaces": ["client", "server"]
}
```

### Fichiers de lock

| Fichier                    | Emplacement | Usage                                      |
| -------------------------- | ----------- | ------------------------------------------ |
| `package-lock.json`        | Racine      | **Utilisé par npm ci** - fichier principal |
| `client/package-lock.json` | client/     | Ignoré par npm ci (legacy)                 |
| `server/package-lock.json` | server/     | Ignoré par npm ci (legacy)                 |

### Commandes importantes

```bash
# Installer toutes les dépendances (workspaces)
npm install

# Installer une dépendance dans un workspace spécifique
npm install <package>@<version> -w client
npm install <package>@<version> -w server

# En cas de conflits de peer dependencies
npm install <package>@<version> -w client --legacy-peer-deps
```

### Point d'attention : Dependabot

Dependabot met à jour uniquement les `package-lock.json` des workspaces individuels (client/, server/), mais **pas** le `package-lock.json` racine utilisé par `npm ci` en CI.

**Solution** : Créer des branches manuelles avec :

```bash
npm install <package>@<version> -w client --legacy-peer-deps
git add client/package.json package-lock.json
git commit -m "chore(deps): bump <package> from X to Y"
```

---

## Infrastructure

### Docker

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: shift_user
      POSTGRES_PASSWORD: shift_password
      POSTGRES_DB: shift_game
    ports:
      - "5432:5432"
```

### Variables d'Environnement

```bash
# server/.env
DATABASE_URL="postgresql://shift_user:shift_password@localhost:5432/shift_game"
PORT=3001
NODE_ENV=development
```

```bash
# client/.env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Configuration TypeScript

### Client (tsconfig.json)

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Server (tsconfig.json)

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

---

## Scripts NPM

### Client

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

### Server

```json
{
  "dev": "nodemon src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "db:generate": "prisma generate"
}
```

---

## Outils de Développement

| Outil                       | Version | Usage                  |
| --------------------------- | ------- | ---------------------- |
| ESLint                      | ^9.0.0  | Linting code           |
| eslint-config-next          | ^15.0.0 | Config ESLint Next.js  |
| @eslint/eslintrc            | ^3.2.0  | Config ESLint          |
| Prettier                    | ^3.4.0  | Formatage code         |
| prettier-plugin-tailwindcss | ^0.6.0  | Ordre classes Tailwind |

---

## API et Patterns

### Next.js App Router

```typescript
// Structure de page
// app/[route]/page.tsx
export default function Page() {
  return <Component />;
}

// Layout
// app/[route]/layout.tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

### Server Components vs Client Components

```typescript
// Server Component (par défaut)
// Pas de 'use client'
async function ServerComponent() {
  const data = await fetchData(); // Côté serveur
  return <div>{data}</div>;
}

// Client Component
'use client';
function ClientComponent() {
  const [state, setState] = useState(); // Côté client
  return <button onClick={...}>Click</button>;
}
```

### Prisma Queries

```typescript
// Lecture
const users = await prisma.user.findMany({
  include: { profile: true },
})

// Création
const user = await prisma.user.create({
  data: { username, avatar },
})

// Mise à jour
await prisma.user.update({
  where: { id },
  data: { username },
})
```

### Socket.io Events

```typescript
// Client
socket.emit("roll_dice", { gameId })
socket.on("game_state", (state: GameState) => {})

// Server
io.on("connection", (socket) => {
  socket.on("roll_dice", async ({ gameId }) => {
    // Logique
    io.to(gameId).emit("game_state", newState)
  })
})
```

---

## Versions à Éviter

| Package   | Version | Raison                |
| --------- | ------- | --------------------- |
| Next.js   | < 13    | Pages Router déprécié |
| React     | < 18    | Pas de hooks modernes |
| Prisma    | < 5     | API différente        |
| Socket.io | < 4     | Breaking changes      |

---

## CI/CD (Racine)

### Git Hooks

| Package     | Version | Notes                               |
| ----------- | ------- | ----------------------------------- |
| husky       | ^9.1.7  | Git hooks modernes                  |
| lint-staged | ^15.4.3 | Lint sur fichiers staged uniquement |

### Commit Validation

| Package                         | Version | Notes                       |
| ------------------------------- | ------- | --------------------------- |
| @commitlint/cli                 | ^19.6.1 | Validation des commits      |
| @commitlint/config-conventional | ^19.6.0 | Règles Conventional Commits |

### GitHub Actions

| Action                      | Version | Usage                |
| --------------------------- | ------- | -------------------- |
| actions/checkout            | v4      | Checkout du code     |
| actions/setup-node          | v4      | Setup Node.js        |
| actions/cache               | v4      | Cache dépendances    |
| softprops/action-gh-release | v2      | Création de releases |

---

## Ressources Documentation

- Next.js 16: https://nextjs.org/docs
- React 19: https://react.dev
- Radix UI: https://www.radix-ui.com/primitives
- Prisma 5: https://www.prisma.io/docs
- TailwindCSS 4: https://tailwindcss.com/docs
- Socket.io 4: https://socket.io/docs/v4
- Zod: https://zod.dev
- Conventional Commits: https://www.conventionalcommits.org
- Semantic Versioning: https://semver.org
- Husky: https://typicode.github.io/husky
- Commitlint: https://commitlint.js.org
