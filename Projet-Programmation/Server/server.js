const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const server = http.createServer(app);

const startGame = require('./startGame.js');
const scores = require('./scores.js');
const abandon = require('./abandon.js');
const chat = require('./chat.js');
const sauvegardePartie = require('./sauvegardePartie.js');

app.use(cors);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
const port = 3001;

const db = mysql.createConnection({
    host: 'rateapp.fr',
    user: 'cp2253952p22_projetprogrammation',
    password: 'azertyu123!',   
    database: 'cp2253952p22_projetprogrammation'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connecté à MySQL');
});

const connectedUsers = {};
const rooms = [];

async function generatePartyId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result;
    do {
        result = '';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    } while (await isCodeInDatabase(result));
    return result;
}

async function isCodeInDatabase(code) {
    const query = `SELECT idPartie FROM parties WHERE idPartie = '${code}'`;
    const results = db.query(query);
    return results.length > 0;
}

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté ' + socket.id);
    socket.emit('firstConnection');

    socket.on('connexion', async (data) => {
        const { pseudo, password } = data;
        if (connectedUsers[socket.id]) {
            socket.emit('resultatConnexion', "Déjà connecté");
            console.log('Déjà connecté');
            return;
        }

        try {
            const requestAll = 'SELECT * FROM joueurs WHERE pseudo = ?';
            db.query(requestAll, [pseudo], async (err, result) => {
                if (err) {
                    socket.emit('resultatConnexion', "Erreur lors de la connexion");
                    console.log('Erreur lors de la connexion');
                } else {
                    if (result.length > 0) {
                        const user = result[0];
                        const match = await bcrypt.compare(password, user.motdepasse);

                        if (match) {
                            socket.emit('infoPlayer', {'idJ':result[0].idJ,'pseudo':result[0].pseudo});
                            socket.emit('resultatConnexion', "Connexion réussie");
                            console.log('Connexion réussie');
                            connectedUsers[socket.id] = true;
                            console.log(connectedUsers);
                        } else {
                            socket.emit('resultatConnexion', "Mot de passe incorrect");
                            console.log('Mot de passe incorrect');
                        }
                    }else {
                        socket.emit('resultatConnexion', "pseudo incorrect");
                        console.log('pseudo incorrect');
                    }
                }
            });
        } catch (error) {
            console.error(error);
            socket.emit('resultatConnexion', "Erreur lors de la connexion");
        }
    });

    socket.on('inscription', async (data) => {
        const { pseudo, password } = data;
        if (!pseudo || pseudo.length < 3 || pseudo.length > 30) {
            return socket.emit('resultatInscription', 'Pseudo invalide');
          }
          if (!password || password.length !== 64) { // La longueur d'un SHA256 en hexadécimal est 64
            return socket.emit('resultatInscription', 'Mot de passe invalide');
          }

        try {
            const checkEmailQuery = 'SELECT idJ FROM joueurs WHERE pseudo = ?';
            db.query(checkEmailQuery, [pseudo], async (err, result) => {
                if (err) {
                    socket.emit('resultatInscription', "Erreur lors de l\'inscription");
                    console.log('Erreur lors de l\'inscription');
                } else {
                    if (result.length > 0) {
                        socket.emit('resultatInscription', "pseudo déjà utilisé");
                        console.log('pseudo déjà utilisé');
                    } else {
                        const hashedPassword = await bcrypt.hash(password, 10);
                        const insertUserQuery = 'INSERT INTO joueurs (pseudo, motdepasse) VALUES (?, ?)';
                        db.query(insertUserQuery, [pseudo, hashedPassword], async (err, result) => {
                            if (err) {
                                socket.emit('resultatInscription', "Erreur lors de l\'inscription");
                                console.log('Erreur lors de l\'inscription');
                                console.log(err);
                            } else {
                                socket.emit('resultatInscription', "Inscription réussie, veuillez vous connecter!")
                                console.log('Inscription réussie, veuillez vous connecter!');
                            }
                        });
                    }
                }
            });
        } catch (error) {
            console.error(error);
            socket.emit('resultatInscription', "Erreur lors de l\'inscription");
        }
    });

    socket.on('createParty', async data => { 
        const { minValue, maxValue, estPublic, selectedGame,idJ } = data;
        const estPublicNum = estPublic ? 1 : 0;
        
        try {
            const partyId = await generatePartyId(); 
            var sens = "";
            switch (selectedGame) {
                case "Bataille":
                    sens = "all";
                    break;
            }
            if (minValue && maxValue && selectedGame) {
                const request = 'INSERT INTO `parties`(`idPartie`, `joueursMin`, `joueursMax`, `sens`, `tour`, `type`, `sauvegarde`, `centre`, `archive`, `pioche`, `publique`) VALUES (?, ?, ?, ?, -1, ?, 0, "{}", "{}", "[]", ?)';
                db.query(request, [partyId, minValue, maxValue, sens, selectedGame, estPublicNum], (err, result) => {
                    if (err) {
                        socket.emit('resultatCreation', "Création de partie échouée, mauvaises informations");
                        console.log("Création de partie échouée, mauvaises informations");
                    } else {
                        socket.emit('resultatCreation', "Création de partie effectuée");
                        console.log("Création de partie effectuée");
                        socket.join(partyId);rooms.push(partyId);
                        db.query('INSERT INTO `joue`(`idJ`, `idPartie`, `score`, `main`, `gagnees`, `proprietaire`) VALUES (?,?,0,"[]","[]",1)', [idJ,partyId]);
                        socket.emit('joinGame', partyId);
                    }
                });
            }
        } catch (error) {
            console.log("Erreur lors de la génération du partyId", error);
            socket.emit('resultatCreation', "Erreur lors de la création de la partie");
        }
    });

    socket.on('joinRequest',async data=>{
        if (await isCodeInDatabase(data.idParty)){
            db.query('SELECT pseudo from joueurs,joue where joueurs.idJ = joue.idJ and joue.idPartie = ?', (data.idParty).toString(), async (err,result) => {
                if (err){
                    throw(err);
                }
                const playerList = result.map(object => object.pseudo);
                socket.emit('joinGame',data.idParty);
                db.query('INSERT INTO `joue`(`idJ`, `idPartie`, `score`, `main`, `gagnees`, `proprietaire`) VALUES (?,?,0,"[]","[]",0)', [data.idPlayer,data.idParty]);
                console.log(playerList);
                socket.emit('playerList',playerList);
            });
            console.log("Ce joueur ",data.idPlayer,"a demandé à rejoindre",data.idParty)
        }else{
            socket.emit('joinGame',null);
            console.log("Partie non existante")
        }
    });

    socket.on('joinableList',()=>{
        db.query('SELECT idPartie,joueursMin,joueursMax,type from parties WHERE sauvegarde = 0 AND publique = 1',[],async (err, result) =>{
            if(err)throw(err);
            console.log(result);
            socket.emit('joinableListOut',result);
        })
    });
    socket.on('savedList',()=>{
        db.query('SELECT idPartie,joueursMin,joueursMax,type from parties where sauvegarde = 1',[],async (err, result) =>{
            if(err)throw(err);
            console.log(result);
            socket.emit('savedListOut',result);
        })
    });

    socket.on('deconnexion', () => {
        if (socket.id in connectedUsers) {
            delete connectedUsers[socket.id];
            socket.emit('deconnexion', "Déconnexion réussie !");
            console.log('Un utilisateur s\'est déconnecté via la déconnexion manuelle');
        }
    });

    socket.on("disconnect", (reason) => {
        if(reason == "ping timeout" || reason == "transport close") { // Si le joueur se reconnecte après une déconnexion par manque de co
            socket.emit('playerDisconnect', reason, socket.id);
        } else {
            socket.emit('disconnectComplete');
        }
    });
    
    startGame(io,socket,db);
    scores(io,socket,db);
    abandon(io,socket,db);
    chat(io,socket,db);
    sauvegardePartie(io,socket,db);
});

server.listen(port, () => {
    console.log('Serveur écoutant sur le port ' + port);
});
