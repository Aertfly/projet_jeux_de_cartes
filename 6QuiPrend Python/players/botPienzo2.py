from players.player import Player
from game.card import Card


class BotPienzo2(Player):
    def player_turn(self, game):
        def fonction_tri(list_of_cards):
            return len(list_of_cards)

        #triee = sorted(game.table, key=fonction_tri, reverse=False)
        triee = game.table

        #print(f"\n\nAffichage de la liste triée")
        # Afficher les versions triée ou pas
        #for ligne in triee:
        #    print(ligne)

        safeZone = 4
        # On détermine la ligne avec le moins de carte
        minimum, indice = min((len(ligne), i) for i, ligne in enumerate(triee))
        # On a trouvé la ligne la plus petite : c'est la ligne numéro "indice", d'une taille de "minimum"
        while indice < 4:
            if len(triee[indice]) == minimum and minimum < safeZone:
                for carte in self.hand:
                    if carte > triee[indice][-1]: # Si on a une carte qui pourrait aller dans la ligne la moins remplie
                        if indice == 3: # Si on joue sur la dernière ligne
                            return carte
                        if carte < triee[indice+1][-1]: # Si la carte ne pourrait pas aller sur la ligne d'après
                            return carte
                        # La carte irait sur la ligne d'après, en fait on ne la joue pas            
            indice+=1

        # On est dans le cas où aucune carte ne remplit la stratégie

        # On trouve le numéro de ligne où irait la carte la plus grande de la main
        numero_ligne = -1
        maximum = -1
        for i, ligne in enumerate(triee):
            if self.hand[-1].value > ligne[-1].value and ligne[-1].value > maximum:
                numero_ligne = i
                maximum = ligne[-1].value

        if game.total_cows(triee[numero_ligne]) > game.total_cows(triee[self.getLineToRemove(game)-1]) and len(triee[numero_ligne]) == 5:
            return self.hand[0]
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