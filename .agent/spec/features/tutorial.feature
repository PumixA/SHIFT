# language: fr
@tutorial @onboarding
Feature: Système de tutoriel interactif
  En tant que nouveau joueur
  Je veux être guidé dans l'apprentissage du jeu
  Sans être bloqué par des modales intrusives

  Background:
    Given je suis sur la page de jeu en mode local

  # ===================================
  # Première partie - Welcome Modal
  # ===================================

  @first-time
  Scenario: Affichage du modal de bienvenue pour un nouveau joueur
    Given je n'ai jamais complété le tutoriel
    And je n'ai pas coché "Ne plus demander"
    When la partie démarre
    Then je vois le modal de bienvenue après 1 seconde
    And le modal affiche "Bienvenue dans SHIFT !"
    And je vois les options "Oui, montrez-moi" et "Non merci"
    And je vois une checkbox "Ne plus me demander"

  @first-time
  Scenario: Démarrer le tutoriel depuis le modal de bienvenue
    Given je vois le modal de bienvenue
    When je clique sur "Oui, montrez-moi"
    Then le modal de bienvenue se ferme
    And le tutoriel interactif démarre
    And je vois l'étape "Bienvenue dans SHIFT !"

  @first-time
  Scenario: Passer le tutoriel depuis le modal de bienvenue
    Given je vois le modal de bienvenue
    When je clique sur "Non merci"
    Then le modal de bienvenue se ferme
    And le jeu continue normalement
    And le tutoriel ne démarre pas

  @never-ask
  Scenario: Option "Ne plus demander" empêche l'affichage futur
    Given je vois le modal de bienvenue
    When je coche "Ne plus me demander"
    And je clique sur "Non merci"
    Then le modal de bienvenue se ferme
    And la préférence "tutorialNeverAsk" est enregistrée à true
    When je rafraîchis la page et démarre une nouvelle partie
    Then le modal de bienvenue ne s'affiche pas

  # ===================================
  # Tutoriel interactif
  # ===================================

  @tutorial-navigation
  Scenario: Navigation dans le tutoriel complet
    Given le tutoriel interactif est ouvert
    Then je vois la barre de progression
    And je vois l'étape actuelle sur le nombre total
    When je clique sur "Suivant"
    Then je passe à l'étape suivante
    When je clique sur le bouton précédent
    Then je reviens à l'étape précédente

  @tutorial-navigation
  Scenario: Navigation au clavier
    Given le tutoriel interactif est ouvert
    When j'appuie sur la touche "Flèche droite"
    Then je passe à l'étape suivante
    When j'appuie sur la touche "Flèche gauche"
    Then je reviens à l'étape précédente
    When j'appuie sur "Échap"
    Then le tutoriel se ferme

  @tutorial-completion
  Scenario: Compléter le tutoriel
    Given le tutoriel interactif est ouvert
    And je suis à la dernière étape
    When je clique sur "Terminer"
    Then le tutoriel se ferme
    And la préférence "tutorialCompleted" est enregistrée à true
    And le modal de bienvenue ne s'affichera plus

  @tutorial-skip
  Scenario: Passer le tutoriel en cours
    Given le tutoriel interactif est ouvert
    When je clique sur "Passer"
    Then le tutoriel se ferme
    And le jeu continue normalement

  # ===================================
  # Tutoriel par sections
  # ===================================

  @sections
  Scenario: Accéder au tutoriel depuis les paramètres
    Given je suis en partie
    When j'ouvre les paramètres
    And je vais dans l'onglet "Aide"
    Then je vois les 4 sections du tutoriel:
      | Section   | Description                  |
      | Les bases | Dé et déplacement            |
      | Les règles| Système de règles dynamiques |
      | Le plateau| Modification et effets       |
      | Avancé    | Victoire et contrôles        |

  @sections
  Scenario: Lancer une section spécifique
    Given je suis dans l'onglet "Aide" des paramètres
    When je clique sur "Commencer" pour la section "Les règles"
    Then les paramètres se ferment
    And le tutoriel démarre à l'étape "Les règles dynamiques"
    And la barre de progression affiche le pourcentage de la section

  @sections
  Scenario: Section marquée comme vue après complétion
    Given je lance la section "Les bases"
    When je complète toutes les étapes de la section
    Then la section "Les bases" est marquée comme "Vu"
    And la préférence "tutorialCompletedSections" contient "basics"

  @sections
  Scenario: Revoir une section déjà complétée
    Given la section "Les bases" est marquée comme "Vu"
    When je vais dans l'onglet "Aide" des paramètres
    Then je vois un badge "Vu" sur la section "Les bases"
    And je peux cliquer sur "Revoir" pour relancer la section

  # ===================================
  # Conseils contextuels (Hints)
  # ===================================

  @hints
  Scenario: Conseils contextuels au premier tour
    Given les conseils contextuels sont activés
    And c'est le premier tour de la partie
    When 2 secondes passent sans action
    Then un toast apparaît avec "Lancez le dé !"
    And le toast a un bouton "Compris"

  @hints
  Scenario: Conseil après le premier déplacement
    Given les conseils contextuels sont activés
    And j'ai terminé mon premier déplacement
    When la phase de modification commence
    Then un toast apparaît avec "Vous pouvez modifier le jeu"

  @hints
  Scenario: Désactiver les conseils contextuels
    Given je suis dans l'onglet "Aide" des paramètres
    When je désactive "Conseils contextuels"
    Then la préférence "tutorialHintsEnabled" est enregistrée à false
    And aucun conseil contextuel n'apparaîtra pendant le jeu

  # ===================================
  # Réinitialisation
  # ===================================

  @reset
  Scenario: Réinitialiser la progression du tutoriel
    Given j'ai complété toutes les sections du tutoriel
    When je vais dans l'onglet "Aide" des paramètres
    And je clique sur "Réinitialiser la progression"
    Then toutes les sections sont marquées comme non vues
    And la préférence "tutorialCompleted" est à false
    And le modal de bienvenue s'affichera à la prochaine partie

  # ===================================
  # Accessibilité
  # ===================================

  @a11y
  Scenario: Le tutoriel est navigable au clavier
    Given le tutoriel interactif est ouvert
    Then tous les boutons sont accessibles avec Tab
    And je peux valider avec Entrée ou Espace
    And je peux fermer avec Échap

  @a11y
  Scenario: Le modal de bienvenue capture le focus
    Given le modal de bienvenue s'affiche
    Then le focus est sur le premier bouton interactif
    And Tab navigue entre les éléments du modal uniquement
