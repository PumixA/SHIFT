# Exigences Fonctionnelles - SHIFT

> Version: 1.1.0
> Dernière mise à jour: 2026-02-06

## Vision Produit

SHIFT est un jeu de plateau stratégique où les règles évoluent dynamiquement pendant la partie. Contrairement aux jeux traditionnels à règles fixes, SHIFT permet aux joueurs de créer, modifier et supprimer des règles en temps réel, créant une expérience unique à chaque partie.

## Personas Utilisateurs

### Joueur Casual

- Veut des parties rapides et amusantes
- Utilise les packs de règles prédéfinis
- Joue principalement en mode local ou avec des bots

### Joueur Stratège

- Aime créer des règles complexes
- Optimise ses packs de règles personnalisés
- Joue en multijoueur compétitif

### Hôte de Soirée

- Organise des parties en groupe
- Configure les paramètres de jeu
- Gère les invitations et le lobby

## Fonctionnalités Core

### F1: Système de Jeu de Base

#### F1.1: Plateau de Jeu

- Plateau linéaire avec nombre de cases configurable (défaut: 30)
- Cases numérotées de 1 à N
- Visualisation des positions des joueurs
- Support 2-4 joueurs

#### F1.2: Tour de Jeu

- Ordre de jeu rotatif (Cyan → Violet → Orange → Vert)
- Lancer de dé (1-6)
- Déplacement automatique du pion
- Résolution des règles actives

#### F1.3: Condition de Victoire

- Premier joueur à atteindre ou dépasser la dernière case
- Classement par score en cas d'égalité
- Historique de partie enregistré

### F2: Système de Règles Dynamiques

#### F2.1: Création de Règles

- Interface de construction visuelle
- Sélection de déclencheur (trigger)
- Configuration des conditions
- Définition des effets
- Validation en temps réel

#### F2.2: Déclencheurs Disponibles

| Catégorie   | Déclencheurs                                                        |
| ----------- | ------------------------------------------------------------------- |
| Mouvement   | ON_MOVE_START, ON_PASS_OVER, ON_LAND, ON_TELEPORT, ON_BACKWARD_MOVE |
| Tour        | ON_TURN_START, ON_TURN_END, ON_DICE_ROLL                            |
| Score       | ON_SCORE_THRESHOLD, ON_REACH_POSITION, ON_NEAR_VICTORY              |
| Interaction | ON_OVERTAKE, ON_SAME_TILE, ON_PLAYER_BYPASS                         |
| Jeu         | ON_GAME_START, ON_FIRST_MOVE, ON_CONSECUTIVE_SIX                    |

#### F2.3: Effets Disponibles

| Catégorie | Effets                                                                             |
| --------- | ---------------------------------------------------------------------------------- |
| Mouvement | MOVE_RELATIVE, TELEPORT, SWAP_POSITIONS, MOVE_TO_TILE, MOVE_RANDOM                 |
| Tour      | SKIP_TURN, EXTRA_TURN                                                              |
| Score     | MODIFY_SCORE, STEAL_POINTS                                                         |
| Power-ups | APPLY_DOUBLE_DICE, APPLY_SHIELD, APPLY_SPEED_BOOST, APPLY_SLOW, APPLY_INVISIBILITY |

#### F2.4: Packs de Règles

- 10+ packs prédéfinis (Vanilla, Classic, Challenge, etc.)
- Création de packs personnalisés
- Partage de packs entre utilisateurs
- Import/Export de configurations

### F3: Modes de Jeu

#### F3.1: Multijoueur en Ligne

- Création de salons avec code d'accès
- Matchmaking par invitation
- Chat en temps réel
- Synchronisation WebSocket

#### F3.2: Mode Local/Hors Ligne

- Partie sur un seul appareil
- Support hors connexion (PWA)
- Bots IA (facile, moyen, difficile)

#### F3.3: Sauvegarde et Reprise

- Sauvegarde automatique de l'état
- Reprise de partie interrompue
- Historique des parties terminées

### F4: Social et Communauté

#### F4.1: Système d'Amis

- Ajout d'ami par ID utilisateur (copie depuis la page Amis)
- Demandes d'amitié (envoi, réception, acceptation, refus)
- Liste d'amis avec statut en ligne/hors ligne
- Retrait d'ami
- Redirection vers /profile si non connecté
- Blocage d'utilisateurs (non implémenté)

