const { playerActionSQP, ligneSQP, envoyerInfos, infoPartie } = require('./sqp/playerActionSQP.js');
const { scores, scoreMoyenJoueur } = require('../Global/scores.js');
const gestionTours = function (io, socket, db) {

    socket.on("playerAction", (data) => { // Data doit contenir l'id de la partie
        console.log("joueur " + data.playerId + " " + data.action + " " + data.carte.enseigne + " " + data.carte.valeur);

        // On dit à tous les joueurs que le joueur en question a joué une carte
        recupererPseudo(db, data.playerId).then((data2) => {
            io.to(data.idPartie).emit('conveyAction', { "pseudoJoueur": data2, "natureAction": data.action });
        });

        // On stocke dans "cartesJoueurs" l'ensemble des mains des joueurs
        recupererMains(db, data.idPartie).then((cartesJoueurs) => {

            // On enlève la carte du joueur de sa main dans l'objet cartesJoueurs
            try {
                cartesJoueurs.get(data.playerId).get("main").forEach((element, index) => {
                    if (JSON.stringify(element) == JSON.stringify(data.carte)) {
                        cartesJoueurs.get(data.playerId).get("main").splice(index, 1);
                        return;
                    }
                });
            } catch {
                console.log("Erreur de lecture des cartes :");
                console.log(cartesJoueurs.get(data.playerId)); // undefined
                throw "finito";
            }

            // On répercute l'enlèvement de la carte de la main du joueur dans l'objet vers la base de données
            db.query("UPDATE joue SET main=? WHERE joue.idJ=? AND joue.idPartie=?", [JSON.stringify(cartesJoueurs.get(data.playerId).get("main")), data.playerId, data.idPartie], async (err0, result0) => {
                if (err0) throw err0;

                db.query("SELECT centre FROM parties WHERE idPartie=?", [data.idPartie], async (err, result) => {
                    if (err) throw err;
                    const centre = JSON.parse(result[0]["centre"]); // On peut maintenant accéder au centre, récupéré depuis la BDD

                    // On met la carte du joueur au centre
                    centre[data.playerId] = data.carte;
                    db.query("UPDATE parties SET centre=? WHERE idPartie=?", [JSON.stringify(centre), data.idPartie], async (err, result) => { if (err) throw err; }); // On met à jour la BDD

                    db.query("SELECT archive, type FROM parties WHERE idPartie=?", [data.idPartie], async (err2, result2) => {
                        if (err2) throw err2;
                        
                        const archive = JSON.parse(result2[0]["archive"]); // On peut maintenant accéder à archive
                        const jeu = result2[0]["type"];

                        switch (jeu){
                            case "Bataille": 
                                // On passe à une logique spécifique à la bataille
                                bataille(io, socket, db, centre, archive, cartesJoueurs, data);
                                break;
                            case "6 Qui Prend":
                                playerActionSQP(io, socket, db, centre, archive, data);
                                break;
                            default:
                                throw "Jeu inconnu";
                        }
                    });
                });
            });
        });
    });

    socket.on('infoGame', idParty => {
        db.query('SELECT pseudo,centre,archive,pioche,score,tour,main from parties p,joue j,joueurs jo where p.idPartie=j.idPartie and j.idJ=jo.idJ and p.idPartie =?', [idParty], async (err, result) => {
            if (err) throw (err);
            var infoPlayers = [];
            console.log("res : ", result);
            if (result.length != 0) {
                await scoreMoyenJoueur(io, db, idParty).then((scoreMoyenJoueur) => {
                    console.log("Score moy", scoreMoyenJoueur);
                    for (i = 0; i < result.length; i++) {
                        infoPlayers.push({
                            "nbCards": JSON.parse(result[i].main).length,
                            "pseudo": result[i].pseudo,
                            "score": result[i].score,
                            'scoreMoyenJoueur': scoreMoyenJoueur[i]
                        })
                    }
                });
                socket.emit('infoGameOut', {
                    'center': JSON.parse(result[0].centre),
                    'archive': JSON.parse(result[0].archive),
                    'draw': JSON.parse(result[0].pioche).length,
                    'infoPlayers': infoPlayers,
                    'nbTurn': result[0].tour
                });
            }
        });
    });

    socket.on("ligne", (data) => {
        console.log("Ligne reçue : " + data.idJoueur + " " + data.idPartie + " " + data.ligne);
        // On regarde dans quel jeu on est
        db.query("SELECT type FROM parties WHERE idPartie=?", [data.idPartie], async (err, result) => {
            const jeu = result[0]["type"];
            switch (jeu){
                case "6 Qui Prend":
                    ligneSQP(io, socket, db, data);
                    break;
                default:
                    throw "Jeu inconnu";
            }
        });

    })
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


async function bataille(io, socket, db, centre, archive, cartesJoueurs, data){
    // Si archive est vide : on n'est pas dans une bataille
    if (JSON.stringify(archive) == "{}") {
        console.log("On n'est pas dans une bataille");
            let unionJoueursPossibles = await joueursPossibles(db, data.idPartie);

            if (unionJoueursPossibles.length == 1) {
                finDePartie(io, socket, db, unionJoueursPossibles[0], data.idPartie, cartesJoueurs);
            } else {
                annoncerScores(io, socket, db, cartesJoueurs, data.idPartie);
                suite(io, socket, db, data.idPartie, unionJoueursPossibles.length, centre, archive, cartesJoueurs, data);
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
            finDePartie(io, socket, db, unionJoueursPossibles[0], data.idPartie, cartesJoueurs);  // BUG A CORRIGER
        } else {
            suite(io, socket, db, data.idPartie, joueursPossibles.length, centre, archive, cartesJoueurs, data);
        }
    }

    // la suite de la logique est effectuée dans la fonction suite appelée plus haut et située plus bas
    
}

function annoncerScores(io, socket, db, cartesJoueurs, idPartie) {
    // Prend en entrée le dictionnaire des cartes et retourne le score de chaque joueur sous la forme d'un dictionnaire idJoueur:score
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

function suite(io, socket, db, idPartie, nbJoueursPossibles, centre, archive, cartesJoueurs, data) {
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

function finDePartie(io, socket, db, vainqueur, idPartie, cartesJoueurs, idPartie) {
    // Envoie sur la route 'winner' le pseudo du gagnant
    io.to(idPartie).emit('winner', vainqueur);

    annoncerScores(io, socket, db, cartesJoueurs, idPartie);

    // Passe le tour à -2
    db.query("UPDATE parties SET tour=? WHERE idPartie=?", [-2, idPartie], async (err, result) => { if (err) throw err; });
}

// CALCULE PUIS RETOURNE L'ENSEMBLE DES JOUEURS QUI SONT EN BATAILLE (à partir d'un dictionnaire dont les valeurs sont des cartes)
function joueursBataillle(cartes) {
    console.log("joueursBataille retourne la liste " + Object.keys(cartes));
    return Object.keys(cartes);
}

// CALCULE PUIS RETOURNE L'ENSEMBLE DES JOUEURS QUI SONT EN BATAILLE (à partir d'un dictionnaire dont les valeurs sont des listes de cartes)
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

function annoncerJoueurs(io, db, listeJoueurs, numeroTour, idPartie , centre , archive) {
    // Cette fonction devrait envoyer à tous les joueurs qui doivent jouer une annonce leur disant que c'est à eux de jouer
    // par la route 'newTurn' (numeroTour, numeroJoueur)
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

function recupererMains(db, idPartie) {
    console.log("Appel à récupererMains avec idPartie = " + idPartie);
    // Cette fonction retourne une promesse, qui lors de la résolution donnera l'ensemble des mains non vides des joueurs

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

// On envoie à tous les joueurs le dictionnaire qui comporte l'ensemble des cartes au centre
async function reveal(io, socket, centre, db, idPartie) {
    var centreAEnvoyer = {};
    for (const clé of Object.keys(centre)) {
        const recuperer = await recupererPseudo(db, clé); 
        centreAEnvoyer[recuperer] = centre[clé];
    }
    io.to(idPartie).emit('reveal', centreAEnvoyer);
}

module.exports = gestionTours;

