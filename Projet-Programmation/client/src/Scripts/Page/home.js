import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Deconnection from "../Components/deconnection.js";
import { SocketContext } from '../Shared/socket.js';
import { usePlayer } from '../../index.js';
import { Outlet } from "react-router-dom";
import { CreatePartyForm } from "./createParty.js";

/*function CreateButton(props){
    const navigate = useNavigate();
    function clicked(){
        setTimeout(() => navigate('/Home/'+props.path), 250);
    }    
    return(
        <button type="button" onClick={clicked} disabled={props.disabled}>{props.text}</button>
    );
}*/

function PrintButton(props){
    const navigate = useNavigate();
    function clicked(){
        setTimeout(() => navigate('/Home/'+props.path), 250);
    }    
    return(
        <button type="button" onClick={clicked} disabled={props.disabled}>{props.text}</button>
    );
}


function JoinGame(){
  const [idPartyRequested,setIdPartyRequested] = useState("");
  const {socket } = useContext(SocketContext);
  const {idJ, setPlayerList } = usePlayer();
  const [isSubmit,setIsSubmit] = useState(false);
  const [error,setError] = useState("")
  const navigate = useNavigate();
  
  function submit(event){
    event.preventDefault();
    if(idPartyRequested){
      socket.emit('joinRequest',{'idPlayer':idJ,'idParty':idPartyRequested});
      setIsSubmit(true);
      socket.on('joinGame',(data)=>{
        if(data.message){
          setTimeout(() =>{
            setError(data.message);
            setIsSubmit(false);
          }, 500);
        }else{
          setPlayerList(data.playerList);
          setTimeout(() => navigate('/Home/waitingRoom/'+data.idParty), 250);
        }
      })
    }
    else{
      alert("Veuillez rentrer un identifiant valide");
    }
  }
  
  return(
    <form onSubmit={submit}>
    <h1>Rejoindre une partie</h1>
    <p style={{ color: "red" }}>{error}</p>
    {/*<CreateButton
    path="createParty"
    text="Créer une partie"
    disabled={isSubmit}
  /><hr>*/}
  <PrintButton
  path="listParty"
  text="Afficher les parties en cours"
  disabled={isSubmit}
  />
  <hr></hr>
  <PrintButton
  path="listPartySaved"
  text="Afficher mes parties sauvegardées"
  disabled={isSubmit}
  />
  <hr></hr>
  <Outlet />
  <br /><br /><br /><br />
  <div id="id_join">
  <input
  type="text"
  placeholder="Identifiant de la partie à rejoindre"
  onChange={(event) => setIdPartyRequested(event.target.value)}
  />
  <button type="submit" disabled={isSubmit}>
  {isSubmit ? "Veuillez patienter" : "Rejoindre la partie"}
  </button>
  
  </div>
  <br /><br /><br /><br />
  </form>
  )
}

function Stat(){
  const {socket } = useContext(SocketContext);
  const [score, setScore] = useState([]);
  const [selectedGame, setSelectedGame] = useState('')
  
  function showScores(gameName){
    socket.emit('getScores', gameName);
    setSelectedGame(gameName);
  }
  
  useEffect(() => {
    socket.on("globalScores", (globalScores) => {
      setScore(globalScores);
    });
    showScores("Bataille");
    const cleanup = () => {
      socket.off('globalScores');
    }
    return cleanup;
  }, []);
  
  function ScoreTable({ score, selectedGame }) {
    if (Array.isArray(score)) {
      
      score.sort((a, b) => {
        
        let scoreMoyenA = a.totalPoints / a.nombreParties;
        let scoreMoyenB = b.totalPoints / b.nombreParties;
        
        if (scoreMoyenA > scoreMoyenB) {
          return -1; 
        } else if (scoreMoyenA < scoreMoyenB) {
          return 1; 
        } else {
          return 0; 
        }
      });
      return (
        <div>
          <h1>{selectedGame}</h1>
          <table>
            <thead>
              <tr>
                <th>Pseudo</th>
                <th>Total de points</th>
                <th>Nombre de Parties jouées</th>
                <th>Score Moyen</th>
              </tr>
            </thead>
            <tbody>
              {score.map((item) => (
                <tr key={item.idJ}>
                <td>{item.pseudo}</td>
                <td>{item.totalPoints}</td>
                <td>{item.nombreParties}</td>
                <td>{Math.round(item.totalPoints / item.nombreParties)}</td>
                </tr>
                ))}
            </tbody>
          </table>
        </div>
          );
        } else {
        }
      }
      return(
      <form style={{minHeight: '500px'}}>
        <div>
        <h1>Statistiques</h1>
        <button type="button" onClick={() => showScores("Bataille")}>Bataille</button>
        <button type="button" onClick={() => showScores("6 Qui Prend")}>6 Qui Prend</button>
        <button type="button" onClick={() => showScores("Memory")}>Mémory</button>
        <button type="button" onClick={() => showScores("Regicide")}>Régicide</button>
        <ScoreTable score={score} selectedGame={selectedGame}/>
        </div>
      </form>
  );
}


function Home(){
  return (
    <div>
    <h1>Jeu de cartes - HAI405I</h1>
    <div id="home" style={{display: 'flex'}}>
    <CreatePartyForm />
    <JoinGame />
    <Stat />
    </div>
    <ul>
    <li>Projet réalisé par le <b>groupe 4</b>.</li>
    </ul>
    <Deconnection />
    </div>
    );
  }
    

export default Home;