var abandon = function(db,socket, motif, player) {
    var data = {player : player};
    const disconnectedPlayers = {}; // Tableau pour suivre les joueurs déconnectés involontairement
    if(motif == 'playerLeaving') { // Quand c'est volontaire. data demande l'idJ
        console.log("le joueur", player, "quitte volontairement");
        db.query("SELECT idPartie FROM joue WHERE idJ = ?", [player], async(err, results) => {
            if(err) {
                throw err;
            }
            console.log(results);
            if (results && results.length > 0) {
                const party = results[0].idPartie; // Récupérer l'id de la partie depuis les résultats
                if (await removePlayer(db, player, party)) {
                    db.query("SELECT pseudo FROM joueurs, joue WHERE joue.idJ = ? AND idPartie = ?", [player, party], async(err, results) => { // Pour récupérer le pseudonyme du joueur, pour son affichage dans le chat
                        if(err) {
                            throw err;
                        }
                        socket.to(party).emit("otherPlayerLeft", results[0]); 
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

    if(motif == 'playerDisconnect') { // Quand c'est involontaire. data demande l'idJ    
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
        // Mettre à jour l'état du joueur lorsqu'il se reconnecte
        if (disconnectedPlayers[data.player]) {
            disconnectedPlayers[data.player] = false; // Le joueur est de retour
            console.log("Le joueur", data.player, "est de retour dans la partie", data.party);
        }
    };
};

function after30s(io, socket, db, data) {
    // Vérifier si le joueur est toujours déconnecté après 30 secondes
    if (disconnectedPlayers[data.player]) {
        console.log("Le joueur", data.player, "n'est pas revenu à la partie", data.party);
        io.to(data.party).emit("otherPlayerLeft", data.username);
        delete disconnectedPlayers[data.player]; // On supprime de notre liste le joueur déco
        if(removePlayer(db, data.player, data.party)) {
            console.log("le joueur a été supprimé des données de la partie")
        };
    } else {
        console.log("Le joueur", data.player, "est revenu à la partie", data.party);
    }
}

function removePlayer(db, player, party) {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM joue WHERE idJ = ? AND idPartie = ?", [player, party], (err, results) => {
            if (err) {
                console.log(player, "a essayé de quitter la partie", party, ", sans succès");
                reject(false);
            } else {
                console.log("la suppression du joueur", player, "dans la partie", party, "s'est effectuée");
                resolve(true);
            }
        });
    });
}

module.exports = abandon;
