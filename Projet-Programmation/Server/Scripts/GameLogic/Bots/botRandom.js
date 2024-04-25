function botRandom(hand){
    return hand[Math.random() * (hand.length)];
}

function getRandomLine(){
    return Math.random() * (4)
}

module.exports = {botRandom,getRandomLine}