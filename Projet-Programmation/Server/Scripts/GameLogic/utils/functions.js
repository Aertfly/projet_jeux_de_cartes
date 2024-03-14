const {createSens} = require('../startGame');
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
    db.query('SELECT jo.pseudo as pseudo, jo.idJ as idJ,p.centre,p.archive,j.main,j.score,p.tour,p.type,FLOOR(COALESCE(s.totalPoints/s.nombreParties, 0)) as scoreMoyenJoueur FROM parties p JOIN joue j ON p.idPartie = j.idPartie JOIN joueurs jo ON j.idJ = jo.idJ LEFT JOIN statistiques s ON j.idJ = s.idJ AND s.jeu = p.type WHERE p.idPartie = ?',[idPartie],async(err,result)=>{
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

        console.log("On envoie le centre qui vaut " + JSON.stringify(centre2));
        
        // On envoie les informations aux joueurs
        io.to(idPartie).emit('infoGameOut', {center: centre2, archive: JSON.parse(result[0]["archive"]), draw: 0, infoPlayers: infoJoueurs, nbTour: result[0]["tour"]});
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
 * @param {*} db connnection to the database
 * @returns the value of the field sens in the db;
 */
async function getSens(db){
    db.query("Select sens from parties where idPartie=?",[idParty],async(err,result)=>{
        if(err)throw err;
        if (result.length===0)return null;
        return JSON.parse(result[0]['sens']);
    });
}

/**
 * Retrieve the value of the idJ of the player who has to play
 * @param {*} db connnection to the database
 * @returns the idJ of the player who has to play
 */
async function currentPlayerTurn(db){
    const sens = getSens(db);
    await sens;
    return sens[0];
}

/**
 * Iterate to the next player in the db, Incremente turn if the turn is finished 
 * @param {*} io connection to the server React
 * @param {*} db connnection to the database
 * @param {String} idParty unique identifiant of the party
 * @param {Int} turn the number of turn 
 * @returns the value of turn
 */
async function nextPlayerTurn(io,db,idParty,turn){
    const sens = getSens(db);
    await sens;
    const nextIdPlayer = sens.splice(0,1);
    io.to(data.idParty).emit('newTurn',{joueurs:[nextIdPlayer]});//A modifier ? 
    if(sens.lenght===0){createSens(db,idParty);return turn++};
    return turn;
}


module.exports = {ajouterScores, recupererInfosJoueurs, envoyerInfos, envoyerCartesGagnees,currentPlayerTurn,nextPlayerTurn};