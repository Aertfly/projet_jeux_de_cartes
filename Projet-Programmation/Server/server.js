const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const server = http.createServer(app);

const gestionTours = require('./gestionTours.js');
const startGame = require('./startGame.js');
const {scores, scoreMoyenJoueur} = require('./scores.js');
const abandon = require('./abandon.js');
const chat = require('./chat.js');
const sauvegardePartie = require('./sauvegardePartie.js');
const { Socket } = require('dgram');

app.use(cors);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
const port = 3001;

const db = mysql.createConnection({
    host: 'mysql.etu.umontpellier.fr',
    user: 'e20220005227',
    password: 'azertyu',
    database: 'e20220005227'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connecté à MySQL');
});

const connectedUsers = {};
const idJPlayers = [];
const asso = new Map();
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
                        const match = await bcrypt.compare(password, result[0].motdepasse);
                        if (match && !idJPlayers.includes(result[0].idJ) ) {
                            asso.set(socket.id, result[0].idJ);
                            socket.emit('infoPlayer', { 'idJ': result[0].idJ, 'pseudo': result[0].pseudo });
                            socket.emit('resultatConnexion', "Connexion réussie");
                            console.log('Connexion réussie');
                            idJPlayers.push(result[0].idJ);
                            connectedUsers[socket.id] = true;
                            console.log(asso);
                            console.log(connectedUsers);
                            console.log(idJPlayers);
                        } else {
                            const flemme = (idJPlayers.includes(result[0].idJ)) ? "Déjà connecté" : "Mot de passe incorrect";
                            socket.emit('resultatConnexion', flemme);
                            console.log(flemme);
                        }
                    } else {
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
        const { minValue, maxValue, estPublic, selectedGame, idJ, pseudo } = data;
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
                        socket.join(partyId);
                        if (!rooms.includes(partyId)) {
                            rooms.push(partyId);
                        }; console.log(rooms);
                        db.query('INSERT INTO `joue`(`idJ`, `idPartie`, `score`, `main`, `gagnees`, `proprietaire`) VALUES (?,?,0,"[]","[]",1)', [idJ, partyId]);
                        socket.emit('joinGame', { 'idParty': partyId, 'playerList': [pseudo] });
                    }
                });
            }
        } catch (error) {
            console.log("Erreur lors de la génération du partyId", error);
            socket.emit('resultatCreation', "Erreur lors de la création de la partie");
        }
    });
    
    socket.on('joinRequest', data => {
        const { idParty, idPlayer } = data;
        console.log("Ce joueur ", idPlayer, "a demandé à rejoindre", idParty);
        
        
        db.query('SELECT COUNT(joue.idJ) as playerCount, joueursMax, sauvegarde, pseudo from joueurs,joue,parties where joueurs.idJ = joue.idJ and joue.idPartie = parties.idPartie and parties.idPartie = ?', [idParty], (err, resultats) => {
            if (err) throw err;
            if (!(resultats[0].sauvegarde)){
                if (resultats[0].playerCount < resultats[0].joueursMax) {
                    
                    db.query('INSERT INTO `joue` (`idJ`, `idPartie`, `score`, `main`, `gagnees`, `proprietaire`) VALUES (?, ?, 0, "[]", "[]", 0)', [idPlayer, idParty]);
                    socket.join(idParty);
                    console.log("Le joueur a rejoint la room");
                    db.query('SELECT pseudo FROM joueurs, joue WHERE joueurs.idJ = joue.idJ AND joue.idPartie = ?', [idParty], async (err, result) => {
                        if (err) throw err;
                        const playerList = result.map(object => object.pseudo);
                        io.to(idParty).emit('refreshPlayerList', { "playerList": playerList });
                        socket.emit('joinGame2', { "playerList": playerList, "idParty": idParty });
                        socket.join(idParty);
                        if (!rooms.includes(idParty)) {
                            rooms.push(idParty);
                        }; console.log(rooms);
                    });
                } else {
                    console.log('La partie est pleine');
                    socket.emit('joinGame2', { 'message': "La partie est pleine'" });
                }
            } else {
                db.query('SELECT pseudo FROM joueurs, joue WHERE joueurs.idJ = joue.idJ AND joue.idPartie = ?', [idParty], async (err, result) => {
                    if (err) throw err;
                    const playerList = result.map(object => object.pseudo);
                    socket.join(idParty);
                    socket.emit('joinGame2', { "playerList": playerList, "idParty": idParty });
                });
            }
            
        });
    });
    
    socket.on('joinableList', () => {
        const request = "SELECT count(idJ)as nbJoueur,p.idPartie,joueursMin,joueursMax,type from parties p,joue j WHERE p.idPartie=j.idPartie and sauvegarde = 0 AND publique = 1 AND tour=-1 GROUP BY p.idPartie;"
        db.query(request, [], async (err, result) => {
            if (err) throw (err);
            socket.emit('joinableListOut', result);
        });
    });
    socket.on('savedList', (idPlayer) => {
        db.query('SELECT p.idPartie, joueursMin, joueursMax, type FROM parties p,joue j WHERE p.idPartie=j.idPartie AND sauvegarde = 1 AND idJ = ?;', [idPlayer], async (err, result) => {
            if (err) throw (err);
            console.log(result);
            socket.emit('savedListOut', result);
        })
    });
    
    socket.on('deconnexion', () => {
        
        if (socket.id in connectedUsers) {
            delete connectedUsers[socket.id];
            const index = idJPlayers.indexOf(asso.get(socket.id));
            if (index !== -1) {
                idJPlayers.splice(index, 1);
            }
            console.log('Un utilisateur s\'est déconnecté via la déconnexion manuelle');
        }
    });
    
    socket.on("disconnect", (reason) => {
        if (reason == "ping timeout") { // Si le joueur se reconnecte après une déconnexion par manque de co
            abandon(db, socket, 'playerDisconnect', asso.get(socket.id));
            delete connectedUsers[socket.id];
            const index = idJPlayers.indexOf(asso.get(socket.id));
            if (index !== -1) {
                idJPlayers.splice(index, 1);
            }
        } else {
            abandon(db, socket, 'playerLeaving', asso.get(socket.id));
            delete connectedUsers[socket.id];
            const index = idJPlayers.indexOf(asso.get(socket.id));
            if (index !== -1) {
                idJPlayers.splice(index, 1);
            }
        }
    });
    
    socket.on('playerLeaving', (idJ) => {
        abandon(db, socket, 'playerLeaving', idJ)
    })
    
    socket.on('infoGame',idParty=>{
        db.query('SELECT pseudo,centre,archive,pioche,main,score,tour from parties p,joue j,joueurs jo where p.idPartie=j.idPartie and j.idJ=jo.idJ and p.idPartie =?',[idParty],async(err,result)=>{
            if(err)throw(err);
            var infoPlayers=[];
            console.log("res : ",result);
            await scoreMoyenJoueur(io,db,idParty).then((scoreMoyenJoueur) => {
                console.log("Score moy",scoreMoyenJoueur);
                for(i=0;i<result.length;i++){
                    infoPlayers.push({
                        "nbCards":JSON.parse(result[i].main).length,
                        "pseudo":result[i].pseudo,
                        "score":result[i].score,
                        'scoreMoyenJoueur': scoreMoyenJoueur
                    })
                }
            }); 
            socket.emit('infoGameOut',{
                'center' :JSON.parse(result[0].centre),
                'archive' : JSON.parse(result[0].archive),
                'draw' : JSON.parse(result[0].pioche).length,
                'infoPlayers' : infoPlayers,
                'nbTurn' : result[0].tour
            });
            
        });
    });
    
    startGame(io, socket, db);
    scores(io, socket, db);
    abandon(io, socket, db);
    chat(io, socket, db);
    sauvegardePartie(io, socket, db);
    gestionTours(io, socket, db);
});

server.listen(port, () => {
    console.log('Serveur écoutant sur le port ' + port);
});
