var abandon = function(io, socket, db) {
    const disconnectedPlayers = {}; // Tableau pour suivre les joueurs déconnectés involontairement

    socket.on('playerLeaving', (data) => { // Quand c'est volontaire
        if (removePlayer(db, data.player, data.party)) {
            io.to(data.party).emit("otherPlayerLeft", data.username);
            console.log("L'information du départ du joueur", data.player, "a été envoyée à tous les joueurs de la partie", data.party);
        } else {
            console.log("Annulation du départ du joueur", data.player, "de la partie", data.party);
        }
        // Supprimer le joueur du tableau des joueurs déconnectés (s'il était dedans, normalement non mais au cas où)
        delete disconnectedPlayers[data.player];
        console.log("cest bon");
    });

    socket.on("playerDisconnect", (data) => { // Quand c'est involontaire
        disconnectedPlayers[data.player] = true; // Marquer le joueur comme déconnecté
        setTimeout(function() { after30s(io, socket, db, data) }, 30000);  
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
        io.to(data.party).emit("otherPlayerLeft", data.player);
        io.emit('disconnect', "client namespace disconnect");
        delete disconnectedPlayers[data.player]; // On supprime de noter liste des déco potentiels
        removePlayer(db, data.player, data.party);
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
