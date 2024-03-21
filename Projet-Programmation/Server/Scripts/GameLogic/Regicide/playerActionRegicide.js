const {regenDraw} = require("../startGame.js");
const {currentPlayerTurn,nextPlayerTurn,envoyerInfos} = require("../utils/functions.js")

function playerDiscardRegicide(io,socket,db,hand,discardedCards,currentBoss,idParty,idJ){
    let sum=0;
    for(const card of discardedCards){
        sum+=card.valeur;
    }
    if(sum>=currentBoss.atk){
        discardedCards=[];
        nextPlayerTurn(io,db,idParty,1000)
    }else{
        db.query('Update joue Set gagnees=? where idJ=? and idPartie=?',[JSON.stringify(discardedCards),idJ,idParty],(err,result)=>{
            if(err)throw(err);
            if(hand.length!=0){socket.emit('requestAction',{idJ:idJ,action:"defausserCarte"})}
            else{
                io.to(idParty).emit('endGame',{winner: {"pseudo": "Le roi", "score": 0}})
            }
        });
    }
    return;
}


 async function playerActionRegicide(io, socket, db, center, archive, data, playersHand){
    archive[data.playerId]?archive[data.playerId].push(center[data.playerId]):archive[data.playerId]=[center[data.playerId]]
    if(await verifyPreCond(socket,db,playersHand.get(data.playerId).get("main"),archive[data.playerId],data.playerId,data.idPartie))return;
    console.log("pre-cond vérifier")
    if(!canPlay(archive[data.playerId],playersHand.get(data.playerId).get("main"))){
        console.log("Declenchement des calcul du tour")
        await activateCardPower(io,db,data.idPartie,fuseCards(archive[data.playerId]),archive.boss,playersHand);
        let turnFinished=true;
        if(archive.boss.hp<=0)await handleEnemyDeath(io,db,data.idPartie,archive.boss);
        else turnFinished=makePlayerTakeDmg(socket,data.playerId,archive.boss);
        newTurn(io,db,data.idPartie,data.playerId,archive,turnFinished);
    }else {
        console.log("On demande au joueur de rejouer")
        db.query("Update parties SET archive=? where idPartie=?",[JSON.stringify(archive),data.idPartie],(err,res)=>{
            if(err)throw err;
            socket.emit('requestAction',{idJ:data.playerId,action:"jouerCarte"});
        })
    }
}

async function verifyPreCond(socket,db,playerHand,playedCards,playerId,idPartie){
    const currentPlayer = await currentPlayerTurn(db,idPartie);
    if((currentPlayer!=playerId)||(!verifyDuplicate(playedCards))){
        console.log("On annule l'action du joueur ");
        return await cancelPlayerAction(socket,db,playerHand,playedCards[playedCards.length-1],idPartie,playerId);
    }
    return false;
}

/**
 * Annule l'action du joueur, remettant la base de données et la main du joueur dans l'état précédent
 * @param {*} socket permet de renvoyer au joueur sa carte, on simule une pioche de la carte 
 * @param {*} db connection à la base de donnée
 * @param {object} center on lui enleve la carte jouée et on update la valeur du centre de la partie dans la db
 * @param {list} playedCards carte jouées par le joueur
 * @param {int} playerId permet d'actualiser de la main du joueur
 * @param {string} idPartie  permet d'actualiser la valeur du centre de la partie et de la main du joueur
 */
async function cancelPlayerAction(socket,db,playerHand,playedCard,idPartie,playerId){
    socket.emit('drawedCard',{idJ:playerId,card:playedCard});
    try{
        await db.query("UPDATE parties SET centre=? WHERE idPartie=?", [JSON.stringify({}), idPartie]); 
        playerHand.push(playedCard);
        await db.query("UPDATE joue SET main=? WHERE joue.idJ=? AND joue.idPartie=?", [JSON.stringify(playerHand),playerId,idPartie]);
        return new Promise((resolve)=>resolve(true));
    }catch(err){
        console.log("Erreur lors de cancelPlayerAction",err,playerHand,playedCard,idPartie,playerId)
    }
}


/**
 * Vérifie que les doubles ou les triples ou les quadruples joués respectent les régles du jeu
 * @param {list} cards liste des cartes jouées par le joueur
 * @returns retourne vrai les régles sont respectées
 */
function verifyDuplicate(cards){
    const card = cards[cards.length-1];
    if((cards.length<=1)||(card.valeur===1))return true;
    let sum=0;
    //pas besoin de regarder le dernier élement puisque c'est notre carte jouée
    for(let i=0;i<cards.length-1;i++){
        if(card.valeur!=cards[i].valeur){
            if(cards[i].valeur!=1)
            return false;
        }
        sum += cards[i].valeur
    }
    return (sum<=10);
}

