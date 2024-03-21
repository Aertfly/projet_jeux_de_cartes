const { query } = require("express");
const { reDealCardsSQP } = require("../startGame.js");
const { ajouterScores, recupererInfosJoueurs, envoyerInfos } = require("../utils/functions.js");

/**
 * Permet de récuperer une ligne dans la base de données
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {String} lineName La ligne voulue
 * @param {String} tableName La table concernée
 * @param {String} condition Le champ qui doit remplir la condition
 * @param {*} value La valeur recherchée
 * @returns La promesse de retourner la ligne souhaitée
 */
function queryLine(db, lineName, tableName, condition, value) {
    if (!db || !tableName || !lineName || !condition || !value) {
        return Promise.reject("Paramètres invalides");
    }
    
    return new Promise((resolve, reject) => {
        const query = `SELECT ${lineName} FROM ${tableName} WHERE ${condition} = ?`;
        
        db.query(query, [value], (error, results) => {
            if (error) { reject(error); }
            resolve(results[0][lineName]);
        });
    });
}

/**
 * Quand on reçoit une action de la part d'un joueur, et qu'on est dans une partie de 6 qui prend
 * @param {Server} io La connexion avec les clients
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {*} centre 
 * @param {*} data La donnée envoyée par le client
 */
const playerActionSQP = function(io, db, centre, data){    
    // Si tous les joueurs dans la partie ont joué
    db.query("SELECT COUNT(*) FROM joue WHERE idPartie = ?", (data.idPartie), (err, result) => {
        if (result[0]["COUNT(*)"] == Object.keys(centre).length){
            declencherLogique(io, db, data.idPartie, centre);
        }
    });
}

/**
 * Gère la logique de la partie
 * La majorité des règles du jeu sont implémentées ici
 * @param {Server} io La connexion aux clients
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {Number} idPartie L'ID de la partie
 * @param {*} centre
 */
var declencherLogique = function(io, db, idPartie, centre){
    queryLine(db, "archive", "parties", "idPartie", idPartie).then((archive0) => {
        let archive = JSON.parse(archive0);
                
        // on suppose que le nombre de cartes au centre est égal au nombre de joueurs (assert ?)
        // pas forcément : possiblement reprise après ligne choisie
        
        // On révèle les cartes : on envoie les infos
        envoyerInfos(db, io, idPartie);
        
        // On trie les cartes par ordre croissant
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
                clearInterval(intervalle);
                
                // On récupère le numéro de tour
                queryLine(db, "tour", "parties", "idPartie", idPartie).then((nbTour) => {
                    nbTour++; // On passe à un nouveau tour
                    db.query("UPDATE parties SET tour=?", [nbTour], (err, result) => { if (err) throw err; }) // On met à jour le nouveau tour dans la BD
                    
                    // On va chercher infoPlayers
                    recupererInfosJoueurs(db, idPartie).then((infoJoueurs) => {
                        // On envoie les dernières infos sur la partie au joueur
                        envoyerInfos(db, io, idPartie);
                        
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
                                // On dit aux joueurs qu'on est dans un nouveau tour
                                io.to(idPartie).emit('newTurn', { "numeroTour": nbTour, "joueurs": joueurs });
                            }
                        });
                    });
                });
            } else { // Il reste encore des cartes à traiter, on continue
                // On prend la première carte de la liste de cartes triées, et on l'enlève de cette liste
                let carteActuelle = triees.shift();
                
                // On détermine dans quelle ligne va LA carte
                let ligne = -1
                
                // Pour chaque ligne
                for(let i = 0; i < 4; i++){
                    // On prend la dernière carte de la ligne
                    carteMaximum = archive[i][archive[i].length-1];
                    
                    // Si la valeur de cette carte est inférieure à la valeur de LA carte
                    if(carteMaximum.valeur < carteActuelle[1].valeur){
                        ligne = i;
                    }
                }
                                
                if(ligne == -1){ // Si aucune ligne ne peut accueillir la carte
                    // On propose au joueur de choisir une ligne en envoyant sur la route 'requestAction' le dictionnaire {'type': 'ligne': 'ligne': ligne}
                    io.to(idPartie).emit('requestAction', {idJ: parseInt(carteActuelle[0]),action:"choisirLigne"});  // Dico vide : a priori pas de détails à envoyer ?
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
                        db.query("UPDATE parties SET centre=? WHERE idPartie=?", [JSON.stringify(centre), idPartie], (err, result) => { if(err) throw err; });
                        
                        // 6 qui prend : le joueur remplace la ligne par sa carte
                        remplacerLigne(io, db, parseInt(carteActuelle[0]), idPartie, ligne, {valeur: carteActuelle[1].valeur, nbBoeufs: carteActuelle[1].nbBoeufs}, centre).then(() => {
                            envoyerInfos(db, io, idPartie);
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
                                               
                        // On met à jour le centre et l'archive dans la bd
                        db.query("UPDATE parties SET centre=?, archive=? WHERE idPartie=?", [JSON.stringify(centre), JSON.stringify(archive), idPartie], (err, result) => { if(err) throw err; });
                    }
                }
                // On envoie les infos mises à jour :
                envoyerInfos(db, io, idPartie);

            }
        }, 1000);  // On attend 1 seconde
    });
}


