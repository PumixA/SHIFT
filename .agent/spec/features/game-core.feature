# language: fr
@game @core
Fonctionnalité: Mécanique de jeu de base
  En tant que joueur de SHIFT
  Je veux pouvoir jouer une partie standard
  Afin de progresser sur le plateau et gagner

  Contexte:
    Étant donné une partie avec 2 joueurs
    Et le plateau a 30 cases
    Et c'est le tour du joueur "Cyan"

  @dice
  Scénario: Lancer de dé valide
    Quand le joueur "Cyan" lance le dé
    Alors le résultat du dé est entre 1 et 6
    Et le joueur "Cyan" avance du nombre de cases correspondant
    Et l'historique contient "Cyan a lancé le dé"

  @movement
  Scénario: Déplacement sur le plateau
    Étant donné le joueur "Cyan" est sur la case 5
    Quand le joueur "Cyan" obtient 4 au dé
    Alors le joueur "Cyan" est sur la case 9
    Et l'événement "ON_LAND" est déclenché pour la case 9

  @turn
  Scénario: Changement de tour
    Quand le joueur "Cyan" termine son tour
    Alors c'est le tour du joueur "Violet"
    Et l'événement "ON_TURN_START" est déclenché pour "Violet"
    Et l'événement "ON_TURN_END" est déclenché pour "Cyan"

  @victory
  Scénario: Condition de victoire
    Étant donné le joueur "Cyan" est sur la case 28
    Quand le joueur "Cyan" obtient 5 au dé
    Alors le joueur "Cyan" gagne la partie
    Et le statut de la partie est "FINISHED"
    Et l'historique de partie est enregistré

  @turn @skip
  Scénario: Tour sauté
    Étant donné le joueur "Cyan" a l'effet "SKIP_TURN"
    Quand c'est le tour du joueur "Cyan"
    Alors le tour passe automatiquement à "Violet"
    Et l'effet "SKIP_TURN" est retiré de "Cyan"
    Et un message système indique "Cyan passe son tour"

  Plan du Scénario: Déplacement avec différentes valeurs de dé
    Étant donné le joueur "Cyan" est sur la case <position_initiale>
    Quand le joueur "Cyan" obtient <valeur_de> au dé
    Alors le joueur "Cyan" est sur la case <position_finale>

    Exemples:
      | position_initiale | valeur_de | position_finale |
      | 1                 | 1         | 2               |
      | 1                 | 6         | 7               |
      | 10                | 3         | 13              |
      | 25                | 6         | 30              |
      | 28                | 5         | 30              |
