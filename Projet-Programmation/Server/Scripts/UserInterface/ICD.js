const asso = new Map();
const bcrypt = require('bcrypt');
const abandon = require('./abandon.js');
const { getMaxId } = require('./utils.js');
const ICD = function(io,socket,db){

    socket.on('connexion', async (data) => {
        const { pseudo, password } = data;

        if (asso.has(socket.id)) {
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
                        if (match && !asso.has(result[0].idJ)) {
                            asso.set(socket.id, result[0].idJ);
                            socket.emit('infoPlayer', { 'idJ': result[0].idJ, 'pseudo': result[0].pseudo });
                            socket.emit('resultatConnexion', "Connexion réussie");
                            console.log('Connexion réussie');
                            console.log(asso);

                        } else {
                            const r = (asso.has(result[0].idJ)) ? "Déjà connecté" : "Mot de passe incorrect";
                            socket.emit('resultatConnexion', r);
                            console.log(r);
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
                        const insertUserQuery = 'INSERT INTO joueurs (idJ,pseudo, motdepasse) VALUES (?,?, ?)';
                        db.query(insertUserQuery, [await (getMaxId(db)),pseudo, hashedPassword], async (err) => {
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

        if (asso.has(socket.id)) {
            asso.delete(socket.id);
            console.log('Un utilisateur s\'est déconnecté via la déconnexion manuelle');
            console.log(asso);
        }
    });

    socket.on("disconnect", (reason) => {
        if (reason == "ping timeout") { // Si le joueur se reconnecte après une déconnexion par manque de co
            abandon(io,db, socket, 'playerDisconnect', asso.get(socket.id));
            if (asso.has(socket.id)) {
                asso.delete(socket.id);
                console.log('Un utilisateur s\'est déconnecté via la déconnexion manuelle');
                console.log(asso);
            }
        } else {
            abandon(io,db, socket, 'playerLeaving', asso.get(socket.id));
            if (asso.has(socket.id)) {
                asso.delete(socket.id);
                console.log('Un utilisateur s\'est déconnecté via la déconnexion manuelle');
                console.log(asso);
            }
        }
    });

    socket.on('playerLeaving', (idJ) => {
        abandon(io,db, socket, 'playerLeaving', idJ)
    })
    abandon(io, socket, db);
};

module.exports = {ICD,asso};
