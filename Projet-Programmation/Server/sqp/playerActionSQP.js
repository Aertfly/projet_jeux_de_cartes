function queryLine(db,condition,value,tableName,lineName){
    if (!db || !tableName || !lineName || !condition || !value) {
        return "Paramètres invalides";
    }
    const query = `SELECT ${lineName} FROM ${tableName} WHERE ${condition} = ${value}`;
    return results[0][lineName];
}

function updateTable(db,condition, value, tableName, lineName) {
    if (!db || !tableName || !lineName || !condition || !value) {
        return "Paramètres invalides";
    }
    const query = `UPDATE ${tableName} SET ${lineName} WHERE ${condition} = ${value}`;
    db.query(query, updateValues, (error, results) => {
        if (error) {
            console.error('Erreur lors de l\'exécution de la requête :', error);
        }
        });
};

var playerActionSQP = function(io, socket, db){
    socket.on('playerAction', data => {  // Quand on reçoit une action de la part d'un joueur
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

        // On récupère le centre et l'archive
        centre = JSON.parse(queryLine(db, 'idParty', data.idPartie, 'parties', 'centre'));
        console.log(centre);
        // archive = queryLine(db, 'idParty', data.idPartie, 'parties', 'archive');

        // Si playerAction = 'joue'
        if (data.action == 'joue'){
            // On ajoute la carte du joueur au centre
 
            // Si le centre est égal au nombre de joueurs (récupérer sur la BDD le nombre de joueurs)
                // On joue : appel à declencherLogique

        }

        // Si playerAction = 'ligne'
            // Le joueur renvoie également sa carte
            
            // Le joueur récupère la ligne qu'il a enlevée :
            // On enlève la carte du joueur du centre
            // On ajoute au score du joueur les têtes de boeuf qu'il a ramassées
            // On remplace la ligne ramassée par la carte du joueur
    });
}

var declencherLogique = function(io, socket, db, idPartie){
    // on suppose que le nombre de cartes au centre est égal au nombre de joueurs (assert ?)

    // on reveal : on envoie infoGameOut (center, archive, draw (vide), infoPlayers, nbTurn)
    // on attend 1s

    // on trie les cartes par ordre croissant

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
                // recupererLigne(db, idJ, idPartie, ligne, LA carte)

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
