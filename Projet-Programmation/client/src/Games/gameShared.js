
/**
 * Récupére toute les images .png du dossier d'un jeu
 * @param {string} gameName nom du dossier du jeu (normalement toujours le nom du jeu)
 * @returns {object} Dictionnaire ayant pour clé "./" + card.valeur + "-" + card.enseigne + ".png" et pour valeur sa référence
 */ 
function importImages(gameName){
    const importAll = (context) => {
        return Object.fromEntries(
            context.keys().map((key) => [key, context(key)])
        );
    };
    console.log('../img/' + gameName)
    return importAll(require.context('../img/Battle', false, /\.(png)$/));
}

function circlePoints(r, nb) {
    const radius = r;
    const angleIncrement = (2 * Math.PI) / nb;
    const positions = [];

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < nb; i++) {
        const angle = i * angleIncrement;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        positions.push({ x, y });
    }
    return positions;
}

function generatePointCards(nb, widthCards, heightCards) {
    const width = window.innerWidth;
    const listPoints = [];
    const ecart = (width - widthCards - 500) / (nb - 1) //-500 pour éviter de déborder sur le chat --> notez qu'il faudrait aussi rendre l'affichage du chat dynamique...

    for (var i = 0; i < nb; i++) {
        var x = widthCards + i * ecart;
        listPoints.push(x);
    }
    return {
        'y': window.innerHeight - heightCards - 100,
        'x': listPoints
    }
}

function cardImgName(card) {
    return "./" + card.valeur + "-" + card.enseigne + ".png";
}

export  {cardImgName,importImages,generatePointCards,circlePoints}
