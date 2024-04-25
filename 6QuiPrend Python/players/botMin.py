from players.botPlayerSimple import BotPlayerSimple 
from game.card import Card

class BotMin(BotPlayerSimple):
    """
    Le bot qui choisit toujours la valeur la plus petite
    """
    def getCardToPlay(self):    
        if(len(self.hand)<=0):
            raise Exception("Main vide")
            return
        try:
            result = self.hand[0]
            for i in range(1,len(self.hand)):
                if result > self.hand[i]:
                    result = self.hand[i]
            return result
        except ValueError:
            self.info("Là ya une dingz.")
