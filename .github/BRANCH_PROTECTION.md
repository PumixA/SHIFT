# Configuration de la protection des branches

Ce guide explique comment configurer la protection des branches sur GitHub.

## Accès aux paramètres

1. Aller sur le repository GitHub
2. Settings → Branches → Add branch protection rule

---

## Configuration pour `main` (Production)

### Branch name pattern

```
main
```

### Règles à activer

- [x] **Require a pull request before merging**
  - [x] Require approvals: `1`
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Status checks requis:
    - `CI Success`
    - `Security Scan`
    - `Validate Commit Messages`
    - `Validate PR Title`
    - `Validate PR Target`

- [x] **Require conversation resolution before merging**

- [x] **Do not allow bypassing the above settings**

- [ ] **Allow force pushes** → DÉSACTIVÉ
- [ ] **Allow deletions** → DÉSACTIVÉ

---

## Configuration pour `dev` (Pre-production)

### Branch name pattern

```
dev
```

### Règles à activer

- [x] **Require a pull request before merging**
  - [x] Require approvals: `0` (optionnel)
  - [ ] Dismiss stale pull request approvals → optionnel

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Status checks requis:
    - `CI Success`
    - `Validate Commit Messages`
    - `Validate PR Title`

- [ ] **Allow force pushes** → DÉSACTIVÉ
- [ ] **Allow deletions** → DÉSACTIVÉ

---

## Environnements GitHub (optionnel)

### Créer l'environnement `staging`

1. Settings → Environments → New environment
2. Name: `staging`
3. Configuration:
   - [ ] Required reviewers (optionnel)
   - [x] Deployment branches: `dev`

### Créer l'environnement `production`

1. Settings → Environments → New environment
2. Name: `production`
3. Configuration:
   - [x] Required reviewers: ajouter les mainteneurs
   - [x] Deployment branches: `main`
   - [ ] Wait timer: optionnel (ex: 5 minutes)

---

## Vérification

Après configuration, tester avec :

1. Créer une branche `test/branch-protection`
2. Faire un commit avec un mauvais format
3. Vérifier que le push est rejeté
4. Créer une PR vers `main` depuis une branche non-dev
5. Vérifier que la PR est bloquée

---

## Troubleshooting

### Les status checks n'apparaissent pas

Les status checks doivent avoir été exécutés au moins une fois pour apparaître dans la liste. Faites un premier push sur une branche pour les déclencher.

### Le workflow ne se déclenche pas

Vérifier que :

1. Le fichier YAML est valide
2. Les branches sont correctement orthographiées
3. Les permissions du workflow sont correctes

### Erreur "branch protection rule not applied"

S'assurer que :

1. Le pattern de branche correspond exactement
2. L'utilisateur n'a pas les permissions admin permettant de bypass
