# language: fr
@auth
Feature: Authentification utilisateur
  En tant qu'utilisateur
  Je veux pouvoir créer un compte et me connecter
  Afin d'accéder à mon profil et mes statistiques

  Background:
    Given le serveur est connecté à la base de données
    And le service d'email est configuré

  # ============================================
  # Inscription
  # ============================================

  @register
  Scenario: Inscription réussie avec email et mot de passe
    Given je suis sur la page profil sans être connecté
    When je clique sur "Créer un compte"
    And je remplis le formulaire avec:
      | username | TestUser          |
      | email    | test@example.com  |
      | password | password123       |
    And je soumets le formulaire
    Then je suis connecté avec le nom "TestUser"
    And je vois mon profil avec "Membre depuis"

  @register @validation
  Scenario: Inscription échoue avec email déjà utilisé
    Given un utilisateur existe avec l'email "existing@example.com"
    When je tente de m'inscrire avec l'email "existing@example.com"
    Then je vois l'erreur "Cette adresse email est déjà utilisée"

  @register @validation
  Scenario: Inscription échoue avec mot de passe trop court
    When je tente de m'inscrire avec le mot de passe "123"
    Then je vois l'erreur "Le mot de passe doit contenir au moins 6 caractères"

  @register @validation
  Scenario: Inscription échoue avec nom d'utilisateur invalide
    When je tente de m'inscrire avec le nom "ab"
    Then je vois l'erreur "Le nom d'utilisateur doit contenir entre 3 et 20 caractères"

  # ============================================
  # Connexion
  # ============================================

  @login
  Scenario: Connexion réussie
    Given un utilisateur existe avec:
      | email    | user@example.com |
      | password | password123      |
    When je me connecte avec "user@example.com" et "password123"
    Then je suis connecté
    And mon userId est stocké dans localStorage

  @login @validation
  Scenario: Connexion échoue avec mauvais mot de passe
    Given un utilisateur existe avec l'email "user@example.com"
    When je me connecte avec "user@example.com" et "wrongpassword"
    Then je vois l'erreur "Email ou mot de passe incorrect"

  @login @validation
  Scenario: Connexion échoue avec email inexistant
    When je me connecte avec "unknown@example.com" et "password123"
    Then je vois l'erreur "Email ou mot de passe incorrect"

  # ============================================
  # Déconnexion
  # ============================================

  @logout
  Scenario: Déconnexion
    Given je suis connecté
    When je clique sur "Déconnexion"
    Then mon userId est supprimé de localStorage
    And je vois la modal d'authentification

  # ============================================
  # Mot de passe oublié
  # ============================================

  @forgot-password
  Scenario: Demande de réinitialisation de mot de passe
    Given un utilisateur existe avec l'email "user@example.com"
    When je demande une réinitialisation pour "user@example.com"
    Then je vois le message "Si cette adresse existe, un email de réinitialisation a été envoyé"
    And un token de réinitialisation est créé
    And un email est envoyé avec le lien de réinitialisation

  @forgot-password @security
  Scenario: Demande avec email inexistant ne révèle pas l'information
    When je demande une réinitialisation pour "unknown@example.com"
    Then je vois le message "Si cette adresse existe, un email de réinitialisation a été envoyé"
    And aucun email n'est envoyé

  # ============================================
  # Réinitialisation de mot de passe
  # ============================================

  @reset-password
  Scenario: Réinitialisation de mot de passe réussie
    Given j'ai un token de réinitialisation valide
    When j'accède à la page de réinitialisation avec ce token
    Then le formulaire de nouveau mot de passe s'affiche
    When je saisis un nouveau mot de passe "newpassword123"
    And je confirme le mot de passe "newpassword123"
    And je soumets le formulaire
    Then je vois le message "Mot de passe modifié avec succès"
    And je peux me connecter avec "newpassword123"

  @reset-password @validation
  Scenario: Réinitialisation échoue avec token expiré
    Given j'ai un token de réinitialisation expiré
    When j'accède à la page de réinitialisation avec ce token
    Then je vois l'erreur "Ce lien a expiré"

  @reset-password @validation
  Scenario: Réinitialisation échoue avec token déjà utilisé
    Given j'ai un token de réinitialisation déjà utilisé
    When j'accède à la page de réinitialisation avec ce token
    Then je vois l'erreur "Ce lien a déjà été utilisé"

  @reset-password @validation
  Scenario: Réinitialisation échoue avec mots de passe non correspondants
    Given j'ai un token de réinitialisation valide
    And je suis sur la page de réinitialisation
    When je saisis un nouveau mot de passe "password1"
    And je confirme le mot de passe "password2"
    And je soumets le formulaire
    Then je vois l'erreur "Les mots de passe ne correspondent pas"

  # ============================================
  # Accès au profil
  # ============================================

  @profile @auth-required
  Scenario: Accès au profil sans être connecté
    Given je ne suis pas connecté
    When j'accède à la page profil
    Then je vois la modal d'authentification
    And je peux choisir de me connecter ou créer un compte

  @profile
  Scenario: Affichage du profil connecté
    Given je suis connecté en tant que "TestUser"
    When j'accède à la page profil
    Then je vois mon nom "TestUser"
    And je vois "Membre depuis" avec la date d'inscription
    And je vois mes statistiques:
      | Victoires | 0 |
      | Parties   | 0 |
      | Série     | 0 |
      | Score     | 0 |
