import React, {useContext, useState,useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../index.js'
import Deconnection from '../Components/deconnection.js';
import Chat from '../Components/chatComponent.js';
import Save from '../Components/saveComponent.js';
import Leave from '../Components/Leave.js';
import imgPlaceholder from '../../Assets/img/NoImagePlaceholder.png';//Ranjithsiji, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons


function NbTurn(props){
    const nb = props.nbTurn;
    console.log("TOUR")
    return (<p className="tour-info">On est au tour : {nb}</p>)
}

function EndGame(props) {
    const Info  =  props.Info;
    const resultGame = props.resultGame;
    if (resultGame.tri === "croissant") Info.infoPlayers.sort((a, b) => b.score - a.score);
    else Info.infoPlayers.sort((a, b) => a.score - b.score);

    return (
        <div className="result-container">
          {resultGame.winner && (
            <div className="result-section winner-section player-info">
              <p>La partie a été remportée par </p>
              <h2>{resultGame.winner.pseudo}</h2>
              <p>avec un score de {resultGame.winner.score}</p>
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
              <h2 style={{color: "black"}}>Classement des joueurs</h2>
              <table>
                <tr>
                    <th>Pseudo</th>
                    <th>Score</th>
                    <th>Score Moyen</th>
                </tr>
              {Info.infoPlayers.map((player, index) => (
                <tr>
                    <td>{player.pseudo}</td>
                    <td>{player.score}</td>
                    <td>{player.scoreMoyenJoueur}</td>
                </tr>
                /*<div key={index} className="player-info">
                  <p>Nom: {player.pseudo}</p>
                  <p>Score: {player.score}</p>
                  <p>Score Moyen Joueur: {player.scoreMoyenJoueur}</p>
                </div>*/
              ))}
              </table>
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
  const [OtherPlayerAction, setOtherPlayerAction] = useState({});
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
                setInfo(prevInfo =>{
                    //On update seulement les informations que le serveur nous demande de mettre à jour;
                    let copy = {...prevInfo}
                    const params = ['center','archive','draw']
                    for (const p of params){
                        if(data[p])copy[p]=data[p];
                    }
                    if(data['infoPlayers']){
                        if(copy['infoPlayers']){
                            const paramsPlayer = ['nbCards','pseudo','score','scoreMoyenJoueur'];
                            let p;
                            for(const playerD of data['infoPlayers']){
                                p = indexOf(playerD,copy['infoPlayers']);
                                console.log("bruh",p,playerD,copy['infoPlayers'])
                                if(p!=-1){
                                    for (const p of paramsPlayer){
                                        if(playerD[p])copy['infoPlayers'][p]=playerD[p];
                                    }
                                }else{
                                    copy['infoPlayers'].push(playerD)
                                }
                            }
                        }else{
                            copy['infoPlayers'] = data['infoPlayers'];
                        }
                    }
                    return copy;
                });
            });

            
            socket.on('newTurn', (data) => {
                console.log('newTurn', data);
                setOtherPlayerAction(()=>{
                    let copy = {}
                    for(const p of data.pseudos){
                        copy[p] = "doitJouer";
                    }
                    return copy;
                });
                setInfo((prev)=>{
                    let copy = {...prev}
                    copy['nbTour'] = data.numeroTour
                    return copy;
                })
                if (data.joueurs.includes(idJ))setMyAction("jouerCarte");
            });

            socket.on('conveyAction', (data) => {
                console.log("conveyAction reçu",data);
                setOtherPlayerAction(prevOtherPlayerAction => {
                    let copy = {...prevOtherPlayerAction};
                    copy[data.pseudoJoueur] = data.natureAction;
                    return copy;
                });
            });

            socket.on('loser',(data)=>{
                console.log("Ce mec la a perdu",data);
            });

            socket.on('requestAction',(data)=>{
                console.log("Cette personne doit faire un truc",data);
                if(data.idJ === idJ){
                    setMyAction(data.action);
                    console.log("Je dois faire un truc");
                }
                else{
                    setOtherPlayerAction(prev =>{
                        let copy = {...prev};
                        copy[data.pseudo] = "doit" + data.action;
                        return copy;
                    });
                }
            });
            
            socket.on('drawedCard',(data)=>{
                console.log('drawedCard',data);
                if(data.idJ === idJ){
                    setCards(prevCards=>[...prevCards,data.card]);
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
            socket.removeAllListeners();
        }
        fetchInfoServ();
        return cleanup;
    },[]);

    return (
        <>
        <Deconnection />
        <Leave idj={idJ} socket={socket} />
        <Chat data={{ party: idParty }} />
        {resultGame ?<EndGame resultGame={resultGame} Info={Info}/>:<><Save data={{ party: idParty }}/><Outlet context={contextValue} /></>}
        {Info['nbTour']>=0?<NbTurn nbTurn={Info['nbTour']}/>:<></>}
        </>
    );
}


function indexOf(elem,list){
    let e ;
    for(let i=0;i<list.length;i++){
        e = list[i];
        if(e && e.pseudo===elem.pseudo)return i;
   
    }
    return -1;
}

export default GameContainer;
