const { isActiveConnection } = require('./activeConnections');

var abandon = function(io, socket, db) {
    socket.on('playerLeaving', (data) => { // data prend en argument l'idJ et l'idPartie
        // Ce code sera à fusionner avec celui de Pierre pour éviter deux "socket.on" identiques
        if(removePlayer(db, data.player, data.party)) {
            io.to(data.party).emit("otherPlayerLeft", data.player);
            console.log("l'information du départ du joueur", data.player, "a été envoyé à tous les joueurs de la partie", party);
        } else {
            console.log("annulation du départ du joueur", data.player, "de la partie", party);
        }
    })
    socket.on("playerDisconnect", (data) => {
        // data prend en argument l'idJ et l'idPartie
        setTimeout(function() { after30s(io, socket, db, data) }, 30000); // Pour faire attendre 30s le programme, obligé de changer de fonction
    })
}

function after30s(io, socket, db, data) {
    // Vérifier si le joueur s'est reconnecté
    if (isActiveConnection(data.player)) {
        console.log("Le joueur", data.player, "est revenu à la partie", data.party);
    } else {
        console.log("Le joueur", data.player, "n'est pas revenu à la partie", data.party);
        io.to(data.party).emit("otherPlayerLeft", data.player);
        removePlayer(db, data.player, data.party);
    }
    
}

function removePlayer(db, player, party) {
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