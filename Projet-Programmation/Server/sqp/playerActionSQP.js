const { query } = require("express");

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
                //console.log("On résout une requête avec pour résultat : " + results);
                //console.log("Et on renvoie" + results[0][lineName]);
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
    
    if (data.action != "joue") throw "Erreur d'action"
    
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

var declencherLogique = function(io, socket, db, idPartie, centre, archive){
    console.log("declencherLogique appelé");
    
    // on suppose que le nombre de cartes au centre est égal au nombre de joueurs (assert ?)
    // pas forcément : possiblement reprise après ligne choisie
    
    // on révèle les cartes : on envoie les infos
    queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
        infoPartie(db, idPartie).then((infoJoueurs) => {
            envoyerInfos(db, io, idPartie, centre, archive, infoJoueurs, nbTour);
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
        if(triees.length == 0){ // Toutes les cartes ont été jouées, on passe au tour suivant
            console.log("Le centre est vide, on clear l'intervalle");
            clearInterval(intervalle);

            // On récupère le numéro de tour
            queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
                nbTour++; // On passe à un nouveau tour
                db.query("UPDATE parties SET tour=?", [nbTour], (err, result) => { if (err) throw err; }) // On met à jour le nouveau tour dans la BD
                
                // On va chercher infoPlayers
                infoPartie(db, idPartie).then((infoJoueurs) => {
                    // On envoie les dernières infos sur la partie au joueur
                    envoyerInfos(db, io, idPartie, centre, archive, infoJoueurs, nbTour);

                    db.query("SELECT idJ FROM joue WHERE idPartie=?", [idPartie], async (err2, result2) => {
                        if (err2) throw err2;
                        let joueurs = [];
                        result2.forEach((idJoueur) => {
                            joueurs.push(idJoueur["idJ"]);
                        });

                        console.log("On emit sur newTurn avec " + JSON.stringify({ "numeroTour": nbTour, "joueurs": joueurs }));
                        // On dit aux joueurs qu'on est dans un nouveau tour
                        io.to(idPartie).emit('newTurn', { "numeroTour": nbTour, "joueurs": joueurs });
                    });
                });
            });
        } else { // Il reste encore des cartes à traiter, on continue
            console.log("On fait un tour de boucle avec un centre de longueur " + triees.length);
            // On prend la première carte de la liste de cartes triées, et on l'enlève de cette liste
            let carteActuelle = triees.shift();
            
            // On détermine dans quelle ligne va LA carte
            let ligne = -1
            
            // Pour chaque ligne
            for(let i = 0; i < 4; i++){
                // On prend la carte maximum dans la ligne (-1)
                carteMaximum = archive[i][archive[i].length-1];
                //console.log("Ligne numéro " + i);
                
                // Si la valeur de cette carte est inférieure à la valeur de LA carte
                if(carteMaximum.valeur < carteActuelle[1].valeur){
                    ligne = i;
                } else {
                    //console.log("On a " + carteMaximum.valeur + " < " + carteActuelle[1].valeur);
                }
            }
            
            console.log("Ligne déterminée : " + ligne);
            
            if(ligne == -1){ // Si aucune ligne ne peut accueillir la carte
                // On propose au joueur de choisir une ligne en envoyant sur la route 'requestAction' le dictionnaire {'type': 'ligne': 'ligne': ligne}
                io.to(idPartie).emit('requestAction', {idJ: parseInt(carteActuelle[0])});  // Dico vide : a priori pas de détails à envoyer ?
                console.log("On requestAction avec " + JSON.stringify({idJ: carteActuelle[0]}));
                clearInterval(intervalle);
            } else {  // Sinon : une ligne peut accueillir la carte
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
            // On envoie les infos mises à jour :
            queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
                infoPartie(db, idPartie).then((infoJoueurs) => {
                    console.log("On envoie les infos sur la room d'id " + idPartie);
                    envoyerInfos(db, io, idPartie, centre, archive, infoJoueurs, nbTour);
                });
            });
        }
    }, 1000);  // On attend 1 seconde
}

function recupererPseudo(db, idJoueur) {
    console.log("Appel de recupererPseudo avec idJoueur="+idJoueur);
    return new Promise((resolve, reject) => {
        db.query("SELECT pseudo FROM joueurs WHERE idJ=?", [idJoueur], async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result[0]["pseudo"]);
        });
    });
}

var envoyerInfos = function(db, io, idPartie, centre, archive, infoJoueurs, nbTour){
    // console.log("On envoie infoGameOut")
    //console.log("Centre (restera intact) : " + JSON.stringify(centre));
    let centre2 = Object.assign({},centre);
    //console.log("Centre2 avant : " + JSON.stringify(centre2));
    
    db.query("SELECT pseudo, joue.idJ FROM joueurs, joue, parties WHERE joue.idPartie = parties.idPartie AND joue.idJ = joueurs.idJ AND parties.idPartie = ?;", [idPartie], (err, result) => {
        if(err) throw err;
        //console.log("Le résultat vaut " + JSON.stringify(result));

        for(ligne of result){
            centre2[ligne["pseudo"]] = centre2[ligne["idJ"]];
            delete centre2[ligne["idJ"]];
        }

        //console.log("Centre2 après : " + JSON.stringify(centre2));

        io.to(idPartie).emit('infoGameOut', {center: centre2, archive: JSON.parse(archive), draw: 0, infoPlayers: infoJoueurs, nbTour});
    });
}

