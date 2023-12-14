/*Exemple liste cartes :[{"enseigne":"Pique","valeur":10},{"enseigne":"Carreau","valeur":6}]*/

const startGame = function(io,socket,db){
    socket.on('start', data => {
        console.log("Partie ",data.idParty,"lancée par : ",data.idPlayer,);
        db.query("SELECT idJ FROM joue j where idPartie = ? and Main = '[]';",data.idParty, async(err,rawResult)=>{
            if (err)throw(err);
            console.log(rawResult);
            result = rawResult.map(objet => objet.idJ);
            console.log(result);
            console.log(result.includes(data.idPlayer));
            if(!(result.includes(data.idPlayer)))console.log("Le joueur qui a essayé de lancé n'est pas dans la partie")
            else {
                console.log(dealCardsWar(result));
            }
        });
    })
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
    var len = familyList.length
    console.log(len,familyList,nbCards)
    res = []
    for (i=0 ; i<len;i++){
        for(j=1 ; j<=nbCards; j++){
            res.push({
                "enseigne" : familyList[i],
                "valeur" : j
        })
        }
    }
    return FYK(res,len);
}

function dealCardsWar(IdPlayerList){
    nbPlayers = IdPlayerList.length;
    draw = generateDraw(["Pique","Carreau","Trefle","Coeur"],13,);
    const playersHands = new Array(nbPlayers).fill([]);
    len = draw.length;
    for (i=0;i<len;i++){
        const currentPlayerIndex = i % nbPlayers;
        playersHands[currentPlayerIndex].push(draw[i]);
    }
    return playersHands;
}
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

module.exports = startGame;