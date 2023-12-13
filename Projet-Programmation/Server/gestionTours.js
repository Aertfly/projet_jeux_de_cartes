var tour = 0;

var gestionTours = function(io, db, partie) {
    io.on('playerLeaving', () => { // Quand un joueur quitte la partie
        db.query("SELECT * FROM joue WHERE idPartie = ?", [partie.idPartie], async (err, result) => {
            if(err){
                throw err;
            }
            nbJoueurs = new Map(Array.from(result, (key, value) => [key, value])).size;
            console.log("Il y a " + nbJoueurs + " joueurs dans la partie " + partie.idPartie);
            if (nbJoueurs == 0){
                // Plus aucun joueur n'est dans la partie
                clearInterval(compterJoueurs);
                io.emit
                console.log("Il n'y a plus aucun joueur");
                db.query("DELETE FROM parties WHERE idPartie = ?", [partie.idPartie], async(err, result) =>{
                    if(err || result.affectedRows != 1){
                        console.log("La partie a déjà été supprimée");
                    } else {
                        console.log("Normalement la partie a bien été supprimée");
                    }
                });
            }
        });
    });
    mainsBis = null;
    console.log(mainsBis);
    recupererMains(db, partie.idPartie,mainsBis);
    while(mainsBis == null){
        // console.log(mainsBis);
    }
    console.log(mainsBis);
}

function recupererMains(db,idPartie, retour){
    retour = null;
    db.query('SELECT pseudo, main FROM joueurs, joue WHERE idPartie = ? AND joue.idJ=joueurs.idJ', [idPartie], async(err, result) =>{
        console.log("ici");
        if(err){
            console.log('Erreur lors de la connexion');
            throw err;
        }
        var mains = new Map();
        result.forEach(element => {
            mainDuJoueur = JSON.parse(element.main);
            if(mainDuJoueur.length > 0){
                console.log("Le joueur " + element.pseudo + " a " + mainDuJoueur.length + " carte(s)")
                mains.set(element.pseudo, mainDuJoueur);
            } else {
                console.log("Le joueur " + element.pseudo + " n'a plus de cartes");
            }
        });
        // console.log(mains);
        console.log("Il y a " + mains.size + " joueurs qui ont encore des cartes");
        for(const [key, value] of mains){
            retour.set(key,value);
        }
        console.log("Affectation mais c'est trop tard ?")
    });
}

module.exports = gestionTours;