from random import randint 
from players.botPlayer import BotPlayer
class RandomBotPlayer(BotPlayer):
    def getCardToPlay(self):
        return self.hand[randint(0,len(self.hand)-1)]
    
    def getLineToRemove(self, game):
        return randint(1,4)