function contains(cards,card){
    for(c of cards){
        if(c.valeur === card.valeur )return true;
    }return false
}

/**
 * Regarde si le joueur peut encore jouer
 * @param {list} playedCards cartes jouées par le joueur, au centre du jeu
 * @param {list} playerHand  cartes dans la main du joueur
 * @returns si le joueur peut jouer true sinon false
 */
function canPlay(playedCards,playerHand){
    console.log("canPlay",playedCards,playerHand);
    const playedCard= playedCards[playedCards.length-1];
    if(playedCards.length===0)return false;
    if((playedCards.length===1)
        &&((playedCard.valeur===1)
            ||((playedCard.valeur<=5)&&(contains(playerHand,playedCard))))){//si le joueur a joué une carte et que c'est un as ou qu'il peut jouer un double, il peut rejouer une carte
            return true;
    }
    if(playedCards.length===2){
        if((playedCard.valeur<=3)&&(contains(playerHand,playedCard))){//si le joueur peut jouer un triple il peut rejouer une carte
            return true;
        }
    }
    if(playedCards.length===3){
        if((playedCard.valeur===2)&&(contains(playerHand,playedCard))){//si le joueur peut jouer un quadruple il peut rejouer une carte
            return true;
        }
    }
    //On a forcement playedCards.length>=4 et aucune carte peut être joué 5 fois donc on a fini
    return false;
}

async function activateCardPower(io,db,idParty,fusedCard,currentBoss,playersHand){
    console.log("activateCardPower",fusedCard);
    for(family of fusedCard.enseigne){
        if(family!=currentBoss.card.enseigne){
            switch (family){
                case 'coeur':
                    await regenDraw(db,idParty,fusedCard.valeur);
                    break;
                case 'carreau':
                    await makePlayersDraw(io,db,idParty,playersHand,fusedCard.valeur);
                    break;
                case 'trefle':
                    doubleAttack(fusedCard)
                    break;
                case 'pique':
                    reduceEnnemyAtk(currentBoss, fusedCard.valeur);
                    break;
                default:
                    console.log("Erreur : Carte inconnu",currentBoss,fusedCard);
            }
        }
    }
    dealDmg(currentBoss, fusedCard.valeur);
}

