const { recupererPseudos, envoyerInfos,joueursPossibles } = require("../utils/functions.js");

async function playerActionBataille(io, db, centre, archive, cartesJoueurs, data, socket){
    // Si archive est vide : on n'est pas dans une bataille
    if (JSON.stringify(archive) == "{}") {
        console.log("On n'est pas dans une bataille");
        let unionJoueursPossibles = await joueursPossibles(db, data.idPartie);

        if (unionJoueursPossibles.length <= 1) {
            finDePartie(io, db, data.idPartie);
        } else {
            annoncerScores(io, db, cartesJoueurs, data.idPartie);
            console.log("On continue, unionJoueursPossibles = " + JSON.stringify(unionJoueursPossibles));
            suite(io, db, data.idPartie, unionJoueursPossibles.length, centre, archive, cartesJoueurs, data, socket);
        }
    } else { // Si archive n'est pas vide : on est dans une bataille
        console.log("On est dans une bataille")
        // le nombre de joueurs qui peuvent jouer correspond à la taille de la liste retournée par joueursBataille2(archive)
        let joueursPossibles = joueursBataille2(archive)

        if (joueursPossibles.length <= 1) {
            finDePartie(io, db, data.idPartie); 
        } else {
            console.log("On continue, joueursPossibles = " + JSON.stringify(joueursPossibles));
            suite(io, db, data.idPartie, joueursPossibles.length, centre, archive, cartesJoueurs, data, socket);
        }
    }

    // la suite de la logique est effectuée dans la fonction suite appelée plus haut et située plus bas
    
}

/**
 * Cette fonction retourne une promesse, qui lors de la résolution donnera l'ensemble des mains non vides des joueurs
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {Number} idPartie L'ID de la partie
 * @returns Promesse de renvoyer l'ensemble des mains non vides des joueurs
 */
function recupererMains(db, idPartie) {
    // console.log("Appel à récupererMains avec idPartie = " + idPartie);

    return new Promise((resolve, reject) => {
        db.query('SELECT idJ, main, gagnees FROM joue WHERE idPartie = ?', [idPartie], async (err, result) => {
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
                    // console.log("Le joueur " + element.pseudo + " a " + mainDuJoueur.length + " cartes actives + " + gagneesDuJoueur.length + " cartes gagnées");
                    ensemble.set(element.idJ, joueur);
                } else {
                    // console.log("Le joueur " + element.pseudo + " n'a plus de cartes ni actives ni gagnées");
                }
            });
            resolve(ensemble);
        });
    });
}

/**
 * Annonce le score des joueurs à partir du dictionnaire des cartes
 * La donnée envoyée sera sous la forme d'un dictionnaire idJoueur:score
 * @param {Server} io La connexion aux clients
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {*} cartesJoueurs Dictionnaire des cartes
 * @param {Number} idPartie L'ID de la partie
 */
function annoncerScores(io, db, cartesJoueurs, idPartie) {
    pseudos_id = new Map();
    db.query("SELECT idJ, pseudo FROM joueurs", [], async (err, result) => {
        if (err) throw err;
        
        for (let i = 0; i < result.length; i++) {
            pseudos_id.set(result[i].idJ, result[i].pseudo);
        }

        updatedscores = {}
        cartesJoueurs.forEach((valeur, clé) => {
            updatedscores[pseudos_id.get(clé)] = valeur.get('main').length + valeur.get('gagnees').length;
        });

        console.log("On envoie les scores : " + JSON.stringify(updatedscores));
        io.to(idPartie).emit('updateScores', updatedscores);
    });
}

