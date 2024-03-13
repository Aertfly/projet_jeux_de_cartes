import React, { useContext, useState,useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../index.js'
import Deconnection from '../Components/deconnection.js';
import Chat from '../Components/chatComponent.js';
import Save from '../Components/saveComponent.js';
import Leave from '../Components/Leave.js';
import imgPlaceholder from '../../Assets/img/NoImagePlaceholder.png';//Ranjithsiji, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons

function EndGame(props) {
    const Info  =  props.Info;
    const resultGame = props.resultGame;
    Info.infoPlayers.sort((a, b) => a.score - b.score);

    return (
        <div className="result-container">
          {resultGame.winner && (
            <div className="result-section winner-section player-info">
              <h2>Gagnant</h2>
              <p>Nom: {resultGame.winner.pseudo}</p>
              <p>Score: {resultGame.winner.score}</p>
            </div>
          )}
    
          {resultGame.loser && (
            <div className="result-section loser-section player-info">
              <h2>Perdant</h2>
              <p>Nom: {resultGame.loser.pseudo}</p>
              <p>Score: {resultGame.loser.score}</p>
            </div>
          )}
    
          {Info && (
            <div className="result-section">
              <h2>Classement des joueurs</h2>
              {Info.infoPlayers.map((player, index) => (
                <div key={index} className="player-info">
                  <p>Nom: {player.pseudo}</p>
                  <p>Score: {player.score}</p>
                  <p>Score Moyen Joueur: {player.scoreMoyenJoueur}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
}

function GameContainer(){
    const { socket } = useContext(SocketContext);
    const { idJ, pseudo } = usePlayer();
    const { idParty } = useParams();
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [Info, setInfo] = useState([]);
    const [myAction, setMyAction] = useState(null);
    const [OtherPlayerAction, setOtherPlayerAction] = useState([]);
    const [images,setImages] = useState({"./":imgPlaceholder});
    const [resultGame, setResultGame] = useState('');

    const contextValue = {
        idJ,
        pseudo,
        idParty,
        images,
        setImages,
        Info,
        setInfo,
        myAction,
        setMyAction,
        OtherPlayerAction,
        setOtherPlayerAction,
        cards,
        setCards,   
        socket,
        navigate,
    };

    useEffect(() => {
        const fetchInfoServ = async () => {
            console.log("fetchInfoServ")

            socket.on('savePartyResult', () => {
                navigate('/home');
            });

            socket.on('endGame',(data) =>{
                setResultGame(data);
            });

            socket.on('dealingCards', (data) => {
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
                    OtherPlayerAction.length = 0;
                    setOtherPlayerAction([]);
                    setMyAction("jouerCarte");
                }
            });

            socket.on('conveyAction', (data) => {
                console.log("conveyAction reçu",data);
                OtherPlayerAction.push(data.pseudoJoueur);
                let li = [...OtherPlayerAction]//permet forcément à react de détecter le changement et de correctement re-render
                setOtherPlayerAction(li);
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

            socket.on('gameStart',(data)=>{
                if(data.message){
                    console.log("Erreur :",data.message);
                    //navigate('/')
                }
                else{
                    socket.emit('infoGame', idParty);
                    socket.emit("requestCards", { "idJ": idJ, "idParty": idParty });;
                }
            });
            socket.emit('infoGame', idParty);
            socket.emit("requestCards", { "idJ": idJ, "idParty": idParty });;
        }

        const cleanup = () => {
            /* au cas où socket.removeAllListeners() ne marche pas comme prévu
            const listNameSocket = ['savePartyResult','endGame','dealingCards','infoGameOut','newTurn','conveyAction','loser','requestAction','gameStart'];
            for(const n of listNameSocket){socket.off(n)};*/
            socket.removeAllListeners();
        }
        fetchInfoServ();
        return cleanup;
    },[ ]);

    return (
        <>
        <Deconnection />
        <Leave idj={idJ} socket={socket} />
        <Chat data={{ party: idParty }} />
        {resultGame ?<EndGame resultGame={resultGame} Info={Info}/>:<><Save data={{ party: idParty }}/><Outlet context={contextValue} /></>}
        </>
    );
}


export default GameContainer;