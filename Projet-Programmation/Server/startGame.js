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
                console.log(generateDraw(["Pique","Carreau","Trefle","Coeur"],13))
            }
        });
    })
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
    return res;
}

function dealCardsWar(dbIdPlayerList){//liste des RowDataPacket de la BDD
    draw = generateDraw();
    return 0;
}


module.exports = startGame;