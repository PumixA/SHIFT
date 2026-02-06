# Index de Documentation IA - SHIFT

> Point d'entrée pour les agents IA travaillant sur le projet SHIFT

## Navigation Rapide

### Gouvernance et Règles

| Document                           | Description                             | Priorité            |
| ---------------------------------- | --------------------------------------- | ------------------- |
| [AGENT.md](./AGENT.md)             | Directives globales, règles impératives | **LIRE EN PREMIER** |
| [../.cursorrules](../.cursorrules) | Règles spécifiques Cursor AI            | Haute               |

### Spécifications Fonctionnelles

| Document                                     | Description                      |
| -------------------------------------------- | -------------------------------- |
| [spec/requirement.md](./spec/requirement.md) | Exigences produit, User Stories  |
| [spec/design.md](./spec/design.md)           | Architecture système, diagrammes |
| [spec/features/](./spec/features/)           | Scénarios BDD (Gherkin)          |

### Domaine Métier

| Document                           | Description                    |
| ---------------------------------- | ------------------------------ |
| [wiki/domain.md](./wiki/domain.md) | Glossaire, Ubiquitous Language |

### Technique

| Document                                   | Description                         |
| ------------------------------------------ | ----------------------------------- |
| [tech/stack.md](./tech/stack.md)           | Versions exactes des dépendances    |
| [spec/cicd.md](./spec/cicd.md)             | Pipeline CI/CD, Dependabot, GitFlow |
| [links/resources.md](./links/resources.md) | Documentation externe, APIs         |

---

## Arbre de Décision pour Agents

```
Quelle tâche dois-je accomplir?
│
├── Comprendre le projet
│   └── Lire: AGENT.md → spec/requirement.md → spec/design.md
│
├── Implémenter une fonctionnalité
│   ├── Lire: wiki/domain.md (termes métier)
│   ├── Lire: tech/stack.md (versions)
│   ├── Lire: spec/features/*.feature (comportement attendu)
│   └── Suivre: AGENT.md (règles de code)
│
├── Corriger un bug
│   ├── Lire: spec/design.md (architecture)
│   ├── Identifier le composant concerné
│   └── Suivre: AGENT.md (conventions)
│
├── Ajouter une dépendance
│   ├── Vérifier: tech/stack.md (compatibilité)
│   └── Mettre à jour: tech/stack.md après ajout
│
└── Modifier l'architecture
    ├── Lire: spec/design.md
    ├── Proposer un plan
    └── Mettre à jour: spec/design.md après validation
```

---

## Fichiers Gherkin Disponibles

| Fichier                                                      | Domaine            | Scénarios                     |
| ------------------------------------------------------------ | ------------------ | ----------------------------- |
| [game-core.feature](./spec/features/game-core.feature)       | Mécanique de jeu   | Dé, mouvement, victoire       |
| [rules-system.feature](./spec/features/rules-system.feature) | Règles dynamiques  | CRUD, triggers, effets        |
| [social.feature](./spec/features/social.feature)             | Social/Multiplayer | Amis, invitations, chat       |
| [auth.feature](./spec/features/auth.feature)                 | Authentification   | Register, login, reset passwd |

---

## Checklist Pré-Implémentation

Avant de modifier le code, vérifier:

- [ ] J'ai lu `AGENT.md` pour les règles globales
- [ ] J'ai vérifié les versions dans `tech/stack.md`
- [ ] J'ai compris les termes métier dans `wiki/domain.md`
- [ ] J'ai identifié les scénarios Gherkin concernés
- [ ] J'ai vérifié l'architecture dans `spec/design.md`

---

## Mise à Jour de la Documentation

Après toute modification significative:

1. **Nouvelle fonctionnalité** → Mettre à jour `spec/requirement.md`
2. **Changement d'architecture** → Mettre à jour `spec/design.md`
3. **Nouveau terme métier** → Ajouter dans `wiki/domain.md`
4. **Nouvelle dépendance** → Ajouter dans `tech/stack.md`
5. **Nouveau comportement** → Ajouter scénario `.feature`

---

## Contact et Contribution

- Template PR: `.github/pull_request_template.md`
- CI/CD: `.github/workflows/ci.yml`
- Conventional Commits: `<type>(<scope>): <description>`
