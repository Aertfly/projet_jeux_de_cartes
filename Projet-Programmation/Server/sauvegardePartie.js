var sauvegardePartie = function(io, socket, db) {
    socket.on('saveParty', (data) => { // data doit contenir l'idPartie
        console.log("La partie", data.partie, "demande à être mise en pause");
        db.query("UPDATE parties SET sauvegarde = 1 WHERE idPartie = ?", [data.partie], async(err, results) => {
            if(err){
                console.log("erreur lors du changement de la variable sauvegarde : existe-t-elle ?");
                throw err;
            }
            if(results.affectedRows == 1){ // Si le changement à true a bien réussi
                console.log("sauvegarde effectué");
                io.in(data.partie).emit('savePartyResult', true); //renvoie à tous les joueurs côté client de la partie pour leur faire afficher un bouton, pour revenir au hub du site
            }
        })
    })
}

module.exports = sauvegardePartie;