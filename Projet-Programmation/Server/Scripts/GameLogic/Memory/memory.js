const { ajouterScores, recupererInfosJoueurs, envoyerInfos, currentPlayerTurn, nextPlayerTurn } = require("../utils/functions.js");

/**
* Quand on reçoit une action de la part d'un joueur, et qu'on est dans une partie de Memory
* @param {Server} io La connexion avec les clients
* @param {mysql.Connection} db La connexion à la base de données 
*/

const playerActionMemory = function(io, db, data, donneesDB){    
    
    if(err)throw(err);
    centre = JSON.parse(donneesDB[0]['centre']);
    archive = JSON.parse(donneesDB[0]['archive']);
    pioche = JSON.parse(donneesDB[0]['pioche']);
    if(centre[data.idPlayer].lenght == 0){ // si le joueur joue sa première carte
        archive = await (resetArchive(archive, db)); // on remet à -1 les anciens coups joués par l'ancien joueur
        //infoGameOut archive
        if (archive[data.carte] == 0) {
            console.log("Le joueur n'est pas censé choisir une paire déjà trouvée !");
        } else if (archive[data.carte] == -1){
            centre[data.idPlayer].push(data.carte); // on initialise l'index de la première carte jouée dans centre
            archive[data.carte] = pioche[data.carte]; 
            await (updateCentre(centre, data, db)); // on le met dans la db
            await (updateArchive(archive, data, db)); // pareil
            // infoGameOut, archive, tour
            // newTurn, current player turn 
        }
    } else if (centre[data.idPlayer].lenght == 1){
        ancienneCarte = centre[data.idPlayer][0];
        if (archive[data.carte] >= 0){
            console.log("Le joueur n'est pas censé choisir une paire déjà trouvée où celle qu'il à choisit juste avant!");
        } else if (archive[data.carte] == -1){
            if (pioche[data.carte] == pioche[ancienneCarte]){ // si le joueur trouve une paire 
                archive[data.carte] = pioche[data.carte];
                archive[ancienneCarte] = pioche[ancienneCarte]; // on setup l'archive à envoyer
                centre[data.idPlayer].push(data.carte); // deuxième carte 
                // mettre dans 'gagnees' les cartes gagnees par le joueur;
                
                // infoGameOut archive, centre[data.idPlayer], tour, gagnees,  envoyerInfos

                if(checkEndMemory(archive)) { // 1 => si archive n'a plus de cartes à -1, la game est finie, emit fin de game 
                    io.emit('endGameMemory'); // faire une fonction qui récupère les infos globales de la partie et les envoies

                } else {  // 2 => newTurn, next player turn
                    nextPlayerTurn(io, db, data.idPartie, 30000); // millisecondes = 30 sec
                    centre[data.idPlayer] = [];
                    await (updateCentre(centre, data, db)); // le joueur à fini de jouer ses deux cartes, on remet le centre à vide
                };
                
            } else { // si le joueur ne trouve pas de paire 
                archive[data.carte] = pioche[data.carte];
                archive[ancienneCarte] = pioche[ancienneCarte]; // on setup l'archive à envoyer
                // infoGameOut archive, centre[data.idPlayer], tour
                nextPlayerTurn(io, db, data.idPartie, 30000); // millisecondes = 30 sec
                centre[data.idPlayer] = [];
                await (updateCentre(centre, data, db)); // le joueur à fini de jouer ses deux cartes, on remet le centre à vide
            };
        };
    };
};

function resetArchive(archive, db) {
    return new Promise((resolve,reject)=>{
        for (let i = 0; i < archive.length; i++) {
            if (archive[i] > 0) {
                archive[i] = -1;
            };
        };
        db.query("UPDATE parties SET archive = ? where idPartie = ?",[archive, data.idPartie],async(err,result)=>{
            if(err)reject(err);
            console.log((result.changedRows === 1) ? 'Paramètres enregistrés dans la db':"Erreur paramètres invalides");
            resolve(result.changedRows === 1);
        });
    });
};

function updateCentre(centre, data, db){
    return new Promise((resolve,reject)=>{
        db.query("UPDATE parties SET centre = ? where idPartie = ?",[centre, data.idPartie],async(err,result)=>{
            if(err)reject(err)
            console.log((result.changedRows === 1) ? 'Paramètres enregistrés dans la db':"Erreur paramètres invalides");
            resolve(result.changedRows === 1);
        });
    });
};

function updateArchive(archive, data, db){ 
    return new Promise((resolve,reject)=>{
        db.query("UPDATE parties SET archive = ? where idPartie = ?",[archive, data.idPartie],async(err,result)=>{
            if(err)reject(err)
            console.log((result.changedRows === 1) ? 'Paramètres enregistrés dans la db':"Erreur paramètres invalides");
            resolve(result.changedRows === 1);
        });
    });
};

function checkEndMemory(archive){ // check si l'archive n'a plus de carte face cachée, si c'est le cas, toutes les paires ont été trouvées
    for (let i=0;i<=archive.lenght;i++){
        if(archive[i] == -1){
            return false;
        };
    };
    return true;
};
module.exports = {playerActionMemory};