var remplacerLigne = function(db, idJ, idPartie, ligne, carte){
    console.log("Appel de la fonction remplacerLigne avec idPartie = " + idPartie + ", ligne = " + ligne, ", carte = " + carte);
    // Prend une connexion à une base de données, un idJ, un idPartie, un numéro de ligne (de 0 à 3) et la carte qui viendra remplacer la ligne
    // Renvoie un booléen qui dit si on peut continuer ou non
    
    // On récupère l'archive depuis la base de données
    queryLine(db, "archive", "parties", "idPartie", idPartie).then((archive) => {
        archive = JSON.parse(archive);
        // sommeTetes = on récupère le score du joueur dans la table joue
        db.query("Select score from joue,parties where joue.idPartie = parties.idPartie and joue.idJ = ? and parties.idPartie = ?", [idJ, idPartie], (err, result) => {
            if(err) throw err;
            sommeTetes = result[0]["score"]; // A tester 
            
            // Pour chaque carte dans la ligne :
            for(let carte2 of archive[ligne]){
                console.log("On traite la carte " + JSON.stringify(carte2));
                sommeTetes += carte2.nbBoeufs;
                console.log("On ajoute " + carte2.nbBoeufs + " têtes au score");
            }
            // On met à jour le score du joueur dans la BD
            db.query("UPDATE joue, parties SET score=? WHERE joue.idPartie = parties.idPartie AND joue.idJ=? AND parties.idPartie=?", [sommeTetes, idJ, idPartie], (err2, result2) => {
                if(err2) throw err2;
            });
            
            // Si le nombre de tetes du joueur est supérieur ou égal à 66
            if(sommeTetes >= 66){
                // Le joueur a perdu :
                io.to(idPartie).emit('looser', {idJ: idJ});
                // On envoie sur la route 'looser' l'idJ
                // throw "partie terminée (message de test)";
                return false;
                // On retourne false
            }
            
            // Dans la variable qui correspond à l'archive, on remplace la ligne correspondante par juste la carte passée en paramètre
            archive[ligne] = [carte];

            // On met à jour la db à partir de la variable de l'archive
            db.query("UPDATE parties SET archive=? WHERE idPartie=?", [JSON.stringify(archive), idPartie], (err2, result2) => {
                if(err2) throw err2;
                console.log("On a mis à jour l'archive après qu'un joueur a ramassé une ligne");
                return true;
            })
        })
    });
}

function trier(temp) {
    const comparer = (a, b) => {
        return a[1].valeur - b[1].valeur;
    };
    
    temp.sort(comparer);
    
    return temp;
}

const ligneSQP = function(io, socket, db, data){
    // On récupère le centre
    queryLine(db, "centre", "parties", "idPartie", data.idPartie).then((centre) => {    
        // On récupère LA carte du joueur au centre (il a déjà joué sa carte, là il dit simplement quelle ligne il veut remplacer)

        centre = JSON.parse(centre);

        carteActuelle = centre[data.idJoueur];
        
        // On enlève LA carte du centre
        for (let c in centre) {
            if (centre[c] === carteActuelle) {
              delete centre[c];
            }
        }
        
        console.log("Le nouveau centre : " + JSON.stringify(centre) + "\n(on en a enlevé " + JSON.stringify(carteActuelle) + ")");
        // On met à jour le centre dans la bd
        db.query("UPDATE parties SET centre=? WHERE idPartie=?", [JSON.stringify(centre), data.idPartie], (err, result) => {
            if(err) throw err;
            console.log("BDD mise à jour" + result);
        });
        
        remplacerLigne(db, data.idJoueur, data.idPartie, data.ligne, carteActuelle);
        
        queryLine(db, "archive", "parties", "idPartie", data.idPartie).then((archive) => {
            declencherLogique(io, socket, db, data.idPartie, centre, JSON.parse(archive));
        })
    });
}

function infoPartie(db, idParty){
    return new Promise((resolve, reject) => {
        db.query('SELECT pseudo,centre,archive,pioche,main,score,tour from parties p,joue j,joueurs jo where p.idPartie=j.idPartie and j.idJ=jo.idJ and p.idPartie =?',[idParty],async(err,result)=>{
            if(err)reject(err);
            const infoPlayers=[];
            for(i=0;i<result.length;i++){
                infoPlayers.push({
                    "nbCards":JSON.parse(result[i].main).length,
                    "pseudo":result[i].pseudo,
                    "score":result[i].score
                })
            }
            resolve(infoPlayers);
        });
    });
    
};

module.exports = { playerActionSQP, ligneSQP};
