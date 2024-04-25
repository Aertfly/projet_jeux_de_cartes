import matplotlib.pyplot as plt
from players.humanPlayer import HumanPlayer
from game.nimmtGame import NimmtGame     
from players.randomBotPlayer import RandomBotPlayer
from players.botMin import BotMin
from players.botMax import BotMax
from players.botEchantillon import BotEchantillon
from players.botAlphaBeta import BotAlphaBeta
from players.botPienzo import BotPienzo

def interactiveRun():
    while True:
        try:
            nbBotsAleatoires = int(input("Entrez le nombre de bots qui jouent aléatoirement : "))
            nbBotsMax = int(input("Entrez le nombre de bots qui jouent toujours la carte la plus grande possible : "))
            nbBotsMin = int(input("Entrez le nombre de bots qui jouent toujours la carte la plus petite possible : "))
            nbBotsAlpha = int(input("Entrez le nombre de bots qui jouent en alpha : "))
            nbBotsEchantillon = int(input("Entrez le nombre de bots qui jouent la méthode des échantillons : "))
            nbBotsPienzo = int(input("Entrez le nombre de bots Pienzo "))
            nb = int(input("Entrez le nombre de parties à jouer : "))

            bots = []

            for i in range(nbBotsAleatoires):
                bots.append(RandomBotPlayer(f"Aleatoire{i+1}"))
            for i in range(nbBotsMin):
                bots.append(BotMin(f"Min{i+1}"))
            for i in range(nbBotsMax):
                bots.append(BotMax(f"Max{i+1}"))
            for i in range(nbBotsAlpha):
                bots.append(BotAlphaBeta(f"Alpha{i+1}"))    
            for i in range(nbBotsEchantillon):
               bots.append(BotEchantillon(f"Echan{i+1}", 50))
            for i in range(nbBotsPienzo):
               bots.append(BotPienzo(f"Pienzo{i+1}"))
            nb_victoires = {}

            for i in range(nb):
                game = NimmtGame(bots)
                scores, winners = game.play()
                # print(scores)
                for player in winners:
                    nb_victoires[player.name] = nb_victoires.get(player.name, 0) + 1
                print(f"   {i}\r", end="\r")

            # Trier les bots par nombre de victoires et obtenir les données triées
            sorted_bots = sorted(bots, key=lambda x: nb_victoires.get(x.name, 0), reverse=True)
            bot_names = [bot.name for bot in sorted_bots]
            victories = [nb_victoires.get(bot.name, 0)/nb*100 for bot in sorted_bots]

            # Mettre à jour les couleurs en fonction des bots triés
            colors = ["red"]*nbBotsAleatoires + ["green"]*nbBotsMin + ["blue"]*nbBotsMax + ["black"]*nbBotsEchantillon + ["yellow"]*nbBotsAlpha + ["purple"]*nbBotsPienzo
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
    players.append(BotMax("Max1"))
    players.append(BotMax("Max2"))
    players.append(BotPienzo("Pienzo"))

    game = NimmtGame(players)
    scores, winners = game.play()
    print(scores, winners)

def est_positif(n):
  if n > 0:
    return 1
  else:
    return 0

def benchmark_winrate(a_tester, nbMax=0,nbMin=0,nbRandom=0,nbEchantillon=0):
    assert nbMax >= 0
    assert nbMin >= 0
    assert nbRandom >= 0
    assert nbEchantillon >= 0
    assert (nbMax + nbMin + nbRandom + nbEchantillon) >= 1
    assert (nbMax + nbMin + nbRandom + nbEchantillon) <= 9
    
    bots = []
    if a_tester.casefold() == "aleatoire":
        bots.append(RandomBotPlayer("Sujet"))
    if a_tester.casefold() == "min":
        bots.append(BotMin("Sujet"))
    if a_tester.casefold() == "max":
        bots.append(BotMax("Sujet"))
    if a_tester.casefold() == "echantillon":
        bots.append(BotEchantillon("Sujet"))
    if a_tester.casefold() == "alphabeta":
        bots.append(BotEchantillon("Sujet"))

    for i in range(nbRandom):
        bots.append(RandomBotPlayer(f"Aleatoire{i+1}"))
    for i in range(nbMin):
        bots.append(BotMin(f"Min{i+1}"))
    for i in range(nbMax):
        bots.append(BotMax(f"Max{i+1}"))
    for i in range(nbEchantillon):
        bots.append(BotEchantillon(f"Echantillon{i+1}"))

    # print(f"On va tester avec comme bots : {bots}")
    nb_victoires, nb_points = 0, 0
    nb_tests = 1000
    for i in range(nb_tests):
        game = NimmtGame(bots)
        scores, winners = game.play()

        for player in winners:
            if player.name == "Sujet":
                nb_victoires += 1
            nb_points += scores.get("Sujet")
        print(f"   {i}\r", end="\r")
    print(f"Taux de victoire : {round(nb_victoires/1000*100, 2)}%. Taux de victoire espéré : {round(100/len(bots), 2)}%")
    return round(nb_victoires/nb_tests*100,2), round(100/len(bots),2), nb_points/nb_tests

def test_complet():
    for nombre_adversaires in [1, 2, 5, 9]:
        for sujet in ["aleatoire", "min", "max", "echantillon"]:
            for adversaires in ["aleatoire", "min", "max", "echantillon"]:
                nbrandom, nbmin, nbmax, nbechantillon = 0, 0, 0, 0
                if adversaires == "aleatoire": nbrandom = nombre_adversaires
                if adversaires == "min": nbmin = nombre_adversaires
                if adversaires == "max": nbmax = nombre_adversaires
                if adversaires == "echantillon": nbechantillon = nombre_adversaires
        
                nbv, attendu, moyenne_points = benchmark_winrate(sujet, nbRandom=nbrandom, nbMin=nbmin, nbMax=nbmax, nbEchantillon=nbechantillon)
                ratio = nbv/attendu
                couleur = '\033[0m'
                if ratio > 1.2:
                    couleur = '\033[92m' # vert
                elif ratio < 0.5:
                    couleur = '\033[91m' # rouge
                elif ratio < 0.8:
                    couleur = '\033[93m' # jaune
                reset = '\033[0m'
                print(f"{couleur}1 {sujet:<9} vs {nombre_adversaires} {adversaires:<9} : victoire dans {nbv:<5}% des cas (attendu {attendu:<5}%) : ratio de {round(ratio, 2):<4} (avg {round(moyenne_points, 2):<5}){reset}")
    

if __name__ == "__main__":
    interactiveRun()
    #testHumain()
    # benchmark_winrate("echantillon", nbMax=5)
    # test_complet()
