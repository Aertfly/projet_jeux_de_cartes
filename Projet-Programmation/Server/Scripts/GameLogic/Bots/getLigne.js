function getMinLigne(board){
    let ligne =0;
    let nbBoeufMin=66;
    let total;
    for (let i=0;i<4;i++){
        total = totalTete(board[i]) 
        if (total <= nbBoeufMin){
            ligne = i+1
            nbBoeufMin = total
        }
    }
    return ligne;
}

function totalTete(li){
    let sum =0
    for(card of li){
        sum += card.nbBoeufs 
    }
    return sum;
}

module.exports = getMinLigne;
