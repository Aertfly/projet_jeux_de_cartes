import React, { useState, useEffect } from 'react';
import { useOutletContext } from "react-router-dom";
import {importImages,quadrillagePoints} from '../Shared/gameShared.js'
import { GameBoard } from './SQP.js';

function Card(props) {
    //console.log("carte affichée :", props.id, ": ", props);

    const { images } = useOutletContext();
    const imagePath = (props.card === "dos") ? images['./dos.png'] : images[`./${props.card}.png`];
    
    const cardStyles = {
        position: 'absolute',
        ...(props.x !== undefined ? { left: `${props.x}px` } : {}),
        top: `${props.y}px`,
        width: '25px',
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
    //console.log("ce quon a dans images :", images);

    const handleCardClick = (card,rowIndex) => {
        // Gérez le clic sur la carte ici
        console.log("Carte du centre cliquée :", card === null ? "dos" : card, rowIndex);
        if (myAction === "jouerCarte" ) {
            console.log("Affichage du bouton:",rowIndex);
            setSelectedCardIndex(rowIndex); // Sélection de la carte
        }
    };

    const handleValidateClick = () => {
        if (showValidateButton) {
            console.log("Validation de la carte :", selectedCardIndex);
            socket.emit('playerAction', {'action': 'retournerCarte', 'carte': selectedCardIndex, 'playerId': idJ, 'idPartie': idParty });
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

    const textContainerStyle = {
        position: 'absolute',
        top: '45%',
        right: '130px',
        transform: 'translateY(-50%)',
        border: '2px solid',
        padding: '10px',
        borderRadius: '5px',
        backgroundColor: 'white',
        color: 'black',
    };
    
    if (myAction === "jouerCarte") {
        textContainerStyle.border = '2px solid red';
        textContainerStyle.color = 'red';
    }
    
    
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
        <div>
            <div style={textContainerStyle}>
                {myAction === "jouerCarte" ? "A vous de jouer !" : "Veiller patienter ..."}
            </div>
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
            <GameBoard />
            <Center />
        </div>
    )
}

export default Memory;
