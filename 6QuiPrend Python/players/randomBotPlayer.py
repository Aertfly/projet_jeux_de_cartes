from random import randint 
from players.botPlayerSimple import BotPlayerSimple
class RandomBotPlayer(BotPlayerSimple):
    def getCardToPlay(self):
        return self.hand[randint(0,len(self.hand)-1)]
    
    def getLineToRemove(self, game):
        return randint(1,4)
