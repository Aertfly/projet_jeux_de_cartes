const { recupererPseudo} = require("../GameLogic/utils/functions");
const { playerActionSQP } = require("../GameLogic/sqp/playerActionSQP");
const { playerActionBataille, recupererMains } = require("../GameLogic/Battle/bataille");


var abandon = function(io,db,socket, motif, player) {
    var data = {player : player};
    const disconnectedPlayers = {}; // Tableau pour suivre les joueurs déconnectés involontairement
    if(motif == 'playerLeaving') { // Quand c'est volontaire. data demande l'idJ
        console.log("le joueur", player, "quitte volontairement");
        db.query("SELECT p.idPartie FROM joue j,parties p WHERE idJ = ? AND p.idPartie=j.idPartie AND sauvegarde=0", [player], async(err, results) => {
            if(err) {
                throw err;
            }
            if (results && results.length > 0) {
                const party = results[0].idPartie; // Récupérer l'id de la partie depuis les résultats
                console.log(results[0].idPartie);
                const resultatSuppression = await removePlayer(io,db, player, party,socket)
                if (resultatSuppression) {
                    db.query("SELECT pseudo FROM joueurs, joue WHERE joue.idJ = ? AND idPartie = ?", [player, party], async(err, results) => { // Pour récupérer le pseudonyme du joueur, pour son affichage dans le chat
                        if(err) {
                            throw err;
                        }
                        socket.to(party).emit("otherPlayerLeft", await recupererPseudo(db,player));
                        console.log("L'information du départ du joueur", player, "a été envoyée à tous les joueurs de la partie", party);
                    });
                } else {
                    console.log("Annulation du départ du joueur", player, "de la partie", party);
                }
            }
        });
        // Supprimer le joueur du tableau des joueurs déconnectés (s'il était dedans, normalement non mais au cas où)
        delete disconnectedPlayers[player];
    };

    if(motif == 'playerDisconnect') { // Quand c'est involontaire
        db.query("SELECT idPartie FROM joue WHERE idJ = ?", [player], async(err, results) => {
            if(err) {
                throw err;
            }
            data[party] = results; // On rajoute l'info de quel partie il venait
            b.query("SELECT pseudo FROM joueurs WHERE idJ = ?", [player], async(err, results) => {
                if(err) {
                    throw err;
                }
                data[username] = results; // On rajoute l'info de son pseudonyme, pour l'affichage dans le chat plus tard (s'il ne revient pas)
                disconnectedPlayers[data.player] = true; // Marquer le joueur comme déconnecté
                setTimeout(function() { after30s(io, socket, db, data) }, 30000); // On attend 30 secondes
            });
        });
    };

    if(motif == 'playerReconnect') { 
        // Mettre à jour l'état du joueur lorsqu'il soit considéré comme "connectable"
        if (disconnectedPlayers[data.player]) {
            disconnectedPlayers[data.player] = false; // Le joueur est de retour
            console.log("Le joueur", data.player, "est de retour dans la partie", data.party);
        }
    };
};

async function after30s(io, socket, db, data) {
    // Vérifier si le joueur est toujours déconnecté après 30 secondes
    if (disconnectedPlayers[data.player]) {
        console.log("Le joueur", data.player, "n'est pas revenu à la partie", data.party);
        io.to(data.party).emit("otherPlayerLeft", data.username);
        delete disconnectedPlayers[data.player]; // On supprime de notre liste le joueur déco
        const resultatSuppression = await removePlayer(io,db, data.player, data.party,socket)
        if(resultatSuppression) {
            console.log("le joueur a été supprimé des données de la partie avec succès")
        };
    } else {
        console.log("Le joueur", data.player, "est revenu à la partie", data.party);
    }
}

