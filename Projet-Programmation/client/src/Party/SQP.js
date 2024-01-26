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
    const [myAction, setMyAction] = useState(null);
    const [OtherPlayerAction, setOtherPlayerAction] = useState()

    const contextValue = {
        setInfo,
        setMyAction,
        setOtherPlayerAction,
        OtherPlayerAction,
        myAction,
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
    
    const cardStyles = {
        position: 'absolute',
        left: `${props.x}px`,
        top: `${props.y}px`,
        width: '100px', // Ajustez la largeur selon vos besoins
        height: '150px', // Ajustez la hauteur selon vos besoins
        border: '1px solid black', // Bordure pour visualiser le rectangle
        textAlign: 'center',
        padding: '10px',
        backgroundColor: "#D3D3D3"
    };

    const textStyles = {
        position: 'absolute',
        bottom: '35px', // Ajustez la position verticale du texte
        left: '50%', // Centre le texte horizontalement
        transform: 'translateX(-50%)', // Centre le texte horizontalement
        color: 'white', // Couleur du texte (à ajuster selon vos besoins)
        fontSize: '50px'
    };

    return (
        <div style={cardStyles} onClick={props.onClick} className='CardHand' hidden={props.played}>
            <p style={textStyles}>{props.card.valeur} </p>
            <img src={image} alt="Fond de boeuf" style={{display:'inline', width: '100px', height: '100px'}}/>
                {boeufs.map(() => (
                    <img src={image} alt="tête de boeuf" style={{display:'inline', width: '25px', height: '25px'}}/>
                ))}
        </div>
    );
};

