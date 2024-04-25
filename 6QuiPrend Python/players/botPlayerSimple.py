from players.botPlayer import BotPlayer

class BotPlayerSimple(BotPlayer):
    def player_turn(self, game):
        """
        Gère le tour de jeu d'un joueur.
        :param game : le jeu en cours
        """
        carteChoisie = self.getCardToPlay()
        if carteChoisie in self.hand:
            return carteChoisie
        else:
            self.info("Vous n'avez pas cette carte dans votre main")
