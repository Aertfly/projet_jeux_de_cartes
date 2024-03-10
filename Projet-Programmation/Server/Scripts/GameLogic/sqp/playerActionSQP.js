const { query } = require("express");
const { reDealCardsSQP } = require("../startGame.js");
const { ajouterScores, infoPartie, envoyerInfos } = require("../utils/functions.js");

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

var declencherLogique = function(io, socket, db, idPartie, centre){
    queryLine(db, "archive", "parties", "idPartie", idPartie).then((archive0) => {
        let archive = JSON.parse(archive0);
        
        console.log("declencherLogique appelé");
        
        // on suppose que le nombre de cartes au centre est égal au nombre de joueurs (assert ?)
        // pas forcément : possiblement reprise après ligne choisie
        
        // on révèle les cartes : on envoie les infos
        queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
            infoPartie(db, idPartie).then((infoJoueurs) => {
                envoyerInfos(db, io, idPartie, centre, infoJoueurs, nbTour);
            });
        });    
        
        // on trie les cartes par ordre croissant
        let temp = [];
        
        
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
                //console.log("Le centre est vide, on clear l'intervalle");
                clearInterval(intervalle);
                
                // On récupère le numéro de tour
                queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
                    nbTour++; // On passe à un nouveau tour
                    db.query("UPDATE parties SET tour=?", [nbTour], (err, result) => { if (err) throw err; }) // On met à jour le nouveau tour dans la BD
                    
                    // On va chercher infoPlayers
                    infoPartie(db, idPartie).then((infoJoueurs) => {
                        // On envoie les dernières infos sur la partie au joueur
                        envoyerInfos(db, io, idPartie, centre, infoJoueurs, nbTour);
                        
                        db.query("SELECT idJ FROM joue WHERE idPartie=?", [idPartie], async (err2, result2) => {
                            if (err2) throw err2;
                            let joueurs = [];
                            result2.forEach((idJoueur) => {
                                joueurs.push(idJoueur["idJ"]);
                            });
                            
                            if(infoJoueurs[Object.keys(infoJoueurs)[0]]["nbCards"] == 0){ // Si un joueur (donc tous) n'a plus de cartes, on passe à une nouvelle manche
                                console.log("Un joueur n'a plus de carte : appel à reDealCardsSQP");
                                reDealCardsSQP(io, joueurs.length, db, idPartie, joueurs);
                            } else {
                                console.log("On emit sur newTurn avec " + JSON.stringify({ "numeroTour": nbTour, "joueurs": joueurs }));
                                // On dit aux joueurs qu'on est dans un nouveau tour
                                io.to(idPartie).emit('newTurn', { "numeroTour": nbTour, "joueurs": joueurs });
                            }
                        });
                    });
                });
            } else { // Il reste encore des cartes à traiter, on continue
                // console.log("On fait un tour de boucle avec un centre de longueur " + triees.length);
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
                
                // console.log("Ligne déterminée : " + ligne);
                
                if(ligne == -1){ // Si aucune ligne ne peut accueillir la carte
                    // On propose au joueur de choisir une ligne en envoyant sur la route 'requestAction' le dictionnaire {'type': 'ligne': 'ligne': ligne}
                    io.to(idPartie).emit('requestAction', {idJ: parseInt(carteActuelle[0])});  // Dico vide : a priori pas de détails à envoyer ?
                    console.log("On requestAction avec " + JSON.stringify({idJ: carteActuelle[0]}));
                    clearInterval(intervalle);
                } else {  // Sinon : une ligne peut accueillir la carte
                    // Si la ligne a une longueur de 5 : le joueur remplace la ligne
                    if(archive[ligne].length == 5){  // 6 qui prend :
                        // On enlève LA carte du centre
                        centre = Object.keys(centre).filter((clé) => clé !== carteActuelle[0])
                        .reduce((objet, clé) => {
                            objet[clé] = centre[clé];
                            return objet;
                        }, {});
                        
                        // On met à jour le centre dans la bd
                        db.query("UPDATE parties SET centre=? WHERE idPartie=?", [JSON.stringify(centre), idPartie], (err, result) => {
                            if(err) throw err;
                            // console.log("BDD mise à jour" + result);
                        });
                        
                        // 6 qui prend : le joueur remplace la ligne par sa carte
                        remplacerLigne(io, db, parseInt(carteActuelle[0]), idPartie, ligne, {valeur: carteActuelle[1].valeur, nbBoeufs: carteActuelle[1].nbBoeufs}, centre).then(() => {
                            queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
                                queryLine(db, "archive" ,"parties", "idPartie", idPartie).then((archive) => {
                                    archive = JSON.parse(archive);
                                    console.log("L'archive qu'on va envoyer est :" + JSON.stringify(archive));
                                    infoPartie(db, idPartie).then((infoJoueurs) => {
                                        //console.log("On envoie les infos sur la room d'id " + idPartie);
                                        envoyerInfos(db, io, idPartie, centre, infoJoueurs, nbTour);
                                    });    
                                });
                            });
                        });
                    } else {  // Sinon : le joueur place simplement sa carte
                        // On ajoute LA carte à la ligne dans archive
                        archive[ligne].push({valeur: carteActuelle[1].valeur, nbBoeufs: carteActuelle[1].nbBoeufs});
                        
                        // On enlève LA carte du centre
                        centre = Object.keys(centre).filter((clé) => clé !== carteActuelle[0])
                        .reduce((objet, clé) => {
                            objet[clé] = centre[clé];
                            return objet;
                        }, {});
                        
                        /*console.log("----\nCentre :");
                        console.log(centre);
                        console.log("----\nArchive :");
                        console.log(archive);*/
                        
                        // On met à jour le centre et l'archive dans la bd
                        db.query("UPDATE parties SET centre=?, archive=? WHERE idPartie=?", [JSON.stringify(centre), JSON.stringify(archive), idPartie], (err, result) => {
                            if(err) throw err;
                            // console.log("BDD mise à jour" + result);
                        });
                    }
                }
                // On envoie les infos mises à jour :
                queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
                    infoPartie(db, idPartie).then((infoJoueurs) => {
                        console.log("On envoie les infos sur la room d'id " + idPartie);
                        envoyerInfos(db, io, idPartie, centre, infoJoueurs, nbTour);
                    });
                });
            }
        }, 1000);  // On attend 1 seconde
    });
}