#### F4.2: Chat en Jeu (Non implémenté)

> Cette fonctionnalité est prévue pour une version future.

- Messages texte
- Réactions emoji
- Messages système
- Historique de conversation

#### F4.3: Invitations

- Invitation d'amis à une partie
- Bouton "Inviter à jouer" visible uniquement pour les amis en ligne
- Bouton "Rejoindre la partie" pour les amis en partie

### F5: Profil et Statistiques

#### F5.1: Profil Utilisateur

- Avatar personnalisable
- Nom d'utilisateur unique
- Préférences de jeu
- Date d'inscription ("Membre depuis")

#### F5.2: Statistiques

- Nombre de parties jouées
- Victoires / Défaites
- Score total cumulé
- Taux de victoire
- Score moyen par partie
- Série de victoires (actuelle et meilleure)

### F7: Authentification

#### F7.1: Inscription

- Création de compte avec email/mot de passe
- Validation du nom d'utilisateur (3-20 caractères, unique)
- Validation du mot de passe (minimum 6 caractères)
- Vérification unicité de l'email

#### F7.2: Connexion

- Connexion par email/mot de passe
- Stockage du userId en localStorage
- Session persistante jusqu'à déconnexion

#### F7.3: Réinitialisation de Mot de Passe

- Demande de réinitialisation par email
- Génération de token sécurisé (32 bytes)
- Expiration du token après 1 heure
- Page de réinitialisation avec validation du token
- Email de réinitialisation avec template HTML

#### F7.4: Services Backend

- `AuthService`: gestion register/login/reset password
- `EmailService`: envoi d'emails via nodemailer
- Hachage bcrypt avec 10 rounds de salage
- Modèle `PasswordReset` en base de données

### F8: Options et Paramètres

#### F8.1: Audio

- Volume principal (0-100%)
- Volume musique (0-100%)
- Volume effets sonores (0-100%)
- Mode muet global

#### F8.2: Contrôles

- Support manette (activable)
- Vibrations manette (activable)
- Raccourcis clavier (activable)

#### F8.3: Notifications

- Notifications push (activable)
- Sons de notification (activable)
- Vibrations de notification (activable)
- Rappel de tour (activable)

## Exigences Non Fonctionnelles

### Performance

- Temps de chargement initial < 3s
- Latence réseau < 100ms pour les actions
- Support de 100 parties simultanées par serveur

### Accessibilité

- Navigation au clavier complète
- Support manettes de jeu
- Responsive mobile
- Mode sombre natif

### Sécurité

- Validation côté serveur de toutes les actions
- Protection contre la triche
- Données utilisateur chiffrées
- Sessions sécurisées

### Disponibilité

- Mode hors ligne fonctionnel
- PWA installable
- Reconnexion automatique

## Fonctionnalités Additionnelles

### F6: Système de Tutoriel

#### F6.1: Onboarding Non-Intrusif

- Modal de bienvenue au premier lancement
- Option "Ne plus demander" persistante
- Consentement utilisateur requis avant tutoriel

#### F6.2: Tutoriel Interactif

- Navigation libre (précédent/suivant)
- 11 étapes réparties en 4 sections
- Overlay semi-transparent (50% opacité)
- Mise en surbrillance des éléments
- Raccourcis clavier (flèches, Échap)

#### F6.3: Sections du Tutoriel

| Section  | Nom        | Contenu                                   |
| -------- | ---------- | ----------------------------------------- |
| basics   | Les bases  | Bienvenue, Dé, Déplacement                |
| rules    | Les règles | Règles dynamiques, Déclencheurs, Création |
| board    | Le plateau | Modification, Effets                      |
| advanced | Avancé     | Victoire, Contrôles, Fin                  |

#### F6.4: Accès Segmenté

- Onglet "Aide" dans les paramètres
- Relancer une section spécifique
- Relancer le tutoriel complet
- Visualisation des sections vues (badges)

#### F6.5: Conseils Contextuels

- Hints non-bloquants via toasts
- Activables/désactivables dans les paramètres
- Déclenchés par phase de jeu et actions

#### F6.6: Persistance

- Préférences dans LocalStorage (`shift_settings`)
- Migration automatique de l'ancien flag
- Réinitialisation possible
