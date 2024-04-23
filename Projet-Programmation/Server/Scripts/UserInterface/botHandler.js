function botHandler(io,socket,db){
    socket.on('changeType',(data)=>{
        if(changeType(db,data.name)){
            io.to(data.idParty).emit('')
        }
    });
    
    socket.on('addBot',(data)=>{
        console.log("On demande à rajouter un bot",data);
        const bot = newBot(db,data.idParty,data.idPlayer);
        if(bot)io.to(data.idParty).emit('newBot',bot);
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
            if(!res){
                console.log("Aucune partie");
                resolve(true);
            }
            if(res.length <= 0){
                console.log("Le joueur n'est pas dans la partie");
                resolve(true);
            }
            if(!res[0].proprietaire){
                console.log("Le joueur n'est pas le proprietaire ");
                resolve(true);
            }
            resolve(false);;
        });
    });
}

async function newBot(db,idParty,idJ){
    if(await (preCondBot(db,idParty,idJ)))return null;
    const stratList = ["aleatoire",'max','min']
    const strat = stratList[Math.floor(Math.random() * (stratList.length))]
    const name = randomName();
    const idR = (await getIdR(db))+1;
    const promiseList = [];
    db.query("INSERT INTO robots (idR,nom, strategie) VALUES (?,?, ?)",[idR,name,strat],(errU,resU)=>{
        if(errU)throw errU;
        return {'name':name,'strat':strat}

    });
    //db.query("INSERT INTO joue ")

}

function getIdR(db){
    return new Promise((resolve,reject)=>{
        db.query('Select MAX(idR) as idR from robots',[],(err,result)=>{
            if(err)reject(err);
            resolve(result[0].idR ? result[0].idR : 0);
        });
    });
}

module.exports = botHandler;