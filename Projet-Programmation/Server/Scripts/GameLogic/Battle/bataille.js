const { infoPartie, envoyerInfos } = require("../utils/functions.js");

async function playerActionBataille(io, db, centre, archive, cartesJoueurs, data){
    // Si archive est vide : on n'est pas dans une bataille
    if (JSON.stringify(archive) == "{}") {
        console.log("On n'est pas dans une bataille");
            let unionJoueursPossibles = await joueursPossibles(db, data.idPartie);

            if (unionJoueursPossibles.length == 1) {
                finDePartie(io, db, unionJoueursPossibles[0], data.idPartie, cartesJoueurs);
            } else {
                annoncerScores(io, db, cartesJoueurs, data.idPartie);
                suite(io, db, data.idPartie, unionJoueursPossibles.length, centre, archive, cartesJoueurs, data);
            }
    } else { // Si archive n'est pas vide : on est dans une bataille
        console.log("On est dans une bataille")
        // le nombre de joueurs qui peuvent jouer correspond à la taille de la liste retournée par joueursBataille2(archive)
        let joueursPossibles = joueursBataille2(archive)
        //console.log("Bataille : " + joueursPossibles.length + "\nCentre :");
        //console.log(centre);
        //console.log("En jeu :");
        //console.log(archive);
        if (joueursPossibles.length == 1) {
            finDePartie(io, db, unionJoueursPossibles[0], data.idPartie, cartesJoueurs);  // BUG A CORRIGER
        } else {
            suite(io, db, data.idPartie, joueursPossibles.length, centre, archive, cartesJoueurs, data);
        }
    }

    // la suite de la logique est effectuée dans la fonction suite appelée plus haut et située plus bas
    
}

/**
 * Calcule l'ensemble des joueurs qui peuvent jouer dans une partie.
 * Fait l'union des joueurs qui ont une carte au centre et des joueurs qui ont une main non vide
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {Number} idPartie L'ID de la partie
 * @returns {Promise} Promesse de renvoyer la liste des joueurs qui peuvent jouer dans la partie
 */
async function joueursPossibles(db, idPartie){
    return new Promise((resolve) => {
        // le nombre de joueurs qui peuvent jouer correspond au nombre de joueurs qui n'ont pas une main égale à [] UNION ceux qui ont déjà une carte au centre
        db.query("SELECT joue.idJ as idJ, parties.centre as centre FROM joue, parties WHERE joue.idPartie=? OR parties.idPartie=? AND main != '[]'", [idPartie, idPartie], async (err3, result3) => {
            if (err3) throw err3;

            // On fait la liste des joueurs qui ont une main non vide
            let joueursPossibles = [];
            for (let index = 0; index < result3.length; index++) {
                joueursPossibles.push("" + result3[index]["idJ"]);
            }

            let joueursPossibles2 = Object.keys(JSON.parse(result3[0]["centre"]));

            // On fait l'union des deux listes, pour avoir l'ensemble des joueurs qui peuvent jouer (main non vide et/ou carte au centre)
            let unionJoueursPossibles = new Set([...joueursPossibles, ...joueursPossibles2]);

            unionJoueursPossibles = [...unionJoueursPossibles];

            resolve(unionJoueursPossibles);
        });
    });   
}

/**
 * Cette fonction retourne une promesse, qui lors de la résolution donnera l'ensemble des mains non vides des joueurs
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {Number} idPartie L'ID de la partie
 * @returns Promesse de renvoyer l'ensemble des mains non vides des joueurs
 */
function recupererMains(db, idPartie) {
    console.log("Appel à récupererMains avec idPartie = " + idPartie);

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
 * @param {*} io 
 * @param {*} db 
 * @param {*} cartesJoueurs Dictionnaire des cartes
 * @param {Number} idPartie L'ID de la partie
 */
function annoncerScores(io, db, cartesJoueurs, idPartie) {
    console.log("Envoi des scores :");

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

        console.log(updatedscores);
        io.to(idPartie).emit('updateScores', updatedscores);
    });
}

