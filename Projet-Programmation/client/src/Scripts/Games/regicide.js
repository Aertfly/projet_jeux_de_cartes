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
            <div id='howtoPlay'>
            <h1>COMMENT JOUER</h1>
            <p>À son tour, un joueur joue une carte de sa main pour attaquer l'ennemi dans le but de le vaincre.</p>
            <ul>
                <li>La <span class="keyword">valeur</span> des cartes détermine les <span class="damage">dégâts</span></li>
                <li>La <span class="keyword">couleur</span> détermine un pouvoir spécial</li>
            </ul>
            <p>Les joueurs ne peuvent pas communiquer à propos des cartes qu'ils ont en main. Mais si ils souhaitent jouer une partie plus facile, ils sont libres de le faire !</p>

            <h1>TOUR DE JEU</h1>
            <p>Un tour se déroule en 4 étapes :</p>
            <ol>
                <li>Jouer une carte (ou passer)</li>
                <li>Activer le pouvoir de sa couleur</li>
                <li>Infliger les <span class="damage">dégâts</span> (et vérifiez si l'ennemi est vaincu)</li>
                <li>Subir l'attaque ennemie en défaussant des cartes</li>
            </ol>

            <h2>Étape 1 : Jouer une carte de sa main (ou passer)</h2>
            <p>Posez-la devant vous sur la table. La <span class="keyword">valeur</span> de la carte détermine la <span class="damage">valeur de l'attaque</span> (par exemple, un 7 de <span class="card-family heart">Cœur</span> infligera 7 <span class="damage">dégâts</span>). PASSER : voir plus bas.</p>

            <h2>Étape 2 : Activer le pouvoir de la couleur de la carte</h2>
            <p>Une attaque est toujours associée à un pouvoir relatif à la <span class="keyword">couleur</span> de la carte jouée. Les pouvoirs de couleur rouge sont immédiats, les pouvoirs de couleur noire prennent effet dans les étapes suivantes.</p>
            <ul>
                <li><span class="card-family red">♥ CŒUR</span> - Régénère la pioche</li>
                <li><span class="card-family red">♦ CARREAU</span> - Piochez des cartes à la Taverne</li>
                <li><span class="card-family black">♣ TRÈFLE</span> - Double les dégâts</li>
                <li><span class="card-family black">♠ PIQUE</span> - Protège de l'attaque ennemie</li>
            </ul>

            <h2>Étape 3 : Infliger les dégâts et vérifier si l'ennemi est vaincu</h2>
            <p><span class="card-family red">VALETS</span> : <span class="life">Vie 20</span> - <span class="damage">Attaque 10</span></p>
            <p><span class="card-family red">DAMES</span> : <span class="life">Vie 30</span> - <span class="damage">Attaque 15</span></p>
            <p><span class="card-family red">ROIS</span> : <span class="life">Vie 40</span> - <span class="damage">Attaque 20</span></p>
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
                <h2>LE JOKER</h2>
                <p>À l'étape 1, vous pouvez jouer un Joker (seul). Le Joker a une valeur de 0. Son pouvoir est d'annuler l'immunité de l'ennemi. Une fois le Joker joué, les pouvoirs relatifs à la couleur de l'ennemi pourront à présent être activés en jouant une carte.</p>
                <ul>
                    <li>Après avoir joué un Joker, le joueur actif saute directement les étapes 3 et 4 de son tour, et il détermine le joueur suivant.</li>
                    <li>Les joueurs ne peuvent jamais communiquer à propos leurs cartes en main, mais ils peuvent à ce moment là exprimer leur souhait (ou réticence) d'être choisi.</li>
                    <li>Si le Joker est joué contre un ennemi de Pique, les cartes Pique jouées précédemment prennent effet immédiatement pour le reste du combat contre lui.</li>
                    <li>Cependant, contre un ennemi de Trèfle, les cartes Trèfle jouées précédemment ne comptent pas double (leur attaque ayant déjà eu lieu).</li>
                </ul>

                <h2>ANIMAUX DE COMPAGNIE</h2>
                <p>Pendant l'étape 1, un Animal de Compagnie peut être joué seul, mais peut aussi être joué avec une autre carte (Joker exclu). Un Animal de Compagnie a une valeur de 1. Cette valeur s'ajoute à la valeur totale de l'attaque, tout comme le pouvoir de sa couleur.</p>
                <p>Par exemple, en jouant un 8 de Carreau avec l'Animal de Trèfle, la valeur de l'attaque de base est de 9, et les pouvoirs sont tous les deux appliqués : 9 cartes sont piochées par l'équipe, et la valeur finale de l'attaque est de 18.</p>
                <p>La carte que l'Animal accompagne peut être un autre Animal de Compagnie. À tout moment lorsque les pouvoirs de Cœur et de Carreau sont déployés ensemble, résolvez le Cœur (remplissage de la pioche) avant de piocher grâce au Carreau.</p>
                <p>Note : lorsque deux pouvoirs similaires sont joués ensemble, l'effet n'est appliqué qu'une seule fois.</p>

                <h2>COMBOS</h2>
                <p>Pendant l'étape 1, au lieu de jouer une seule carte, les joueurs peuvent jouer une combinaison de 2, 3 ou 4 cartes de même valeur (Animaux de Compagnie exclus). La valeur de l'ensemble doit être de 10 ou moins, ce qui permet les combinaisons suivantes :</p>
                <ul>
                    <li>une paire de 2, 3, 4 ou 5</li>
                    <li>un triple de 2 ou 3</li>
                    <li>un quadruple de 2</li>
                </ul>
                <p>Quand ces cartes sont jouées ensemble, la valeur de l'attaque et les pouvoirs sont déterminés ensuite par le total de la combinaison.</p>
                <p>Par exemple, pour un triple de 3 avec Carreau, Pique et Trèfle, les joueurs piochent 9 cartes, l'attaque ennemie est réduite de 9 points, et l'attaque du joueur est de 18 points.</p>
                <p>Note : lorsque deux pouvoirs similaires sont joués ensemble, l'effet n'est appliqué qu'une seule fois.</p>

                <h2>PIOCHER UN ENNEMI VAINCU</h2>
                <p>En main, les Valets valent 10, les Dames 15, et les Rois 20. Ces valeurs sont appliquées pour attaquer comme pour défausser suite à une attaque ennemie. Le pouvoir de leur couleur est appliqué comme pour les autres cartes.</p>

                <h2>PASSER</h2>
                <p>Au début de l'étape 1, il peut être plus judicieux de passer son tour au lieu de jouer une carte. Annoncez que vous passez et allez directement à l'étape 4 : vous n'attaquez pas mais l'ennemi réalise son attaque contre vous. Tous les joueurs ne peuvent pas passer consécutivement.</p>

                <h2>FIN DE PARTIE</h2>
                <p>VICTOIRE remportée par tous les joueurs une fois le dernier Roi vaincu.</p>
                <p>DÉFAITE de tous les joueurs dès qu'un joueur ne peut pas assumer la totalité des dégâts d'une attaque ennemie.</p>
                <button onClick={()=>{setShowModal(false)}}>Fermer</button>
            </div>

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
            <p style={{ position: 'absolute', left: `${midX }px`, top: `${midY - 50}px` }}>Pioche : {draw.pioche} </p>
            <p style={{ position: 'absolute', left: `${midX }px`, top: `${midY - 75}px` }}>Defausse : {draw.defausse} </p>
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