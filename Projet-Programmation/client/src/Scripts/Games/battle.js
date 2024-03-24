import React, { useState, useEffect,  } from 'react';
import { useOutletContext } from "react-router-dom";
import {cardImgName,importImages,generatePointCards,generatePointWonCards,circlePoints} from '../Shared/gameShared.js'
import Modal from 'react-modal';


function WonCardComponent(){
    const {socket, idParty , idJ} = useOutletContext();
    const [showModal, setShowModal] = useState(false);
    const [wonCards,setWonCards] = useState([]);
    const pointsCards = generatePointWonCards(wonCards.length, 100, 150);

    const customStyles = {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px'
        }
      };

    const handleClick = () => {
        socket.on('dealingWonCards',(data)=>{
            console.log("Cartes gagnées reçu",data);
            setWonCards(data.Cards);
            setShowModal(true);
        });
        socket.emit('requestWonCards',{"idParty":idParty,"idJ":idJ});
    }


    return(
        <>
            <button onClick={handleClick} >Carte gagnées </button >
            <Modal isOpen={showModal} onRequestClose={()=>{setShowModal(false)}} style={customStyles} ariaHideApp={false}>
                <h2>Liste de vos cartes gagnées</h2>
                {wonCards&&pointsCards.length>0?wonCards.map((card, index) =>
                <Card key={index} value={card} x={pointsCards[index].x} y={pointsCards[index].y} />
                ):<p>Vous n'avez gagné aucune carte</p>}
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
        console.log("Je clique sur la carte :", props.value)
        if (myAction) {
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
        width: '100px',
        height: '150px',
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
    const [pointsCards, setPointCards] = useState(generatePointCards(nbCards, 75, 100));

    useEffect(() => {
        const handleResize = () => {
            setPointCards(generatePointCards(nbCards, 75, 100));
        };
        window.addEventListener('resize', handleResize);
        handleResize()
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [nbCards]);

    //console.log(pointsCards);

    return (
        <div>
            {cards.map((card, index) =>
                <CardHand key={index} value={card} x={pointsCards.x[index]} y={pointsCards.y} />
            )}
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
    console.log("Action autres",OtherPlayerAction); 
    return (
        <div className="battle-player" style={playerStyle}>
            {(props.pseudo === pseudo)? <p>{myAction === "jouerCarte" ? "A vous de jouer !" : "Veuillez attendre votre tour..."}</p> : <></>}
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



function Battle() {
    const {Info,setImages} = useOutletContext()

    useEffect(() => {
        setImages(importImages("Battle"));
        return () => {};
    },[]);

    return (
        <div className='BattleBody'>
            {Info === undefined ? (
                "CHARGEMENT..."
            ) : (
                <>
                    {/*<Draw /> car on n'a pas besoin d'une pioche dans la bataille*/}
                    {/*<Center />*/}
                    <GameBoard />
                    <CardsHand />
                    <WonCardComponent />
                </>
            )}
        </div>
    );
}

export default Battle;