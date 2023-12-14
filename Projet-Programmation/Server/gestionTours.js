var tour = 0;

var gestionTours = function(io, socket, db, partie) {
    socket.on('playerLeaving', (data) => { // Quand un joueur quitte la partie
        // Intégrer ici le code de Killian

        // Let him cook
        db.query("SELECT * FROM joue WHERE idPartie = ?", [partie.idPartie], async (err, result) => {
            if(err){
                throw err;
            }
            nbJoueurs = new Map(Array.from(result, (key, value) => [key, value])).size;
            console.log("Il y a " + nbJoueurs + " joueurs dans la partie " + partie.idPartie);
            if (nbJoueurs == 0){
                // Plus aucun joueur n'est dans la partie
                clearInterval(compterJoueurs);
                io.emit
                console.log("Il n'y a plus aucun joueur");
                db.query("DELETE FROM parties WHERE idPartie = ?", [partie.idPartie], async(err, result) =>{
                    if(err || result.affectedRows != 1){
                        console.log("La partie a déjà été supprimée");
                    } else {
                        console.log("Normalement la partie a bien été supprimée");
                    }
                });
            }
        });
    });

    // On stocke dans "mains" l'ensemble des mains des joueurs
    const promesse = recupererMains(db, partie.idPartie);
    promesse.then((data) => {
        const mains = data[0];
        const gagnees = data[0];
    });

    socket.on("playerAction", (data) =>{       
        console.log(data.player + " " + data.action + " " + data.carte.enseigne + " " + data.carte.valeur);

        // On enlève la carte du joueur de sa main
        // On met la carte du joueur au centre
        /* le centre est de la forme
        {
            "joueur1": {
                "enseigne": "Pique", "valeur": 5
            },
            "joueur2": {
                "enseigne": "Carreau", "valeur": 6
            }
        }
        */

        // si le joueur est le dernier à jouer = si le nombre de cartes au centre est égal à la taille de la liste des joueurs qui doivent jouer
            // on lance la bataille
            // si la valeur de carte la plus grande est unique
                // On récupère le nom du joueur qui a placé la plus grande carte
                // On ajoute à ses cartes gagnées toutes les cartes du centre
                // On incrémente le numéro de tour de 1
                // On appelle la méthode annoncerJoueurs avec l'ensemble des joueurs : c'est un nouveau tour
            // sinon, il y a bataille
                // On récupère la valeur de carte la plus grande
                // On fait la liste des joueurs qui ont posé une carte de cette vakeur
                // On appelle la méthode annoncerJoueurs avec les joueurs de cette liste : c'est une bataille
    });
}

function annoncerJoueurs(listePseudos){
    // Cette fonction devrait envoyer à tous les joueurs qui doivent jouer une annonce leur disant que c'est à eux de jouer
    // par la route 'newTurn' (numeroTour, numeroJoueur)
}

function transfererCartesGagnees(joueur){
    if(joueur.main != []){
        throw "Le joueur ne peut pas récupérer ses cartes gagnées tant que sa main n'est pas vide";
    }
    joueur.main = joueur.gagnees;
    joueur.gagnees = [];
    return joueur;
}

function recupererMains(db, idPartie) {
    // Cette fonction retourne une promesse, qui lors de la résolution donnera l'ensemble des mains non vides des joueurs
    /* {
        "Joueur1": {
            "main": [
                {
                "Enseigne": "Pique",
                "Valeur": 10
                }
            ],
            "gagnees": [
                {
                "Enseigne": "Carreau",
                "Valeur": 5
                }
            ]
        }
    } */

    return new Promise((resolve, reject) => {
      db.query('SELECT pseudo, main, gagnees FROM joueurs, joue WHERE idPartie = ? AND joue.idJ=joueurs.idJ', [idPartie], async(err, result) => {
        if (err) {
          console.log('Erreur lors de la connexion');
          reject(err);
        }
        var ensemble = new Map();
        result.forEach(element => { // Pour chaque élément (= chaque joueur)
          mainDuJoueur = JSON.parse(element.main);
          gagneesDuJoueur = JSON.parse(element.gagnees);
          if (mainDuJoueur.length > 0 || gagneesDuJoueur.length > 0) { // Si le carte a encore des cartes dans sa main ou des cartes gagnées
            var joueur = new Map();
            joueur.set("main", mainDuJoueur);
            joueur.set("gagnees", gagneesDuJoueur);
            console.log("Le joueur " + element.pseudo + " a " + mainDuJoueur.length + " cartes actives + " + gagneesDuJoueur.length + " cartes gagnées");
            ensemble.set(element.pseudo, joueur);
          } else {
            console.log("Le joueur " + element.pseudo + " n'a plus de cartes ni actives ni gagnées");
          }
        });
        resolve(ensemble);
      });
    });
}
  


module.exports = gestionTours;
