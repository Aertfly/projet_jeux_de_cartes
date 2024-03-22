const { playerActionSQP, ligneSQP } = require('./sqp/playerActionSQP.js');
const { scores, scoreMoyenJoueur } = require('../Global/scores.js');
const { playerActionBataille, recupererPseudo, recupererMains } = require('./Battle/bataille.js');
const { envoyerCartesGagnees,envoyerInfos,joueursPossibles, currentPlayerTurn } = require('./utils/functions.js');
const {playerActionRegicide,playerDiscardRegicide} = require('./Regicide/playerActionRegicide.js');
const {playerActionMemory} = require('./Memory/memory.js')

const gestionTours = function (io, socket, db) {

    socket.on("playerAction", (data) => { // Data doit contenir l'id de la partie
        console.log("Un joueur a fait une action : ",data);

        // On dit à tous les joueurs que le joueur en question a joué une carte
        recupererPseudo(db, data.playerId).then((data2) => {
            io.to(data.idPartie).emit('conveyAction', { "pseudoJoueur": data2, "natureAction": data.action });
            // TODO : exclure le joueur qui a envoyé la carte
        });
        switch(data.action){
            case 'jouerCarte':
                jouerCarte(io,socket,db,data);
                break;
            case 'piocherCarte'://pas utiliser actuellement 
                piocherCarte(socket,db,data);
                break;
            case 'defausserCarte':
                defausserCarte(io,socket,db,data);
                break;
            case 'retournerCarte':
                isRightPlayerMemory(io,db,data); // A FAIRE POUR LE MEMORY, data = {playerId, idPartie, indexCarte}
            default :
                console.log("action inconnu");
                return;
        }
    });

    socket.on('infoGame', (idParty) => {
        console.log(idParty);
        envoyerInfos(db,io,idParty);
        db.query('Select tour,sens from parties where idPartie=?',[idParty],async(err,result)=>{
            if(err)throw err;
            let joueurs = [];
            if(result[0]['sens']==='all'){
                joueurs = await joueursPossibles(db,idParty)
                for(let i=0;i<joueurs.length;i++){
                    joueurs[i] = JSON.parse(joueurs[i]);}
            }else{
                joueurs=[JSON.parse(result[0]['sens'])[0]];
            }
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

function jouerCarte(io,socket,db,data){
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
                            case 'Régicide':
                                playerActionRegicide(io,socket,db,centre,archive,data,cartesJoueurs)
                                break;
                            default:
                                throw "Jeu inconnu";
                        }
                    });
                });
            });
        });
}

function piocherCarte(socket,db,data){
    db.query('Select pioche,main from parties p,joue j where p.idPartie = j.idPartie AND j.idJ=? AND p.idPartie=?',[data.playerId,data.idPartie],(err, result) =>{
        if(err)throw err;
        const drawObject = JSON.parse(result[0]['pioche']);
        const draw = drawObject['pioche'];
        const hand = JSON.parse(result[0]['main']);
        const cardDrawed = draw.pop();
        hand.push(cardDrawed);
        updateDrawAndHand(data.idPartie,data.playerId,drawObject,hand);
        socket.emit('drawedCards',{Cards:cardDrawed,nextAction:'jouerCarte'});
    }); 
}
function updateDrawAndHand(db,idParty,idPlayer,draw,hand){
    db.query("UPDATE joue,parties SET main=?,pioche=? WHERE joue.idPartie=parties.idPartie AND joue.idJ=?AND joue.idPartie=?", [JSON.stringify(hand),JSON.stringify(draw),JSON.stringify(idPlayer),idParty],(err) => { if (err) throw err; });   
}
function defausserCarte(io,socket,db,data){
    db.query('Select archive,main,gagnees,pioche,type,tour from parties p,joue j where p.idPartie = j.idPartie AND j.idJ=? AND p.idPartie=?',[data.playerId,data.idPartie],(err, result) =>{
        if(err)throw err;
        const archive = JSON.parse(result[0]['archive']);
        const drawObject = JSON.parse(result[0]['pioche']);
        const discardPile = drawObject['defausse'];
        const hand = JSON.parse(result[0]['main']);
        const discardedCards = JSON.parse(result[0]['gagnees']);

        discardedCards.push(data.carte);
        discardPile.push(hand.splice(hand.indexOf(data.carte),1));
        updateDrawAndHand(db,data.idPartie,data.playerId,drawObject,hand);
        switch(result[0]["type"]){
            case 'Régicide':
                playerDiscardRegicide(io,socket,db,hand,discardedCards,archive.boss,data.idPartie,data.playerId)
                break;
            default:
                throw 'jeu inconnu'
        }
    });
}

function isRightPlayerMemory(io,db,data){
    // Vérifier si le joueur qui m'envoie une action est bien celui attendu et qu'il à joué < 2 fois
    db.query("SELECT COUNT(*) FROM parties WHERE idPartie = ?", [data.idPartie],(err,donneesDB) => {
        if(err)throw(err);
        currentSens = JSON.parse(donneesDB[0]['sens']);
        currentCentre = JSON.parse(donneesDB[0]['centre']);
        if(data.idPlayer == currentSens[0] && currentCentre[data.idPlayer].length < 2){
            playerActionMemory(io,db,data,donneesDB);
        } else {
            console.log("Ce joueur + " + data.idPlayer + " n'est pas censé jouer");
        };
    });
};

module.exports = gestionTours;

