from abc import ABC, abstractmethod
class Player(ABC):
    def __init__(self, name) -> None:
        """
        Crée un joueur avec un nom donné.

        :param name: Le nom du joueur.
        """
        self.name=name
        self.score=0
        self.hand=[]

    @abstractmethod
    def info(self, message):
        """
        Affiche un message à l'attention du joueur.

        :param message: Le message à afficher.
        """
        pass 

    @abstractmethod
    def getCardToPlay(self):
        """
        Permet d'obtenir la carte à jouer.

        :return: La réponse du joueur.
        """
        pass

    @abstractmethod
    def getLineToRemove(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        pass

    @abstractmethod
    def player_turn(self, game):
        """
        Gère le tour de jeu d'un joueur.
        :param game : le jeu en cours
        """
        pass

    def __repr__(self):
        """
        Retourne le joueur sous forme de chaîne.
        """
        return self.name