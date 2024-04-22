from random import randint 
from players.botPlayer import botPlayer
class randomBotPlayer(botPlayer):
    def getCardToPlay(self):
        return self.hand[randint(len(self.hand))]
