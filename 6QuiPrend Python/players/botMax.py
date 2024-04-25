from players.botPlayerSimple  import BotPlayerSimple 
from game.card import Card

class BotMax(BotPlayerSimple):
    """
    Le bot qui choisit toujours la valeur la plus grosse
    """
    def getCardToPlay(self):    
        return self.hand[-1]
