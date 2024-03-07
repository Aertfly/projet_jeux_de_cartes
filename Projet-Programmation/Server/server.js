// MODULES
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
// Dépendances 
const gestionTours = require('./gestionTours.js');
const gestionParty = require('./gestionParty.js');
const { startGame } = require('./startGame.js');
const { scores } = require('./scores.js');
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

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté ' + socket.id);
    socket.emit('firstConnection');

    startGame(io, socket, db);
    scores(io, socket, db);
    gestionParty(io, socket, db);
    chat(io, socket, db);
    sauvegardePartie(io, socket, db);
    gestionTours(io, socket, db);
    ICD(io,socket, db);

});

server.listen(port, () => {
    console.log('Serveur écoutant sur le port ' + port);
});