function CardHand(props) {
    const {cards,setCards, idJ, myAction, socket, idParty , setMyAction } = useAppContext();

    function onCardClick() {
        console.log("Je clique sur",props.value);
        if (myAction === "jouerCarte") {
            console.log("Moi le joueur d'id :", idJ, "joue la carte", props.value);
            socket.emit('playerAction', { "carte": props.value, "action": "joue", "playerId": idJ ,"idPartie": idParty});
            setMyAction(null);
            cards.splice(cards.indexOf(props.value),1);
            setCards(cards);
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
    const {cards,myAction} = useAppContext();
    const [pointsCards,setPointCards] = useState(generatePointCards(cards.length,100,150));
    var nbCards = cards ? cards.length : 0; 

    useEffect(() => {
        const handleResize = () => {
            setPointCards(generatePointCards(nbCards,100,150));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [nbCards]); 

    return (
        <div>
            <Countdown style={{left: `${pointsCards.x[nbCards-1]/2}px`,top: `${pointsCards.y - 100}px`,position:'absolute',fontSize: '25px'}}/>
            <p style={{left: `${pointsCards.x[nbCards-1]/2}px`,top: `${pointsCards.y - 75}px`,position:'absolute',fontSize: '25px'}}>{
            myAction==="jouerCarte"? "A vous de jouer !" : myAction==="choisirLigne" ? "Choissisez une ligne à récupérer":"Veuillez patienter..."}</p>
            {cards.map((card,index) => 
                <CardHand key={index} value={card} x={pointsCards.x[index]} y={pointsCards.y} />
            )}
        </div>
    );
}

function Countdown(props){
    const {myAction} = useAppContext();
    const [number,setNumber] = useState(30);

    useEffect(() => {
        let interval;
        const decreaseNumber = () => {
            if (number <= 0){
                clearInterval(interval);
                setNumber(0)
            }else {
                setNumber(number-1);
            }
        }

        const cleanup = () => {
            clearInterval(interval);
        }

        if(myAction){
            interval = setInterval(decreaseNumber,1000)
        }else{
            setNumber(30);
        }

        return cleanup
    },[myAction,number])

    return (
        myAction ? <p style={props.style}>{number}</p> : <></>
    )
}

function Center() {
    const { Info, myAction, idJ , idParty, socket } = useAppContext();
    const positions = quadrillagePoints();
    const board = Info.archive;

    console.log("Board", board);
    if (!board) return null;

    const handleCardClick = (card,rowIndex) => {
        // Gérez le clic sur la carte ici
        console.log("Carte du centre cliquée :", card,rowIndex);
        if (myAction === "choisirLigne" ){
            console.log("Envoie ligne selectionnée serveur  :",rowIndex);
            socket.emit('ligne', {'ligne': rowIndex, 'idJoueur': idJ, 'idPartie': idParty})
        }
        //socket.emit('ligne', {ligne: 2, idJoueur: idJ, idPartie: idParty});
    };

    const centerRows = positions.map((row, rowIndex) => {
        const rowCards = row.map((position, colIndex) => {
            const cardIndex = rowIndex * row.length + colIndex;
            const card = board[rowIndex] && board[rowIndex][colIndex];
            return card ? (
                <Card key={colIndex} x={position.x} y={position.y} card={card} onClick={() => handleCardClick(card,rowIndex)} />
            ) : null;
        }).filter(Boolean); // Filtrer les éléments non définis

        return <div key={rowIndex} className="row-container">{rowCards}</div>;
    });

    return <div className="center-container">{centerRows}</div>;
}


function quadrillagePoints() {
    const itemsCount = 20;
    const itemsPerRow = 5; // Nombre d'items par ligne
    const cardSpacing = 130;
    const positions = [];

    for (let index = 0; index < itemsCount; index++) {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = (col * cardSpacing)-400;
        const y = (row * cardSpacing)-400;
        if (positions[row] === undefined) {
            // Si la ligne n'existe pas encore, créez-la
            positions[row] = [];
        }
        positions[row].push({ x, y });
    }

    return positions;
}

function Player(props) {
    const img = require('../img/SQP/bonhomme.png');
    const playerContainerStyle = {
        display: 'flex',
        flexDirection: 'column', // Afficher les informations verticalement
        alignItems: 'center',
        marginBottom: '20px',
        marginRight: '20px', // Ajouter une marge à droite pour séparer les joueurs
    };

    const imageStyle = {
        width: '50px',
        height: '50px',
        marginBottom: '10px',
    };

    return (
        <div style={playerContainerStyle}>
            <img src={img} alt="Bonhomme" style={imageStyle} />
            <p>{props.pseudo}</p>
            <p>{props.score} Points</p>
            <p>{props.nbCards} cartes</p>
        </div>
    );
}

function GameBoard() {
    const { Info } = useAppContext();

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
                    Info.infoPlayers.map((player, index) => (
                        <Player
                            key={index}
                            pseudo={player.pseudo}
                            nbCards={player.nbCards}
                            score={player.score}
                        />
                    ))}
            </div>
        </div>
    );
}

function SixQuiPrend() {
    const { idParty, idJ, setInfo, setCards, Info, socket, setMyAction, setOtherPlayerAction, navigate } = useAppContext()

    useEffect(() => {
        const fetchInfoServ = async () => {
            console.log("fetchInfoServ")

            socket.on('savePartyResult', () => {
                navigate('/home');
            })
            
            socket.on("dealingCards", (data) => {
                console.log("Cartes reçues via dealingCards",data);
                setCards(data.Cards);
            });

            socket.on('infoGameOut', (data) => {
                console.log("Info de la partie", data);
                setInfo(data);
            });
            
            socket.on('newTurn', (data) => {
                console.log("NOUVEAU TOUR");
                if (data.joueurs.includes(idJ)) {
                    console.log("C'est mon tour de jouer ! - Tour " + data.numeroTour);
                    setMyAction("jouerCarte");
                }
            });
            
            socket.on('conveyAction', (data) => {
                console.log("conveyAction reçu",data);
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
                console.log("Cette personne doit faire un truc",data);
                if(data.idJ === idJ){
                    setMyAction("choisirLigne")
                    console.log("Je dois faire un truc")
                }
            });

            socket.emit('infoGame', idParty);
            socket.emit("requestCards", { "idJ": idJ, "idParty": idParty });;
        }

        const cleanup = () => {
            console.log("Nettoyage")
            const listNameSocket = ['reveal','conveyAction','newTurn','infoGameOut',"dealingCards",'savePartyResult'];
            for(const n of listNameSocket){socket.off(n)};
        }
        fetchInfoServ();
        return cleanup;
    },[]);

    return (
        <>  
            <Chat data={{party: idParty}} />
            <Deconnection />
            <Save data={{party: idParty}} />
            <Leave />
            <Center />
            <CardsHand />
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

