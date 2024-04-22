from random import randint 
class randomBotPlayer(botPlayer):
    def getCardToPlay(self):
        return self.hand[randint(len(self.hand))]
