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
                <h2>Liste de vos cartes gagnées !</h2>
                {wonCards&&pointsCards.length>0?wonCards.map((card, index) =>
                <Card key={index} value={card} x={pointsCards[index].x} y={pointsCards[index].y} />
                ):<p>Vous n'avez gagnées aucune carte</p>}
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
    console.log("Action autres",OtherPlayerAction); 
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
            console.log("Je demande à piocher");
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

    console.log("Affichage du boss !",Info);
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
        <Boss />
        <GameBoard />
        <CardsHand />
        <WonCardComponent />
        <Draw />
        </div>
    )
}

export default Regicide;