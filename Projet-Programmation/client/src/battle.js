import React, { useContext, useState, useEffect, createContext } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js'
import Deconnection from './deconnection.js';
import Chat from './chatComponent.js';





var sockets = null;
const AppContext = createContext();
const AppProvider = ({ children }) => {
    const { socket } = useContext(SocketContext);
    const { idJ } = usePlayer();
    const { idParty } = useParams();
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [Info, setInfo] = useState([]);
    const [isMyTurn,setIsMyTurn] = useState(false);
    const [OtherPlayerAction,setOtherPlayerAction] = useState()
    const importAll = (context) => {
        return Object.fromEntries(
          context.keys().map((key) => [key, context(key)])
        );
      };
    const images = importAll(require.context('../img', false, /\.(png)$/));
    const [img,setImg] = useState(images);
    console.log(img);
    const contextValue = {
        img,
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

function cardToText(card) {
    return "./"+card.valeur + "-" + card.enseigne+".png";
}


function Leave(props) {
    const { socket, idJ, navigate } = useAppContext();
    function clicked() {
        socket.emit('playerLeaving', idJ);
        navigate('/home');
    }
    return (
        <button type='button' onClick={clicked}>Quitter ?</button>
    );
}

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

function GameBoard() {
    const [playerPositions, setPlayerPositions] = useState([]);
    const { Info,OtherPlayerAction } = useAppContext();
    const infoPlayers = Info.infoPlayer
    const numberOfPlayers = infoPlayers.length;
    useEffect(() => {
        setPlayerPositions(circlePoints(300, numberOfPlayers));
    }, [numberOfPlayers]);

    return (
        <div className="poker-game-board">
            {playerPositions.map((position, index) => (

                <Player x={position.x} y={position.y} pseudo={infoPlayers.pseudo[index]} nbCards={infoPlayers.nbCards[index]} action={OtherPlayerAction} />
            ))}
        </div>
    );
};

function CardHand(props) {
    const {socket, idJ, img, isMyTurn } = useAppContext();
    function play() {
        if (isMyTurn) {
            socket.emit('playerAction', { "carte": props.value, "action": "joue", "playerId": idJ });
        }
    }
    return (
        <div>
            <p>{isMyTurn ? "A vous de jouer !" : "Veuillez patienter..."}</p>
            <img src={img.cardToText(props.value)} onClick={play} />
        </div>
    );
}

function CardsHand() {
    const { cards } = useAppContext()
    return (
        <div>
            {cards.map(card => {
                <CardHand value={card} />
            })}
        </div>
    );
}

function Player(props) {
    const { pseudo,action} = useAppContext();
    const [msg,setMsg] = useState("");
    const playerStyle = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
    };
    if (action&&action.pseudoJoueur==pseudo){
        setMsg("A "+action.natureAction+" une carte")
    }
    if (props.pseudo == pseudo) {
        return <div className="poker-player" style={playerStyle}>
            {props.pseudo + "(VOUS)"}
            {props.nbCards}
            <CardsHand />
        </div>
    } else {
        if(action){
            return <div className="poker-player" style={playerStyle}>
            <p hidden={!msg}>{msg}</p>
            <p>{props.pseudo}</p>
            <p>{props.nbCards}</p>
        </div>
        }

    }
};
function Card(props) {
    const {img} = useAppContext();
    const cardStyle = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
    };
    return (
        <img style={cardStyle} src={img.cardToText(props.value)}/>
    );
}

function Center() {
    const { Info } = useAppContext()
    const [cardsPositions, setCardsPositions] = useState([]);
    const center = Info.center;
    const numberOfCards = center.length;
    useEffect(() => {
        setCardsPositions(circlePoints(100, numberOfCards));
    }, [numberOfCards]);

    return (
        <div>
            {cardsPositions.map((position, index) => (
                <Card x={position.x} y={position.y} value={center[index]}/>
            ))}
        </div>
    );
}



function Draw() {
    const {Info,img} = useAppContext()
    const draw = Info.draw;
    const src = img['./dos.png'];
    return (
        <div>
            <p>Il y a : {draw} cartes dans la pioche</p>
            <img src={src} />
        </div>
    );
}

function Battle() {
    console.log(useAppContext())
    const { idParty, idJ, setInfo, setCards, Info, socket,setIsMyTurn, setOtherPlayerAction} = useAppContext()


    useEffect(() => {
        const fetchInfoServ = async () => {
            socket.emit('infoGame', idParty);
            socket.emit("requestCards", { "idJ": idJ, "idParty": idParty });;

            socket.on("dealingCards", (data) => {
                console.log("Cartes reçues via dealingCards");
                setCards(data);
            });
            socket.on('infoGameOut', (data) => {
                console.log("Info other", data);
                setInfo(data);
            });
            socket.on('newTurn', (data) => {
                if (data.joueurs.includes(idJ)) {
                    console.log("C'est mon tour de jouer ! - Tour " + data.numeroTour);
                    setIsMyTurn(true);
                    setInfo({'Center':Info.center,'draw':Info.draw,'infoPlayers':Info.infoPlayer,'nbTurn': data.numeroTour});
                }
            });
    
            socket.on('conveyAction', (data) => {
                console.log("conveyAction reçu");
                setOtherPlayerAction(data);
            });
    
            socket.on('reveal', (data) => {
                console.log("reveal reçu");
                setInfo({'Center': data,'draw':Info.draw,'infoPlayers':Info.infoPlayer,'nbTurn': Info.nbTurn});
            });
        }
        fetchInfoServ();
    }, [socket])



    return (
        <div>
            {Info.length == 0 ?
                "CHARGEMENT..." : <GameBoard />}

            <Draw />
            <Center />
            <Leave />
            <Chat data={{ party: idParty }} />
            {/*<Deconnection />*/}
        </div>);
}

function App() {
    return (
        <AppProvider>
            <Battle />
        </AppProvider>
    );
};

export default App;