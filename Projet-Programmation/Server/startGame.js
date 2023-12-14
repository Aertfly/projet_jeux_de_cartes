const startGame = function(io,socket,db){
    socket.on('start',data =>{
        console.log("Partie lancée d'id : ",data.idParty, "par :" ,data.idJ);
    })
}

module.exports = startGame;