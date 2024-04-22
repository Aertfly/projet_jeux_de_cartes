


function botHandler(io,db,socket){
    socket.on('changeType',(data)=>{
        if(changeType(db,data.name)){
            io.to(data.idParty).emit('')
        }
    });
    socket.on('addBot',(data)=>{
        const bot = newBot(db,data.idParty,data.idJ)
        if(bot)io.to(data.idParty).emit('newBot',bot)
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


function newBot(db,idParty,idJ){
    db.query("Select pseudo,proprietaire from joueurs j,joue jo where j.idJ = jo.idJ and jo.idJ=? and jo.idPartie=? ",[idJ,idParty],(err,res)=>{
        if(err)throw err;
        if(!res){
            console.log("Aucune partie");
            return null;
        }
        if(!res[0].proprietaire){
            console.log("Le joueur n'est pas le proprietaire ");
            return null;
        }
        const stratList = ["aleatoire",'plusForte']
        const strat = stratList[Math.floor(Math.random() * (stratList.length-1))]
        const name = randomName();
        db.update("INSERT INTO robots (idR,nom, strategie) VALUES (?,?, ?)",[getIdR(db)+1,name,strat],(errU,resU)=>{
            if(errU)throw errU;
            return bot
        });
    });
}

function getIdR(db){
    db.('Select MAX(idR) from robots',[],(err,result))
}