const { ajouterScores, recupererInfosJoueurs, envoyerInfos, currentPlayerTurn, nextPlayerTurn } = require("../utils/functions.js");

/**
* Quand on reçoit une action de la part d'un joueur, et qu'on est dans une partie de Memory
* @param {Server} io La connexion avec les clients
* @param {mysql.Connection} db La connexion à la base de données 
*/

const playerActionMemory = async function(io, db, data, donneesDB){    
    console.log("PlayerAction Memory Proc");
    centre = JSON.parse(donneesDB[0]['centre']);
    archive = JSON.parse(donneesDB[0]['archive']);
    pioche = JSON.parse(donneesDB[0]['pioche']);
    currentSens = JSON.parse(donneesDB[0]['sens']);
    currentTour = JSON.parse(donneesDB[0]['tour']);

    if(centre[data.playerId] !== null && centre[data.playerId].length === 0){ // si le joueur joue sa première carte
        console.log("le joueur joue sa première carte");
        archive = await (resetArchive(archive, data, db)); // on remet à -1 les anciens coups joués par l'ancien joueur
        io.to(data.idPartie).emit('infoGameOut', {archive: archive, numeroTour:Math.floor(currentTour/currentSens.length)});//infoGameOut archive
        if (archive[data.carte] == 0) {
            console.log("Le joueur n'est pas censé choisir une paire déjà trouvée !");
        } else if (archive[data.carte] == -1){
            console.log("Première carte jouée par " + data.playerId);
            centre[data.playerId].push(data.carte); // on initialise l'index de la première carte jouée dans centre
            archive[data.carte] = pioche[data.carte]; 
            await (updateCentre(centre, data, db)); // on le met dans la db
            await (updateArchive(archive, data, db)); // pareil
            
            io.to(data.idPartie).emit('infoGameOut', {center: centre, archive: archive, numeroTour:Math.floor(currentTour/currentSens.length)}); // infoGameOut, archive, tour
            io.to(data.idPartie).emit('newTurn',{joueurs:[data.playerId],numeroTour:Math.floor(currentTour/currentSens.length)});
            console.log("Le joueur doit jouer à nouveau");
        };
    } else if (centre[data.playerId] !== null && centre[data.playerId].length === 1){
        console.log("le joueur joue sa deuxième carte");
        ancienneCarte = centre[data.playerId][0];
        if (archive[data.carte] >= 0){
            console.log("Le joueur n'est pas censé choisir une paire déjà trouvée où celle qu'il à choisit juste avant!");
        } else if (archive[data.carte] == -1){
            console.log("Deuxième carte jouée par " + data.playerId);
            if (pioche[data.carte] == pioche[ancienneCarte]){ // si le joueur trouve une paire 
                console.log("Paire trouvée par " + data.playerId);
                archive[data.carte] = pioche[data.carte];
                centre[data.playerId].push(data.carte); // deuxième carte 

                winnedCards = [pioche[data.carte],pioche[ancienneCarte]];
                await (updateWinnedCards(data, winnedCards, db)); // mettre dans 'gagnees' les cartes gagnees par le joueur;

                io.to(data.idPartie).emit('infoGameOut', {center: centre, archive: archive, numeroTour:Math.floor(currentTour/currentSens.length)});

                if(await (checkEndMemory(archive))) { // 1 => si archive n'a plus de cartes à -1, la game est finie, emit fin de game 
                    io.emit('endGameMemory'); // faire une fonction qui récupère les infos globales de la partie et les envoies
                    console.log("Partie finie!");
                } else {  // 2 => newTurn, next player turn
                    
                    centre[data.playerId] = [];
                    await (updateCentre(centre, data, db)); // le joueur à fini de jouer ses deux cartes, on remet le centre à vide
                    nextPlayerTurn(io, db, data.idPartie); 
                };
                
            } else { // si le joueur ne trouve pas de paire 
                console.log("Pas de paire trouvée");
                archive[data.carte] = pioche[data.carte];
                archive[ancienneCarte] = pioche[ancienneCarte]; // on setup l'archive à envoyer

                io.to(data.idPartie).emit('infoGameOut', {center: centre, archive: archive, numeroTour:Math.floor(currentTour/currentSens.length)});
                
                nextPlayerTurn(io, db, data.idPartie); 
                centre[data.playerId] = [];
                await (updateCentre(centre, data, db)); // le joueur à fini de jouer ses deux cartes, on remet le centre à vide
                console.log("Au prochain joueur de jouer !")
            };
        };
    };
};

function updateWinnedCards(data, winnedCards, db){
    return new Promise((resolve,reject)=>{

        db.query("SELECT * FROM joue WHERE idPartie = ?", [data.idPartie],(err,donneesDB) => {
            if(err)throw(err);
            winnedCardsDB = [JSON.parse(donneesDB[0]['gagnees']), winnedCards];
            io.to(data.playerId).emit('infoGameOut', {gagnees: winnedCardsDB});
            currentScore = JSON.parse(donneesDB[0]['score']) + 2;

            db.query("UPDATE joue SET gagnees = ?, score = ? where idPartie = ?",[JSON.stringify(winnedCardsDB), JSON.stringify(currentScore), data.idPartie],async(err,result)=>{
                if(err)reject(err);
                console.log((result.changedRows === 1) ? 'Paramètres enregistrés dans la db':"Erreur paramètres invalides");
                resolve(result.changedRows === 1);
            });
        });

    });
};

function resetArchive(archive, data, db) {
    return new Promise((resolve,reject)=>{
        for (let i = 0; i < archive.length; i++) {
            if (archive[i] > 0) {
                archive[i] = -1;
            };
        };
        db.query("UPDATE parties SET archive = ? where idPartie = ?",[JSON.stringify(archive), data.idPartie],async(err,result)=>{
            if(err)reject(err);
            console.log((result.changedRows === 1) ? 'Paramètres enregistrés dans la db':"Erreur paramètres invalides");
            resolve(archive);
        });
    });
};

function updateCentre(centre, data, db){
    return new Promise((resolve,reject)=>{
        db.query("UPDATE parties SET centre = ? where idPartie = ?",[JSON.stringify(centre), data.idPartie],async(err,result)=>{
            if(err)reject(err)
            console.log((result.changedRows === 1) ? 'Paramètres enregistrés dans la db':"Erreur paramètres invalides");
            resolve(result.changedRows === 1);
        });
    });
};

function updateArchive(archive, data, db){ 
    return new Promise((resolve,reject)=>{
        db.query("UPDATE parties SET archive = ? where idPartie = ?",[JSON.stringify(archive), data.idPartie],async(err,result)=>{
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
