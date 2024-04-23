from players.botPlayer import BotPlayer
from game.card import Card

class BotMax(BotPlayer):
    """
    Le bot qui choisit toujours la valeur la plus grosse
    """
    def getCardToPlay(self):    
        if(len(self.hand)<=0):
            raise Exception("Main vide")
            return
        try:
            result = self.hand[0]
            for i in range(1,len(self.hand)):
                if result < self.hand[i]:
                    result = self.hand[i]
            return result
        except ValueError:
            self.info("Là ya une dingz.")