async function removePlayer(io,db, player, party,socket) {
    return new Promise((resolve, reject) => {
        // Vérifier d'abord si les données à supprimer existent vraiment
        db.query("SELECT * FROM joue WHERE idJ = ? AND idPartie = ?", [player, party], (err, results) => {
            if (err) {
                console.log("Erreur lors de la vérification des données à supprimer :", err);
                reject(false);
            } else {
                if (results.length === 0) {
                    console.log("Aucune donnée correspondante à supprimer n'a été trouvée.");
                    resolve(false); // Aucune donnée à supprimer
                } else {
                    const isOwner = results[0].proprietaire === 1; // Vérifier si le joueur est propriétaire
                    if (isOwner) {
                        // Mettre propriétaire le joueur suivant
                        db.query("SELECT j.idJ FROM joue j,joueurs jo WHERE j.idPartie = ? AND j.idJ=jo.idJ AND jo.idJ <> ? LIMIT 1", [party, player], async (err, nextPlayerResult) => {
                            if (err) {
                                console.log("Erreur lors de la récupération du prochain propriétaire :", err);
                                reject(false);
                            } else {
                                const nextPlayer = nextPlayerResult && nextPlayerResult.length > 0 ? nextPlayerResult[0].idJ : null;
                                console.log("Next Owner:", nextPlayer);

                                if (nextPlayer) { // Si il y a un autre joueur dans la partie, donc transmettre la propriété
                                    db.query("UPDATE joue SET proprietaire = 1 WHERE idPartie = ? AND idJ = ?", [party, nextPlayer], async (err, updateResult) => {
                                        if (err) {
                                            console.log("Erreur lors de la mise à jour du prochain propriétaire :", err);
                                            reject(false);
                                        } else {
                                            console.log("Nouveau propriétaire mis en place :", nextPlayer);
                                        }
                                    });
                                } else { // S'il est tout seul
                                    console.log("Aucun joueur suivant trouvé pour devenir propriétaire.");
                                }
                            }
                        });
                    }

                    // Supprimer le joueur
                    db.query("DELETE FROM joue WHERE idJ = ? AND idPartie = ?", [player, party], async (deleteErr, deleteResults) => {
                        if (deleteErr) {
                            console.log("Erreur lors de la suppression :", deleteErr);
                            reject(false);
                        } else {
                            console.log("La suppression s'est effectuée avec succès.");
                            // Vérifier si le joueur supprimé était propriétaire
                            if (isOwner) {
                                console.log("L'ancien propriétaire a été supprimé.");
                            }
                            db.query("SELECT count(j.idJ)as nbJoueur,joueursMin,type,sens,tour,centre,archive from joueurs js,joue j, parties p where js.idJ=j.idJ AND j.idPartie = p.idPartie AND p.idPartie=? AND sauvegarde=0", [party], async (err, nbRes) => {
                                if (err) throw (err)                       
                                if((nbRes[0].nbJoueur < nbRes[0].joueursMin) ||nbRes[0].nbJoueur==0){
                                    io.to(party).emit('leave');
                                    resolve(removeAllPlayer(db,party));
                                }else{
                                    console.log("La type de partie est :",nbRes[0].type);
                                    if(nbRes[0].tour > -1){
                                        switch (nbRes[0].type){
                                            case "Bataille": 
                                                recupererMains(db, party).then((cartesJoueurs) => {
                                                    const data = {idPartie:party,playerId:cartesJoueurs.keys().next().value}// Obtient la première clé
                                                    playerActionBataille(io, db, JSON.parse(nbRes[0].centre), JSON.parse(nbRes[0].archive), cartesJoueurs, data, socket);
                                                });
                                                break;
                                            case "6 Qui Prend":
                                                playerActionSQP(io, db, JSON.parse(nbRes[0].centre), party);
                                                break;
                                            case 'Régicide':
                                                handleNextPlayer(io,db,party,JSON.parse(nbRes[0].sens),player,nbRes[0].tour);
                                                break;
                                            case 'Memory':
                                                handleNextPlayer(io,db,party,JSON.parse(nbRes[0].sens),player,nbRes[0].tour);
                                                break;
                                            default:
                                                console.log("Jeu inconnu, fin abandon");
                                        }
                                    }else{
                                        db.query("Select pseudo,proprietaire from joueurs j,joue jo where j.idJ = jo.idJ and jo.idPartie=? ",[party],(errR,resR)=>{
                                            if(errR)throw errR;
                                            console.log(resR);
                                            io.to(party).emit('refreshPlayerList',{'playerList': resR.map(obj => ({ 'pseudo': obj.pseudo, 'owner': obj.proprietaire }))});
                                            console.log("On envoie la liste de joueur actualisé")
                                        });
                                    }
                                }
                            });
                            resolve(true);
                        }
                    });
                }
            }
        });
    });
}

async function handleNextPlayer(io,db,idParty,playerOrder,player,turn){
    console.log(idParty,playerOrder,player,turn);
    if(player===playerOrder[0]){    
        console.log("On dit au prochain joueur de jouer");
        //au minimun on a deux joueurs donc cela ne devrait pas poser de probléme
        io.to(idParty).emit('newTurn',{joueurs:[playerOrder[1]],
            numeroTour:Math.floor(turn/playerOrder.length),
            pseudos:[await recupererPseudo(db,playerOrder[1])]});
    }
    playerOrder.splice(playerOrder.indexOf(player),1);
    await updatePlayerOrder(db,idParty,playerOrder);
}

function updatePlayerOrder(db,idParty,playerOrder){
    return new Promise((resolve,reject)=>{
        db.query("Update parties SET sens=? where idPartie=?",[JSON.stringify(playerOrder),idParty],(err,res)=>{
            if(err)reject(err);
            console.log(res.changedRows===1?"Update sens réussi":"Update raté");
            resolve(true);
        })
    })
}

function removeList(db,idParty,list){
    const promiseList =[];
    for(let i=0;i<list.length; i++){
        promiseList.push(new Promise((res,rej)=>{
            db.query("DELETE FROM joue WHERE joue.idJ = ? AND joue.idPartie = ?",[list[i],idParty],(errD,resD)=>{
                if(errD)rej(errD);
                res(resD.affectedRows==1);
            })
        }));
    }
    return promiseList;
}

function removeAllPlayer(db,idParty){
    console.log("Declenchement de removeAllPlayer");
    return new Promise((resolve,reject)=>{
        db.query("Select jo.idJ from joue jo,joueurs j where j.idJ = jo.idJ And idPartie=?",[idParty],async(err,res)=>{
            if(err) reject(err)
            await Promise.all([...removeList(db,idParty,res.map(object => object.idJ)),... removeAllBot(db,idParty,await idRList(db,idParty))])
            db.query("DELETE FROM parties WHERE idPartie = ?",[idParty],(errP,resP)=>{
                if(errP){reject(errP);}
                resP.affectedRows==1?console.log("La partie a été supprimée."):console.log("La partie n'a pas été supprimée.");
                resolve(resP.affectedRows==1);      
            });
        });
    }); 
}

function idRList(db,idParty){
    return new Promise((rev,rej)=>{
        db.query("Select idR from joue,robots where idJ=idR and idPartie=?",[idParty],(err,res)=>{
            if(err)rej(err);
            rev(res ?res.map(obj => obj.idR):[]);
        });
    });
}

function removeAllBot(db,idParty,list){
    const promiseList = removeList(db,idParty,list);
    for(const idR of list){
        promiseList.push(new Promise((rev,rej)=>{
            db.query("Delete from robots where idR=?",[idR],(err,res)=>{
                if(err)rej(err);
                rev(res.affectedRows==1);
            })
        }));
    }
    return promiseList;
}

module.exports = abandon;
