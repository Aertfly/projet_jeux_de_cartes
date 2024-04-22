class Card:
    """
    Représente une carte du jeu.
    Attributs :
    - value : La valeur de la carte.
    - cowsNb : Le nombre de boeufs associé à la carte.
    """
    def __init__(self, value):
        """
        Crée une carte avec une valeur donnée.
        :param value: La valeur de la carte.
        """
        self.value=value
        if self.value == 55:
            self.cowsNb= 7
        elif value % 10 == value // 10:
            self.cowsNb= 5
        elif value % 10 == 0:
            self.cowsNb= 3
        elif value % 10 == 5:
            self.cowsNb= 2
        else:
            self.cowsNb=1
    def __repr__(self):
        """
        Retourne la valeur de la carte sous forme de chaîne.
        """
        return str(self.value)
    def __lt__(self, other):
        """
        Compare deux cartes
        :param other: La carte à comparer.
        """
        return self.value < other.value
    def __eq__(self, other):
        """
        Compare deux cartes
        
        :param other: La carte à comparer.
        """
        return self.value == other.value
    