function suite(io, db, idPartie, nbJoueursPossibles, centre, archive, cartesJoueurs, data) {
    console.log("Joueurs : " + Object.keys(centre).length + "/" + nbJoueursPossibles);
    if (Object.keys(centre).length == nbJoueursPossibles) { // si le joueur est le dernier à jouer = si le nombre de cartes dans le premier centre est égal au nombre de joueurs qui peuvent jouer
        console.log("Le joueur est le dernier à jouer, on déclenche la logique");
        // on lance la bataille
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
        valeurs.sort();
        let valeurLaPlusGrande = valeurs[valeurs.length - 1];

        if (compterValeurs[valeurLaPlusGrande] == '1') { // si la valeur de carte la plus grande est unique
            // console.log("La carte la plus grande est unique");

            // On récupère le nom du joueur qui a placé la plus grande carte
            let gagnantDeLaBataille = undefined;
            for (const clé of Object.keys(centre)) {
                if (centre[clé]["valeur"] == valeurLaPlusGrande) {
                    gagnantDeLaBataille = clé;
                }
            }
            console.log("Pli remporté par " + gagnantDeLaBataille);
            // On ajoute à ses cartes gagnées toutes les cartes des deux centres
            db.query("SELECT gagnees FROM joue WHERE idJ=? AND idPartie=?", [gagnantDeLaBataille, idPartie], async (err, result) => {
                if (err) throw err;

                cartesGagneesDuGagnant = JSON.parse(result[0]["gagnees"]); // On récupère les cartes gagnées du gagnant
                for (const clé of Object.keys(centre)) {
                    cartesGagneesDuGagnant.push(centre[clé]); // On y ajoute les cartes du centre
                }
                for (const clé of Object.keys(archive)) {
                    cartesGagneesDuGagnant.push(archive[clé]); // On y ajoute les cartes des archives
                }

                gagneesAjoutes = false;
                // On insère cette nouvelle liste de cartes dans la BDD
                db.query("UPDATE joue SET gagnees=? WHERE idPartie=? AND idJ=?", [JSON.stringify(cartesGagneesDuGagnant), idPartie, gagnantDeLaBataille], async (err2, result2) => {
                    if (err2) throw err2;
                    gagneesAjoutes = true;
                });

            });

            // On vide les deux centres
            db.query("UPDATE parties SET centre=?, archive=? WHERE idPartie=?", [JSON.stringify({}), JSON.stringify({}), idPartie], async (err2, result2) => { if (err2) throw err2; });

            // On incrémente le numéro de tour de 1
            db.query("UPDATE parties SET tour = tour + 1 WHERE idPartie=?", [idPartie], async (err2, result2) => { if (err2) throw err2; });

            // On appelle la méthode annoncerJoueurs avec l'ensemble des joueurs : c'est un nouveau tour
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
                    annoncerJoueurs(io, db, joueurs, result3[0]["tour"], idPartie , centre , archive)
                });
            });

        } else { // sinon, il y a bataille
            console.log("Il y a bataille");
            console.log(centre);

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

            console.log("\nArchive :");
            console.log(archive);

            // On stocke l'archive dans la base de données
            db.query("UPDATE parties SET archive=? WHERE idPartie=?", [JSON.stringify(archive), idPartie], (err, result) => { if (err) throw err; });

            // On récupère le numéro de tour actuel
            db.query("SELECT tour FROM parties WHERE idPartie=?", [idPartie], async (err3, result3) => {
                if (err3) throw err3;

                // On appelle la méthode annoncerJoueurs avec les joueurs de cette liste : c'est une bataille
                annoncerJoueurs(io, db, joueursEnBataille, result3[0]["tour"], idPartie , centre , archive)
            });
        }
    } else {
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
    }
}

/**
 * Gère la fin de partie :
 * - Envoie sur la route 'winner' le pseudo du gagnant
 * - Annonce les scores finaux
 * - Passe le tour à -2 sur la base de données
 * @param {*} io 
 * @param {*} db 
 * @param {*} vainqueur 
 * @param {*} idPartie 
 * @param {*} cartesJoueurs 
 * @param {*} idPartie 
 */
function finDePartie(io, db, vainqueur, idPartie, cartesJoueurs, idPartie) {
    io.to(idPartie).emit('winner', vainqueur);

    annoncerScores(io, db, cartesJoueurs, idPartie);

    // Passe le tour à -2
    db.query("UPDATE parties SET tour=? WHERE idPartie=?", [-2, idPartie], async (err, result) => { if (err) throw err; });
}

/**
 * CALCULE PUIS RETOURNE L'ENSEMBLE DES JOUEURS QUI SONT EN BATAILLE
 * @param {*} cartes Dictionnaire dont les valeurs sont des listes de cartes
 * @returns L'ensemble des joueurs qui sont en bataille
 */
function joueursBataille2(cartes) {
    var idMax = -1;
    for (var idJ of Object.keys(cartes)) {
        for (var numCarte of Object.keys(cartes[idJ])) {
            if (numCarte > idMax) idMax = numCarte;
        }
    }

    var retour = [];
    // On compte combien de joueurs ont cette carte
    for (var idJ of Object.keys(cartes)) {
        if ((cartes[idJ].length) - 1 == idMax) {
            retour.push(idJ)
        }
    }
    console.log("joueursBataille2 retourne la liste " + retour);
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
 * @param {*} centre 
 * @param {*} archive 
 */
function annoncerJoueurs(io, db, listeJoueurs, numeroTour, idPartie , centre , archive) {
    console.log("On attend 5 secondes avant de passer au nouveau tour");
    infoPartie(db, idPartie).then((infoJoueurs) => {
        envoyerInfos(db, io, idPartie, centre, infoJoueurs, numeroTour);
    });
    setTimeout(() => {
        io.to(idPartie).emit('newTurn', { "numeroTour": numeroTour, "joueurs": listeJoueurs });
        console.log("On a envoyé newTurn :");
        console.log({ "numeroTour": numeroTour, "joueurs": listeJoueurs });
        infoPartie(db, idPartie).then((infoJoueurs) => {
            envoyerInfos(db, io, idPartie, {}, infoJoueurs, numeroTour);
        });
    }, 5000);
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
}

/**
 * Envoie à tous les joueurs le dictionnaire qui comporte l'ensemble des cartes au centre
 * @param {*} io 
 * @param {*} socket 
 * @param {*} centre 
 * @param {*} db 
 * @param {*} idPartie 
 */
async function reveal(io, centre, db, idPartie) {
    var centreAEnvoyer = {};
    for (const clé of Object.keys(centre)) {
        const recuperer = await recupererPseudo(db, clé); 
        centreAEnvoyer[recuperer] = centre[clé];
    }
    io.to(idPartie).emit('reveal', centreAEnvoyer);
}


module.exports = { playerActionBataille, recupererPseudo, recupererMains };