/**
 * Trie les lignes de l'archive en fonction de la dernière carte de chacune des lignes
 * @param {*} archive 
 * @returns Archive triée
 */
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

/**
 * Remplace une ligne par une carte
 * Si le joueur dépasse le score max, on termine la partie
 * @param {Server} io 
 * @param {mysql.Connection} db 
 * @param {Number} idJ Le joueur qui pose la carte (pour éventuellement récuperer la ligne)
 * @param {Number} idPartie L'ID de la partie
 * @param {Number} ligne Numéro de ligne (0 à 3)
 * @param {*} carte La carte qui viendra remplacer la ligne
 * @returns Une promesse de renvoyer un booléen qui dit si on peut continuer ou non
 */
var remplacerLigne = function(io, db, idJ, idPartie, ligne, carte){
       
    return new Promise((resolve, reject) => {
        // On récupère l'archive depuis la base de données
        queryLine(db, "archive", "parties", "idPartie", idPartie).then((archive) => {
            archive = JSON.parse(archive);

            // On récupère le score du joueur dans la table joue
            db.query("Select score from joue,parties where joue.idPartie = parties.idPartie and joue.idJ = ? and parties.idPartie = ?", [idJ, idPartie], (err, result) => {
                if(err) throw err;
                sommeTetes = result[0]["score"];
                
                // On ajoute les têtes des cartes ramassées au score du joueur
                for(let carte2 of archive[ligne]){
                    sommeTetes += carte2.nbBoeufs;
                }

                // On met à jour le score du joueur dans la BD
                db.query("UPDATE joue, parties SET score=? WHERE joue.idPartie = parties.idPartie AND joue.idJ=? AND parties.idPartie=?", [sommeTetes, idJ, idPartie], (err2, result2) => { if(err2) throw err2; });
                
                // Si le nombre de têtes du joueur est supérieur ou égal à 66
                if(sommeTetes >= 2){
                    // Le joueur a perdu :
                    ajouterScores(db, idPartie).then(() => {

                        // On récupère le perdant
                        db.query("SELECT pseudo, score FROM joue, joueurs WHERE joueurs.idJ = joue.idJ AND joue.idPartie=? ORDER BY joue.score DESC LIMIT 1; ", [idPartie], (err3, result3) => {
                            if(err3) throw err3;

                            // On récupère le gagnant
                            db.query("SELECT pseudo, score FROM joue, joueurs WHERE joueurs.idJ = joue.idJ AND joue.idPartie=? ORDER BY joue.score ASC LIMIT 1; ", [idPartie], (err4, result4) => {
                                if(err4) throw err4;

                                // On envoie la fin de partie
                                console.log("On va envoyer les infos")
                                envoyerInfos(db, io, idPartie);
                                setTimeout(() => {
                                    io.to(idPartie).emit('endGame', {looser: {"pseudo": result3[0]["pseudo"], "score": result3[0]["score"]}, winner: {"pseudo": result4[0]["pseudo"], "score": result4[0]["score"]}});
                                }, 2000);
                            });
                        });
                    });
                }
                
                // On remplace la ligne par la carte
                archive[ligne] = [carte];
                
                // On met à jour la BDD à partir de la variable de l'archive
                db.query("UPDATE parties SET archive=? WHERE idPartie=?", [JSON.stringify(trierArchive(archive)), idPartie], (err2, result2) => {
                    if(err2) throw err2;
                    resolve();
                })
            })
        });
    });    
}

/**
 * Triée des cartes en fonction de leur valeur
 * @param {*} temp Liste de cartes 
 * @returns Liste des cartes triées
 */
function trier(temp) {
    const comparer = (a, b) => {
        return a[1].valeur - b[1].valeur;
    };
    
    temp.sort(comparer);
    
    return temp;
}

/**
 * Traite la récupération d'une ligne par un joueur
 * @param {Server} io La connexion aux clients
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {*} data Les données envoyées par le joueur
 */
const ligneSQP = function(io, db, data){
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
        
        // On met à jour le centre dans la bd
        db.query("UPDATE parties SET centre=? WHERE idPartie=?", [JSON.stringify(centre), data.idPartie], (err, result) => { if(err) throw err; });
        
        // On remplace la ligne dans l'archive par la carte jouée
        remplacerLigne(io, db, data.idJoueur, data.idPartie, data.ligne, carteActuelle).then( () => {
            // On continue la logique du tour
            declencherLogique(io, db, data.idPartie, centre);
        });
    });
}





module.exports = { playerActionSQP, ligneSQP};
