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

    useEffect(() => {
        const fetchInfoServ = async () => {
            console.log("fetchInfoServ")
            socket.on("dealingCards", (data) => {
                console.log("Cartes reçues via dealingCards",data);
                setCards(data.Cards);
            });
            socket.on('infoGameOut', (data) => {
                console.log("Info other", data);
                setInfo(data);
            });
            
            socket.on('newTurn', (data) => {
                if (data.joueurs.includes(idJ)) {
                    console.log("C'est mon tour de jouer ! - Tour " + data.numeroTour);
                    setIsMyTurn(true);
                    setInfo({ 'Center': Info.center, 'draw': Info.draw, 'infoPlayers': Info.infoPlayer, 'nbTurn': data.numeroTour });
                }
            });

            socket.on('conveyAction', (data) => {
                console.log("conveyAction reçu");
                setOtherPlayerAction(data);
            });

            socket.on('reveal', (data) => {
                console.log("reveal reçu");
                setInfo({ 'Center': data, 'draw': Info.draw, 'infoPlayers': Info.infoPlayer, 'nbTurn': Info.nbTurn });
            });

            socket.emit('infoGame', idParty);
            socket.emit("requestCards", { "idJ": idJ, "idParty": idParty });;
        }

        const cleanup = () => {
            console.log("Nettoyage")
            const listNameSocket = ['reveal','conveyAction','newTurn','infoGameOut',"dealingCards"];
            for(const n of listNameSocket){socket.off(n)};
        }
        fetchInfoServ();
        return cleanup;
    }, []);

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