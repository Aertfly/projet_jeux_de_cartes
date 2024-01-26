import React, { useContext, useState, useEffect, createContext } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from '../socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../index.js'
import Deconnection from '../Page/Component/deconnection.js';
import Chat from '../Page/Component/chatComponent.js';





const AppContext = createContext();
const AppProvider = ({ children }) => {
    const { socket } = useContext(SocketContext);
    const { idJ, pseudo } = usePlayer();
    const { idParty } = useParams();
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [Info, setInfo] = useState([]);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [OtherPlayerAction, setOtherPlayerAction] = useState([])
    const importAll = (context) => {
        return Object.fromEntries(
            context.keys().map((key) => [key, context(key)])
        );
    };
    const images = importAll(require.context('../img/Battle', false, /\.(png)$/));

    const contextValue = {
        images,
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

function cardImgName(card) {
    return "./" + card.valeur + "-" + card.enseigne + ".png";
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

function generatePointCards(nb, widthCards, heightCards) {
    const width = window.innerWidth;
    const listPoints = [];
    const ecart = (width - widthCards - 500) / (nb - 1) //-500 pour éviter de déborder sur le chat

    for (var i = 0; i < nb; i++) {
        var x = widthCards + i * ecart;
        listPoints.push(x);
    }
    return {
        'y': window.innerHeight - heightCards - 100,
        'x': listPoints
    }
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

function GameBoard() {
    const [playerPositions, setPlayerPositions] = useState([]);
    const { Info, OtherPlayerAction } = useAppContext();
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
                <Player x={position.x} y={position.y} pseudo={infoPlayers[index]['pseudo']} nbCards={infoPlayers[index]['nbCards']} action={OtherPlayerAction} />
            ))}
        </div>
    );
};

function CardHand(props) {
    const { socket, idJ, images, isMyTurn, setIsMyTurn, idParty , cards} = useAppContext();

    function play() {
        console.log("Je clique sur la carte :", props.value)
        if (isMyTurn) {
            console.log("On joue la carte :", props.value);
            socket.emit('playerAction', { "carte": props.value, "action": "joue", "playerId": idJ, "idPartie" : idParty });
            setIsMyTurn(false);
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
    const { cards   } = useAppContext();
    const [pointsCards, setPointCards] = useState(generatePointCards(nbCards, 75, 100));
    var nbCards = cards ? cards.length : 0; 


    useEffect(() => {
        const handleResize = () => {
            setPointCards(generatePointCards(nbCards, 75, 100));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [nbCards]);

    //console.log(pointsCards);

    return (
        <div>
            {cards.map((card, index) =>
                <CardHand value={card} x={pointsCards.x[index]} y={pointsCards.y} />
            )}
        </div>
    );
}


function Player(props) {
    const { pseudo, action,OtherPlayerAction, isMyTurn, Info} = useAppContext();
    const [msg, setMsg] = useState("");
    const playerStyle = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
    };
    if ((action) && (action.pseudoJoueur === pseudo)) {
        setMsg("A " + action.natureAction + " une carte")
    }
    console.log("Action autres",OtherPlayerAction);
    return (
        <div className="battle-player" style={playerStyle}>
            {(props.pseudo === pseudo)? <p>{isMyTurn  ? "A vous de jouer !" : "Veuillez attendre votre tour..."}</p> : <></>}
            <p hidden={!msg}>{msg}</p>
            <p>{props.pseudo + (props.pseudo === pseudo ? "(vous)" : "")}</p>
            <p>{props.nbCards} cartes</p>
            {OtherPlayerAction.includes(props.pseudo) ? props.pseudo in Info.center ? <Card x={100} y={100} value={Info.center[props.pseudo]}/> :<Card x={100} y={100}/> : <></> }
        </div>);
};

function Card(props) {
    const { images } = useAppContext();
    const src = props.value ? images[cardImgName(props.value)] : images['./dos.png'];
    console.log("CARTE ", props.value);
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
        <img style={cardStyle} src={src} alt={props.value ? "image de" + props.value.valeur + " " + props.value.enseigne : "dos de carte"} />
    );
}

function Center() {
    const { Info } = useAppContext()
    const [cardsPositions, setCardsPositions] = useState([]);
    const center = Info.center;
    var numberOfCards = center ? center.length : 0;
    useEffect(() => {
        const handleResize = () => {
            setCardsPositions(circlePoints(100, numberOfCards));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    },[numberOfCards]);

    return (
        <div>
            {cardsPositions.map((position, index) => (
                <Card x={position.x} y={position.y} value={center[index]} />
            ))}
        </div>
    );
}


/*function Draw() {
    const { Info, images } = useAppContext()
    const draw = Info.draw ? Info.draw : 0;
    const [midX, setMidX] = useState(window.innerWidth / 2);
    const [midY, setMidY,] = useState(window.innerHeight / 2);
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
            <Card x={midX} y={midY} />
        </div>
    );
}*/

function Battle() {
    const { idParty, idJ, setInfo, setCards, Info, socket, setIsMyTurn,OtherPlayerAction, setOtherPlayerAction } = useAppContext()


    useEffect(() => {
        const fetchInfoServ = async () => {
            console.log("fetchInfoServ")
            socket.on("dealingCards", (data) => {
                console.log("Cartes reçues via dealingCards", data);
                setCards(data.Cards);
            });
            socket.on('infoGameOut', (data) => {
                console.log("Info other", data);
                setInfo(data);
            });

            socket.on('newTurn', (data) => {
                console.log("NOUVEAU TOUR");
                if (data.joueurs.includes(idJ)) {
                    console.log("C'est mon tour de jouer ! - Tour " + data.numeroTour);
                    setIsMyTurn(true);
                    setOtherPlayerAction([]);
                }
            });

            socket.on('conveyAction', (data) => {
                console.log("conveyAction reçu",data);
                OtherPlayerAction.push(data.pseudoJoueur)
                setOtherPlayerAction(OtherPlayerAction);
            });

            socket.emit('infoGame', idParty);
            socket.emit("requestCards", { "idJ": idJ, "idParty": idParty });;
        }

        const cleanup = () => {
            console.log("Nettoyage")
            const listNameSocket = ['reveal', 'conveyAction', 'newTurn', 'infoGameOut', "dealingCards"];
            for (const n of listNameSocket) { socket.off(n) };
        }
        fetchInfoServ();
        return cleanup;
    },[]);



    return (
        <div className='BattleBody'>
            {Info === undefined ? (
                "CHARGEMENT..."
            ) : (
                <>
                    {/*<Draw /> car on n'a pas besoin d'une pioche dans la bataille*/}
                    {/*<Center />*/}
                    <Deconnection />
                    <Leave />
                    <Chat data={{ party: idParty }} />
                    <GameBoard />
                    <CardsHand />
                </>
            )}
        </div>
    );
}

/*function JouerForm() {

    const action = () => {
        useEffect(() => {
            const carte = { "enseigne": "Pique", "valeur": 6 };
            const playerId = 1;

            console.log(carte.enseigne);
            console.log("Emission de la carte " + carte);
            socket.emit('playerAction', { "carte": carte, "player": "Pierre", "action": "joue", "playerId": playerId });
        });
    }

    return (
        <button onClick={action}>Jouer une carte</button>
    )
}*/

function App() {

    return (
        <AppProvider>
            <Battle />
        </AppProvider>
    );
};

export default App;