function suite(io, db, idPartie, nbJoueursPossibles, centre, archive, cartesJoueurs, data, socket) {
    console.log("Joueurs : " + Object.keys(centre).length + "/" + nbJoueursPossibles);
    if (Object.keys(centre).length == nbJoueursPossibles) { // si le joueur est le dernier à jouer = si le nombre de cartes dans le premier centre est égal au nombre de joueurs qui peuvent jouer
        // console.log("Le joueur est le dernier à jouer, on déclenche la logique");
        // on lance la bataille

        envoyerInfos(db, io, idPartie);

        compterValeurs = {};     

        for (const clé of Object.keys(centre)) { // Pour chaque carte au centre
            // On compte sa valeur et on l'ajoute dans compterValeurs
            if (compterValeurs[centre[clé]["valeur"]] == undefined) {
                compterValeurs[centre[clé]["valeur"]] = 1;
            } else {
                compterValeurs[centre[clé]["valeur"]] += 1;
            }
        }

        let valeurs = Object.keys(compterValeurs); // valeurs comptient la liste des valeurs jouées
        valeurs.sort(function(a, b){return a-b}); // On fournit une fonction de comparaison pour trier correctement les valeurs
        let valeurLaPlusGrande = null;
        if(valeurs.includes("1")){ // S'il y a un as, c'est la valeur la plus grande
            valeurLaPlusGrande = 1;
        } else { // Sinon, la liste étant triée, la dernière valeur est forcément la plus grande
            console.log("Pas d'as détecté, voici les valeurs : " + JSON.stringify(valeurs));
            valeurLaPlusGrande = valeurs[valeurs.length - 1];
        }

        if (compterValeurs[valeurLaPlusGrande] == '1') { // si la valeur de carte la plus grande est unique
            // On récupère le nom du joueur qui a placé la plus grande carte
            let gagnantDeLaBataille = undefined;
            for (const clé of Object.keys(centre)) {
                if (centre[clé]["valeur"] == valeurLaPlusGrande) {
                    gagnantDeLaBataille = clé;
                }
            }
            // console.log("Pli remporté par " + gagnantDeLaBataille + " sur la base de " + JSON.stringify(centre) + " ; valeurs = " + JSON.stringify(valeurs) + " ; valeurLaPlusGrande = " + JSON.stringify(valeurLaPlusGrande));
            // On ajoute à ses cartes gagnées toutes les cartes des deux centres
            db.query("SELECT gagnees FROM joue WHERE idJ=? AND idPartie=?", [gagnantDeLaBataille, idPartie], async (err, result) => {
                if (err) throw err;

                cartesGagneesDuGagnant = JSON.parse(result[0]["gagnees"]); // On récupère les cartes gagnées du gagnant
                for (const clé of Object.keys(centre)) {
                    cartesGagneesDuGagnant.push(centre[clé]); // On y ajoute les cartes du centre
                }
                for (const clé of Object.keys(archive)) {
                    Array.prototype.push.apply(cartesGagneesDuGagnant,archive[clé]); // On y ajoute les cartes des archives
                }

                // On insère cette nouvelle liste de cartes dans la BDD
                db.query("UPDATE joue SET gagnees=? WHERE idPartie=? AND idJ=?", [JSON.stringify(cartesGagneesDuGagnant), idPartie, gagnantDeLaBataille], async (err2, result2) => { if (err2) throw err2; });
            });

            // On vide les deux centres
            db.query("UPDATE parties SET centre=?, archive=? WHERE idPartie=?", [JSON.stringify({}), JSON.stringify({}), idPartie], async (err4, result4) => { if (err4) throw err4; 

                // On incrémente le numéro de tour de 1
                db.query("UPDATE parties SET tour = tour + 1 WHERE idPartie=?", [idPartie], async (err2, result2) => { if (err2) throw err2; });

                db.query("SELECT idJ FROM joue WHERE idPartie=?", [idPartie], async (err2, result2) => {
                    if (err2) throw err2;
                    let joueurs = [];
                    result2.forEach((idJoueur) => {
                        joueurs.push(idJoueur["idJ"]);
                    });

                    // On récupère le numéro de tour actuel
                    db.query("SELECT tour FROM parties WHERE idPartie=?", [idPartie], async (err3, result3) => {
                        if (err3) throw err3;

                        // On annonce un nouveau tour
                        annoncerJoueurs(io, db, joueurs, result3[0]["tour"], idPartie)
                    });
                });
            });
        } else { // sinon, il y a bataille
            // On fait la liste des joueurs qui ont posé une carte de cette valeur
            let joueursEnBataille = [];
            for (const clé of Object.keys(centre)) {
                if (centre[clé]["valeur"] == valeurLaPlusGrande) {
                    joueursEnBataille.push(parseInt(clé));
                }
            }
            console.log("Joueurs en bataille :");
            console.log(joueursEnBataille);

            // On envoie toutes les cartes du premier centre dans le second centre
            for (const clé of Object.keys(centre)) {
                if (archive.hasOwnProperty(clé)) {
                    archive[clé].push(centre[clé]);
                } else {
                    archive[clé] = [centre[clé]];
                }
            }


            // On stocke l'archive dans la base de données
            db.query("UPDATE parties SET centre=?, archive=? WHERE idPartie=?", [JSON.stringify({}), JSON.stringify(archive), idPartie], (err, result) => { if (err) throw err; });

            // On récupère le numéro de tour actuel
            db.query("SELECT tour FROM parties WHERE idPartie=?", [idPartie], async (err3, result3) => {
                if (err3) throw err3;

                // On appelle la méthode annoncerJoueurs avec les joueurs en bataille
                annoncerJoueurs(io, db, joueursEnBataille, result3[0]["tour"], idPartie)
            });
        }
    }
    // Si le joueur n'est pas le dernier à jouer, on vérifie juste qu'il ne faut pas remettre ses cartes gagnées dans sa main

    // Si le joueur n'a plus de cartes dans sa main
    if (JSON.stringify(cartesJoueurs.get(data.playerId).get("main")) == "[]") {
        // On met dans la main du joueur ses cartes gagnées
        cartesJoueurs.get(data.playerId).set("main", cartesJoueurs.get(data.playerId).get("gagnees"));

        // On vide ses cartes gagnées 
        cartesJoueurs.get(data.playerId).set("gagnees", []);
    }

    // On répercute les cartes gagnées de l'objet vers la base de données (gagnees  + main)
    db.query("UPDATE joue SET gagnees=? WHERE joue.idJ=? AND joue.idPartie=?", [JSON.stringify(cartesJoueurs.get(data.playerId).get("gagnees")), data.playerId, idPartie], async (err, result) => { if (err) throw err; });
    db.query("UPDATE joue SET main=? WHERE joue.idJ=? AND joue.idPartie=?", [JSON.stringify(cartesJoueurs.get(data.playerId).get("main")), data.playerId, idPartie], async (err0, result0) => { if (err0) throw err0; });

    db.query("SELECT main from joue where idPartie = ? and idJ = ?; ",[idPartie,data.playerId],async(err,resultCartes)=>{
        if (err)throw(err);
        if (resultCartes.length != 0){
            //console.log(result);
            //console.log(result[0].main);
            socket.emit("dealingCards",{'Cards':JSON.parse(resultCartes[0].main)});
        }else{
            console.log("Erreur envoi cartes :",resultCartes,idPartie,data.playerId)
        }
    });

    mettreAJourScores(db, data.idPartie);

}

