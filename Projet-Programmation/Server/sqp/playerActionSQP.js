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

var declencherLogique = function(io, socket, db, idPartie, centre, archive){
    console.log("declencherLogique appelé");

    // on suppose que le nombre de cartes au centre est égal au nombre de joueurs (assert ?)

    // on révèle les cartes : on envoie infoGameOut
    queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
        infoPartie(db, idPartie).then((infoJoueurs) => {
            socket.to(idPartie).emit('infoGameOut', {center: centre, archive: archive, draw: {}, infoPlayers: infoJoueurs, nbTour});
        });
    });    

    // on trie les cartes par ordre croissant
    let temp = [];
    console.log("----\nCentre :");
    console.log(centre);
    console.log("----\nArchive :");
    console.log(archive);


    for (let clé of Object.keys(centre)){
        temp.push([clé, centre[clé]]);
    }

    let triees = trier(temp);
    for(let i in triees){
        console.log(triees[i][0] + " " + triees[i][1].valeur + " " + triees[i][1].nbBoeufs);
    }
    
    // tant que le centre n'est pas vide
    let intervalle = setInterval( () => {
        if(centre.length != 0){
            clearInterval(intervalle);
        }
        
        // si on n'attend pas de carte
        // On prend la première carte de la liste de cartes triées, et on l'enlève de cette liste
        let carteActuelle = triees.shift();

        // On détermine dans quelle ligne va LA carte
        let ligne = -1

        // Pour chaque ligne
        for(let i = 0; i < 4; i++){
            // On prend la carte maximum dans la ligne (-1)
            carteMaximum = archive[i][archive[i].length-1];
            console.log("Ligne numéro " + i);
            
            // Si la valeur de cette carte est inférieure à la valeur de LA carte
            if(carteMaximum.valeur < carteActuelle[1].valeur){
                ligne = i;
            } else {
                console.log("On a " + carteMaximum.valeur + " < " + carteActuelle[1].valeur);
            }
        }

        console.log("Ligne déterminée : " + ligne);

        // Si ligne == -1
        if(ligne == -1){
            // On propose au joueur de choisir une ligne en envoyant sur la route 'requestAction' le dictionnaire {'type': 'ligne': 'ligne': ligne}
            socket.emit('requestAction', {});  // Dico vide : a priori pas de détails à envoyer ?
            clearInterval(intervalle);
        } else {  // Sinon
            // Si la ligne a une longueur de 5 : le joueur remplace la ligne
            if(archive[ligne] == 5){  // 6 qui prend :
                // On enlève LA carte du centre
                centre = Object.keys(centre).filter((clé) => clé !== carteActuelle[0])
                    .reduce((objet, clé) => {
                        objet[clé] = centre[clé];
                        return objet;
                    }, {});

                // On met à jour le centre dans la bd
                db.query("UPDATE parties SET centre=? WHERE idPartie=?", [JSON.stringify(centre), idPartie], (err, result) => {
                    if(err) throw err;
                    console.log("BDD mise à jour" + result);
                });

                // 6 qui prend : le joueur remplace la ligne par sa carte
                remplacerLigne(db, idJ, idPartie, ligne, carteActuelle, centre);
            } else {  // Sinon : le joueur place simplement sa carte
                // On ajoute LA carte à la ligne dans archive
                archive[ligne].push({valeur: carteActuelle[1].valeur, nbBoeufs: carteActuelle[1].nbBoeufs});
                
                // On enlève LA carte du centre
                centre = Object.keys(centre).filter((clé) => clé !== carteActuelle[0])
                    .reduce((objet, clé) => {
                        objet[clé] = centre[clé];
                        return objet;
                    }, {});

                console.log("----\nCentre :");
                console.log(centre);
                console.log("----\nArchive :");
                console.log(archive);

                // On met à jour le centre et l'archive dans la bd
                db.query("UPDATE parties SET centre=?, archive=? WHERE idPartie=?", [JSON.stringify(centre), JSON.stringify(archive), idPartie], (err, result) => {
                    if(err) throw err;
                    console.log("BDD mise à jour" + result);
                });
            }
        }
        // On envoie les centres mis à jour : 'infoGameOut' (center, archive, draw (vide), infoPlayers, nbTurn)
        queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
            infoPartie(db, idPartie).then((infoJoueurs) => {
                socket.to(idPartie).emit('infoGameOut', {center: centre, archive: archive, draw: {}, infoPlayers: infoJoueurs, nbTour});
            });
        });
    }, 1000);  // On attend 1 seconde

    // On récupère le numéro de tour
    queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
        nbTour++; // On passe à un nouveau tour
        db.query("UPDATE parties SET tour=?", [nbTour], (err, result) => { if (err) throw err; }) // On met à jour le nouveau tour dans la BD

        // On va chercher infoPlayers
        infoPartie(db, idPartie).then((infoJoueurs) => {
            // On envoie les dernières infos sur la partie au joueur
            socket.to(idPartie).emit('infoGameOut', {center: centre, archive: archive, draw: {}, infoPlayers: infoJoueurs, nbTour});
        });
    });
}

var remplacerLigne = function(db, idJ, idPartie, ligne, carte){
    console.log("Appel de la fonction remplacerLigne avec idPartie = " + idPartie + ", ligne = " + ligne, ", carte = " + carte);
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


function infoPartie(db, idParty){
    return new Promise((resolve, reject) => {
        db.query('SELECT pseudo,centre,archive,pioche,main,score,tour from parties p,joue j,joueurs jo where p.idPartie=j.idPartie and j.idJ=jo.idJ and p.idPartie =?',[idParty],async(err,result)=>{
            if(err)reject(err);
            var infoPlayers=[];
            for(i=0;i<result.length;i++){
                infoPlayers.push({
                    "nbCards":JSON.parse(result[i].main).length,
                    "pseudo":result[i].pseudo,
                    "score":result[i].score
                })
            }
            resolve(result);
        });
    });
    
};
