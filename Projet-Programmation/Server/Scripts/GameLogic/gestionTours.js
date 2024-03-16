const { playerActionSQP, ligneSQP } = require('./sqp/playerActionSQP.js');
const { scores, scoreMoyenJoueur } = require('../Global/scores.js');
const { playerActionBataille, recupererPseudo, recupererMains } = require('./Battle/bataille.js');
const { envoyerCartesGagnees,envoyerInfos,joueursPossibles } = require('./utils/functions.js');

const gestionTours = function (io, socket, db) {

    socket.on("playerAction", (data) => { // Data doit contenir l'id de la partie
        // console.log("joueur " + data.playerId + " " + data.action + " " + data.carte.enseigne + " " + data.carte.valeur);

        // On dit à tous les joueurs que le joueur en question a joué une carte
        recupererPseudo(db, data.playerId).then((data2) => {
            io.to(data.idPartie).emit('conveyAction', { "pseudoJoueur": data2, "natureAction": data.action });
            // TODO : exclure le joueur qui a envoyé la carte
        });
        switch(data.action){
            case 'jouerCarte':
                jouerCarte(io,db,data);
        }
    });

    socket.on('infoGame', async(idParty) => {
        console.log(idParty);
        envoyerInfos(db,io,idParty);
        const joueurs = await joueursPossibles(db,idParty)
        for(let i=0;i<joueurs.length;i++){
            joueurs[i] = JSON.parse(joueurs[i]);}
        db.query('Select tour from parties where idPartie=?',[idParty],(err,result)=>{
            if(err)throw err;
            console.log("Joueurs :",joueurs,result[0]['tour']);
            socket.emit('newTurn', { "numeroTour":result[0]['tour'], "joueurs": joueurs });
        }); 
    });

    socket.on("ligne", (data) => {
        // On regarde dans quel jeu on est
        db.query("SELECT type FROM parties WHERE idPartie=?", [data.idPartie], async (err, result) => {
            switch (result[0]["type"]){
                case "6 Qui Prend":
                    ligneSQP(io, db, data);
                    break;
                default:
                    throw "Jeu inconnu";
            }
        });
    })

    socket.on("requestWonCards", (data) => {
        // On regarde dans quel jeu on est
        db.query("SELECT type FROM parties WHERE idPartie=?", [data.idParty], async (err, result) => {
            switch (result[0]["type"]){
                case "Bataille":
                    envoyerCartesGagnees(db, socket, data);
                    break;
                default:
                    throw "Jeu inconnu";
            }
        });

    })
}

function jouerCarte(io,db,data){
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
                                playerActionBataille(io, db, centre, archive, cartesJoueurs, data, socket);
                                break;
                            case "6 Qui Prend":
                                playerActionSQP(io, db, centre, data);
                                break;
                            default:
                                throw "Jeu inconnu";
                        }
                    });
                });
            });
        });
}


module.exports = gestionTours;