/**
 * Gère la fin de partie :
 * - Envoie sur la route 'winner' le pseudo du gagnant
 * - Annonce les scores finaux
 * - Passe le tour à -2 sur la base de données
 * @param {*} io 
 * @param {*} db 
 * @param {*} idPartie 
 * @param {*} cartesJoueurs 
 */
function finDePartie(io, db, idPartie) {
    mettreAJourScores(db, idPartie);
    ajouterScores(db, idPartie);

    // On récupère le pseudo et les cartes gagnées par le vainqueur
    db.query("SELECT jo.pseudo as pseudo, j.main as main, j.gagnees as gagnees FROM joue j, joueurs jo WHERE j.score != 0 AND j.idPartie=? AND j.idJ=jo.idJ", [idPartie], (err, result) => {
        if(err) throw err;
        main = JSON.parse(result[0]["main"]);
        gagnees = JSON.parse(result[0]["gagnees"]);

        io.to(idPartie).emit('endGame', {winner: {pseudo: result[0]["pseudo"], score: main.length + gagnees.length}});
        
        envoyerInfos(db, io, idPartie);

        // Passe le tour à -2
        db.query("UPDATE parties SET tour=? WHERE idPartie=?", [-2, idPartie], async (err, result) => { if (err) throw err; });
    });
}

/**
 * CALCULE PUIS RETOURNE L'ENSEMBLE DES JOUEURS QUI SONT EN BATAILLE
 * @param {*} cartes Dictionnaire dont les valeurs sont des listes de cartes
 * @returns L'ensemble des joueurs qui sont en bataille
 */
function joueursBataille2(cartes) {
    var idMax = -1;
    Object.values(cartes).forEach((main) => {
        if(main.length > idMax) idMax = main.length;
    });

    var retour = [];
    // On compte combien de joueurs ont cette carte
    for (var idJ of Object.keys(cartes)) {
        if ((cartes[idJ].length) == idMax) {
            retour.push(idJ)
        }
    }
    return retour;
}

/**
 * Envoyer à tous les joueurs qui doivent jouer une annonce leur disant que c'est à eux de jouer
 * par la route 'newTurn' (numeroTour, numeroJoueur)
 * @param {*} io 
 * @param {*} db 
 * @param {*} listeJoueurs 
 * @param {*} numeroTour 
 * @param {*} idPartie 
 */
function annoncerJoueurs(io, db, listeJoueurs, numeroTour, idPartie) {
    console.log("On attend 5 secondes avant de passer au nouveau tour");
        
    // envoyerInfos(db, io, idPartie);

    setTimeout(async() => {
        io.to(idPartie).emit('newTurn', { "numeroTour": numeroTour, "joueurs": listeJoueurs , "pseudos":await recupererPseudos(db,listeJoueurs)});
        console.log("On a envoyé newTurn aux joueurs " + JSON.stringify(listeJoueurs));
        envoyerInfos(db, io, idPartie);
    }, 500);
}



/**
 * Récupère le pseudo d'un joueur dans la BDD à partir de son idJoueur
 * @param {*} db 
 * @param {*} idJoueur 
 * @returns Promesse de renvoyer le pseudo du joueur
 */
function recupererPseudo(db, idJoueur) {
    return new Promise((resolve, reject) => {
        db.query("SELECT pseudo FROM joueurs WHERE idJ=?", [idJoueur], async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result[0]["pseudo"]);
        });
    });
};

/**
 * Met à jour les scores des joueurs d'une partie
 * Le score d'un joueur correspond à la somme du nombre de cartes dans sa main et du nombre de ses cartes gagnées 
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {Number} idPartie L'ID de la partie
 */
function mettreAJourScores(db, idPartie){
    db.query("SELECT idJ, main, gagnees FROM joue WHERE idPartie=?", [idPartie], (err, result) => {
        if(err) throw err;
        result.forEach(ligne => {
            main = JSON.parse(ligne["main"]);
            gagnees = JSON.parse(ligne["gagnees"]);
            db.query("UPDATE joue SET score = ? WHERE idPartie=? AND idJ=?", [main.length+gagnees.length, idPartie, ligne["idJ"]], (err2, result2) => { if(err2) throw err2; });
        });
    });
}

module.exports = { playerActionBataille, recupererPseudo, recupererMains };
