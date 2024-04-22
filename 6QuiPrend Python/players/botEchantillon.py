from player import Player
from game.card import Card
from random import randint

class botEchantillon(botPlayer):
    """
    Le bot qui choisit implémente une centaine de simulations du round pour savoir
    quel choix est le moins risqué à prendre en fonction du nombre de tête de boeufs
    ramassées.
    """
    def __init__(self, game):
        self.game = game

    def round(carte, table):
        pts = 0

        i = 1
        while carte > table[i][-1]: # Juste pour trouver la ligne où placer la carte
            i+=1
        i-=1

        if i == 0:
            ligne = randin(1, 4)
            pts = sum(card.cowsNb for card in table[ligne])
            table[ligne] = [carte]
        else: 
            if len(table[i]) == 5 :
                pts = sum(card.cowsNb for card in table[i])
                table[i] = [carte]
            else:
                table[i].append(carte)
        return pts, table

    def simulation(carteJoueur, autres_cartes_joueurs):
        plateau_temporaire = [ligne.copy() for ligne in botEchantillon.game.table]

        for cards in autres_cartes_joueurs:
            if cards < carteJoueur:
                sert_a_rien, plateau_temporaire = round(cards, plateau_temporaire)

        nb_points_gagnes, plateau_temporaire = round(carteJoueur, plateau_temporaire)
        return nb_points_gagnes

    def getCardToPlay(self):
        resultatsRounds = []

        listeCartesPossibles = [i+1 for i in range(104)]
        for element in self.hand:
            listeCartesPossibles.pop(element-1)
        for element in game.alreadyPlayedCards: # à corriger pour faire en sorte que "game.alreadyPlayedCards" soit la liste des cartes déjà joués
            listeCartesPossibles.pop(element-1)

        for _ in range(100):
            autreJoueursCartes = []
            for _ in range(len(game.players)): # à corriger pour faire en sorte que "game.players" soit la liste des noms des joueurs
                carteRandom = randint(0, len(listeCartesPossibles)-1)
                while carteRandom in autreJoueursCartes:
                    carteRandom = randint(0, len(listeCartesPossibles)-1)
                autreJoueursCartes.append(listeCartesPossibles[carteRandom])
            
            resultatParties = []
            for carte in self.hand:
                resultatParties.append(botEchantillon.simulation(carte, autreJoueursCartes))
            [resultatsRounds.append(element) for element in resultatParties if element==0]

        return max(resultatsRounds, key=resultatsRounds.count)

"""        

# Exemple de jeu pour tester le botEchantillon
table_jeu = {
    1: [10, 23, 25],
    2: [41, 44],
    3: [56, 60, 67],
    4: [80, 81, 83, 91]
}

already_played_cards = [2, 57, 82]  # Cartes déjà jouées

# Création d'une instance de botEchantillon avec des données de jeu
bot = botEchantillon({
    'table': table_jeu,
    'alreadyPlayedCards': already_played_cards,
    'players': ['Joueur3', 'Joueur2']  # Exemple de noms de joueurs
})

# Exemple de main du joueur pour tester la méthode getCardToPlay
hand_joueur = [55, 27, 42, 8]  # Main du joueur

# Assignation de la main du joueur au bot
bot.hand = hand_joueur

# Test de la méthode getCardToPlay
carte_a_jouer = bot.getCardToPlay()
print("Carte à jouer choisie par le bot :", carte_a_jouer)

"""