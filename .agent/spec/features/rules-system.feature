# language: fr
@rules @dynamic
Fonctionnalité: Système de règles dynamiques
  En tant que joueur de SHIFT
  Je veux créer et modifier des règles pendant la partie
  Afin de personnaliser l'expérience de jeu

  Contexte:
    Étant donné une partie en cours avec 2 joueurs
    Et le pack de règles "Vanilla" est activé

  @creation
  Scénario: Création d'une règle simple
    Quand je crée une règle avec:
      | champ       | valeur                    |
      | nom         | Bonus Case 10             |
      | déclencheur | ON_LAND                   |
      | condition   | targetTile = 10           |
      | effet       | MODIFY_SCORE +5           |
    Alors la règle "Bonus Case 10" est ajoutée à la partie
    Et la règle est visible dans le livre des règles
    Et un message système annonce la nouvelle règle

  @trigger @on_land
  Scénario: Déclenchement d'une règle ON_LAND
    Étant donné une règle "Piège Case 5" avec:
      | déclencheur | ON_LAND           |
      | condition   | targetTile = 5    |
      | effet       | MOVE_RELATIVE -3  |
    Quand le joueur "Cyan" atterrit sur la case 5
    Alors le joueur "Cyan" recule de 3 cases
    Et l'historique indique "Règle 'Piège Case 5' déclenchée"

  @trigger @on_pass
  Scénario: Déclenchement d'une règle ON_PASS_OVER
    Étant donné une règle "Péage" avec:
      | déclencheur | ON_PASS_OVER      |
      | condition   | targetTile = 15   |
      | effet       | MODIFY_SCORE -2   |
    Et le joueur "Cyan" est sur la case 12
    Quand le joueur "Cyan" obtient 5 au dé
    Alors le joueur "Cyan" perd 2 points en passant par la case 15
    Et le joueur "Cyan" est sur la case 17

  @effects @powerup
  Scénario: Application d'un effet temporaire
    Étant donné une règle "Double Dé" avec:
      | déclencheur | ON_DICE_ROLL              |
      | condition   | diceValue = 6             |
      | effet       | APPLY_DOUBLE_DICE 2 tours |
    Quand le joueur "Cyan" obtient 6 au dé
    Alors le joueur "Cyan" a l'effet "DOUBLE_DICE" pour 2 tours
    Et les prochains lancers de "Cyan" sont doublés

  @effects @shield
  Scénario: Bouclier bloque un effet négatif
    Étant donné le joueur "Cyan" a l'effet "SHIELD"
    Et une règle "Piège" qui applique "MOVE_RELATIVE -5"
    Quand le joueur "Cyan" déclenche la règle "Piège"
    Alors le joueur "Cyan" ne recule pas
    Et l'effet "SHIELD" est consommé
    Et un message indique "Bouclier activé!"

  @chain
  Scénario: Règles en chaîne
    Étant donné une règle "Téléportation" qui téléporte à la case 20
    Et une règle "Bonus Case 20" qui donne +10 points
    Quand le joueur "Cyan" déclenche "Téléportation"
    Alors le joueur "Cyan" est téléporté à la case 20
    Et la règle "Bonus Case 20" est déclenchée
    Et le joueur "Cyan" gagne 10 points

  @modification
  Scénario: Modification d'une règle existante
    Étant donné une règle "Bonus" qui donne +5 points
    Quand je modifie la règle "Bonus" pour donner +10 points
    Alors la règle "Bonus" donne maintenant +10 points
    Et l'historique indique "Règle 'Bonus' modifiée"

  @deletion
  Scénario: Suppression d'une règle
    Étant donné une règle "Obsolète" active
    Quand je supprime la règle "Obsolète"
    Alors la règle "Obsolète" n'est plus active
    Et elle n'apparaît plus dans le livre des règles

  @validation
  Scénario: Validation des règles invalides
    Quand je tente de créer une règle sans déclencheur
    Alors la création échoue
    Et un message d'erreur indique "Déclencheur requis"

  @pack
  Plan du Scénario: Chargement de packs de règles
    Quand je charge le pack de règles "<pack>"
    Alors <nombre_regles> règles sont actives
    Et le message système indique "Pack '<pack>' chargé"

    Exemples:
      | pack       | nombre_regles |
      | Vanilla    | 0             |
      | Classic    | 5             |
      | Challenge  | 10            |
