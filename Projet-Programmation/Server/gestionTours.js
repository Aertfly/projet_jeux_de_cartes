var tour = 0;

var gestionTours = function(io, db, partie, finPartie) {
    //setInterval(()=>{
    //while (tour >= 0){
        // On récupère la liste des joueurs qui peuvent encore jouer
        try {
            const recupererMains = 'SELECT pseudo, main FROM joueurs, joue WHERE idPartie = ? AND joue.idJ=joueurs.idJ';
            db.query(recupererMains, [partie.idPartie], async (err, result) => {
                if (err) {
                    console.log('Erreur lors de la connexion');
                    throw err;
                } 
                if(result.length > 10){
                    result.forEach(element => {
                        console.log("\n" + element.pseudo + "\n" + element.main + "\n");
                    });
                } else {
                    tour = -2
                    // On attend que tous les joueurs aient quitté la partie
                    const compterJoueurs = setInterval(() => {
                        db.query("SELECT * FROM joue WHERE idPartie = ?", [partie.idPartie], async (err, result) => {
                            if(err){
                                throw err;
                            }
                            nbJoueurs = new Map(Array.from(result, (key, value) => [key, value])).size;
                            console.log("Il y a " + nbJoueurs + " joueurs dans la partie " + partie.idPartie);
                            if (nbJoueurs == 0){
                                // Plus aucun joueur n'est dans la partie
                                clearInterval(compterJoueurs);
                                console.log("Il n'y a plus aucun joueur");
                                finPartie()
                                db.query("DELETE FROM parties WHERE idPartie = ?", [partie.idPartie], async(err, result) =>{
                                    if(err || result.affectedRows != 1){
                                        throw err;
                                    }
                                    console.log("Normalement la partie a bien été supprimée");
                                });
                            }
                        });
                    },1000);        
                }
            });
        } catch (error) {
            console.error("Erreur : " + error);
        }
    //}
    //,5000);
}

module.exports = gestionTours;