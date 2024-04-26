from players.player import Player
from game.card import Card


class BotPienzo(Player):
    def player_turn(self, game):
        safeZone = 3
        # On détermine la ligne avec le moins de carte
        minimum, indice = min((len(ligne), i) for i, ligne in enumerate(game.table))
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
                    
    def getLineToRemove(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite, par défaut pour les bots la ligne avec le moins de têtes de boeufs.

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        line, nbBoeufMin = 0, 66
        for i in range(4):
            if (game.total_cows(game.table[i]) <= nbBoeufMin):
                line = i+1
                nbBoeufMin = game.total_cows(game.table[i])
        return line

    def getCardToPlay(self):
        pass

    def info(self, message):
        pass