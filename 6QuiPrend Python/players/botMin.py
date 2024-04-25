from players.botPlayerSimple import BotPlayerSimple 
from game.card import Card

class BotMin(BotPlayerSimple):
    """
    Le bot qui choisit toujours la valeur la plus petite
    """
    def getCardToPlay(self):    
        return self.hand[0]