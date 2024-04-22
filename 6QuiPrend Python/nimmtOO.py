from players.humanPlayer import HumanPlayer
from game.nimmtGame import NimmtGame     

def interactiveRun():
    print("Bienvenue sur le jeu 6 qui prend !")
    while True:
        try:
            num_players = int(input("Combien de joueurs ? "))
            players=[]
            for i in range(num_players):
                name=input("Nom du joueur : ")
                players.append(HumanPlayer(name))
            game=NimmtGame(players)
            scores, winners=game.play()

            print("La partie est terminée!")
            print("Scores finaux :")
            for playername, score in scores.items(): 
                print(f"Joueur {playername} : {score} points")
            s=" ".join([player.name for player in winners])
            print("Vainqueurs(s) : ",s," !")
            break
        except ValueError:
            print("Veuillez entrer un nombre entier.")

if __name__ == "__main__":
    interactiveRun()