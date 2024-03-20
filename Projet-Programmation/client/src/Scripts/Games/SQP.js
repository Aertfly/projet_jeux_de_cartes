import React, { useState, useEffect } from 'react';
import { useOutletContext } from "react-router-dom";

import {generatePointCards,quadrillagePoints} from '../Shared/gameShared.js'




function Card(props) {
    const image = require('../../Assets/img/SQP/boeuf.png');
    const boeufs = [];for(let i=0;i<props.card.nbBoeufs;i++){boeufs.push(i)}//pour la parcourir ensuite autant de fois qu'il y a de têtes
    
    const cardStyles = {
        position: 'absolute',
        ...(props.x !== undefined ? { left: `${props.x}px` } : {}),
        top: `${props.y}px`,
        width: '100px', // Ajustez la largeur selon vos besoins
        height: '150px', // Ajustez la hauteur selon vos besoins
        border: '1px solid black', // Bordure pour visualiser le rectangle
        textAlign: 'center',
        padding: '10px',
        backgroundColor: "#D3D3D3"
    };

    const textStyles = {
        position: 'absolute',
        bottom: '35px', // Ajustez la position verticale du texte
        left: '50%', // Centre le texte horizontalement
        transform: 'translateX(-50%)', // Centre le texte horizontalement
        color: 'white', // Couleur du texte (à ajuster selon vos besoins)
        fontSize: '50px'
    };

    return (
        <div style={cardStyles} onClick={props.onClick} className='CardHand' hidden={props.played}>
            <p style={textStyles}>{props.card.valeur} </p>
            <img src={image} alt="Fond de boeuf" style={{display:'inline', width: '100px', height: '100px'}}/>
                {boeufs.map((index) => (
                    <img key={index} src={image} alt="tête de boeuf" style={{display:'inline', width: '25px', height: '25px'}}/>
                ))}
        </div>
    );
};

function CardHand(props) {
    const {cards,setCards, idJ, myAction, socket, idParty , setMyAction } = useOutletContext();

    function onCardClick() {
        console.log("Je clique sur",props.value);
        if (myAction === "jouerCarte") {
            console.log("Moi le joueur d'id :", idJ, "joue la carte", props.value);
            socket.emit('playerAction', { "carte": props.value, "action": "joue", "playerId": idJ ,"idPartie": idParty});
            setMyAction(null);
            cards.splice(cards.indexOf(props.value),1);
            setCards(cards);
        }
    }

    return (
        <div>
            <Card
                x={props.x}
                y={props.y}
                card={props.value}
                onClick={() => onCardClick()}
            />
        </div>
    );
}

