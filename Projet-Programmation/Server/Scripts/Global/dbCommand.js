function queryLine(db,condition,value,tableName,lineName){
    if (!db || !tableName || !lineName || !condition || !value) {
        return "Paramètres invalides";
    }
    const query = `SELECT ${lineName} FROM ${tableName} WHERE ${condition} = ${value}`;
    const results = db.query(query);
    return results.length > 0;
}

function updateTable(db,condition, value, tableName, lineName) {
    if (!db || !tableName || !lineName || !condition || !value) {
        return "Paramètres invalides";
    }
    const query = `UPDATE ${tableName} SET ${lineName} WHERE ${condition} = ${value}`;
    db.query(query, updateValues, (error, results) => {
        if (error) {
            console.error('Erreur lors de l\'exécution de la requête :', error);
        }
        });
};


function trierArchive(archive) {
    return archive.sort((ligneA, ligneB) => {
        const derniereCarteA = ligneA[ligneA.length - 1];
        const derniereCarteB = ligneB[ligneB.length - 1];

        if (derniereCarteA.valeur < derniereCarteB.valeur) {
            return -1;
        } else if (derniereCarteA.valeur > derniereCarteB.valeur) {
            return 1;
        } else {
            return 0;
        }
    });
}
