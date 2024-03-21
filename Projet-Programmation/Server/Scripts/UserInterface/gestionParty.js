const rooms = [];

const gestionParty = function (io, socket, db) {

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
                const request = 'INSERT INTO `parties`(`idPartie`, `joueursMin`, `joueursMax`, `sens`, `tour`, `type`, `sauvegarde`, `centre`, `archive`, `pioche`, `publique`) VALUES (?, ?, ?, ?, -1, ?, 0, "{}", "{}", ?, ?)';
                db.query(request, [partyId, minValue, maxValue, sens, selectedGame,JSON.stringify({pioche:[]}), estPublicNum], (err) => {
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
                        socket.emit('joinGame', { "playerList": [pseudo], "idParty": partyId });
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
};

module.exports = gestionParty;