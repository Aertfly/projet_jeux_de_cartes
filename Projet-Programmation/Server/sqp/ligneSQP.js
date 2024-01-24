function queryLine(db, lineName, tableName, condition, value) {
    if (!db || !tableName || !lineName || !condition || !value) {
        return Promise.reject("Paramètres invalides");
    }

    return new Promise((resolve, reject) => {
        const query = `SELECT ${lineName} FROM ${tableName} WHERE ${condition} = ?`;

        db.query(query, [value], (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'exécution de la requête :', error);
                reject(error);
            } else {
                resolve(results[0][lineName]);
            }
        });
    });
}

const ligneSQP = function(io, socket, db, data){
    // On récupère le centre
    queryLine(db, "centre", "parties", "idPartie", data.idPartie).then((centre) => {    
        // On récupère LA carte du joueur au centre (il a déjà joué sa carte, là il dit simplement quelle ligne il veut remplacer)
        carteActuelle = centre[data.idJoueur];

        // On enlève LA carte du centre
        centre = Object.keys(centre).filter((clé) => clé !== carteActuelle[0])
        .reduce((objet, clé) => {
            objet[clé] = centre[clé];
            return objet;
        }, {});

        // On met à jour le centre dans la bd
        db.query("UPDATE parties SET centre=? WHERE idPartie=?", [JSON.stringify(centre), idPartie], (err, result) => {
            if(err) throw err;
            console.log("BDD mise à jour" + result);
        });

        remplacerLigne(db, idJ, idPartie, data.ligne, carteActuelle);
    });
}

module.exports = ligneSQP;
