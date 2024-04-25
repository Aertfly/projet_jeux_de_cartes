from players.botPlayer import BotPlayer
from game.card import Card
from random import randint, choice

class BotEchantillon(BotPlayer):
    """
    Le bot qui choisit implémente une dizaine de simulations du round pour savoir
    quel choix est le moins risqué à prendre en fonction du nombre de tête de boeufs
    ramassées.
    """
    def __init__(self, name, nbSimulations=50):
        super().__init__(name)
        self.nbsimul = nbSimulations 

    @staticmethod
    def roundTest(carte, table):
        pts = 0
        #print("carte round :", carte.value)
        #print(table)
        i = 0
        while i < len(table) and carte.value > table[i][-1].value:
            i += 1

        if i == len(table) or carte.value < table[0][-1].value:
            ligne = randint(1, 4)
            #print("ligne choisie pour nouvelle carte:", ligne)
            pts = sum(card.cowsNb for card in table[ligne-1])
            table[ligne-1] = [carte]
        else:
            if len(table[i-1]) == 5:
                pts = sum(card.cowsNb for card in table[i-1])
                table[i-1] = [carte]
            else:
                table[i-1].append(carte)

        return pts, table

    @staticmethod
    def simulation(carteJoueur, autres_cartes_joueurs, game):
        plateau_temporaire = [ligne.copy() for ligne in game.table]

        for card_value in autres_cartes_joueurs:
            card = Card(card_value)
            if card.value < carteJoueur.value:
                sert_a_rien, plateau_temporaire = BotEchantillon.roundTest(card, plateau_temporaire)

        nb_points_gagnes, plateau_temporaire = BotEchantillon.roundTest(carteJoueur, plateau_temporaire)
        return nb_points_gagnes

    def getCardToPlay(self):
        pass
    
    def player_turn(self, game):
        resultatsRounds = []

        listeCartesPossibles = [i+1 for i in range(104)]
        for element in self.hand + game.alreadyPlayedCards:
            if element.value in listeCartesPossibles:
                listeCartesPossibles.remove(element.value)

        for _ in range(self.nbsimul):
            autreJoueursCartes = []
            while len(autreJoueursCartes) < len(game.players) - 1:
                carteRandom = choice(listeCartesPossibles)
                if carteRandom not in autreJoueursCartes:
                    autreJoueursCartes.append(carteRandom)

            resultatParties = []
            for carte in self.hand:
                resultatParties.append(self.simulation(carte, autreJoueursCartes, game))
            resultatsRounds.extend(resultatParties)

        #print("result :", resultatsRounds)
        #print("minimum de la liste :", min(resultatsRounds))
        carte_min_pts = min(resultatsRounds)
        cartes_min = [carte for carte, pts in zip(self.hand, resultatsRounds) if pts == carte_min_pts]
        #print("carte min ;", cartes_min)
        if cartes_min:
            return max(cartes_min, key=lambda c: c.value)  # Retourne la carte avec le moins de points et la plus grosse en cas d'égalité
        else:
            return self.hand[-1] # En cas d'erreur, ça peut arriver quand une carte rapporte un minimum de points, mais dans peu de situation
