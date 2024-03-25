
/**
 * Récupère le pseudo des joueur dans la BDD à partir d'une liste d'idJoueur
 * @param {*} db 
 * @param {*} idList liste d'idJoueur
 * @returns Promesse de renvoyer la liste des  pseudo des joueurs
 */
function recupererPseudos(db,idList){
    return new Promise((resolve,reject)=>{
        const idString = idList.join(',');
        db.query(`SELECT pseudo FROM joueurs WHERE idj IN (${idString})`,[],(err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result.map(row => row.pseudo));
        });
    });
}

/**
 * Récupère le pseudo d'un joueur dans la BDD à partir de son idJoueur
 * @param {*} db 
 * @param {*} idJoueur 
 * @returns Promesse de renvoyer le pseudo du joueur
 */
function recupererPseudo(db, idJoueur) {
    return new Promise((resolve, reject) => {
        db.query("SELECT pseudo FROM joueurs WHERE idJ=?", [idJoueur], async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result[0]["pseudo"]);
        });
    });
};


/**
 * Ajoute les scores des joueurs d'une partie aux statistiques dans la base de données
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {Number} idPartie L'ID de la partie
 * @returns Promesse d'envoyer une résolution vide quand les scores auront été ajoutés
 */
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

/**
 * Renvoie les infos de la partie
 * @param {mysql.Connection} db La connexion à la base de données 
 * @param {Number} idParty L'ID de la partie
 * @returns Promesse de renvoyer les infos des joueurs (liste composée de dictionnaires {nbCards, pseudo, score})
 */
function recupererInfosJoueurs(db, idParty){
    return new Promise((resolve, reject) => {
        db.query('SELECT pseudo,centre,archive,pioche,main,score,tour from parties p,joue j,joueurs jo where p.idPartie=j.idPartie and j.idJ=jo.idJ and p.idPartie =?',[idParty],async(err,result)=>{
            if(err)reject(err);
            const infosJoueurs=[];
            for(i=0;i<result.length;i++){
                infosJoueurs.push({
                    "nbCards":JSON.parse(result[i].main).length,
                    "pseudo":result[i].pseudo,
                    "score":result[i].score,
                })
            }
            resolve(infosJoueurs);
        });
    });
};

/**
 * Envoie les informations d'une partie à ses joueurs
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {Server} io Le serveur pour communiquer avec les clients
 * @param {Number} idPartie L'ID de la partie 
 */
const envoyerInfos = function(db, io, idPartie){
    // On récupère les infos utiles sur la BDD
    db.query('SELECT jo.pseudo as pseudo, jo.idJ as idJ,p.centre,p.archive,j.main,j.score,p.tour,p.type,FLOOR(COALESCE(s.totalPoints/s.nombreParties, 0)) as scoreMoyenJoueur,p.pioche FROM parties p JOIN joue j ON p.idPartie = j.idPartie JOIN joueurs jo ON j.idJ = jo.idJ LEFT JOIN statistiques s ON j.idJ = s.idJ AND s.jeu = p.type WHERE p.idPartie = ?',[idPartie],async(err,result)=>{
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

        let centre2 = JSON.parse(result[0]["centre"]);
        for(ligne of result){
            centre2[ligne["pseudo"]] = centre2[ligne["idJ"]];
            delete centre2[ligne["idJ"]];
        }
        const draw = JSON.parse(result[0]["pioche"]);
        let nbdraw = draw['pioche']? {'pioche':draw['pioche'].length,'defausse':draw['defausse'].length}: draw.length;
        // On envoie les informations aux joueurs
        io.to(idPartie).emit('infoGameOut', {center: centre2, archive: JSON.parse(result[0]["archive"]), draw: nbdraw, infoPlayers: infoJoueurs, nbTour: result[0]["tour"]});
    });
}

