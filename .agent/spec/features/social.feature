# language: fr
@social @multiplayer
Fonctionnalité: Fonctionnalités sociales
  En tant qu'utilisateur de SHIFT
  Je veux interagir avec d'autres joueurs
  Afin de créer une communauté et jouer ensemble

  @friends @request
  Scénario: Envoi d'une demande d'ami par ID
    Étant donné je suis connecté en tant que "Alice"
    Et l'utilisateur "Bob" existe avec l'ID "bob-123"
    Et "Bob" n'est pas mon ami
    Quand je copie l'ID de "Bob" depuis la page Amis
    Et j'envoie une demande d'ami avec l'ID "bob-123"
    Alors "Bob" reçoit une notification de demande d'ami
    Et le statut de la relation est "PENDING"
    Et la demande apparaît dans l'onglet "Envoyées"

  @friends @accept
  Scénario: Acceptation d'une demande d'ami
    Étant donné "Alice" m'a envoyé une demande d'ami
    Quand j'accepte la demande de "Alice"
    Alors "Alice" est dans ma liste d'amis
    Et je suis dans la liste d'amis de "Alice"
    Et le statut de la relation est "ACCEPTED"

  @friends @reject
  Scénario: Refus d'une demande d'ami
    Étant donné "Alice" m'a envoyé une demande d'ami
    Quand je refuse la demande de "Alice"
    Alors "Alice" n'est pas dans ma liste d'amis
    Et la demande est supprimée

  @friends @block @not-implemented
  Scénario: Blocage d'un utilisateur
    # Non implémenté - prévu pour version future
    Étant donné "Alice" est mon amie
    Quand je bloque "Alice"
    Alors "Alice" n'apparaît plus dans ma liste d'amis
    Et "Alice" ne peut plus m'envoyer de demandes
    Et "Alice" ne peut plus m'inviter à des parties
    Et le statut de la relation est "BLOCKED"

  @invitation @send
  Scénario: Invitation à une partie
    Étant donné je suis l'hôte d'une partie en attente
    Et "Bob" est mon ami
    Quand j'invite "Bob" à ma partie
    Alors "Bob" reçoit une notification d'invitation
    Et l'invitation apparaît dans la liste de "Bob"

  @invitation @accept
  Scénario: Acceptation d'une invitation
    Étant donné "Alice" m'a invité à sa partie
    Quand j'accepte l'invitation
    Alors je rejoins la partie de "Alice"
    Et je suis visible dans le lobby
    Et "Alice" voit que j'ai rejoint

  @invitation @decline
  Scénario: Refus d'une invitation
    Étant donné "Alice" m'a invité à sa partie
    Quand je refuse l'invitation
    Alors je ne rejoins pas la partie
    Et "Alice" est notifiée de mon refus

  @chat @message @not-implemented
  Scénario: Envoi de message en jeu
    # Non implémenté - prévu pour version future
    Étant donné je suis dans une partie avec "Bob"
    Quand j'envoie le message "Bien joué!"
    Alors "Bob" voit mon message dans le chat
    Et le message affiche mon nom et l'heure

  @chat @emoji @not-implemented
  Scénario: Envoi de réaction emoji
    # Non implémenté - prévu pour version future
    Étant donné je suis dans une partie avec "Bob"
    Quand j'envoie l'emoji "👍"
    Alors "Bob" voit ma réaction emoji
    Et la réaction est animée

  @lobby @create
  Scénario: Création d'un salon de jeu
    Quand je crée une nouvelle partie
    Alors un salon est créé avec un code unique
    Et je suis l'hôte du salon
    Et je peux configurer les paramètres de la partie

  @lobby @join
  Scénario: Rejoindre un salon par code
    Étant donné une partie existe avec le code "ABC123"
    Et la partie n'est pas complète
    Quand je rejoins avec le code "ABC123"
    Alors je suis ajouté au lobby
    Et les autres joueurs me voient

  @lobby @full
  Scénario: Tentative de rejoindre un salon complet
    Étant donné une partie avec 4 joueurs (maximum)
    Quand je tente de rejoindre cette partie
    Alors je reçois un message "Partie complète"
    Et je ne rejoins pas la partie

  @profile @stats
  Scénario: Consultation des statistiques
    Étant donné je suis connecté
    Quand je consulte mon profil
    Alors je vois mon nombre de parties jouées
    Et je vois mon nombre de victoires
    Et je vois mon score total
    Et je vois mon taux de victoire
    Et je vois mon score moyen
    Et je vois ma série de victoires actuelle et meilleure

  @friends @auth
  Scénario: Redirection si non connecté sur page Amis
    Étant donné je ne suis pas connecté
    Quand j'accède à la page Amis
    Alors je suis redirigé vers la page Profil
    Et je vois le formulaire de connexion

  @friends @remove
  Scénario: Retrait d'un ami
    Étant donné je suis connecté
    Et "Alice" est mon amie
    Quand je clique sur le bouton retirer pour "Alice"
    Et je confirme le retrait
    Alors "Alice" n'apparaît plus dans ma liste d'amis
    Et un message de confirmation s'affiche
