const startGame = function(io,socket,db){
    socket.on('start', data => {
        console.log("Tentative de lancement de la partie :", data.idParty, " par : ", data.idPlayer);
        db.query("SELECT idJ, type, sauvegarde, tour, proprietaire, joueursMin FROM joue j,parties p where j.idPartie = p.idPartie and p.idPartie = ?", data.idParty, async(err, rawResult) => {
            if (err) throw (err);
            console.log("Data Partie",rawResult);
            let msg = testPreCond(rawResult,data.idPlayer);
            if (msg)socket.emit('gameStart',{'message':msg});
            else {
                const IdPlayerList = rawResult.map(object => object.idJ);
                if (rawResult[0].sauvegarde) {
                    // Si la partie est sauvegardée
                    
                    db.query("UPDATE parties SET sauvegarde=0 WHERE idPartie = ?;", data.idParty, async(err, result) => {
                        if (err) throw (err);
                        (result.changedRows == 1) ? io.to(data.idParty).emit('gameStart',  {'idParty':data.idParty,'type':rawResult[0].type}): io.to(data.idParty).emit('gameStart', {'message':"Erreur serveur : n'a pas réussi à mettre à jour la valeur de sauvegarde"});
                        console.log("Tentative de lancement d'une partie sauvegardée",data.idParty);
                    });
                } else {
                    // Si la partie n'est pas sauvegardée
                    const nbPlayers = IdPlayerList.length;
                    var playerHands = null;
                    switch (rawResult[0].type) {
                        case "Bataille":
                            playerHands = dealCardsWar(nbPlayers);
                            break;
                        case "6 Qui Prend":
                            playerHands = dealCardsSQP(nbPlayers,db,data.idParty);
                            if(playerHands.length == 0){
                                io.to(data.idParty).emit('gameStart', {'message':"Problème lors de l'accès à la base de données"});
                                return;
                            }
                            break;
                        /* Exemple ajout autre jeu :
                        case "poker":
                            handPlayers = dealCardsPoker(nbPlayers);
                            break;*/    
                        default:
                            io.to(data.idParty).emit('gameStart', {'message':"Type inconnu"}); // Non testé plus haut, l'ajout d'une table type donnant toutes les informations sur les jeux pourra être implémenté ce qui rendra cette partie obsolète
                            return;
                    }
                    if (!(giveCardsDb(db, playerHands, IdPlayerList, nbPlayers, data.idParty))) {
                        io.to(data.idParty).emit('gameStart', {'message':"Problémes lors de la distributions des cartes"});
                    }
                    db.query("UPDATE parties SET tour=0 WHERE idPartie = ?;", data.idParty, async(err, result) => {
                        if (err) throw (err);
                        (result.changedRows == 1) ? io.to(data.idParty).emit('gameStart', {'idParty':data.idParty,'type':rawResult[0].type}): io.to(data.idParty).emit('gameStart', {'message':"La partie n'a pas put être lancée"});
                    });
                }
            }
        });
    }); 

    socket.on('requestCards',data =>{
        db.query("SELECT main from joue where idPartie = ? and idJ = ?; ",[data.idParty,data.idJ],async(err,result)=>{
            if (err)throw(err);
            if (result.length != 0){
                //console.log(result);
                //console.log(result[0].main);
                console.log("On envoie les cartes au joueur",data.idJ)
                socket.emit("dealingCards",{'Cards':JSON.parse(result[0].main)});
                db.query("SELECT idJ FROM joue WHERE idPartie=?", [data.idParty], async (err2, result2) => {
                    if (err2) throw err2;
                    let joueurs = [];
                    result2.forEach((idJoueur) => {
                        joueurs.push(idJoueur["idJ"]);
                    });
                    console.log("On emit sur newTurn avec " + JSON.stringify({ "numeroTour": 0, "joueurs": joueurs }));
                    socket.emit('newTurn', { "numeroTour": 0, "joueurs": joueurs });
                });
            }else{
                console.log("Erreur envoie cartes :",result,data.idParty,data.idJ)
            }
        });
    });
}



function testPreCond(rawResult,id){//vérifie la conformité des informations de la partie et renvoie le message d'erreur à transmettre
    if (rawResult.length===0)return "Erreur 404 : Partie non trouvé";
    if((rawResult[0].tour>=0)&&(!rawResult[0].sauvegarde))return "Partie déja en cours";
    let isNotInParty = true;
    var cpt =0;
    for(let i=0;i<rawResult.length;i++){
        if(rawResult[i]['idJ']==id){
            isNotInParty = false;
            if(!(rawResult[i]['proprietaire']))return "Vous n'êtes pas proprietaire";//le champ proprietaire vaut 1 si il est proprietaire de la partie donc true sinon 0 donc false
        }
        cpt++;
    }
    console.log(cpt);
    if(cpt<rawResult[0].joueursMin)return"Attendez ! Il n'y pas encore assez de joueurs"
    if (isNotInParty)return  "le joueur qui a essayé de lancer n'est pas dans la partie"
    return null;
}

const createSens = async function(db,idParty){
    db.query('Select idj from joue jo,joueur j,parties p where j.idJ=jo.idj and jo.idPartie=j.idPartie and p.idPartie=?',[idParty],async(err,result)=>{
        if (err)throw(err);
        const IdPlayerList = result.map(object => object.idJ);
        IdPlayerList = FYK(IdPlayerList);
        db.query('Update parties SET sens=? where idPartie=?',[IdPlayerList,idParty],async(err,result)=>{
        if (err)throw(err);
        console.log((result.changedRows == 1) ? "Update sens réussi !":"Update sens raté :(");
        });
    });
}

