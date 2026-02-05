# CI/CD Pipeline - SHIFT

> Version: 1.1.0
> Dernière mise à jour: 2026-02-05

## Vue d'ensemble

SHIFT utilise une stratégie de déploiement **Blue-Green** avec GitHub Actions pour l'intégration et le déploiement continus.

## Architecture des branches

```
                    ┌─────────────────┐
                    │   PRODUCTION    │
                    │     (main)      │
                    │   v1.2.0        │
                    └────────▲────────┘
                             │ PR merge (protected)
                             │ + tag release
                    ┌────────┴────────┐
                    │   PRE-PROD      │
                    │     (dev)       │
                    │   v1.3.0-rc.1   │
                    └────────▲────────┘
                             │ PR merge
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐
    │ feat/xxx    │   │ fix/xxx     │   │ chore/xxx   │
    └─────────────┘   └─────────────┘   └─────────────┘
```

## Branches

| Branche      | Rôle                    | Protection             | Merge depuis        |
| ------------ | ----------------------- | ---------------------- | ------------------- |
| `main`       | Production              | Protégée (review + CI) | `dev`, `hotfix/*`   |
| `dev`        | Pre-production          | Protégée (CI)          | Branches de travail |
| `feat/*`     | Nouvelle fonctionnalité | Non                    | -                   |
| `fix/*`      | Correction de bug       | Non                    | -                   |
| `docs/*`     | Documentation           | Non                    | -                   |
| `refactor/*` | Refactoring             | Non                    | -                   |
| `test/*`     | Tests                   | Non                    | -                   |
| `chore/*`    | Maintenance             | Non                    | -                   |
| `hotfix/*`   | Urgence production      | Non                    | `main`              |

## Workflows GitHub Actions

### 1. validate-structure.yml

**Déclencheur**: Push sur branches de travail, PR vers dev/main

**Actions**:

- Valide le format du nom de branche
- Valide les messages de commit (Conventional Commits)
- Valide le titre des PR
- Vérifie la cible des PR

### 2. ci.yml

**Déclencheur**: Push et PR sur `dev` et `main`

**Jobs**:

```
client-check → client-build ─┐
                             ├→ test-unit → ci-success
server-check → server-build ─┤
                             └→ security-scan
                             └→ test-e2e (main/dev only)
```

### 3. prerelease.yml

**Déclencheur**: Push sur `dev`

**Actions**:

- Exécute la CI complète
- Crée un tag pre-release (v1.0.0-rc.N)
- (Futur) Déploie sur staging

### 4. release.yml

**Déclencheur**: Push de tag `v*`

**Actions**:

- Valide que VERSION correspond au tag
- Build complet client + server
- Génère le changelog automatique
- Crée une GitHub Release
- (Futur) Déploie en production

## Conventional Commits

Format obligatoire pour tous les commits:

```
<type>(<scope>): <description>

[body optionnel]

[footer optionnel]
```

### Types autorisés

| Type       | Description             | Impact version |
| ---------- | ----------------------- | -------------- |
| `feat`     | Nouvelle fonctionnalité | MINOR          |
| `fix`      | Correction de bug       | PATCH          |
| `docs`     | Documentation           | -              |
| `style`    | Formatage, style        | -              |
| `refactor` | Refactoring             | -              |
| `test`     | Tests                   | -              |
| `chore`    | Maintenance             | -              |
| `ci`       | CI/CD                   | -              |
| `build`    | Build system            | -              |
| `perf`     | Performance             | PATCH          |

### Scopes recommandés

```
client, server, engine, rules, board, player, bot, ui, auth, socket, db, ci, docs, deps
```

### Exemples

```bash
feat(rules): add swap position effect
fix(dice): correct random seed issue
docs(readme): update installation guide
refactor(engine): extract rule evaluator
chore(deps): update prisma to 5.23
```

## Versioning

### Format: Semantic Versioning

```
MAJOR.MINOR.PATCH[-PRERELEASE]

1.0.0        → Production stable
1.1.0-rc.1   → Release candidate
1.1.0-beta.3 → Version beta
```

### Fichier VERSION

Fichier centralisé à la racine : `/VERSION`

Les `package.json` sont synchronisés lors des releases.

## Hooks Git locaux (Husky)

### pre-commit

Exécute `lint-staged` pour :

- Prettier sur fichiers modifiés
- ESLint sur fichiers TypeScript

### commit-msg

Valide le message de commit avec `commitlint`.

## Installation locale

```bash
# À la racine du projet
npm install

# Husky s'initialise automatiquement via "prepare"
```

## Dependabot

Configuration automatique des mises à jour :

- **Branche cible** : `dev` (pas main)
- Client: hebdomadaire (lundi 9h)
- Server: hebdomadaire (lundi 9h)
- GitHub Actions: hebdomadaire

Les PR sont groupées par catégorie (radix-ui, prisma, etc.).

Les mises à jour passent d'abord par `dev` pour être testées avant d'atteindre `main`.

### Limitation : npm Workspaces

**Problème connu** : Dependabot ne supporte pas correctement npm workspaces.

- Dependabot met à jour `client/package-lock.json` ou `server/package-lock.json`
- Mais `npm ci` utilise le `package-lock.json` **racine**
- Résultat : CI échoue avec "Missing: <package>@<version> from lock file"

### Workflow de résolution

Quand une PR Dependabot échoue :

1. **Créer une branche manuelle** :

   ```bash
   git checkout dev && git pull origin dev
   git checkout -b chore/update-<package>
   ```

2. **Mettre à jour avec npm workspaces** :

   ```bash
   npm install <package>@<version> -w client --legacy-peer-deps
   # ou pour le server :
   npm install <package>@<version> -w server
   ```

3. **Commiter les deux fichiers** :

   ```bash
   git add client/package.json package-lock.json
   git commit -m "chore(deps): bump <package> from X to Y"
   git push origin chore/update-<package>
   ```

4. **Créer une PR** vers `dev` et fermer la PR Dependabot

### Exceptions de validation

Les branches `dependabot/**` sont exemptées de la validation des noms de branches dans `validate-structure.yml`.

## Protection des branches (GitHub Settings)

### main

```yaml
require_pull_request: true
required_approvals: 1
require_status_checks:
  - "CI Success"
  - "Security Scan"
require_branches_up_to_date: true
allow_force_push: false
```

### dev

```yaml
require_pull_request: true
required_approvals: 0
require_status_checks:
  - "CI Success"
allow_force_push: false
```

## Checklist de release

1. [ ] Tous les tests passent sur `dev`
2. [ ] Mettre à jour `VERSION` avec la nouvelle version
3. [ ] Mettre à jour `CHANGELOG.md`
4. [ ] Créer PR `dev` → `main`
5. [ ] Après merge, créer le tag: `git tag -a v1.x.x -m "Release v1.x.x"`
6. [ ] Push le tag: `git push origin v1.x.x`
7. [ ] Vérifier la GitHub Release générée
