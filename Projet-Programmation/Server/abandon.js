var abandon = function(io, socket, db) {
    const disconnectedPlayers = {}; // Tableau pour suivre les joueurs déconnectés involontairement

    socket.on('playerLeaving', (data) => { // Quand c'est volontaire. data demande l'idJ, le pseudo, et l'idPartie
        console.log("le joueur", data.player, "quitte volontairement");
        if (removePlayer(db, data.player, data.party)) {
            db.query("SELECT pseudo FROM joueur WHERE idJ = ? AND idPartie = ?", [player, party], async(err, results) => { // Pour récupérer le pseudonyme du joueur, pour son affichage dans le chat
                if(err) {
                    throw err;
                }
                io.to(data.party).emit("otherPlayerLeft", results);
                console.log("L'information du départ du joueur", data.player, "a été envoyée à tous les joueurs de la partie", data.party);
            });
        } else {
            console.log("Annulation du départ du joueur", data.player, "de la partie", data.party);
        }
        // Supprimer le joueur du tableau des joueurs déconnectés (s'il était dedans, normalement non mais au cas où)
        delete disconnectedPlayers[data.player];
        console.log("cest bon");
    });

    socket.on("playerDisconnect", (reason, player) => { // Quand c'est involontaire. data demande l'idJ    
        db.query("SELECT idPartie FROM joue WHERE idJ = ?", [player], async(err, results) => {
            if(err) {
                throw err;
            }
            data[party] = results; // On rajoute l'info de quel partie il venait
            b.query("SELECT pseudo FROM joueur WHERE idJ = ?", [player], async(err, results) => {
                if(err) {
                    throw err;
                }
                data[username] = results; // On rajoute l'info de son pseudonyme, pour l'affichage dans le chat plus tard (s'il ne revient pas)
                if(reason == "ping timeout" || reason == "transport close") {
                    disconnectedPlayers[data.player] = true; // Marquer le joueur comme déconnecté
                    setTimeout(function() { after30s(io, socket, db, data) }, 30000); // On attend 30 secondes
                } else {
                    socket.emit('disconnectComplete');
                    removePlayer(db, data.player, data.party);
                }
            });
        });
    });

    socket.on("playerReconnect", (data) => { 
        // Mettre à jour l'état du joueur lorsqu'il se reconnecte
        if (disconnectedPlayers[data.player]) {
            disconnectedPlayers[data.player] = false; // Le joueur est de retour
            console.log("Le joueur", data.player, "est de retour dans la partie", data.party);
        }
    });
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

function removePlayer(db, player, party) { // supprime dans la db un joueur d'un partie
    db.query("DELETE * FROM joue WHERE idJ = ? AND idPartie = ?", [player, party], async(err, results) => {
        if(err){
            console.log(player, "a essayé de quitter la partie", party, ", sans succès");
            return false;
        }
        console.log("la suppression du joueur", player, "dans la partie", party, "s'est effectué")
        return true;
    })
}

module.exports = abandon;
