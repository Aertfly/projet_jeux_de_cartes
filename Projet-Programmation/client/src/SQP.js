import React, { useContext, useState, useEffect, createContext } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js'
import Deconnection from './deconnection.js';
import Chat from './chatComponent.js';
import Save from './saveComponent.js';
import Score from './scoreComponent.js';



const AppContext = createContext();
const AppProvider = ({ children }) => {
    const { socket } = useContext(SocketContext);
    const { idJ,pseudo } = usePlayer();
    const { idParty } = useParams();
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [Info, setInfo] = useState([]);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [OtherPlayerAction, setOtherPlayerAction] = useState()

    const image = require('./boeuf.png');
    const contextValue = {
        image,
        setInfo,
        setIsMyTurn,
        setOtherPlayerAction,
        OtherPlayerAction,
        isMyTurn,
        Info,
        cards,
        setCards,
        socket,
        idJ,
        pseudo,
        idParty,
        navigate,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

const useAppContext = () => {
    return useContext(AppContext);
}; 

function circlePoints(r, nb) {
    const radius = r;
    const angleIncrement = (2 * Math.PI) / nb;
    const positions = [];

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < nb; i++) {
        const angle = i * angleIncrement;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        positions.push({ x, y });
    }
    return positions;
}

function Leave() {
    const { socket, idJ, navigate } = useAppContext();
    function clicked() {
        socket.emit('playerLeaving', idJ);
        navigate('/home');
    }
    return (
        <button type='button' onClick={clicked}>Quitter ?</button>
    );
}

function Card(props) {
    // Styles pour le rectangle représentant la carte
    const cardStyles = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
        width: '100px', // Ajustez la largeur selon vos besoins
        height: '150px', // Ajustez la hauteur selon vos besoins
        border: '1px solid black', // Bordure pour visualiser le rectangle
        textAlign: 'center',
        padding: '10px',
        backgroundColor: 'white', // Couleur de fond
    };

    return (
        <div style={cardStyles}>
            <p>Valeur: {props.card.valeur}</p>
            <p>Boeufs: {props.card.nbBoeufs}</p>
        </div>
    );
};

function Hand(props) {
    // Vous pouvez ajuster le positionnement des cartes selon vos besoins
    const cardPositions = cards.map((card, index) => ({
        x: 150 * index,
        y: 0,
    }));

    return (
        <div>
            {cardPositions.map((position, index) => (
                <Card
                    key={index}
                    x={position.x}
                    y={position.y}
                    card={cards[index]}
                    onClick={() => onCardClick(index)}
                />
            ))}
        </div>
    );
}
function CardBoard() {
    const { cards } = useAppContext();
    const src = props.value ? images[cardImgName(props.value)] : images['./dos.png'];

    const cardBoardStyles = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px', 
        backgroundColor: 'lightgray',
    };

    return (
        <div style={cardBoardStyles}>
            {cards.map((card, index) => (
                <Card card={card} x={index * 120} y={0} />
            ))}
        </div>
    );
}

function SixQuiPrend() {
    const { idParty, idJ, setInfo, setCards, Info, socket, setIsMyTurn, setOtherPlayerAction } = useAppContext()

    return (
        <>
            <Save data={{party: idParty}} />
            <Chat data={{party: idParty}} />
            <Deconnection />
            <Score />
        </>
    )
}

function App2() {
    
    return (
        <AppProvider>
            <SixQuiPrend />
        </AppProvider>
    );
};

export default App2;