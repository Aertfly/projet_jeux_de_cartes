const { getMaxId } = require("./utils");

function botHandler(io,socket,db){
    const stratList = ["aleatoire",'max','min','echantillon']

    socket.on('changeStrat',async(data)=>{
        console.log("On me demande de changer la strat d'un bot",data)
        const newStrat = await changeStrat(socket,db,data.botName,data.idParty,data.idPlayer,stratList)
        if(newStrat){
            io.to(data.idParty).emit('stratChanged',{"name":data.botName,"strat": newStrat})
        }
        else{
            console.log("Type non changé")
        }
    });
    
    socket.on('addBot',async(data)=>{
        console.log("On me demande de rajouter un bot",data);
        const bot = await newBot(socket,db,data.idParty,data.idPlayer,stratList);
        console.log("BOT :",bot)
        if(bot)io.to(data.idParty).emit('newBot',bot);
    });

    socket.on('removeBot',async(data)=>{
        console.log("On me demande de supprimer un bot",data);
        let msg = await (preCondBot(db,data.idParty,data.idPlayer))
        if(msg){socket.emit('msg',msg);
        return;}
        const res  = (await getBotInfo(db,data.botName))
        if(res){
            const id = res.idR
            db.query("DELETE from robots where idR=?",[id])
            db.query("DELETE from joue where idJ=?",[id],(err)=>{if(err)throw err})
            io.to(data.idParty).emit("removebot",data.botName);
        }
    });
}

function randomName(){
    const firstNames = ["John", "Mary", "James", "Emily", "Michael", "Emma", "William", "David", "Sophia", "Daniel", "Olivia", "Joseph", "Ava","JM","Pierre","Enzo","Robert","Jacque","Mohammed"];
    const lastNames = ["Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas", "Walker", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez"];

    function getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    var randomFirstName = getRandomElement(firstNames);
    var randomLastName = getRandomElement(lastNames)
    return randomFirstName + " " + randomLastName
}

function preCondBot(db,idParty,idJ,addBot=false){
    return new Promise ((resolve,reject)=>{
        db.query("Select proprietaire,type,joueursMax from joueurs j,joue jo, parties p where j.idJ = jo.idJ and jo.idPartie=p.idPartie and jo.idJ=? and jo.idPartie=? ",[idJ,idParty],async (err,res)=>{
            if(err)reject(err);
            if(!res){
                resolve("ERREUR 404 :  partie non trouvée");
            }else{
                if(res.length <= 0){
                    resolve("ERREUR : vous n'êtes pas dans la partie");
                }
                else{
                    if(res[0].type!="6 Qui Prend"){
                        resolve("Les robots ne sont disponibles que pour le 6 qui prend !")
                    }else
                    if(!res[0].proprietaire){
                        resolve("Vous n'êtes pas le propriétaire");
                    } else{
                        if(addBot){
                            db.query("SELECT count(*) as nb from joue where idPartie =?",[idParty],(err,res2)=>{
                                if(err)throw err;
                                if(res[0].joueursMax <= res2[0].nb){
                                    resolve("La partie est pleine !");
                                }else{
                                    resolve(null);
                                }
                            });
                        }else resolve(null);
                    }
                }
            }
        });
    });
}

async function newBot(socket,db,idParty,idJ,stratList){
    let msg = await (preCondBot(db,idParty,idJ,true))
    if(msg){socket.emit('msg',msg);
    return;}
    const strat = stratList[Math.floor(Math.random() * (stratList.length))]
    const name = randomName();
    const idR = (await  getMaxId(db))+1;
    db.query("INSERT INTO robots (idR,nom, strategie) VALUES (?,?, ?)",[idR,name,strat],(errU,resU)=>{
        if(errU)throw errU;
        db.query('INSERT INTO `joue`(`idJ`, `idPartie`, `score`, `main`, `gagnees`, `proprietaire`) VALUES (?,?,0,"[]","[]",0)', [idR, idParty]);
    });
    console.log("BOT :",{'name':name,'strat':strat})
    return {'name':name,'strat':strat}
}

function getBotInfo(db,nameBot){
    return new Promise((resolve,reject)=>{
        db.query("Select idR,strategie from robots where nom=?",[nameBot],(err,res)=>{
            if(err)throw(err);
            if(res.length > 0)resolve(res[0]);
            else {
                resolve(null);
                console.log("ERREUR ce bot n'existe pas")}
        });
    });
}

function nextStrat(prev,list){
    const i = list.indexOf(prev)+1;
    if(i > list.length-1)return list[0];
    else return (list[i])
}

async function changeStrat(socket,db,nameBot,idParty,idJ,stratList){
    let msg = await (preCondBot(db,idParty,idJ))
    if(msg){socket.emit('msg',msg);
    return;}
    const  info = await getBotInfo(db,nameBot);
    if(info.idR == null)return null;
    const next = nextStrat(info.strategie,stratList);
    console.log(next,info.strategie,stratList);
    db.query("UPDATE robots set strategie = ? where idR=?",[next,info.idR]);
    return next;
}

module.exports = botHandler;    