function CardsHand() {
    const {cards,myAction} = useOutletContext();
    const [pointsCards,setPointCards] = useState(generatePointCards(cards.length,100,150));
    var nbCards = cards ? cards.length : 0; 

    useEffect(() => {
        const handleResize = () => {
            setPointCards(generatePointCards(nbCards,100,150));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [nbCards]); 

    return (
        <div>
            <Countdown style={{left: `${pointsCards.x[nbCards-1]/2}px`,top: `${pointsCards.y - 100}px`,position:'absolute',fontSize: '25px'}}/>
            <p style={{left: `${pointsCards.x[nbCards-1]/2}px`,top: `${pointsCards.y - 75}px`,position:'absolute',fontSize: '25px'}}>{
            myAction==="jouerCarte"? "A vous de jouer !" : myAction==="choisirLigne" ? "Choissisez une ligne à récupérer":"Veuillez patienter..."}</p>
            {cards.map((card,index) => 
                <CardHand key={index} value={card} x={pointsCards.x[index]} y={pointsCards.y} />
            )}
        </div>
    );
}

function Countdown(props){
    const {myAction} = useOutletContext();
    const [number,setNumber] = useState(30);

    useEffect(() => {
        let interval;
        const decreaseNumber = () => {
            if (number <= 0){
                clearInterval(interval);
                setNumber(0)
            }else {
                setNumber(number-1);
            }
        }

        const cleanup = () => {
            clearInterval(interval);
        }

        if(myAction){
            interval = setInterval(decreaseNumber,1000)
        }else{
            setNumber(30);
        }

        return cleanup
    },[myAction,number])

    return (
        myAction ? <p style={props.style}>{number}</p> : <></>
    )
}

function Center() {
    const { Info, myAction,setMyAction, idJ , idParty, socket } = useOutletContext();
    const positions = quadrillagePoints(5, 4);
    const board = Info.archive;

    console.log("Board", board);
    if (!board) return null;

    const handleCardClick = (card,rowIndex) => {
        // Gérez le clic sur la carte ici
        console.log("Carte du centre cliquée :", card,rowIndex);
        if (myAction === "choisirLigne" ){
            console.log("Envoie ligne selectionnée serveur  :",rowIndex);
            socket.emit('ligne', {'ligne': rowIndex, 'idJoueur': idJ, 'idPartie': idParty})
            setMyAction(null)
        }
        //socket.emit('ligne', {ligne: 2, idJoueur: idJ, idPartie: idParty});
    };

    const centerRows = positions.map((row, rowIndex) => {
        const rowCards = row.map((position, colIndex) => {
            const card = board[rowIndex] && board[rowIndex][colIndex];
            return card ? (
                <Card key={colIndex} x={position.x} y={position.y} card={card} onClick={() => handleCardClick(card,rowIndex)} />
            ) : null;
        }).filter(Boolean); // Filtrer les éléments non définis

        return <div key={rowIndex} className="row-container">{rowCards}</div>;
    });

    return <div className="center-container">{centerRows}</div>;
}



function Player(props) {
    const { Info, OtherPlayerAction} = useOutletContext();
    const img = props.img
    const dosImg = props.dosImg;
    const colors = ['#FF5733', '#33FF57', '#5733FF', '#FF33A1', '#33B5FF', '#FFB533', '#A133FF', '#33FFEC', '#FF3344', '#8C33FF'];
    const playerColor = colors[props.index % colors.length];

    const playerContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px',
        marginRight: '5px',
        borderColor: playerColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        padding: '10px',
        borderRadius: '5px',
    };

    const imageStyle = {
        width: '50px',
        height: '50px',
        marginBottom: '10px',
    };

    const cardStyle = {
        width: '50px',
        height: '75px',
        marginBottom: '10px',
    };

    return (
        <>
        <div style={playerContainerStyle}>
            <img src={img} alt="Bonhomme" style={imageStyle} />
            <p>{props.pseudo}</p>
            <p>{props.score} Points</p>
            {OtherPlayerAction.includes(props.pseudo) ? props.pseudo in Info.center ? <Card  y={250} card={Info.center[props.pseudo]}/> :<img src={dosImg} alt="Dos de carte" style={cardStyle} /> : <></> }
        </div></>
    );
}



function GameBoard() {
    const { Info, OtherPlayerAction } = useOutletContext();
    const img = require('../../Assets/img/SQP/bonhomme.png');
    const dosImg = require('../../Assets/img/SQP/dos.png')
    const boardStyle = {
        position: 'absolute',
        top: '10px',
        right: '1%',
        transform: 'translateX(-50%)',
        border: '1px solid black',
        borderRadius: '5px',
        padding: '10px',
        backgroundColor: '#FFF',
    };

    const playersListStyle = {
        display: 'flex', // Aligner les joueurs horizontalement
    };
    console.log(OtherPlayerAction);
    console.log(Info.center);
    return (
        <div style={boardStyle}>
            <div className="players-list" style={playersListStyle}>
                {Info.infoPlayers &&
                    Info.infoPlayers.map((player, index) => (
                        <Player
                            key={index}
                            index={index}
                            pseudo={player.pseudo}
                            score={player.score}
                            img = {img}
                            dosImg = {dosImg}
                        />
                    ))}
            </div>
        </div>
    );
}



function SixQuiPrend() {
    return (
        <div>
            <GameBoard />
            <Center />
            <CardsHand />
        </div>
    );
    
}


export default SixQuiPrend;

