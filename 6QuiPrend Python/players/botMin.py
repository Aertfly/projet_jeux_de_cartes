from players.player import Player
from game.card import Card

class BotMin(botPlayer):
    """
    Le bot qui choisit toujours la valeur la plus petite
    """
    def getCardToPlay(self):    
        try:
            result = 105
            for i in range(len(self.hand)):
                if result > self.hand[i]:
                    result = self.hand[i]
            return result
        except ValueError:
            self.info("Là ya une dingz.")
