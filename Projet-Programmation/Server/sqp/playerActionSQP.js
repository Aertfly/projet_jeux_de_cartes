function queryLine(db, lineName, tableName, condition, value) {
    if (!db || !tableName || !lineName || !condition || !value) {
        return Promise.reject("Paramètres invalides");
    }

    return new Promise((resolve, reject) => {
        const query = `SELECT ${lineName} FROM ${tableName} WHERE ${condition} = ?`;

        db.query(query, [value], (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'exécution de la requête :', error);
                reject(error);
            } else {
                resolve(results[0][lineName]);
            }
        });
    });
}

function updateTable(db, tableName, lineName, condition, value) {
    if (!db || !tableName || !lineName || !condition || !value) {
        return Promise.reject("Paramètres invalides");
    }

    return new Promise((resolve, reject) => {
        const query = `UPDATE ${tableName} SET ${lineName} WHERE ${condition} = ?`;

        db.query(query, [value], (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'exécution de la requête :', error);
                reject(error);
            } else {
                console.log('Résultats de la requête UPDATE :', results);
                resolve(results);
            }
        });
    });
}

const playerActionSQP = function(io, socket, db, centre, archive, data){
    // Quand on reçoit une action de la part d'un joueur, et qu'on est dans une partie de 6 qui prend
    console.log("appel de playerActionSQP");
    /*
    data {
        playerId : int,
        idPartie : int,
        action : string,
        carte {
            enseigne: string,
            valeur: string
        },
        ligne : int
    }
    */

    console.log(centre);
    console.log(archive);
    
    // Si playerAction = 'joue'
    if (data.action == 'joue'){
        // Si le centre est égal au nombre de joueurs (récupérer sur la BDD le nombre de joueurs)
        db.query("SELECT COUNT(*) FROM joue WHERE idPartie = ?", (data.idPartie), (err, result) => {
            var nbJoueurs = result[0]["COUNT(*)"];
            if (nbJoueurs == Object.keys(centre).length){
                // On joue : appel à declencherLogique
                console.log("on joue : appel à déclencherLogique");
                declencherLogique(io, socket, db, data.idPartie, centre, archive);
            }
        });
    }
}

var choixLigne = function(io, socket, db){
    socket.on('ligne', (data) => { // Quand un joueur choisit une ligne
        // On récupère la carte du joueur au centre (il a déjà joué sa carte, là il dit simplement quelle ligne il veut remplacer)
        // On enlève la carte du joueur du centre

        // remplacerLigne(db, data.idJ, data.idPartie, data.ligne, carte)
    });
}

var declencherLogique = function(io, socket, db, idPartie, centre, archive){
    console.log("declencherLogique appelé");

    // on suppose que le nombre de cartes au centre est égal au nombre de joueurs (assert ?)

    // on révèle les cartes : on envoie infoGameOut (center, archive, draw (vide), infoPlayers, nbTurn)
    socket.to(idPartie).emit('infoGameOut', {center: centre, archive: archive, draw: {}, infoPlayers: {}, nbTurn: 0});

    // on trie les cartes par ordre croissant
    let temp = [];
    console.log("----");
    console.log(centre);
    for (let clé of Object.keys(centre)){
        temp.push([clé, centre[clé]]);
    }

    let triees = trier(temp);
    for(let i in triees){
        console.log(triees[i][0] + " " + triees[i][1].valeur + " " + triees[i][1].nbBoeufs);
    }
    

    // tant que le centre n'est pas vide
        // On prend la première carte de la liste de cartes triées, et on l'enlève de cette liste
        
        // On détermine dans quelle ligne va LA carte
        // ligne = -1
        // Pour chaque ligne
            // On prend la carte maximum dans la liste (-1)
            // Si la valeur de cette carte est inférieure à la valeur de LA carte
                // ligne = ligne_actuelle

        // Si ligne == -1
            // On propose au joueur de choisir une ligne en envoyant sur la route 'requestAction' le dictionnaire {'type': 'ligne': 'ligne': ligne}
        // Sinon
            // On ajoute LA carte à la ligne dans archive
            // On enlève LA carte du centre
            // Si la longueur de la ligne est égale à 6
                // 6 qui prend :
                // remplacerLigne(db, idJ, idPartie, ligne, LA carte)

        // On envoie les centres mis à jour :
        // on envoie infoGameOut (center, archive, draw (vide), infoPlayers, nbTurn)

        // On attend 1 seconde

    // On récupère le nombre de tours
    // On y ajoute 1
    // On le met à jour dans la db
    // On envoie infoGameOut (center, archive, draw (vide), infoPlayers, nbTurn)
}

var remplacerLigne = function(db, idJ, idPartie, ligne, carte){
    // Prend une connexion à une base de données, un idJ, un idPartie, un numéro de ligne (de 0 à 3) et la carte qui viendra remplacer la ligne
    // Renvoie un booléen qui dit si on peut continuer ou non

    // On récupère le centre2 = archive depuis la base de données
    // On récupère la ligne correspondante
    // sommeTetes = on récupère le score du joueur dans la table joue
    // Pour chaque carte dans la ligne :
        // sommeTetes += nombre de boeufs de la carte en question
    // Si le nombre de tetes du joueur est supérieur ou égal à 66
        // Le joueur a perdu :
        // On envoie sur la route 'looser' l'idJ
        // On retourne false
    // Dans la variable qui correspond au centre2, on remplace la ligne correspondante par juste la carte passée en paramètre
    // On met à jour la db à partir de la variable du centre2
    // On renvoie true
}

function trier(temp) {
    // Créer une fonction de comparaison qui compare les valeurs des attributs "valeur" des deux objets
    const comparer = (a, b) => {
      return a[1].valeur - b[1].valeur;
    };
  
    // Trier la liste `temp` en fonction de la fonction de comparaison
    temp.sort(comparer);
  
    // Retourner la liste triée
    return temp;
}

module.exports = playerActionSQP;
