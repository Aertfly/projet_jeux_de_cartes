from random import shuffle
from game.card import Card

class NimmtGame:
    """
    Représente une partie du jeu 6 qui prend.
    Attributs :
    - players : La liste des joueurs de la partie.
    - table : Le plateau de jeu.
    - alreadyPlayedCards : La liste des cartes déjà jouées.    
    """
    def __init__(self,players):
        """
        Crée une partie du jeu 6 qui prend.

        :param players: La liste des joueurs.
        """
        self.players=players
        self.table=[]
        self.alreadyPlayedCards=[]
        for player in players:
            player.score=0

    @staticmethod
    def total_cows(cardlist):
        """
        Calcule le total de boeufs dans une liste de cartes.

        :param cardList: La liste de cartes.
        :return: Le nombre total de boeufs dans la liste.
        """
        return sum(card.cowsNb for card in cardlist)

    def distribute_cards(self):
        """
        Distribue les cartes aux joueurs.
        """
        cards = list(map(lambda c:Card(c),list(range(1, 105))))
        shuffle(cards)
        self.table=[]
        for _ in range(4):
            card=cards.pop()
            self.table.append([card])
            self.alreadyPlayedCards.append(card)
        for player in self.players:
            for _ in range(10):
                player.hand.append(cards.pop())
            player.hand.sort()

    def sort_table(self):
        """
        Trie le plateau par ordre croissant des dernières cartes de chaque ligne.
        """
        self.table.sort(key=lambda x: x[-1])
        
    def display_table(self):
        """
        retourne sous forme de chaîne le plateau de jeu avec le nombre de boeufs pour chaque ligne.
        """
        result="Plateau :\n"
        self.sort_table()
        for i, row in enumerate(self.table):
            result+=f"  Ligne {i + 1} ( {NimmtGame.total_cows(row)}🐮 ) : {' '.join(map(str, row))}\n"
        return result
    
    def display_scores(self):
        """
        retourne sous forme de chaîne le score de chaque joueur.
        """
        result="Score :\n"
        for player in self.players:
            result+=f"  Joueur {player.name} : {player.score} 🐮\n"
        return result

    def update_table(self, plays):
        """
        Met à jour le plateau après un tour de jeu.
        
        :param plays: Les coups joués pendant le tour, un coup est un couple (joueur, carte jouée).
        """
        for player, card in plays:
            placed = False
            self.alreadyPlayedCards.append(card)
            for i in range(len(self.table) - 1, -1, -1):
                if self.table[i][-1]<card:
                    if len(self.table[i]) < 5:
                        self.table[i].append(card)
                    else:
                        player.info(self.display_table())
                        cows = NimmtGame.total_cows(self.table[i])
                        player.score+= cows
                        player.info(f"vous avez joué la 6eme carte, vous prenez {cows} 🐮")
                        self.table[i] = [card]
                        self.sort_table()
                    placed = True
                    break
            if not placed:
                player.info(self.display_table())
                message=f"Cartes restants à placer : {' '.join(map(str, [c for _, c in plays[1:]]))}"
                player.info(message)
                player.info(f"vous avez joué {card}")
                line=player.getLineToRemove(self)
                
                player.score += NimmtGame.total_cows(self.table[line-1])
                self.table[line - 1] = [card]
                self.sort_table()

    def play_round(self):
        """
        Effectue un round de jeu complet.
        """
        for _ in range(10):
            plays = []
            for player in self.players:
                card = player.player_turn(self)
                plays.append((player, card))
                player.hand.remove(card)
            plays.sort(key=lambda x: x[1])
            self.update_table(plays)
           
    def play(self):
        """
        lance le jeu
        """
        while not any(map(lambda player:player.score>=66,self.players)):
            try:
                self.distribute_cards()
            except ValueError as e:
                print(e)
                return  
            self.play_round()
        winners=[]
        scores={}
        for player in self.players:
            
            scores[player.name]=player.score
            if winners==[] or player.score<winners[0].score:
                winners=[player]
            elif player.score==winners[0].score:
                winners.append(player)
        
        return scores, winners
