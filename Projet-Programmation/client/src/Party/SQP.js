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
        socket.emit('playerAction', {carte: {valeur: 50, enseigne: "SQP", nbBoeufs: 3},playerId: idJ, idPartie: idParty, "action": "joue"});
    }


    const handleLigneChoisie = () => {
        socket.emit('ligne', {ligne: 2});
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
    const width = window.innerWidth - (2*widthCards);
    const listPoints = [];
    const ecart = width/nb;
    var x;

    for (let  i=1 ; i<=nb ; i++){
        x = (width/nb)*i
        listPoints.push(x)
    }

    return {
        'y' : window.innerHeight-heightCards,
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
        backgroundImage: 'url("../img/SQP/boeuf.png")'
    };

    return (
        <div style={cardStyles}>
            <p>Valeur: {props.card.valeur}</p>
            <p>Boeufs: {props.card.nbBoeufs}</p>
        </div>
    );
};

function CardHand(props) {
    const { idJ, isMyTurn, socket } = useAppContext();

    function onCardClick() {
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
    const pointsCards = generatePointCards(cards.length,100,150);
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
