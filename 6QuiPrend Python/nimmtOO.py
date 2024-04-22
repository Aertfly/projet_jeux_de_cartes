import matplotlib.pyplot as plt
from players.humanPlayer import HumanPlayer
from game.nimmtGame import NimmtGame     
from players.randomBotPlayer import RandomBotPlayer
from players.botMin import BotMin
from players.botMax import BotMax
from players.botAlpha import AlphaBot

def interactiveRun():
    while True:
        try:
            nbBotsAleatoires = int(input("Entrez le nombre de bots qui jouent aléatoirement : "))
            nbBotsMax = int(input("Entrez le nombre de bots qui jouent toujours la carte la plus grande possible : "))
            nbBotsMin = int(input("Entrez le nombre de bots qui jouent toujours la carte la plus petite possible : "))
            nbBotsAlpha = int(input("Entrez le nombre de bots qui jouent en alpha : "))
            nb = int(input("Entrez le nombre de parties à jouer : "))

            bots = []

            for i in range(nbBotsAleatoires):
                bots.append(RandomBotPlayer(f"Aleatoire{i+1}"))
            for i in range(nbBotsMin):
                bots.append(BotMin(f"Min{i+1}"))
            for i in range(nbBotsMax):
                bots.append(BotMax(f"Max{i+1}"))
            for i in range(nbBotsAlpha):
                bots.append(AlphaBot(f"Alpha{i+1}"))    

            nb_victoires = {}

            for i in range(nb):
                game = NimmtGame(bots)
                scores, winners = game.play()

                for player in winners:
                    nb_victoires[player.name] = nb_victoires.get(player.name, 0) + 1
                print(f"   {i}\r", end="\r")

            # Trier les bots par nombre de victoires et obtenir les données triées
            sorted_bots = sorted(bots, key=lambda x: nb_victoires.get(x.name, 0), reverse=True)
            bot_names = [bot.name for bot in sorted_bots]
            victories = [nb_victoires.get(bot.name, 0)/nb*100 for bot in sorted_bots]

            # Mettre à jour les couleurs en fonction des bots triés
            colors = ["red"]*nbBotsAleatoires + ["green"]*nbBotsMin + ["blue"]*nbBotsMax + ["yellow"]*nbBotsAlpha
            sorted_colors = [color for _, color in sorted(zip([nb_victoires.get(bot.name, 0) for bot in bots], colors), reverse=True)]

            print(nb_victoires)
            plt.bar(bot_names, victories, color=sorted_colors)
            plt.xlabel('Bots')
            plt.ylabel('Pourcentage de victoires (%)')
            plt.title('Histogramme des victoires des bots par ordre décroissant')
            plt.show()

            print("\n\n\n")
        except ValueError:
            print("Veuillez entrer un nombre valide.")

def testHumain():
    players = []
    players.append(HumanPlayer("Pierre"))
    players.append(BotMax("Max1"))
    players.append(BotMax("Max2"))
    players.append(BotMax("Max3"))
    players.append(BotMax("Max4"))
    players.append(BotMax("Max5"))
    players.append(BotMax("Max6"))
    players.append(BotMax("Max7"))
    players.append(BotMax("Max8"))
    players.append(BotMax("Max9"))
    

    game = NimmtGame(players)
    scores, winners = game.play()
        
if __name__ == "__main__":
    interactiveRun()
    # testHumain()
