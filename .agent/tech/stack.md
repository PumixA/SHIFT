# Stack Technique - SHIFT

> Version: 1.0.0
> Dernière mise à jour: 2026-02-04

Ce document liste les versions EXACTES des dépendances. Les agents IA DOIVENT utiliser ces versions pour éviter les API dépréciées ou inexistantes.

---

## Frontend (client/)

### Framework Principal

| Package | Version | Notes |
|---------|---------|-------|
| next | 16.0.10 | App Router UNIQUEMENT, pas de Pages Router |
| react | 19.2.0 | Composants fonctionnels + hooks |
| react-dom | 19.2.0 | - |
| typescript | 5.9.3+ | Mode strict activé |

### UI Components (Radix UI)

| Package | Version | Usage |
|---------|---------|-------|
| @radix-ui/react-accordion | ^1.2.2 | Panneaux dépliables |
| @radix-ui/react-alert-dialog | ^1.1.4 | Dialogues d'alerte |
| @radix-ui/react-avatar | ^1.1.2 | Avatars utilisateurs |
| @radix-ui/react-checkbox | ^1.1.3 | Cases à cocher |
| @radix-ui/react-dialog | ^1.1.4 | Modales |
| @radix-ui/react-dropdown-menu | ^2.1.4 | Menus déroulants |
| @radix-ui/react-label | ^2.1.1 | Labels de formulaire |
| @radix-ui/react-popover | ^1.1.4 | Popovers |
| @radix-ui/react-progress | ^1.1.1 | Barres de progression |
| @radix-ui/react-scroll-area | ^1.2.2 | Zones scrollables |
| @radix-ui/react-select | ^2.1.4 | Sélecteurs |
| @radix-ui/react-separator | ^1.1.1 | Séparateurs |
| @radix-ui/react-slider | ^1.2.2 | Sliders |
| @radix-ui/react-slot | ^1.1.1 | Composition |
| @radix-ui/react-switch | ^1.1.2 | Switches toggle |
| @radix-ui/react-tabs | ^1.1.2 | Onglets |
| @radix-ui/react-toast | ^1.2.4 | Notifications toast |
| @radix-ui/react-tooltip | ^1.1.6 | Tooltips |

### Styling

| Package | Version | Notes |
|---------|---------|-------|
| tailwindcss | 4.1.9 | Configuration Tailwind v4 |
| postcss | 8.4.49 | - |
| class-variance-authority | ^0.7.1 | Variants de classes |
| clsx | ^2.1.1 | Conditionnels de classes |
| tailwind-merge | ^2.6.0 | Merge intelligent |

### Formulaires et Validation

| Package | Version | Notes |
|---------|---------|-------|
| react-hook-form | ^7.54.2 | Gestion formulaires |
| zod | ^3.24.1 | Validation de schémas |
| @hookform/resolvers | ^3.9.1 | Intégration Zod |

### Animation et Visualisation

| Package | Version | Notes |
|---------|---------|-------|
| framer-motion | ^11.15.0 | Animations React |
| recharts | ^2.15.4 | Graphiques statistiques |
| lucide-react | ^0.454.0 | Icônes SVG |
| embla-carousel-react | ^8.5.1 | Carrousels |

### Temps Réel

| Package | Version | Notes |
|---------|---------|-------|
| socket.io-client | ^4.8.3 | Client WebSocket |

### Utilitaires

| Package | Version | Notes |
|---------|---------|-------|
| next-themes | ^0.4.4 | Thème dark/light |
| react-resizable-panels | ^2.1.7 | Panneaux redimensionnables |
| sonner | ^1.7.2 | Notifications |
| cmdk | ^1.0.4 | Command palette |
| input-otp | ^1.4.1 | Inputs OTP |
| vaul | ^1.1.2 | Drawers mobile |
| date-fns | ^4.1.0 | Manipulation dates |

---

## Backend (server/)

### Runtime et Framework

| Package | Version | Notes |
|---------|---------|-------|
| express | ^5.2.1 | Framework HTTP |
| typescript | ^5.6.3 | Mode strict |
| ts-node | ^10.9.2 | Exécution TS directe |

### Base de Données

| Package | Version | Notes |
|---------|---------|-------|
| @prisma/client | ^5.22.0 | Client ORM |
| prisma | ^5.22.0 | CLI et migrations |

**PostgreSQL**: 16-alpine (Docker)

### Temps Réel

| Package | Version | Notes |
|---------|---------|-------|
| socket.io | ^4.8.3 | Serveur WebSocket |

### Configuration

| Package | Version | Notes |
|---------|---------|-------|
| dotenv | ^16.4.5 | Variables d'environnement |
| cors | ^2.8.5 | Cross-Origin |

### Développement

| Package | Version | Notes |
|---------|---------|-------|
| nodemon | ^3.1.7 | Hot reload |
| @types/express | ^5.0.0 | Types Express |
| @types/cors | ^2.8.17 | Types CORS |
| @types/node | ^22.9.0 | Types Node.js |

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

| Outil | Version | Usage |
|-------|---------|-------|
| ESLint | 9.0.0 | Linting code |
| Prettier | 3.4.0 | Formatage code |
| prettier-plugin-tailwindcss | ^0.6.9 | Ordre classes Tailwind |

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
  include: { profile: true }
});

// Création
const user = await prisma.user.create({
  data: { username, avatar }
});

// Mise à jour
await prisma.user.update({
  where: { id },
  data: { username }
});
```

### Socket.io Events

```typescript
// Client
socket.emit('roll_dice', { gameId });
socket.on('game_state', (state: GameState) => {});

// Server
io.on('connection', (socket) => {
  socket.on('roll_dice', async ({ gameId }) => {
    // Logique
    io.to(gameId).emit('game_state', newState);
  });
});
```

---

## Versions à Éviter

| Package | Version | Raison |
|---------|---------|--------|
| Next.js | < 13 | Pages Router déprécié |
| React | < 18 | Pas de hooks modernes |
| Prisma | < 5 | API différente |
| Socket.io | < 4 | Breaking changes |

---

## Ressources Documentation

- Next.js 16: https://nextjs.org/docs
- React 19: https://react.dev
- Radix UI: https://www.radix-ui.com/primitives
- Prisma 5: https://www.prisma.io/docs
- TailwindCSS 4: https://tailwindcss.com/docs
- Socket.io 4: https://socket.io/docs/v4
- Zod: https://zod.dev
