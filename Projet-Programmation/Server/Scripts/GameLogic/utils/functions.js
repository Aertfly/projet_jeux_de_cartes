function ajouterScores(db, idPartie){
    return new Promise((resolve, reject) => {
        // On ajoute les joueurs à 0
        db.query("INSERT IGNORE INTO statistiques (idJ, jeu, totalPoints, nombreParties) SELECT j.idJ, p.type, 0, 0 FROM joue j CROSS JOIN parties p WHERE p.idPartie=?;", [idPartie], (err, result) => { if(err) throw err; 
            // On ajoute 1 partie jouée
            db.query("UPDATE statistiques s, joue j, parties p SET s.nombreParties = s.nombreParties + 1 WHERE s.idJ=j.idJ AND j.idPartie=? AND s.jeu = p.type;", [idPartie], (err2, result2) => { if(err2) throw err2; 
                // On ajoute les scores aux totaux
                db.query("UPDATE statistiques s, joue j, parties p SET s.totalPoints = s.totalPoints + j.score WHERE s.idJ=j.idJ AND j.idPartie=? AND s.jeu = p.type;", [idPartie], (err3, result3) => { 
                    if(err3) throw err3; 
                    console.log("On a défini les statistiques, on résout");
                    resolve();
                });
            });
        });        
    });
}

function infoPartie(db, idParty){
    return new Promise((resolve, reject) => {
        db.query('SELECT pseudo,centre,archive,pioche,main,score,tour from parties p,joue j,joueurs jo where p.idPartie=j.idPartie and j.idJ=jo.idJ and p.idPartie =?',[idParty],async(err,result)=>{
            if(err)reject(err);
            const infoPlayers=[];
            for(i=0;i<result.length;i++){
                infoPlayers.push({
                    "nbCards":JSON.parse(result[i].main).length,
                    "pseudo":result[i].pseudo,
                    "score":result[i].score,
                })
            }
            resolve(infoPlayers);
        });
    });
};

/**
 * Envoie les informations d'une partie à ses joueurs
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {Server} io Le serveur pour communiquer avec les clients
 * @param {Number} idPartie L'ID de la partie 
 */
var envoyerInfos = function(db, io, idPartie){
    // On récupère les infos utiles sur la BDD
    db.query('SELECT pseudo, centre, archive, main, score, tour, type, FLOOR(s.totalPoints/s.nombreParties) as scoreMoyenJoueur from parties p,joue j,joueurs jo, statistiques s where p.idPartie=j.idPartie and j.idJ=jo.idJ and p.idPartie =? AND j.idJ=s.idJ AND s.jeu = p.type',[idPartie],async(err,result)=>{
        if(err)reject(err);
        const infoJoueurs=[];
        for(i=0;i<result.length;i++){
            infoJoueurs.push({
                "nbCards":JSON.parse(result[i].main).length,
                "pseudo":result[i].pseudo,
                "score":result[i].score,
                "scoreMoyenJoueur":result[i].scoreMoyenJoueur
            })
        }
        
        // On envoie les informations aux joueurs
        io.to(idPartie).emit('infoGameOut', {center: JSON.parse(result[0]["centre"]), archive: JSON.parse(result[0]["archive"]), draw: 0, infoPlayers: infoJoueurs, nbTour: result[0]["tour"]});
    });
}

module.exports = {ajouterScores, infoPartie, envoyerInfos};