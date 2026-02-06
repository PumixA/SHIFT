# Glossaire du Domaine - SHIFT

> Version: 1.1.0
> Dernière mise à jour: 2026-02-06
> Langue: Français (termes techniques en anglais)

Ce glossaire définit le langage ubiquitaire (Ubiquitous Language) du projet SHIFT. Tous les agents IA et développeurs DOIVENT utiliser ces termes exactement comme définis.

---

## Entités de Jeu

### Board (Plateau)

Surface de jeu linéaire composée de **Tiles**. Configuré par `boardSize` (nombre de cases).

- Valeur par défaut: 30 cases
- Cases numérotées de 1 à N

### Tile (Case)

Unité de position sur le **Board**. Identifiée par son index (1-based).

- `position: number` - Index de la case (1 à boardSize)

### Player (Joueur)

Participant à une partie. Peut être humain ou **Bot**.

- `id: string` - Identifiant unique
- `position: number` - Position actuelle sur le plateau
- `score: number` - Points accumulés
- `color: PlayerColor` - Couleur assignée (Cyan, Violet, Orange, Green)
- `effects: PlayerEffect[]` - Effets actifs

### PlayerColor (Couleur de Joueur)

Enum des couleurs disponibles. Ordre de jeu par défaut.

```typescript
enum PlayerColor {
  CYAN = "cyan", // Premier
  VIOLET = "violet", // Deuxième
  ORANGE = "orange", // Troisième
  GREEN = "green", // Quatrième
}
```

### Bot (Intelligence Artificielle)

Joueur contrôlé par l'ordinateur.

- Niveaux: `easy`, `medium`, `hard`
- Logique dans `lib/bot-ai.ts`

---

## Mécanique de Jeu

### Turn (Tour)

Cycle d'actions d'un joueur. Composé de:

1. **Turn Start** - Début du tour
2. **Dice Roll** - Lancer de dé
3. **Movement** - Déplacement
4. **Rule Resolution** - Application des règles
5. **Turn End** - Fin du tour

### Dice Roll (Lancer de Dé)

Action générant un nombre aléatoire de 1 à 6.

- Calculé côté serveur uniquement (anti-triche)
- Peut être modifié par des **Effects**

### Movement (Déplacement)

Changement de position d'un joueur sur le plateau.

- `MOVE_FORWARD` - Avancer de N cases
- `MOVE_BACKWARD` - Reculer de N cases
- `TELEPORT` - Se déplacer directement à une case
- `SWAP` - Échanger de position avec un autre joueur

### Victory Condition (Condition de Victoire)

Premier joueur à atteindre ou dépasser la dernière case du plateau.

- En cas d'égalité: départage par score

---

## Système de Règles

### Rule (Règle)

Instruction conditionnelle modifiant le comportement du jeu.

- `name: string` - Nom descriptif
- `trigger: RuleTrigger` - Événement déclencheur
- `condition: RuleCondition?` - Condition optionnelle
- `effect: RuleEffect` - Action à exécuter
- `isActive: boolean` - État d'activation

### RuleTrigger (Déclencheur)

Événement déclenchant l'évaluation d'une règle.