function giveCardsDb(db,playerHands,IdPlayerList,nbPlayers,idParty){
    for (let i=0;i<nbPlayers;i++){
        var hand = JSON.stringify(playerHands[i]);
        var idJ = IdPlayerList[i];
        db.query("UPDATE joue SET main =?  WHERE idJ=? ANd idPartie=? ",[hand, idJ,idParty],async(err,result)=>{
            if(err)throw(err);
            if (!(result.changedRows ==1)) {
                console.log("Update main joueur raté",idJ,hand);
                return false;
            }
        });
    }
    console.log("Mains correctement transmises à la BDD");
    return true;
}
//algorithme Fisher-Yates, également appelé mélange de Knuth
function FYK(list){
    len = list.length;
    for (let j=len-1;j>0;j--){
        const i = Math.floor(Math.random() * (len-1));
        [list[j],list[i]]=[list[i],list[j]];
    }
    return list;
}


function generateDraw(familyList,nbCards){
    var len = familyList.length;
    //console.log(len,familyList,nbCards);
    res = [];
    for (let i=0 ; i<len;i++){
        for(j=1 ; j<=nbCards; j++){
            res.push({
                "enseigne" : familyList[i],
                "valeur" : j
            });
        }
    }
    return FYK(res);
}



function generateDrawSQP(){
    var len = 104;
    var nbBoeufs = 0;   
    res = [];
    for (let i=1 ;i<=len;i++){
        const lastNumber = i%10;
        if(lastNumber === 5) nbBoeufs +=2;
        if(lastNumber === 0) nbBoeufs += 3;
        if(i%11 === 0)  nbBoeufs += 5;
        if(nbBoeufs === 0) nbBoeufs = 1;
        res.push({
            "valeur" : i,
            "nbBoeufs" : nbBoeufs
        });
        nbBoeufs = 0;
    }
    return FYK(res);
}


function dealCardsSQP(nbPlayers,db,idParty){
    const draw = generateDrawSQP();
    const playerHands = []; 
    for(let i=0;i<nbPlayers;i++){
        const li = [];
        playerHands.push(li);
    }
    const len = nbPlayers*10;
    if (len > 100)return;//normalement le nombre de joueur max est 10 mais on vérifie
    for(let i=0;i<len;i++){
        var index = i % nbPlayers;
        (playerHands[index]).push(draw[i]);
    }
    // Ajout d'une fonction de comparaison pour trier les cartes selon leur valeur
    function compareCards(a, b) {
        return a.valeur - b.valeur;
    }
    // Tri de chaque main de joueur avec la fonction de comparaison
    for(let i=0;i<nbPlayers;i++){
        playerHands[i].sort(compareCards);
    }
    const archives = [];
    for(let c=1;c<=4;c++){archives.push([draw[104-c]])}
    archives.sort((a, b) => a[0].valeur - b[0].valeur);
    // console.log("Archives",archives);
    db.query("Update parties set archive = ? where idPartie = ? ",[JSON.stringify(archives),idParty],async(err,result)=>{
        if(err)throw(err);
        if (!(result.changedRows ==1)) {
            console.log("Update archive raté",archives,idParty);
            return null;
        }
    });
    return playerHands;
}


function reDealCardsSQP(io, nbPlayers,db,idParty,IdPlayerList){
    const playerHands = dealCardsSQP(nbPlayers,db,idParty);
    if (!(giveCardsDb(db, playerHands, IdPlayerList, nbPlayers, idParty))) {
        io.to(idParty).emit('gameStart', {'message':"Problémes lors de la distributions des cartes"});
    }else{
        io.to(idParty).emit('gameStart', {});
    };
}

function dealCardsWar(nbPlayers){
    const draw = generateDraw(["pique","carreau","trefle","coeur"],13);
    const playerHands = []; // Array(nbPlayers).fill([]) fait pointer chaque case vers la même liste vide
    for(let i=0;i<nbPlayers;i++){
        const li = [];
        playerHands.push(li);
    }//On a généré une liste de liste vide avec chaque liste vide correspondante à la main d'un joueur
    const len = draw.length;//éviter de calculer la longueur à chaque itération
    for(let i=0;i<len;i++){
        var index = i % nbPlayers;
        (playerHands[index]).push(draw[i]);
    }
    return playerHands;
}

module.exports = {startGame,reDealCardsSQP,createSens};

/*Si vous voulez tester la distribution aléatoire de l'algorithme
exemple sur 100 millions : {
  [3,4,5]: 16666418,
  [3,5,4]: 16665702,
  [4,3,5]: 16667400,
  [4,5,3]: 16671831,
  [5,3,4]: 16665582,
  [5,4,3]: 16663068
}
PS : 1 000 000 000 c'est un peu trop

dico = {
"[3,4,5]" : 0,
"[3,5,4]" : 0,
"[5,4,3]" : 0,
"[5,3,4]" : 0,
"[4,3,5]" : 0,
"[4,5,3]" : 0
};
liste = [3,4,5];

for (i=0;i<=1000000000;i++){
var res = FYK(liste);
var test =JSON.stringify(liste)
dico[test] ++;
}
console.log(dico);*/ 


