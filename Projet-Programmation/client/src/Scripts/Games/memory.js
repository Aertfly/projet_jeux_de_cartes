import React, { useState, useEffect } from 'react';
import { useOutletContext } from "react-router-dom";
import {cardImgName,importImages,generatePointCards,circlePoints,quadrillagePoints} from '../Shared/gameShared.js'

function Card(props) {
    console.log("carte affichée :", props.id, ": ", props);
    console.log("test");
    const { images } = useOutletContext();
    const imagePath = (props.card === "dos") ? images['./dos.png'] : images[`./${props.card}.png`];
    
    const cardStyles = {
        position: 'absolute',
        ...(props.x !== undefined ? { left: `${props.x}px` } : {}),
        top: `${props.y}px`,
        width: '30px',
        height: '50px',
        border: `2px solid ${props.border}`, // Soit vert soit rouge soit gris
        textAlign: 'center',
        padding: '10px',
        backgroundColor: "#D3D3D3"
    };

    const imageStyles = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)', // Déplace l'image au centre
        width: '100%', // Utilise 150% de la largeur du conteneur parent
        height: '100%', // Utilise 150% de la hauteur du conteneur parent
        objectFit: 'contain', // Ajuste l'image pour s'adapter au conteneur sans déformer
    };

    return (
        <div style={cardStyles} onClick={props.onClick} className='CardHand' hidden={props.played}>
            <img src={imagePath} alt={`Card ${props.card}`} style={imageStyles} />
        </div>
    );
};


function Center() {
    const { Info, myAction, setMyAction, idJ , idParty, socket, images } = useOutletContext();
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);
    const positions = quadrillagePoints(6, 6, 120, 110);
    const board = Info.archive;
    // Le bouton pour valider son choix (si c'est notre tour et que une carte est sélectionnée)
    const showValidateButton = myAction === "jouerCarte" && selectedCardIndex !== null;

    console.log("Board", board);
    if (!board) return null;
    console.log("ce quon a dans images :", images);

    const handleCardClick = (card,rowIndex) => {
        // Gérez le clic sur la carte ici
        console.log("Carte du centre cliquée :", card === null ? "dos" : card, rowIndex);
        if (myAction === "jouerCarte" ){ 
            console.log("Affichage du bouton:",rowIndex);
            setSelectedCardIndex(rowIndex); // Sélection de la carte
        }
    };

    const handleValidateClick = () => {
        if (showValidateButton) {
            console.log("Validation de la carte :", selectedCardIndex);
            socket.emit('carte', { 'ligne': selectedCardIndex, 'idJoueur': idJ, 'idPartie': idParty }); // à modifier en fonction du côté server
            setSelectedCardIndex(null); // Réinitialisation de la sélection de carte
            setMyAction(null); // Fin de l'action
        }
    };

    const buttonContainerStyle = {
        position: 'fixed',
        bottom: '-180px',
        left: '50%',
        transform: 'translateX(-50%)',
    };

    const countShowedCard = (value) => {
        return Info.archive.filter(cardValue => cardValue === value && cardValue !== 0 && cardValue !== -1).length;
        // la vérification de 0 et -1 c'est pour ne pas mettre une bordure verte si les cartes sont cachés (car elles sont plusieurs à avoir -1)
    };

    const countSelectedCards = () => { // Les cartes face recto
        let count = 0;
        for (let i = 0; i < Info.archive.length; i++) {
            if (Info.archive[i] > 0) {
                count++;
            }
        }
        return count;
    };    

    const centerRows = positions.map((row, rowIndex) => {
        const rowCards = row.map((position, colIndex) => {
            const index = rowIndex * 6 + colIndex;
            const cardValue = Info.archive[index];
    
            let borderColor = null;
    
            if (countShowedCard(cardValue) === 2) {
                borderColor = "green";
            } else if (countShowedCard(cardValue) === 1 && countSelectedCards() === 2) {
                borderColor = "red";
            } else {
                borderColor = "gray";
            }
    
            let cardComponent = null;
    
            if (cardValue === -1 || cardValue > 0) {
                cardComponent = (
                    <Card
                        key={index}
                        id={index}
                        x={position.x}
                        y={position.y}
                        card={cardValue === -1 ? "dos" : cardValue}
                        border={borderColor}
                        onClick={() => handleCardClick(cardValue === -1 ? null : { cardValue }, index)}
                    />
                );
            }
    
            return cardComponent;
        });
    
        return rowCards.filter(Boolean); // Filtrer les éléments null
    });
    
    return (
        <div className="center-container">
            {centerRows.map((rowCards, rowIndex) => (
                <div key={rowIndex} className="row-container">
                    {rowCards}
                </div>
            ))}
            {showValidateButton && (
                <div style={buttonContainerStyle}>
                    <button style={buttonContainerStyle} onClick={handleValidateClick}>Valider</button>
                </div>
            )}
        </div>
    );
    
}

function Player(props) {
    const icon = props.icon
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

    // si props.score est le nombre carte accumulé, alors faire divisé par deux pour le nombre de pairs
    return (
        <>
        <div style={playerContainerStyle}>
            <img src={icon} alt="Bonhomme" style={imageStyle} />
            <p>{props.pseudo}</p>
            <p>{props.score} Pairs</p>
        </div></>
    );
}


function GameBoard() {
    const { Info } = useOutletContext();
    const icon = require('../../Assets/img/SQP/bonhomme.png');
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

    return (
        <div style={boardStyle}>
            <div className="players-list" style={playersListStyle}>
                {Info.infoPlayers &&
                    Info.infoPlayers.map((player, index) => ( // Faut voir si le score c'est le nombre de pair accumulé ou le nombre de cartes accumulé
                        <Player
                            key={index}
                            index={index}
                            pseudo={player.pseudo}
                            score={player.score}
                            icon = {icon}
                        />
                    ))}
            </div>
        </div>
    );
}

function Memory(){
    const {setImages} = useOutletContext();

    useEffect(() => {
        const Images = () => {
            setImages(importImages('Memory'));
        };
        Images()
        return () => {
            setImages(null);
        };
    }, [setImages]);

    return (
        <div>
            <Center />
            <GameBoard />
        </div>
    )
}

export default Memory;