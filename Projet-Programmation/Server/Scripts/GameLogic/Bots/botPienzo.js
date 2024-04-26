function botPienzo(carteJoueur, table) {
    
    const safeZone = 4;
  
    // Déterminer la ligne avec le moins de cartes
    let minimum = Infinity;
    let indice = 0;
    for (let i = 0; i < table.length; i++) {
      const ligneLongueur = table[i].length;
      if (ligneLongueur < minimum) {
        minimum = ligneLongueur;
        indice = i;
      }
    }
  
    // On a trouvé la ligne la plus petite
    while (indice < 4) {
      if (table[indice].length === minimum && minimum < safeZone) {
        for (const carte of carteJoueur) {
          if (carte > table[indice][table[indice].length - 1]) {
            // Si on a une carte qui pourrait aller dans la ligne la moins remplie
            if (indice === 3) {
              // Si on joue sur la dernière ligne
              return carte;
            } else if (carte < table[indice + 1][table[indice + 1].length - 1]) {
              // Si la carte ne pourrait pas aller sur la ligne d'après
              return carte;
            }
            // La carte irait sur la ligne d'après, en fait on ne la joue pas
          }
        }
      }
      indice++;
    }
  
    // On joue la dernière carte de la main par défaut
    return carteJoueur[carteJoueur.length - 1];
  }
  
  module.exports = botPienzo;