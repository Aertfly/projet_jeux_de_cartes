var chatPartie = function(io, socket, db) {
    socket.on('chat', (data) => { // data doit contenir le pseudonyme (pas son idJoueur), son message et l'idPartie
        console.log("le joueur", data.joueur, "veut envoyer ce message :", data.message);
        db.query("SELECT idPartie FROM joue, joueur WHERE joue.idJ = joueur.idJ AND idJ = ? AND idPartie = ?", [data.joueur, data.party], async(err, result) => {
            if(err){
                throw err;
            }
            if(!result){ // Le joueur est dans aucune partie
                console.log("Le joueur veut envoyer un message sans être dans une partie");
            } else {
                console.log("le joueur est bien présent dans la partie :", data.party);
                io.in(data.party).emit('newMessage', { joueur : data.joueur, message : data.message });
                console.log("le message va être envoyé dans la partie", data.party);
            }
        })
    })
}

module.exports = chatPartie;