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

var envoyerInfos = function(db, io, idPartie, centre, infoJoueurs, nbTour){
    let centre2 = Object.assign({},centre);
    let infoJoueurs2 = JSON.parse(JSON.stringify(infoJoueurs));

    db.query("SELECT archive FROM parties WHERE idPartie=?", [idPartie], (err0, result0) => {
        db.query("SELECT pseudo, joue.idJ FROM joueurs, joue, parties WHERE joue.idPartie = parties.idPartie AND joue.idJ = joueurs.idJ AND parties.idPartie = ?;", [idPartie], (err, result) => {
            if(err) throw err;
            
            for(ligne of result){
                centre2[ligne["pseudo"]] = centre2[ligne["idJ"]];
                delete centre2[ligne["idJ"]];
            }
            
            // On récupère les scores des joueurs
            db.query("SELECT j1.pseudo as pseudo, s.totalPoints/s.nombreParties as scoreMoyenJoueur FROM joueurs j1, statistiques s, joue j WHERE j.idJ=s.idJ AND j.idPartie=? AND s.jeu = '6 Qui Prend' AND j.idJ=j1.idJ", [idPartie], (err2, result2) => {
                if(err2) throw err2;
    
                console.log("Le résultat SQL vaut " + JSON.stringify(result2));
                // On crée un objet resultat = {pseudoJoueur: scoreMoyen}
                let resultat = {};
                for(let ligne of Object.keys(result2)){
                    console.log("joueur : " + result2[ligne]["pseudo"] + " score : " + result2[ligne]["scoreMoyenJoueur"]);
                    resultat[result2[ligne]["pseudo"]] = parseInt(result2[ligne]["scoreMoyenJoueur"]);
                }

                console.log("infoJoueurs2 vaut " + JSON.stringify(infoJoueurs2));

                // On ajoute le score moyen du joueur dans infoJoueurs2
                for(let i = 0; i < infoJoueurs2.length; i++){
                    console.log("On veut accéder à l'élément " + infoJoueurs2[i]["pseudo"] + " qui vaut " + resultat[infoJoueurs2[i]["pseudo"]]);
                    infoJoueurs2[i]["scoreMoyenJoueur"] = resultat[infoJoueurs2[i]["pseudo"]];
                }

                io.to(idPartie).emit('infoGameOut', {center: centre2, archive: JSON.parse(result0[0]["archive"]), draw: 0, infoPlayers: infoJoueurs2, nbTour});
            })
        });
    });
}

module.exports = {ajouterScores, infoPartie, envoyerInfos};