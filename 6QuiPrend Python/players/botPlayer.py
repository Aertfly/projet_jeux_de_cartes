from players.player import Player
from game.card import Card

class BotPlayer(Player):
    def info(self, message):
        """
        Affiche un message à l'attention du joueur.
        
        :param message: Le message à afficher.
        """
        print("@"+self.name+" : ",message)

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

    def player_turn(self, game):
        """
        Gère le tour de jeu d'un joueur.

        :param game : le jeu en cours
        """
        self.info(game.display_scores())
        self.info(game.display_table())
        while True:
            self.info(f"Votre main : {' '.join(map(str, self.hand))}")
            try:
                carteChoisie = Card(self.getCardToPlay())
                if carteChoisie in self.hand:
                    return carteChoisie
                else:
                    self.info("Vous n'avez pas cette carte dans votre main")
            except ValueError:
                self.info("Veuillez entrer un nombre entier correspondant à une carte dans votre main.")
    
