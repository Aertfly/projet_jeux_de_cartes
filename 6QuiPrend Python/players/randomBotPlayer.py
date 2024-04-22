from random import randint 
class randomBotPlayer(Player):
    def getCardToPlay(self):
        return self.hand[randint(len(self.hand))]