import React, { useState, useEffect,  } from 'react';
import { useOutletContext } from "react-router-dom";
import {cardImgName,importImages,generatePointCards,generatePointWonCards,circlePoints} from '../Shared/gameShared.js'
import Modal from 'react-modal';

function HowToplay(){
    const [showModal, setShowModal] = useState(false);
    const styles = {
        body: {
            fontFamily: 'Arial, sans-serif'
        },
        h1: {
            color: '#FF0000'
        },
        h2: {
            color: '#0000FF'
        },
        p: {
            color: '#008000'
        }
    };
    return(
        <>
            <button onClick={()=>{setShowModal(true)}} >Comment jouer</button >
            <Modal isOpen={showModal} onRequestClose={()=>{setShowModal(false)}} ariaHideApp={false}>
            <div className='howtoPlay'>
                <h1>COMMENT JOUER</h1>
                <p>À son tour, un joueur joue une carte de sa main pour attaquer l'ennemi dans le but de le vaincre.</p>
                <ul>
                    <li>La valeur des cartes détermine les dégâts</li>
                    <li>La couleur détermine un pouvoir spécial</li>
                </ul>
                <p>Les joueurs ne peuvent pas communiquer à propos des cartes qu'ils ont en main. Mais si ils souhaitent jouer une partie plus facile, ils sont libres de le faire !</p>

                <h1>TOUR DE JEU</h1>
                <p>Un tour se déroule en 4 étapes :</p>
                <ol>
                    <li>Jouer une carte (ou passer)</li>
                    <li>Activer le pouvoir de sa couleur</li>
                    <li>Infliger les dégâts (et vérifiez si l'ennemi est vaincu)</li>
                    <li>Subir l'attaque ennemie en défaussant des cartes</li>
                </ol>

                <h2>Étape 1 : Jouer une carte de sa main (ou passer)</h2>
                <p>Posez-la devant vous sur la table. La valeur de la carte détermine la valeur de l'attaque (par exemple, un 7 de Cœur infligera 7 dégâts). PASSER : voir plus bas.</p>

                <h2>Étape 2 : Activer le pouvoir de la couleur de la carte</h2>
                <p>Une attaque est toujours associée à un pouvoir relatif à la couleur de la carte jouée. Les pouvoirs de couleur rouge sont immédiats, les pouvoirs de couleur noire prennent effet dans les étapes suivantes.</p>
                <ul>
                    <li>♥ CŒUR - Régénère la pioche</li>
                    <li>♦ CARREAU - Piochez des cartes à la Taverne</li>
                    <li>♣ TRÈFLE - Double les dégâts</li>
                    <li>♠ PIQUE - Protège de l'attaque ennemie</li>
                </ul>
                <h2>Étape 3 : Infliger les dégâts et vérifier si l'ennemi est vaincu</h2>
                <p>VALETS : Vie 20 - Attaque 10</p>
                <p>DAMES : Vie 30 - Attaque 15</p>
                <p>ROIS : Vie 40 - Attaque 20</p>
                <p>La valeur de l'attaque est infligée à l'ennemi. Les dégâts sont permanents entre les tours.</p>
                <p>Dès qu'une attaque égale ou dépasse les points de vie actuels de l'ennemi, celui-ci est vaincu.</p>
                <p>Dans ce cas, procédez comme suit :</p>
                <ol>
                    <li>Retirez l'ennemi. Si les joueurs ont :
                        <ul>
                            <li>dépassé ses points de vie, défaussez-le face visible sur le dessus de la défausse.</li>
                            <li>strictement égalé ses points de vie, placez-le face cachée sur le dessus de la Taverne.</li>
                        </ul>
                    </li>
                    <li>Défaussez toutes les cartes jouées contre l'ennemi.</li>
                    <li>Dévoilez la prochaine carte du dessus de la pile Château.</li>
                    <li>Le joueur actif saute l'étape 4 et il commence le nouveau tour contre l'ennemi dévoilé (depuis l'étape 1).</li>
                </ol>

                <h2>Étape 4 : Subir l'attaque de l'ennemi en défaussant des cartes</h2>
                <p>Si l'ennemi n'est pas vaincu, il attaque le joueur actif, et lui inflige une valeur de dégâts égale à sa valeur d'attaque. Si des boucliers (Piques) sont déployés sur la table, son attaque est réduite de la valeur totale des boucliers de tous les joueurs.</p>
                <p>Le joueur actif doit défausser des cartes de sa main afin que leur valeur totale égale ou dépasse la valeur de l'attaque ennemie. Défaussez les cartes une par une, face visible sur la défausse.</p>
                <p>Il est possible d'avoir une main vide suite à la résolution de cette étape.</p>
                <ul>
                    <li>Si le joueur ne peut pas défausser assez de cartes pour assumer la totalité de la valeur requise, il est vaincu et toute l'équipe a perdu.</li>
                    <li>Si le joueur n'est pas vaincu, le joueur suivant commence un nouveau tour depuis l'étape 1.</li>
                </ul>
                <p>Défaussés, les Animaux de Compagnie ont une valeur de 1 et les Jokers ont une valeur de 0.</p>

                <h2>ENNEMIS</h2>
                <p>VALETS DAMES ROIS</p>
                <p>Points de vie : 20 30 40</p>
                <p>Points d'attaque : 10 15 20</p>
                <p>IMMUNITÉ : Chaque ennemi est immunisé contre le pouvoir de sa propre couleur.</p>
                <p>Le pouvoir d'une carte de même couleur que l'ennemi ne peut donc pas être appliqué, mais l'attaque à bien lieu.</p>
                <p>Par exemple, les joueurs ne piocheront pas si une carte Carreau est jouée contre un Valet de Carreau. De la même manière, un bouclier ne peut pas prendre effet face à un ennemi de Pique.</p>
                <p>Cependant, un Joker peut être joué pour annuler l'immunité d'un ennemi.</p>
            </div>
                <button onClick={()=>{setShowModal(false)}}>Fermer</button>
            </Modal>
        </>
    )
}


function GameBoard() {
    const [playerPositions, setPlayerPositions] = useState([]);
    const { Info } = useOutletContext();
    const infoPlayers = Info.infoPlayers
    var numberOfPlayers = infoPlayers ? infoPlayers.length : 0;

    useEffect(() => {
        const handleResize = () => {
            setPlayerPositions(circlePoints(300, numberOfPlayers));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [numberOfPlayers]);

    return (
        <div className="battle-game-board">
            {playerPositions.map((position, index) => (
                <Player key={index} x={position.x} y={position.y} pseudo={infoPlayers[index]['pseudo']} nbCards={infoPlayers[index]['nbCards']} />
            ))}
        </div>
    );
};

function CardHand(props) {
    const { socket, idJ, images, myAction, setMyAction, idParty , cards} = useOutletContext();

    function play() {
        if (myAction==='jouerCarte'|myAction==='defausserCarte') {
            console.log("On joue la carte :", props.value);
            socket.emit('playerAction', { "carte": props.value, "action": myAction, "playerId": idJ, "idPartie" : idParty });
            setMyAction(null);
            cards.splice(cards.indexOf(props.value),1);
        }
    }

    const cardStyle = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
        width: '100px', // Ajustez la largeur selon vos besoins
        height: '150px', // Ajustez la hauteur selon vos besoins
        textAlign: 'center',
        padding: '10px',
    };
    return (
        <div>
            <img src={images[cardImgName(props.value)]} onClick={play} alt={"image de" + cardImgName(props.value)} style={cardStyle} className='CardHand' />
        </div>
    );
}

function CardsHand() {
    const { cards   } = useOutletContext();
    var nbCards = cards ? cards.length : 0; 
    const [pointsCards, setPointCards] = useState(generatePointCards(nbCards+1, 75, 100));

    useEffect(() => {
        const handleResize = () => {
            setPointCards(generatePointCards(nbCards+1, 75, 100));
        };
        window.addEventListener('resize', handleResize);
        handleResize()
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [nbCards]);

    console.log("point",pointsCards.x,cards);

    return (
        <div>
            {cards.map((card, index) =>
                <CardHand key={index} value={card} x={pointsCards.x[index]} y={pointsCards.y} />
            )}
            <PassCard x={pointsCards.x[nbCards]} y={pointsCards.y} />
        </div>
    );
}

function PassCard(props){
    const { socket, idJ, images, myAction, setMyAction, idParty } = useOutletContext();
    function passTurn(){
        if (myAction==='jouerCarte') {
            socket.emit('playerAction', {"action": "passerTour", "playerId": idJ, "idPartie" : idParty });
            setMyAction(null);
        }
    }
    const cardStyle = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
        width: '100px', // Ajustez la largeur selon vos besoins
        height: '150px', // Ajustez la hauteur selon vos besoins
        textAlign: 'center',
        padding: '10px',
    };
    return (
        <div>
            <img src={images['passCard']} onClick={passTurn} alt={"image pour passer son tour"} style={cardStyle} className='CardHand' />
        </div>
    );
    
}

function Player(props) { 
    const { pseudo, OtherPlayerAction, myAction, Info} = useOutletContext();
    const playerStyle = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
    };
    return (
        <div className="battle-player" style={playerStyle}>
            {(props.pseudo === pseudo)? <p>{myAction === "jouerCarte" ? "A vous de jouer !" :myAction === "defausserCarte"? "défausser des cartes pour vous proteger!":"Veuillez attendre votre tour..."}</p> : <></>}
            <p>{props.pseudo + (props.pseudo === pseudo ? "(vous)" : "")}</p>
            <p>{props.nbCards} cartes</p>
            {OtherPlayerAction.includes(props.pseudo) ? props.pseudo in Info.center ? <Card x={100} y={100} value={Info.center[props.pseudo]}/> :<Card x={100} y={100}/> : <></> }
        </div>);
};

function Card(props) {
    const { images } = useOutletContext();
    const src = props.value ? images[cardImgName(props.value)] : images['./dos.png'];
    const cardStyle = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
        width: '100px', 
        height: '150px', 
        textAlign: 'center',
        padding: '10px',
    };
    return (
        <img style={cardStyle} src={src} alt={props.value ? "image de" + props.value.valeur + " " + props.value.enseigne : "dos de carte"} />
    );
}

function Draw() {
    const { Info, myAction,setMyAction,idJ, idParty,socket} = useOutletContext()
    const draw = Info.draw ? Info.draw : 0;
    const [midX, setMidX] = useState(window.innerWidth / 2);
    const [midY, setMidY,] = useState(window.innerHeight / 2);
    function handleClick(){
        if(myAction==='piocherCarte'){
            socket.emit("playerAction",{"action":myAction,"playerId":idJ,"idPartie":idParty})
            setMyAction(null);
        }
        return;
    }
    useEffect(() => {
        const handleResize = () => {
            setMidX(window.innerWidth / 2);
            setMidY(window.innerHeight / 2);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div>
            <p style={{ position: 'absolute', left: `${midX - 50}px`, top: `${midY - 50}px` }}>Il y a : {draw} cartes dans la pioche</p>
            <div onClick={handleClick}>
            <Card x={midX} y={midY} />
            </div>
        </div>
    );
}

function Boss(){
    const {Info} = useOutletContext();
    const [midX, setMidX] = useState(window.innerWidth / 2);
    const style = {
        position: 'absolute',
        left: `${midX-75}px`,
        top: '10px',
    }
    useEffect(() => {
        const handleResize = () => {
            setMidX(window.innerWidth / 2);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    if(Info.archive?.boss){return(
        <div className="boss" style={style}>
                <u style={{color:'red'}}>Immunité {Info.archive.boss.card.enseigne}</u>
                <p>Attaque : {Info.archive.boss.atk}</p>
                <p>PV : {Info.archive.boss.hp}</p>
                <Card x={150} y={15} value={Info.archive.boss.card}/> 
        </div>
    )}
    return(<></>);
}

function Regicide(){
    const {setImages} = useOutletContext()
    useEffect(() => {
        const fetchInfoServ = async () => {
            const images = importImages("Battle");
            images['passCard'] = require("../../Assets/img/passCard.png")
            setImages(images);
        }
        fetchInfoServ();
        return () => {};
    },[]);

    return (
        <div className='BattleBody'>
        <HowToplay />
        <Boss />
        <GameBoard />
        <CardsHand />
        <Draw />
        </div>
    )
}

export default Regicide;