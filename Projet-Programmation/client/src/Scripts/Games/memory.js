import React, { useState, useEffect } from 'react';
import { useOutletContext } from "react-router-dom";
import {cardImgName,importImages,generatePointCards,circlePoints,quadrillagePoints} from '../Shared/gameShared.js'

function Card(props) {
    const {images} = useOutletContext();
    const imagePath = (props.card === null) ? images['./0.png'] : images[`./${props.card}.png`]; // Si j'ai bien compris on a les images comme ça

    const cardStyles = {
        position: 'absolute',
        ...(props.x !== undefined ? { left: `${props.x}px` } : {}),
        top: `${props.y}px`,
        width: '100px',
        height: '150px',
        border: `1px solid ${props.border}`, // Soit vert soit rouge soit gris
        textAlign: 'center',
        padding: '10px',
        backgroundColor: "#D3D3D3"
    };

    return (
        <div style={cardStyles} onClick={props.onClick} className='CardHand' hidden={props.played}>
            <img src={imagePath} alt={`Card ${props.card}`} />
        </div>
    );
};


function Center() {
    const { Info, myAction, setMyAction, idJ , idParty, socket } = useOutletContext();
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);
    const positions = quadrillagePoints(6, 6);
    const board = Info.archive;

    // Le bouton pour valider son choix (si c'est notre tour et que une carte est sélectionnée)
    const showValidateButton = myAction === "choisirCarte" && selectedCardIndex !== null;

    console.log("Board", board);
    if (!board) return null;

    const handleCardClick = (card,rowIndex) => {
        // Gérez le clic sur la carte ici
        console.log("Carte du centre cliquée :", card,rowIndex);
        if (myAction === "retournerCarte" ){ 
            console.log("Envoie la carte selectionnée côté serveur  :",rowIndex);
            setSelectedCardIndex(rowIndex); // Sélection de la carte
        }
    };

    const handleValidateClick = () => {
        if (selectedCardIndex !== null) {
            console.log("Validation de la carte :", selectedCardIndex);
            socket.emit('carte', { 'ligne': selectedCardIndex, 'idJoueur': idJ, 'idPartie': idParty }); // à modifier en fonction du côté server
            setSelectedCardIndex(null); // Réinitialisation de la sélection de carte
            setMyAction(null); // Fin de l'action
        }
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
                // Quand on a deux cartes visibles qui ont la même valeur, alors mettre la bordure verte car c'est une pair
                borderColor = "green";
            } else if (countShowedCard(cardValue) === 1 && countSelectedCards() === 2) {
                // Quand deux cartes retournées ont pas la même valeur, alors mettre la bordure rouge car ce n'est pas une pair
                borderColor = "red";
            } else {
                // Le reste du temps, ça veut dire que deux cartes n'ont pas été sélectionné, donc par défault la bordure est grise
                borderColor = "gray";
            }

            if (cardValue === -1) {
                // Cachée
                return <Card key={colIndex} x={position.x} y={position.y} card="null" border={borderColor} onclick={() => handleCardClick(null, {rowIndex})} />;
            } else if (cardValue > 0) {
                // Visible
                return <Card key={colIndex} x={position.x} y={position.y} card={cardValue} border={borderColor} onclick={() => handleCardClick({cardValue}, {rowIndex})} />;
            } else {
                // Pas de carte
                return null;
            }
        }).filter(Boolean); // Filtrer les éléments null
    
        return <div key={rowIndex} class="row-container">${rowCards.join('')}</div>;
    });

    return (
        <div className="center-container">
            {centerRows}
            {showValidateButton && <button onClick={handleValidateClick}>Valider</button>}
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
            setImages(importImages('Memory')); // La fonction de JM
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