var abandon = function(io, socket, db) {
    socket.on('playerLeaving', (data) => { // data prend en argument l'idJ et l'idPartie
        // Ce code sera à fusionner avec celui de Pierre pour éviter deux "socket.on" identiques
        if(removePlayer(db, data.joueur, data.partie)) {
            io.to(data.partie).emit("otherPlayerLeft", data.joueur);
            io.to(data.partie).emit("chatAdmin", {message : "Un joueur s'est déconnecté !", partie : data.partie})
            console.log("l'information du départ du joueur", data.joueur, "a été envoyé à tous les joueurs de la partie", partie);
        } else {
            console.log("annulation du départ du joueur", data.joueur, "de la partie", partie);
        }
    })
    socket.on("playerDisconnect", (data) => {
        // data prend en argument l'idJ et l'idPartie
        setTimeout(function() { after30s(io, socket, db, data) }, 30000); // Pour faire attendre 30s le programme, obligé de changer de fonction
    })
}

function after30s(io, socket, db, data) {
    // Vérifier si le joueur s'est reconnecté
    db.query("SELECT * FROM joue WHERE idJ = ? AND idPartie = ?", [data.joueur, data.partie], async (err, results) => {
        if (err) {
            console.log("Erreur lors de la vérification de la reconnexion du joueur", data.joueur, "à la partie", data.partie);
            throw err;
        }
        if (results.length === 0) {
            console.log("Le joueur", data.joueur, "n'est pas revenu à la partie", data.partie);
            io.emit("abandonVolontaire", {joueur : data.joueur, partie : data.partie});
            // Tu peux effectuer d'autres actions ici en cas de non-reconnexion du joueur
        } else {
            console.log("Le joueur", data.joueur, "est revenu à la partie", data.partie);
        }
    });
}

function removePlayer(db, joueur, partie) {
    db.query("DELETE * FROM joue WHERE idJ = ? AND idPartie = ?", [joueur, partie], async(err, results) => {
        if(err){
            console.log(joueur, "a essayé de quitter la partie", partie, ", sans succès");
            return false;
        }
        console.log("la suppression du joueur", joueur, "dans la partie", partie, "s'est effectué")
        return true;
    })
}

module.exports = abandon;