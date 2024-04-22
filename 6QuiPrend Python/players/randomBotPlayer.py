from random import randint 
from players.botPlayer import botPlayer
class randomBotPlayer(botPlayer):
    def getCardToPlay(self):
        return self.hand[randint(0,len(self.hand))]
    
    def getLineToRemove(self, game):
        return randint(1,4)
