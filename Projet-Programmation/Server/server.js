const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const server = http.createServer(app);

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

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté ' + socket.id);

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
                            connectedUsers[socket.id] = true;
                            socket.emit('resultatConnexion', "Connexion réussie");
                            console.log('Connexion réussie');
                            console.log(connectedUsers);
                        } else {
                            socket.emit('resultatConnexion', "Mot de passe incorrect");
                            console.log('Mot de passe incorrect');
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

    socket.on('deconnexion', () => {
        if (socket.id in connectedUsers) {
            delete connectedUsers[socket.id];
            socket.emit('deconnexion', "Déconnexion réussie !");
            console.log('Un utilisateur s\'est déconnecté via la déconnexion manuelle');
        }
    });


    socket.on('disconnect', (reason) => {
        console.log('Un utilisateur s\'est déconnecté ' + reason + " " + socket.id);
        delete connectedUsers[socket.id];
    });

});

server.listen(port, () => {
    console.log('Serveur écoutant sur le port ' + port);
});

partie = { "idPartie": "ABC" }
const gestionTours = require('./gestionTours.js');
gestionTours(io, db, partie); // Ceci devrait désormais fonctionner