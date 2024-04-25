function botMax(hand){
    console.log("Le bot max est appellé avec la main :",hand,hand[hand.length - 1]);
    return hand[hand.length - 1]
}

function botMin(hand){ 
    console.log("Le bot min est appellé avec la main :",hand,hand[0]);
    return hand[0]
}

module.exports = {botMax,botMin}