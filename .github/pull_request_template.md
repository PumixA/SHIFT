## Description

<!-- Décrivez brièvement les changements apportés -->

## Type de changement

- [ ] `feat` - Nouvelle fonctionnalité
- [ ] `fix` - Correction de bug
- [ ] `docs` - Documentation
- [ ] `refactor` - Refactoring (pas de changement fonctionnel)
- [ ] `test` - Ajout/modification de tests
- [ ] `chore` - Maintenance (deps, config, etc.)

## Tickets liés

<!-- Lien vers le ticket/issue -->
Closes #

## Changements

### Fichiers modifiés
<!-- Liste des fichiers principaux modifiés -->
-

### Résumé des modifications
<!-- Bullet points des changements clés -->
-

## Captures d'écran

<!-- Si applicable, ajoutez des captures d'écran -->

## Checklist

### Code
- [ ] Le code suit les conventions du projet (`.cursorrules`)
- [ ] Pas de `any` TypeScript
- [ ] Les types de retour sont explicites
- [ ] Les entrées utilisateur sont validées avec Zod

### Tests
- [ ] Les tests existants passent
- [ ] De nouveaux tests couvrent les changements
- [ ] Les scénarios Gherkin sont mis à jour si nécessaire

### Documentation
- [ ] Le code est auto-documenté
- [ ] Les fichiers `.agent/` sont mis à jour si nécessaire
- [ ] Le glossaire (`wiki/domain.md`) est à jour

### Sécurité
- [ ] Pas de credentials en dur
- [ ] Les données sensibles sont protégées
- [ ] Validation côté serveur effectuée

## Plan de test

<!-- Comment tester ces changements -->

### Tests manuels
1.
2.

### Tests automatisés
```bash
# Commandes pour exécuter les tests
npm run test
```

## Notes pour les reviewers

<!-- Informations supplémentaires pour la revue -->

---

> **Rappel CI/CD**: Les checks suivants doivent passer:
> - [ ] TypeScript compilation
> - [ ] ESLint
> - [ ] Tests unitaires
> - [ ] Tests E2E