| Trigger              | Description                           |
| -------------------- | ------------------------------------- |
| `ON_TURN_START`      | Début du tour d'un joueur             |
| `ON_TURN_END`        | Fin du tour d'un joueur               |
| `ON_DICE_ROLL`       | Après le lancer de dé                 |
| `ON_MOVE_START`      | Avant le déplacement                  |
| `ON_LAND`            | Arrivée sur une case                  |
| `ON_PASS_OVER`       | Passage sur une case (sans s'arrêter) |
| `ON_TELEPORT`        | Après une téléportation               |
| `ON_BACKWARD_MOVE`   | Lors d'un recul                       |
| `ON_OVERTAKE`        | Dépassement d'un adversaire           |
| `ON_SAME_TILE`       | Arrivée sur une case occupée          |
| `ON_SCORE_THRESHOLD` | Atteinte d'un seuil de score          |
| `ON_NEAR_VICTORY`    | Approche de la victoire               |
| `ON_GAME_START`      | Début de partie                       |
| `ON_CONSECUTIVE_SIX` | Dés consécutifs de 6                  |

### RuleCondition (Condition)

Prédicat filtrant l'activation d'une règle.

- `targetTile: number` - Case spécifique
- `targetPlayer: PlayerColor` - Joueur spécifique
- `scoreThreshold: number` - Seuil de score
- `diceValue: number` - Valeur de dé spécifique

### RuleEffect (Effet)

Action exécutée quand une règle est déclenchée.

| Effect               | Description                  |
| -------------------- | ---------------------------- |
| `MOVE_RELATIVE`      | Déplacer de +/- N cases      |
| `TELEPORT`           | Téléporter à une case        |
| `SWAP_POSITIONS`     | Échanger les positions       |
| `SKIP_TURN`          | Passer le prochain tour      |
| `EXTRA_TURN`         | Rejouer immédiatement        |
| `MODIFY_SCORE`       | Modifier le score (+/-)      |
| `STEAL_POINTS`       | Voler des points             |
| `APPLY_DOUBLE_DICE`  | Doubler le prochain dé       |
| `APPLY_SHIELD`       | Immunité aux effets négatifs |
| `APPLY_SPEED_BOOST`  | Bonus de mouvement           |
| `APPLY_SLOW`         | Malus de mouvement           |
| `APPLY_INVISIBILITY` | Invisible aux règles ciblées |

### RulePack (Pack de Règles)

Collection prédéfinie de règles.

- `id: string` - Identifiant unique
- `name: string` - Nom du pack
- `description: string` - Description
- `rules: Rule[]` - Liste des règles
- `isDefault: boolean` - Pack système ou personnalisé

---

## Effets Temporaires

### PlayerEffect (Effet Joueur)

Modificateur temporaire appliqué à un joueur.

- `type: EffectType` - Type d'effet
- `duration: number` - Tours restants
- `value: number?` - Valeur associée

### EffectType (Type d'Effet)

```typescript
enum EffectType {
  DOUBLE_DICE = "doubleDice",
  SHIELD = "shield",
  SPEED_BOOST = "speedBoost",
  SLOW = "slow",
  INVISIBILITY = "invisibility",
  SKIP_TURN = "skipTurn",
  EXTRA_TURN = "extraTurn",
}
```

---

## Session de Jeu

### GameSession (Partie)

Instance d'une partie en cours ou terminée.

- `id: string` - Identifiant unique
- `status: GameStatus` - État de la partie
- `hostId: string` - Créateur de la partie
- `players: Player[]` - Liste des joueurs
- `rules: Rule[]` - Règles actives
- `currentTurn: number` - Tour actuel
- `boardSize: number` - Taille du plateau

### GameStatus (État de Partie)

```typescript
enum GameStatus {
  WAITING = "waiting", // En attente de joueurs
  IN_PROGRESS = "playing", // En cours
  PAUSED = "paused", // En pause
  FINISHED = "finished", // Terminée
}
```

### Lobby (Salon d'Attente)

Espace virtuel où les joueurs attendent le début de partie.

- Visible dans `/play`
- Gestion des invitations

---

## Actions et Historique

### Action (Action)

Événement enregistré dans l'historique de partie.

- `type: ActionType` - Type d'action
- `playerId: string` - Joueur concerné
- `timestamp: Date` - Horodatage
- `details: object` - Données spécifiques

### ActionHistory (Historique)

Journal chronologique des actions d'une partie.

- Affiché dans le composant `ActionHistory`
- Persisté pour replay

---

## Social

### Friendship (Amitié)

Relation entre deux utilisateurs.

- `status: FriendshipStatus` - État de la relation
- `requesterId: string` - Demandeur
- `addresseeId: string` - Destinataire

### FriendshipStatus

```typescript
enum FriendshipStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  BLOCKED = "blocked",
}
```

### Invitation

Demande de rejoindre une partie.

- `gameId: string` - Partie concernée
- `senderId: string` - Expéditeur
- `receiverId: string` - Destinataire
- `status: InvitationStatus` - État

---

## Authentification

### AuthService

Service backend gérant l'authentification des utilisateurs.

- Emplacement: `server/src/services/AuthService.ts`
- Méthodes: `register()`, `login()`, `forgotPassword()`, `resetPassword()`, `validateResetToken()`, `changePassword()`

### EmailService

Service backend pour l'envoi d'emails.

- Emplacement: `server/src/services/EmailService.ts`
- Méthodes: `sendPasswordResetEmail()`, `sendWelcomeEmail()`
- Transport: nodemailer avec SMTP

### PasswordReset (Token de Réinitialisation)

Entité stockant les demandes de réinitialisation de mot de passe.

- `id: string` - Identifiant unique
- `userId: string` - Utilisateur concerné
- `token: string` - Token sécurisé (32 bytes hex)
- `expiresAt: Date` - Date d'expiration (1 heure)
- `used: boolean` - Déjà utilisé ou non

### AuthModal

Composant modal pour l'authentification côté client.

- Emplacement: `client/components/auth/auth-modal.tsx`
- Onglets: Login, Register, Forgot Password

---

## Termes Techniques

### Socket Event (Événement Socket)

Message temps réel entre client et serveur via Socket.io.

### Game Engine (Moteur de Jeu)

Module serveur responsable de la logique de jeu pure.

- Emplacement: `server/src/engine/`

### PWA (Progressive Web App)

Application web installable avec support hors ligne.

### Feature Flag (Bascule de Fonctionnalité)

Configuration permettant d'activer/désactiver une fonctionnalité.

---

## Système de Tutoriel

### Tutorial (Tutoriel)

Système d'onboarding interactif guidant les nouveaux joueurs.

- Composant: `InteractiveTutorial`
- Hook: `useTutorial()`

### TutorialSection (Section de Tutoriel)

Groupe d'étapes du tutoriel organisées par thème.

```typescript
type TutorialSection = "basics" | "rules" | "board" | "advanced"
```

| Section    | Titre      | Étapes                                             |
| ---------- | ---------- | -------------------------------------------------- |
| `basics`   | Les bases  | 0-2 (Bienvenue, Dé, Déplacement)                   |
| `rules`    | Les règles | 3-5 (Règles dynamiques, Déclencheurs, Créer règle) |
| `board`    | Le plateau | 6-7 (Modification, Effets)                         |
| `advanced` | Avancé     | 8-10 (Victoire, Contrôles, Fin)                    |

### TutorialPreferences (Préférences Tutoriel)

Configuration utilisateur pour le système de tutoriel.

- `tutorialCompleted: boolean` - Tutoriel terminé au moins une fois
- `tutorialNeverAsk: boolean` - Ne plus afficher le modal de bienvenue
- `tutorialCompletedSections: string[]` - Sections vues
- `tutorialHintsEnabled: boolean` - Activer les conseils contextuels

### WelcomeModal (Modal de Bienvenue)

Dialogue affiché aux nouveaux joueurs proposant de suivre le tutoriel.

- Composant: `TutorialWelcomeModal`
- Affiché si: `shouldShowWelcome() === true`

### TutorialHints (Conseils Contextuels)

Toasts non-bloquants affichés pendant le jeu pour guider le joueur.

- Composant: `TutorialHints`
- Bibliothèque: Sonner
- Déclenchés par: phase de jeu, nombre de tours, actions
