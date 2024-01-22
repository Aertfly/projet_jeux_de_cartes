const scores = function(io, socket, db) {
    socket.on('newScore', (data) => { // data doit contenir l'idJ, son username, son nouveau score, et son idPartie
        console.log("le joueur", data.player, "a augmenté son score, qui est désormais à", data.score, "(dans la partie", data.party, ").");
        db.query('UPDATE joue SET score = ? WHERE idJ = ? AND idPartie = ?', [data.score, data.player, data.party], async(err, result) => {
            if(err){
                console.log("la modification du score a échoué pour le joueur", data.player, "dans la partie", data.party);
                throw err;
            }
            console.log("réussi !")
            io.to(data.party).emit('updateScores', {player : data.player, username : data.username, newScore : data.score, party : data.party});
            
        })
    })
}

module.exports = scores;