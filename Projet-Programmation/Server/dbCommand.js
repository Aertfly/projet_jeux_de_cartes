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

