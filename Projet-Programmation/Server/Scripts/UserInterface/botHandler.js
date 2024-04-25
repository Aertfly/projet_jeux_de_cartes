const { getMaxId } = require("./utils");

function botHandler(io,socket,db){
    const stratList = ["aleatoire",'max','min']

    socket.on('changeStrat',async(data)=>{
        console.log("On me demande de changer la strat d'un bot",data)
        const newStrat = await changeStrat(db,data.botName,data.idParty,data.idPlayer,stratList)
        console.log("REs",newStrat);
        if(newStrat){
            io.to(data.idParty).emit('stratChanged',{"name":data.botName,"strat": newStrat})
        }
        else{
            console.log("Type non changé")
        }
    });
    
    socket.on('addBot',async(data)=>{
        console.log("On me demande de rajouter un bot",data);
        const bot = await newBot(io,db,data.idParty,data.idPlayer,stratList);
        console.log("BOT :",bot)
        if(bot)io.to(data.idParty).emit('newBot',bot);
    });

    socket.on('removeBot',async(data)=>{
        console.log("On me demande de supprimer un bot",data);
        let msg = await (preCondBot(db,data.idParty,data.idPlayer))
        if(msg){io.to(data.idParty,).emit('msg',msg);
        return;}
        db.query("DELETE from robots where idR=?",[await (getBotInfo(db,data.botName)).idR])
        io.to(data.idParty).emit("removebot",data.botName);
    });
}

function randomName(){
    var firstNames = ["John", "Mary", "James", "Emily", "Michael", "Emma", "William"];
    var lastNames = ["Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas", "Walker"];
    function getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    var randomFirstName = getRandomElement(firstNames);
    var randomLastName = getRandomElement(lastNames)
    return randomFirstName + " " + randomLastName
}

function preCondBot(db,idParty,idJ){
    return new Promise ((resolve,reject)=>{
        db.query("Select proprietaire from joueurs j,joue jo where j.idJ = jo.idJ and jo.idJ=? and jo.idPartie=? ",[idJ,idParty],async (err,res)=>{
            if(err)reject(err);
            console.log(res)
            if(!res){
                resolve("ERREUR 404 :  partie non trouvée");
            }else{
                if(res.length <= 0){
                    resolve("ERREUR : vous n'êtes pas dans la partie");
                }
                else{
                    if(!res[0].proprietaire){
                        resolve("Vous n'êtes pas le propriétaire");
                    }else resolve(null);
                }
            }
        });
    });
}

async function newBot(io,db,idParty,idJ,stratList){
    let msg = await (preCondBot(db,idParty,idJ))
    if(msg){io.to(idParty).emit('msg',msg);
    return;}
    const strat = stratList[Math.floor(Math.random() * (stratList.length))]
    const name = randomName();
    const idR = (await  getMaxId(db))+1;
    db.query("INSERT INTO robots (idR,nom, strategie) VALUES (?,?, ?)",[idR,name,strat],(errU,resU)=>{
        if(errU)throw errU;
        db.query('INSERT INTO `joue`(`idJ`, `idPartie`, `score`, `main`, `gagnees`, `proprietaire`) VALUES (?,?,0,"[]","[]",1)', [idR, idParty]);
    });
    console.log("BOT :",{'name':name,'strat':strat})
    return {'name':name,'strat':strat}
}

function getBotInfo(db,nameBot){
    return new Promise((resolve,reject)=>{
        db.query("Select idR,strategie from robots where nom=?",[nameBot],(err,res)=>{
            if(err)reject(err);
            if(res)resolve(res[0]);
            else {
                reject(null);
                console.log("ERREUR ce bot n'existe pas")}
        });
    });
}

function nextStrat(prev,list){
    const i = list.indexOf(prev)+1;
    if(i > prev.length-1)return list[0];
    else return (list[i])
}

async function changeStrat(db,nameBot,idParty,idJ,stratList){
    let msg = await (preCondBot(db,idParty,idJ))
    if(msg){io.to(idParty).emit('msg',msg);
    return;}
    const  info = await getBotInfo(db,nameBot);
    if(info.idR == null)return null;
    const next = nextStrat(info.strategie,stratList);
    console.log(next,info.strategie,stratList);
    db.query("UPDATE robots set strategie = ? where idR=?",[next,info.idR]);
    return next;
}

module.exports = botHandler;    