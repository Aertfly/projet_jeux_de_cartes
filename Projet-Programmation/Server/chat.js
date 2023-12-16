var chatPartie = function(io, socket, db) {
    socket.on('chat', (data) => { // data doit contenir le pseudonyme (pas son idJoueur), son message et l'idPartie
        console.log("le joueur", data.username, "veut envoyer ce message :", data.message);
        console.log("ce joueur est bien présent dans la partie :", data.party);
        io.in(data.party).emit('newMessage', { username : data.username, message : data.message });
        console.log("le message va être envoyé dans la partie", data.party);
            
    })
}

module.exports = chatPartie;