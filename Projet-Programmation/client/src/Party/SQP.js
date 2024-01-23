import React, { useContext, useState, useEffect, createContext } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from '../socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../index.js'
import Deconnection from '../Page/Component/deconnection.js';
import Chat from '../Page/Component/chatComponent.js';
import Save from '../Page/Component/saveComponent.js';
import Score from '../Page/Component/scoreComponent.js';

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

    const image = require('../img/SQP/boeuf.png');
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
    // Styles pour le rectangle reprÃ©sentant la carte
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
    const { idJ, isMyTurn, socket } = useAppContext();

    function onCardClick() {
        if (isMyTurn) {
            console.log("le Joueur", idJ, "joue la carte", props.value);
            socket.emit('playerAction', { "carte": props.value, "action": "joue", "playerId": idJ });
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

function CardHand() {
    const {cards,isMyTurn} = useAppContext();
    return (
        <div>
            <p>{isMyTurn ? "A vous de jouer !" : "Veuillez patienter..."}</p>
            {cards.map((card,index) => 
                <Hand value={card} x={-100+80*index} y={100} />
            )}
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