from players.botPlayer import BotPlayer
from game.card import Card
from random import randint

class BotPienzo(BotPlayer):
    def player_turn(self, game):
        safeZone = 4
        # On détermine la ligne avec le moins de carte
        minimum, indice = 6, -1
        for i, ligne in enumerate(game.table):
            if len(ligne) < minimum:
                minimum = len(ligne)
                indice = i
        # On a trouvé la ligne la plus petite : c'est la ligne numéro "indice", d'une taille de "minimum"
        while indice < 4:
            if len(game.table[indice]) == minimum and minimum < safeZone:
                for carte in self.hand:
                    if carte > game.table[indice][-1]: # Si on a une carte qui pourrait aller dans la ligne la moins remplie
                        if indice == 3: # Si on joue sur la dernière ligne
                            return carte
                        if carte < game.table[indice+1][-1]: # Si la carte ne pourrait pas aller sur la ligne d'après
                            return carte
                        # La carte irait sur la ligne d'après, en fait on ne la joue pas
            indice+=1
        return self.hand[-1]
                    

    def getCardToPlay(self):
        pass
