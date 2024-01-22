var abandon = function(db,socket, motif, player) {
    var data = {player : player};
    const disconnectedPlayers = {}; // Tableau pour suivre les joueurs déconnectés involontairement
    if(motif == 'playerLeaving') { // Quand c'est volontaire. data demande l'idJ
        console.log("le joueur", player, "quitte volontairement");
        db.query("SELECT idPartie FROM joue WHERE idJ = ?", [player], async(err, results) => {
            if(err) {
                throw err;
            }
            if (results && results.length > 0) {
                const party = results[0].idPartie; // Récupérer l'id de la partie depuis les résultats
                console.log(results[0].idPartie);
                socket.to(results[0].idPartie).emit("otherPlayerLeft", results[0]); 
                const resultatSuppression = await removePlayer(db, player, party)
                if (resultatSuppression) {
                    db.query("SELECT pseudo FROM joueurs, joue WHERE joue.idJ = ? AND idPartie = ?", [player, party], async(err, results) => { // Pour récupérer le pseudonyme du joueur, pour son affichage dans le chat
                        if(err) {
                            throw err;
                        }
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
            if (results && results.length > 0) {
                data[party] = results; // On rajoute l'info de quel partie il venait
                b.query("SELECT pseudo FROM joueurs WHERE idJ = ?", [player], async(err, results) => {
                    if(err) {
                        throw err;
                    }
                    data[username] = results; // On rajoute l'info de son pseudonyme, pour l'affichage dans le chat plus tard (s'il ne revient pas)
                    disconnectedPlayers[data.player] = true; // Marquer le joueur comme déconnecté
                    setTimeout(function() { after30s(io, socket, db, data) }, 30000); // On attend 30 secondes
                });
            }
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
        const resultatSuppression = await removePlayer(db, data.player, data.party)
        if(resultatSuppression) {
            console.log("le joueur a été supprimé des données de la partie avec succès")
        };
    } else {
        console.log("Le joueur", data.player, "est revenu à la partie", data.party);
    }
}

async function removePlayer(db, player, party) {
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
                        db.query("SELECT idJ FROM joue WHERE idPartie = ? AND idJ <> ? LIMIT 1", [party, player], async (err, nextPlayerResult) => {
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
                    db.query("SELECT count(idJ) from joue where idPartie = ?",[player],async (del, delRes) =>{

                    });
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
                            db.query("SELECT count(idJ)as nbJoueur from joue where idPartie = ?", [party], async (err, nbRes) => {
                                if (err) throw (err)
                                if (nbRes[0].nbJoueur == 0) {
                                    db.query("DELETE FROM parties where idPartie=?", [party], async (err, delRes) => {
                                        if (err) throw (err)
                                        delRes.affectedRows==1?console.log("La partie a été supprimé."):console.log("La partie n'a pas été supprimé avec succés");
                                    });
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


module.exports = abandon;