const envoyerCartesGagnees = function(db, socket, data){
    db.query("SELECT gagnees from joue where idPartie = ? and idJ = ?; ",[data.idParty,data.idJ],async(err,result)=>{
        if (err)throw(err);
        if (result.length != 0){
            //console.log(result);
            //console.log(result[0].main);
            console.log("On envoie les cartes gagnées au joueur ",data.idJ)
            socket.emit("dealingWonCards",{'Cards':JSON.parse(result[0].gagnees)});
        }else{
            console.log("Erreur d'envoi des cartes gagnées : ",result,data.idParty,data.idJ)
        }
    });
}

/**
 * Calcule l'ensemble des joueurs qui peuvent jouer dans une partie.
 * Fait l'union des joueurs qui ont une carte au centre et des joueurs qui ont une main non vide
 * @param {mysql.Connection} db La connexion à la base de données
 * @param {Number} idPartie L'ID de la partie
 * @returns {Promise} Promesse de renvoyer la liste des joueurs qui peuvent jouer dans la partie
 */
async function joueursPossibles(db, idPartie){
    return new Promise((resolve) => {
        // le nombre de joueurs qui peuvent jouer correspond au nombre de joueurs qui n'ont pas une main égale à [] UNION ceux qui ont déjà une carte au centre
        db.query("SELECT jo.idJ, p.centre from joue jo,parties p where jo.idPartie = p.idPartie AND p.idPartie=? AND jo.main!= '[]';", [idPartie, idPartie], async (err3, result3) => {
            if (err3) throw err3;
            // On fait la liste des joueurs qui ont une main non vide
            let joueursPossibles = [];
            for (let index = 0; index < result3.length; index++) {
                joueursPossibles.push("" + result3[index]["idJ"]);
            }
            let joueursPossibles2 = Object.keys(JSON.parse(result3[0]["centre"]));
            // On fait l'union des deux listes, pour avoir l'ensemble des joueurs qui peuvent jouer (main non vide et/ou carte au centre)
            let unionJoueursPossibles = new Set([...joueursPossibles, ...joueursPossibles2]);
            unionJoueursPossibles = [...unionJoueursPossibles];
            resolve(unionJoueursPossibles);
        });
    });   
}



/**
 * Retrieve the value of the idJ of the player who has to play
 * @param {*} db connnection to the database
 * @param {string} idParty unique id of a party
 * @returns the idJ of the player who has to play
 */
async function currentPlayerTurn(db,idParty){
    return new Promise((resolve, reject) => {
        db.query("Select sens from parties where idPartie=?",[idParty],async(err,result)=>{
            if(err)reject(err);
            if (result.length===0)resolve(null);
            resolve(JSON.parse(result[0]['sens'])[0]);
        });
    })
}
/**
 * Tell the next player that he have to play, Incremente turn if the turn is finished 
 * @param {*} io connection to the server React
 * @param {*} db connnection to the database
 * @param {String} idParty unique identifiant of the party
 * @param {int} timeOut time to wait before sending the new turn
 * @returns true once it's done
 */
function nextPlayerTurn(io,db,idParty,timeOut=0){
    return new Promise((resolve,reject)=>{
        db.query("Select sens,tour from parties where idPartie=?",[idParty],async(err,result)=>{
            if(err)throw err;
            const playerOrder = JSON.parse(result[0]['sens']);
            let turn = result[0]['tour'];
            playerOrder.push(playerOrder.splice(0,1)[0]);
            turn++;
            db.query('Update parties SET sens=?,tour=? where idPartie=?',[JSON.stringify(playerOrder),turn,idParty],async(err,result)=>{
                if (err)reject(err);
                setTimeout(async()=>{
                    io.to(idParty).emit('newTurn',{joueurs:[playerOrder[0]],numeroTour:Math.floor(turn/playerOrder.length),pseudos:await recupererPseudo(db,playerOrder[0])});
                    resolve(result.changedRow === 3);
                },timeOut)
            });
        });
    });
}



module.exports = {ajouterScores, recupererInfosJoueurs,joueursPossibles, envoyerInfos, envoyerCartesGagnees,currentPlayerTurn,nextPlayerTurn,recupererPseudos,recupererPseudo};