function trierArchive(archive) {
    return archive.sort((ligneA, ligneB) => {
        const derniereCarteA = ligneA[ligneA.length - 1];
        const derniereCarteB = ligneB[ligneB.length - 1];
        
        if (derniereCarteA.valeur < derniereCarteB.valeur) {
            return -1;
        } else if (derniereCarteA.valeur > derniereCarteB.valeur) {
            return 1;
        } else {
            return 0;
        }
    });
}

var remplacerLigne = function(io, db, idJ, idPartie, ligne, carte){
    console.log("Appel de la fonction remplacerLigne avec idPartie = " + idPartie + ", ligne = " + ligne, ", carte = " + JSON.stringify(carte));
    // Prend une connexion à une base de données, un idJ, un idPartie, un numéro de ligne (de 0 à 3) et la carte qui viendra remplacer la ligne
    // Renvoie un booléen qui dit si on peut continuer ou non
    
    
    return new Promise((resolve, reject) => {
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
                if(sommeTetes >= 2){
                    console.log("Un joueur a perdu en ayant sommeTetes=" + sommeTetes);
                    // Le joueur a perdu :
                    ajouterScores(db, idPartie).then(() => {
                        db.query("SELECT pseudo, score FROM joue, joueurs WHERE joueurs.idJ = joue.idJ AND joue.idPartie=? ORDER BY joue.score DESC LIMIT 1; ", [idPartie], (err3, result3) => {
                            if(err3) throw err3;
                            let perdant = {"pseudo": result3[0]["pseudo"], "score": result3[0]["score"]};
                            db.query("SELECT pseudo, score FROM joue, joueurs WHERE joueurs.idJ = joue.idJ AND joue.idPartie=? ORDER BY joue.score ASC LIMIT 1; ", [idPartie], (err4, result4) => {
                                if(err4) throw err4;
                                let gagnant = {"pseudo": result4[0]["pseudo"], "score": result4[0]["score"]};

                                // On envoie la fin de partie
                                queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
                                    queryLine(db, "centre", "parties", "idPartie", idPartie).then((centre) => {
                                        infoPartie(db, idPartie).then((infoJoueurs) => {
                                            console.log("On va envoyer les infos")
                                            envoyerInfos(db, io, idPartie, JSON.parse(centre), infoJoueurs, nbTour);
                                            setTimeout(() => {
                                                console.log("Infos envoyées, on envoie endGame");
                                                io.to(idPartie).emit('endGame', {looser: perdant, winner: gagnant});
                                            }, 2000);
                                        });    
                                    })
                                });    
                            });
                        });
                    });
                }
                
                //console.log("La ligne avant remplacement vaut " + JSON.stringify(archive[ligne]));
                // Dans la variable qui correspond à l'archive, on remplace la ligne correspondante par juste la carte passée en paramètre
                archive[ligne] = [carte];
                //console.log("La ligne après remplacement vaut " + JSON.stringify(archive[ligne]));
                //console.log("L'ensemble vaut " + JSON.stringify(archive));
                
                // On met à jour la db à partir de la variable de l'archive
                db.query("UPDATE parties SET archive=? WHERE idPartie=?", [JSON.stringify(trierArchive(archive)), idPartie], (err2, result2) => {
                    if(err2) throw err2;
                    // console.log("On a mis à jour l'archive après qu'un joueur a ramassé une ligne :" + JSON.stringify(result2));
                    //console.log("On a dit que l'archive dans la partie " + idPartie + " valait bien " + JSON.stringify(archive));
                    // return true;
                    // throw "arrêt de test";
                    resolve();
                })
            })
        });
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
        
        remplacerLigne(io, db, data.idJoueur, data.idPartie, data.ligne, carteActuelle).then( () => {
            queryLine(db, "archive", "parties", "idPartie", data.idPartie).then((archive) => {
                declencherLogique(io, socket, db, data.idPartie, centre, JSON.parse(archive));
            })
        });
    });
}





module.exports = { playerActionSQP, ligneSQP};
