from players.player import Player
from game.card import Card

class HumanPlayer(Player):
    def info(self, message):
        """
        Affiche un message à l'attention du joueur.
        
        :param message: Le message à afficher.
        """
        print("@"+self.name+" : ",message)

    def getLineToRemove(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        while True:
            try:
                line = int(input(f"quelle ligne voulez-vous enlever ? "))
                if 1 <= line <= 4:
                    return line
                else:
                    self.info("Vous devez choisir une ligne entre 1 et 4")
            except ValueError:
                self.info("Veuillez entrer un nombre entier entre 1 et 4.")
        
    def getCardToPlay(self):    
        """
        Permet d'obtenir la carte à jouer.

        :return: La réponse du joueur.
        """    
        while True:
            try:
                response = int(input(f"@{self.name} ({self.score}🐮) quelle carte voulez-vous jouer ? "))
                if response <= 0:
                    raise ValueError
                return response
            except ValueError:
                self.info("Veuillez entrer un nombre entier positif.")
    
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
    