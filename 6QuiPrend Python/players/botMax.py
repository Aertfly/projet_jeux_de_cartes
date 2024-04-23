from players.player import Player
from game.card import Card
from players.botPlayer import BotPlayer

class BotMax(BotPlayer):
    """
    Le bot qui choisit toujours la valeur la plus grosse
    """
    def getCardToPlay(self):    
        try:
            result = Card(0)
            for i in range(len(self.hand)):
                if result < self.hand[i]:
                    result = self.hand[i]
            return result.value
        except ValueError:
            self.info("Là ya une dingz.")
