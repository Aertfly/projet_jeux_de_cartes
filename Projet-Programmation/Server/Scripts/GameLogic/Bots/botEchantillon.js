const {Card} = require("../startGame");

/*
    Le bot qui choisit implémente une dizaine de simulations du round pour savoir
    quel choix est le moins risqué à prendre en fonction du nombre de tête de boeufs
    ramassées.
*/



const roundTest = (carte, table) => {
    let pts = 0;
    let i = 0;
    while (i < table.length && carte.value > table[i][table[i].length - 1].value) {
        i += 1;
    }

    if (i === table.length || carte.value < table[0][table[0].length - 1].value) {
        const ligne = Math.floor(Math.random() * 4) + 1;
        pts = table[ligne - 1].reduce((acc, card) => acc + card.cowsNb, 0);
        table[ligne - 1] = [carte];
    } else {
        if (table[i - 1].length === 5) {
            pts = table[i - 1].reduce((acc, card) => acc + card.cowsNb, 0);
            table[i - 1] = [carte];
        } else {
            table[i - 1].push(carte);
        }
    }

    return [pts, table];
};

const simulation = (carteJoueur, autres_cartes_joueurs, table) => {
    let plateau_temporaire = table.map(ligne => [...ligne]);

    for (let card_value of autres_cartes_joueurs) {
        let card = new Card(card_value);
        if (card.value < carteJoueur.value) {
            [, plateau_temporaire] = roundTest(card, plateau_temporaire);
        }
    }

    let [nb_points_gagnes,] = roundTest(carteJoueur, plateau_temporaire);
    return nb_points_gagnes;
};

const botEchantillon = (players, table, nbsimul, hand, alreadyPlayedCards) => {
    /*
        players : une liste des joueurs
        table : une liste de listes des cartes du jeu (au format Card)
        nbsimul : un int pour indiquer le nombre de simulation à faire par round
        hand : une liste de Card, pour représenter la main du bot
        alreadyPlayedCards : une liste contenant les cartes déjà joués (plus disponible)
    */
    let resultatsRounds = [];
    let listeCartesPossibles = Array.from({ length: 104 }, (_, i) => i + 1);

    hand.concat(alreadyPlayedCards).forEach(element => {
        const index = listeCartesPossibles.indexOf(element.value);
        if (index !== -1) {
            listeCartesPossibles.splice(index, 1);
        }
    });

    for (let i = 0; i < nbsimul; i++) {
        let autreJoueursCartes = [];
        while (autreJoueursCartes.length < players.length - 1) {
            let carteRandom = listeCartesPossibles[Math.floor(Math.random() * listeCartesPossibles.length)];
            if (!autreJoueursCartes.includes(carteRandom)) {
                autreJoueursCartes.push(carteRandom);
            }
        }

        let resultatParties = [];
        for (let carte of hand) {
            resultatParties.push(simulation(carte, autreJoueursCartes, table));
        }
        resultatsRounds = resultatsRounds.concat(resultatParties);
    }

    let carte_min_pts = Math.min(...resultatsRounds);
    let cartes_min = hand.filter((_, index) => resultatsRounds[index] === carte_min_pts);
    if (cartes_min.length) {
        return cartes_min.reduce((a, b) => a.value > b.value ? a : b); // Retourne la carte avec le moins de points et la plus grosse en cas d'égalité
    } else {
        return hand[hand.length - 1]; // En cas d'erreur, ça peut arriver quand une carte rapporte un minimum de points, mais dans peu de situation
    }
};

module.exports = botEchantillon;