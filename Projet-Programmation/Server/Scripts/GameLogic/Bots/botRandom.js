function botRandom(hand){
    console.log("Le bot random est appellé avec la main :",hand);
    return hand[Math.floor(Math.random() * hand.length)];
}

function getRandomLine(){
    return Math.floor(Math.random() * (4))
}

module.exports = {botRandom,getRandomLine}