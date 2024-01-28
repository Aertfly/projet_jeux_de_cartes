const scores = function(io, socket, db) {
    socket.on('newScore', (data) => { // data doit contenir l'idJ, son username, son nouveau score, et son idPartie
        console.log("test");
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

function scoreMoyenJoueur(io,db,idParty){
    return new Promise((resolve, reject) => {
        const query = "SELECT statistiques.nombreParties, statistiques.totalPoints FROM statistiques,joue,parties WHERE statistiques.idJ = joue.idJ and joue.idPartie = parties.idPartie and parties.idPartie = ?" ;
        
        db.query(query, [idParty], (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'exécution de la requête :', error);
                reject(error);
            } else {
                let res = []
                for (let i=0; i<res.length; i++){
                    res.push(results[i].nombreParties/results[i].nombreParties)
                }
                resolve(res);
            }
        });
    });
}

module.exports = { scores, scoreMoyenJoueur};
