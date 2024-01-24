import React, { useContext, useState, useEffect, createContext } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from '../socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../index.js'
import Deconnection from '../Page/Component/deconnection.js';
import Chat from '../Page/Component/chatComponent.js';
import Save from '../Page/Component/saveComponent.js';
import Score from '../Page/Component/scoreComponent.js';

function Test() {
    const { idJ, idParty, socket } = useAppContext();

    const handleCardChoisie = () => {
        socket.emit('playerAction', {carte: {valeur: 2, enseigne: "SQP", nbBoeufs: 3},playerId: idJ, idPartie: idParty, "action": "joue"});
    }


    const handleLigneChoisie = () => {
        socket.emit('ligne', {ligne: 2, idJoueur: idJ, idPartie: idParty});
    }

    return (
      <div>
          <br />
          <button type="button" onClick={handleCardChoisie}>{'Jouer cette carte'}</button>
          <button type="submit" onClick={handleLigneChoisie}>{'Jouer cette ligne'}</button>
      </div>
    );
  }

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

    const contextValue = {
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

function generatePointCards(nb,widthCards,heightCards){
    const width = window.innerWidth ; 
    const listPoints = [];
    const ecart = (width - widthCards - 400)/(nb)

    for (var i = 0; i < nb; i++) {
        var x = widthCards + i * ecart;
        listPoints.push(x);
    }
    return {
        'y' : window.innerHeight-heightCards-50,
        'x' : listPoints
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

function Card(props) {
    const image = require('../img/SQP/boeuf.png');
    const boeufs = [];for(let i=0;i<props.card.nbBoeufs;i++){boeufs.push(0)}//pour la parcourir ensuite autant de fois qu'il y a de têtes
    console.log(boeufs); 
    
    const cardStyles = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
        width: '100px', // Ajustez la largeur selon vos besoins
        height: '150px', // Ajustez la hauteur selon vos besoins
        border: '1px solid black', // Bordure pour visualiser le rectangle
        textAlign: 'center',
        padding: '10px',
    };

    const textStyles = {
        position: 'absolute',
        bottom: '10px', // Ajustez la position verticale du texte
        left: '50%', // Centre le texte horizontalement
        transform: 'translateX(-50%)', // Centre le texte horizontalement
        color: 'black', // Couleur du texte (à ajuster selon vos besoins)
        fontSize: '50px'
    };

    return (
        <div style={cardStyles} onClick={props.onClick} className='CardHand'>
            <p style={textStyles}>{props.card.valeur} </p>
            <img src={image} alt="Fond de boeuf" style={{display:'inline', width: '100px', height: '100px'}}/>
                {boeufs.map(() => (
                    <img src={image} alt="tête de boeuf" style={{display:'inline', width: '25px', height: '40px'}}/>
                ))}
        </div>
    );
};

function CardHand(props) {
    const { idJ, isMyTurn, socket } = useAppContext();

    function onCardClick() {
        console.log("Je clique sur",props.value)
        if (isMyTurn) {
            console.log("le Joueur", idJ, "joue la carte", props.value);
            socket.emit('playerActionSQP', { "carte": props.value, "action": "joue", "playerId": idJ });
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
    const {cards,isMyTurn} = useAppContext();
    const [pointsCards,setPointCards] = useState(generatePointCards(cards.length,100,150));

    useEffect(() => {
        const handleResize = () => {
            setPointCards(generatePointCards(cards.length,100,150));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []); 
    console.log(pointsCards);
    return (
        <div>
            <p>{isMyTurn ? "A vous de jouer !" : "Veuillez patienter..."}</p>
            {cards.map((card,index) => 
                <CardHand value={card} x={pointsCards.x[index]} y={pointsCards.y} />
            )}
        </div>
    );
}

function Center() {
    const { Info } = useAppContext()
    const [cardsPositions, setCardsPositions] = useState([]);
    const center = Info.center;
    if (center)var numberOfCards = center.length;
    else var numberOfCards = 0;
    useEffect(() => {
        const handleResize = () => {
            setCardsPositions(circlePoints(100, numberOfCards));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    },[]);

    return (
        <div className="center-container">
            {cardsPositions.map((position, index) => (
                <Card x={position.x} y={position.y} value={center[index]} />
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

            socket.on('loser',(data)=>{
                console.log("Ce mec la a perdu",data);
            });

            socket.on('requestAction',(data)=>{
                console.log("Je dois faire un truc",data)
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
            <Leave />
            <Score />
            <Center />
        </>
    )
}

function App2() {
    
    return (
        <AppProvider>
            <CardsHand />
            <SixQuiPrend />
            <Test />
        </AppProvider>
    );
};

export default App2;