async function makePlayersDraw(io,db,idParty,playersHand,amount){
    const {playerOrder,drawObject} = await getDrawAndSens(db,idParty)
    const draw = drawObject['pioche'];
    const  maxCardsPerPlayer = {2:7,3:6,4:5}[playerOrder.length] || 0;

    let nbFullHands =0;
    let cardDrawed;
    let hand;
    let i=0;
    while((amount>i)&&(nbFullHands<playerOrder.length)){
        index=i%playerOrder.length;
        if(index===0)nbFullHands=0;
        hand=playersHand.get(playerOrder[index]).get('main');
        if(hand.length<maxCardsPerPlayer){
            cardDrawed = draw.pop();
            hand.push(cardDrawed);
            io.to(idParty).emit('drawedCard',{idJ:playerOrder[index],card:cardDrawed});
        }else{nbFullHands++}
        i++;
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return updateDbAfterDrawPlayer(db,drawObject,playersHand,playerOrder,idParty);
}

function  getDrawAndSens(db,idParty){
    return new Promise((resolve,reject)=>{
        db.query("Select pioche,sens from parties where idPartie=?",[idParty],(err,res)=>{
            if(err)reject(err);
            resolve({'playerOrder':JSON.parse(res[0]['sens']),'drawObject':JSON.parse(res[0]['pioche'])})
        });
    });
}

function updateDbAfterDrawPlayer(db,drawObject,playersHand,playerOrder,idParty){//a refactorer avec la fonction queryLine
    const promiseList =[];
    for(let i=0;i<playerOrder.length;i++){
        promiseList.push(new Promise ((resolve,reject)=>{
            db.query("UPDATE joue SET main=? WHERE joue.idJ=? AND joue.idPartie=?",[JSON.stringify(playersHand.get(playerOrder[i]).get('main')),playerOrder[i],idParty],(err,result)=>{
            if(err)reject(err);
            resolve(result.changedRows === 1);
            })
        }));
    }
    promiseList.push(new Promise ((resolve,reject)=>{
        db.query("UPDATE parties SET pioche=? WHERE idPartie=?",[JSON.stringify(drawObject),idParty],(err,result)=>{
        if(err)reject(err);
        resolve(result.changedRows === 1);
        });    
    }))
    return Promise.all(promiseList);    
}
function doubleAttack(card){
    card.valeur += card.valeur;}
function reduceEnnemyAtk(boss,amount){
    boss.atk -= amount}
function dealDmg(boss,amount){
    boss.hp -= amount}

function fuseCards(playedCards){
    let fusedCard = {enseigne:[],valeur:0};
    let possibleFamilyDuplicate = null;
    for(card of playedCards){
        if(!(card.enseigne===possibleFamilyDuplicate)){fusedCard.enseigne.push(card.enseigne);}// TO DO trier les familles par ordre de jeu
        if(card.valeur===1){possibleFamilyDuplicate = card.enseigne}
        fusedCard.valeur += getTrueValue(card);}
    fusedCard.enseigne.sort((carte1, carte2)=>{
        const ordreEnseignes = ["coeur", "carreau", "pique", "trefle"];//on trie les pouvoirs dans l'ordre ou ils doivent être joués
        return ordreEnseignes.indexOf(carte1.enseigne) - ordreEnseignes.indexOf(carte2.enseigne);});
    return fusedCard;
}

function getTrueValue(card){
    if(card.valeur===11)return 10;//si c'est un valet, sa vrai valeur est 10
    if(card.valeur===12)return 15;//si c'est une dame, sa vrai valeur est 15
    if(card.valeur===13)return 20;//si c'est un roi, sa vrai valeur est 20
    return card.valeur;
}

async function handleEnemyDeath(io,db,idParty,currentBoss){//changement à faire 
    console.log("Le boss a été vaincu, on lance la gestion de sa mort"); 
    db.query("Select pioche,archive,sens from parties where idPartie=?",[idParty],(err,result)=>{
        if(err)reject(err);
        const drawObject= JSON.parse(result[0]['pioche']);
        const archive = JSON.parse(result[0]['archive']);
        for(const idJ in archive){
            if(idJ!="boss"){
                for(const card of archive[idJ]){
                    drawObject.defausse.push(card);
                }
            }
        }
        if(currentBoss.hp=0){drawObject['pioche'].push(currentBoss.card)}
        else{drawObject['defausse'].push(currentBoss.card)}
        if(drawObject['chateau'].length===0){io.to(idParty).emit('endGame',{winner: {"pseudo": "Les joueurs", "score": 4*4}});return;}
        const nextBoss = drawObject['chateau'].pop()
        const trueValue = getTrueValue(nextBoss);
        currentBoss = {'card':nextBoss,'hp':trueValue*2,'atk':trueValue}
        const PromiseList = [new Promise((resolve,reject)=>{
            db.query("Update parties SET archive=?,pioche=? where idPartie=?",[JSON.stringify({"boss":currentBoss}),JSON.stringify(drawObject),idParty],(err,res)=>{
                if(err)reject(err);
                console.log(res);
                resolve(res.changedRows === 3);
            });
        }),updatePlayersScore(db,idParty,JSON.parse(result[0]['sens']))];
        return Promise.all(PromiseList);
    });
}

function updatePlayersScore(db,idParty,playerList){
    const PromiseList = [];
    console.log("On incremente le score des joueurs")
    db.query("Select jo.score from joue jo,parties p,joueurs j where j.idJ=jo.idJ AND jo.idPartie=p.idPartie AND p.idPartie=? ",[idParty],(err,res)=>{
        if(err)throw err;
        const scores = res.map(obj =>  {return{[obj['idJ']]:obj['score']+1}});
        console.log(scores);
        for(const player of playerList){
            PromiseList.push(new Promise((resolve,reject)=>{
                db.query("Update joue jo,parties p,joueurs j  SET jo.score=? where j.idJ=jo.idJ AND jo.idPartie=p.idPartie AND p.idPartie=? AND j.idJ=? ",[scores[player],idParty,player],(errU,resU)=>{
                    if(errU)reject(resU);
                    resolve(resU.changedRows===1);
                });
            }))
        }
        return Promise.all(PromiseList);
    });
}

function makePlayerTakeDmg(socket,idJ,currentBoss){
    if(currentBoss.atk>0){
        socket.emit('requestAction',{idJ:idJ,action:"defausserCarte"})
        return false;
    }
    return true;
}


async function newTurn(io,db,idParty,playerId,archive,turnFinished) {
    stashArchivePlayer(playerId,archive)
    await updateInfoGame(db,idParty,archive)
    envoyerInfos(db,io,idParty);
    if(turnFinished)nextPlayerTurn(io,db,idParty,1000);
}

function stashArchivePlayer (playerId,archive){
    if(archive['neutre']){
        for(const card in archive[playerId]){
            archive['neutre'].push(card);
        }
    }else{
        archive['neutre']=archive[playerId]
     } 
}

function updateInfoGame(db,idParty,archive){
    return new Promise ((resolve,reject)=>{
        db.query("Update parties SET archive=?,centre=?  where idPartie=?",[JSON.stringify(archive),JSON.stringify({}),idParty],(err,res)=>{
            if(err)reject(err);
            resolve(res.changedRows === 2);
        })
    });
}



module.exports = {playerActionRegicide,playerDiscardRegicide };