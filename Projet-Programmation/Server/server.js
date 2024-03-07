const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const server = http.createServer(app);

const gestionTours = require('./gestionTours.js');
const { startGame } = require('./startGame.js');
const { scores, scoreMoyenJoueur } = require('./scores.js');

const chat = require('./chat.js');
const sauvegardePartie = require('./sauvegardePartie.js');
const { ICD } = require ('./ICD.js');
app.use(cors);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
const port = 3001;

/* base de données fac : 
const db = mysql.createConnection({
    host: 'mysql.etu.umontpellier.fr',
    user: 'e20220005227',
    password: 'azertyu',
    database: 'e20220005227'
});
*/

// base de données maison :
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
                db.query(request, [partyId, minValue, maxValue, sens, selectedGame, estPublicNum], (err) => {
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
                        socket.emit('joinGame', { "playerList": [pseudo], "idParty": idParty });
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


        db.query('SELECT COUNT(joue.idJ) as playerCount, joueursMax, sauvegarde, tour, pseudo from joueurs,joue,parties where joueurs.idJ = joue.idJ and joue.idPartie = parties.idPartie and parties.idPartie = ?', [idParty], (err, resultats) => {
            if (err) throw err;
            if (!(resultats[0].sauvegarde)) {
                if ((resultats[0].tour == -1)) {
                    if (resultats[0].playerCount < resultats[0].joueursMax) {

                        db.query('INSERT INTO `joue` (`idJ`, `idPartie`, `score`, `main`, `gagnees`, `proprietaire`) VALUES (?, ?, 0, "[]", "[]", 0)', [idPlayer, idParty]);
                        socket.join(idParty);
                        console.log("Le joueur a rejoint la room");
                        db.query('SELECT pseudo FROM joueurs, joue WHERE joueurs.idJ = joue.idJ AND joue.idPartie = ?', [idParty], async (err, result) => {
                            if (err) throw err;
                            const playerList = result.map(object => object.pseudo);
                            io.to(idParty).emit('refreshPlayerList', { "playerList": playerList });
                            socket.emit('joinGame', { "playerList": playerList, "idParty": idParty });
                            socket.join(idParty);
                            if (!rooms.includes(idParty)) {
                                rooms.push(idParty);
                            }; console.log(rooms);
                        });
                    } else {
                        console.log('La partie est pleine');
                        socket.emit('joinGame', { 'message': "La partie est pleine'" });
                    }
                } else {
                    socket.emit('joinGame', { 'message': "La partie est déjà lancée" });
                }
            } else {
                db.query('SELECT pseudo FROM joueurs, joue WHERE joueurs.idJ = joue.idJ AND joue.idPartie = ?', [idParty], async (err, result) => {
                    if (err) throw err;
                    const playerList = result.map(object => object.pseudo);
                    socket.join(idParty);
                    socket.emit('joinGame', { "playerList": playerList, "idParty": idParty });
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

    socket.on('infoGame', idParty => {
        db.query('SELECT pseudo,centre,archive,pioche,score,tour,main from parties p,joue j,joueurs jo where p.idPartie=j.idPartie and j.idJ=jo.idJ and p.idPartie =?', [idParty], async (err, result) => {
            if (err) throw (err);
            var infoPlayers = [];
            console.log("res : ", result);
            if (result.length != 0) {
                await scoreMoyenJoueur(io, db, idParty).then((scoreMoyenJoueur) => {
                    console.log("Score moy", scoreMoyenJoueur);
                    for (i = 0; i < result.length; i++) {
                        infoPlayers.push({
                            "nbCards": JSON.parse(result[i].main).length,
                            "pseudo": result[i].pseudo,
                            "score": result[i].score,
                            'scoreMoyenJoueur': scoreMoyenJoueur[i]
                        })
                    }
                });
                socket.emit('infoGameOut', {
                    'center': JSON.parse(result[0].centre),
                    'archive': JSON.parse(result[0].archive),
                    'draw': JSON.parse(result[0].pioche).length,
                    'infoPlayers': infoPlayers,
                    'nbTurn': result[0].tour
                });
            }
        });
    });

    startGame(io, socket, db);
    scores(io, socket, db);
 
    chat(io, socket, db);
    sauvegardePartie(io, socket, db);
    gestionTours(io, socket, db);
    ICD(io,socket, db);
});

server.listen(port, () => {
    console.log('Serveur écoutant sur le port ' + port);
});
