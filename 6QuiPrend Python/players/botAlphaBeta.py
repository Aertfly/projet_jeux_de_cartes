from players.botPlayer import BotPlayer
from game.card import Card


class BotAlphaBeta(BotPlayer):

    def player_turn(self, game):
        best_score, best_card = self.minimax(game, game.table, 0, -float('inf'), float('inf'), True)
        return best_card

    def evaluate(self, game):
        total_cows = sum(game.total_cows(row) for row in game.table)
        safe_cards = 0
        risky_cards = 0
        total_distance = 0
        
        for card in self.hand:
            distances = [abs(card.value - row[-1].value) for row in game.table]
            min_distance = min(distances)
            total_distance += min_distance

            if min_distance > 1:
                safe_cards += 1
            else:
                risky_cards += 1
        
        avg_distance = total_distance / len(self.hand) if self.hand else 0
        score = (safe_cards * 2) - (risky_cards * 3) - total_cows - avg_distance
        
        return score

    def getCardToPlay(self):
        pass

    def minimax(self, game, table, depth, alpha, beta, maximizing_player):
        if depth == 3 or len(table) == 0: 
            return self.evaluate(game), None

        if maximizing_player:
            max_score = -float('inf')
            best_card = None
            for card in self.hand:
                new_table = table[:]
                new_table.append([card])
                score, _ = self.minimax(game, new_table, depth + 1, alpha, beta, False)
                if score > max_score:
                    max_score = score
                    best_card = card
                alpha = max(alpha, max_score)
                if beta <= alpha:
                    break
            return max_score, best_card
        else:
            min_score = float('inf')
            best_card = None
            for card in self.hand:
                new_table = table[:]
                for i, row in enumerate(new_table):
                    if card < row[-1]:
                        new_table[i].append(card)
                        break
                else:
                    new_table.append([card])
                score, _ = self.minimax(game, new_table, depth + 1, alpha, beta, True)
                if score < min_score:
                    min_score = score
                    best_card = card
                beta = min(beta, min_score)
                if beta <= alpha:
                    break
            return min_score, best_card

        def calculate_remaining_cards(self, game):
            # Calculez les cartes restantes dans le jeu
            all_cards = set(range(1, 105))  
            hand_cards = set(card.value for card in self.hand)
            table_cards = set(card.value for row in game.table for card in row)
            remaining_cards = list(all_cards - hand_cards - table_cards)
            return remaining_cards