/*Exemple liste cartes :[{"enseigne":"Pique","valeur":10},{"enseigne":"Carreau","valeur":6}]*/

const startGame = function(io,socket,db){
    socket.on('start', data => {
        console.log("Partie ",data.idParty,"lancée par : ",data.idPlayer,);
        db.query("SELECT GROUP_CONCAT(idJ) AS idJ, type, sauvegarde, tour,proprietaire FROM joue j,parties p where j.idPartie = p.idPartie and p.idPartie = ? GROUP BY type; ",data.idParty, async(err,rawResult)=>{ 
            // Pour chercher uniquement les idJ "SELECT idJ FROM joue j where idPartie = ? and Main = '[]';"
            if (err)throw(err);
            if (rawResult.length===0)console.log("Aucun joueur dans la partie");
            else {
                IdPlayerList = rawResult[0].idJ.split(',').map(Number);//rawResult[0].idJ == "idJ1,idJ2,...,idJk" string contenant tous les idJ associés à cette partie, rawResult est une liste d'un élement car l'idPartie est unique
                if(!(IdPlayerList.includes(data.idPlayer)))console.log("Le joueur qui a essayé de lancé n'est pas dans la partie");
                else{
                    if(rawResult[0].tour>=0)console.log("Partie déja en cour");
                    else {
                        if (rawResult[0].sauvegarde){
                            //Si la partie est sauvegardé
                            db.query("UPDATE parties SET sauvegarde=0 WHERE idPartie =?;",data.idParty, async(err,result)=>{ 
                                if(err)throw(err);
                                (result.changedRows ==1)?io.to(data.idParty).emit('gameStart',true):io.to(data.idParty).emit('gameStart',false);
                                });
                            }
                            else{
                                //Si partie non sauvegardé
                                const nbPlayers = IdPlayerList.length;
                                var playerHands = null;
                                switch (rawResult[0].type){//à réfléchir, il faudra certainement à un moment revisiter le systéme
                                    case "bataille_ouverte" :
                                        playerHands = dealCardsWar(nbPlayers);
                                        break;
                                    /*Exemple ajout autre jeu :
                                    case "poker":
                                        const handPlayers = dealCardsPoker(nbPlayers);
                                        giveCardsDbAndPlayer(io,socket,db,playerHands,IdPlayerList,nbPlayers,idParty)
                                        break;*/
                                    default:
                                        console.log("type inconnu");
                                        break;
                                }
                                if (!(giveCardsDb(io,db,playerHands,IdPlayerList,nbPlayers,data.idParty)))io.to(data.idParty).emit('gameStart',false);
                                db.query("UPDATE parties SET tour=0 WHERE idPartie =?;",data.idParty, async(err,result)=>{ 
                                    if(err)throw(err);
                                    (result.changedRows ==1)?io.to(data.idParty).emit('gameStart',true):io.to(data.idParty).emit('gameStart',false);
                                });
                            }
                        }
                    }
                }
            });
    });
    socket.on('requestCards',data =>{
        db.query("SELECT main from joue where idPartie = ? and idJ = ?; ",[data.idParty,data.idJ],async(err,result)=>{
            await result;
            if (err)throw(err);
            console.log(result);
            console.log(result[0].main);
            io.to(data.idParty).emit("dealingCards",{'Cards':result[0].main});
        });
    });
}
function giveCardsDb(io,db,playerHands,IdPlayerList,nbPlayers,idParty){
    for (i=0;i<nbPlayers;i++){
        var hand = JSON.stringify(playerHands[i]);
        var idJ = IdPlayerList[i];
        db.query("UPDATE joue SET main =?  WHERE idJ=?  ",[hand, idJ],async(err,result)=>{
            if(err)throw(err);
            if (!(result.changedRows ==1)) {
                console.log("Update main joueur raté",idJ,hand)
                return false;
            }
        });
    }
    console.log("Mains correctement transmises")
    return true;
}
//algorithme Fisher-Yates, également appelé mélange de Knuth
function FYK(list){
    len = list.length;
    for (j=len-1;j>0;j--){
        const i = Math.floor(Math.random() * (len-1));
        [list[j],list[i]]=[list[i],list[j]];
    }
    return list;
}
function generateDraw(familyList,nbCards){
    var len = familyList.length;
    //console.log(len,familyList,nbCards);
    res = [];
    for (i=0 ; i<len;i++){
        for(j=1 ; j<=nbCards; j++){
            res.push({
                "enseigne" : familyList[i],
                "valeur" : j
            });
        }
    }
    return FYK(res);
}
function dealCardsWar(nbPlayers){
    const draw = generateDraw(["Pique","Carreau","Trefle","Coeur"],13);
    const playerHands = []; // Array(nbPlayers).fill([]) fait pointer chaque case vers la même liste vide
    for(i=0;i<nbPlayers;i++){
        const li = [];
        playerHands.push(li);
    }//On a généré une liste de liste vide avec chaque liste vide correspondante à la main d'un joueur
    const len = draw.length;//éviter de calculer la longueur à chaque itération
    for(i=0;i<len;i++){
        var index = i % nbPlayers;
        (playerHands[index]).push(draw[i]);
    }
    return playerHands
}

module.exports = startGame;

/*Si vous voulez tester la distribution aléatoire de l'algorithme
exemple sur 10 millions : {
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
