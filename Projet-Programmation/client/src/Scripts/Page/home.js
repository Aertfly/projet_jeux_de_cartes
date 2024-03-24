import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Deconnection from "../Components/deconnection.js";
import { SocketContext } from '../Shared/socket.js';
import { usePlayer } from '../../index.js';
import { Outlet } from "react-router-dom";
import Modal from 'react-modal';

function CreateButton(props){
    const navigate = useNavigate();
    function clicked(){
        setTimeout(() => navigate('/Home/'+props.path), 250);
    }    
    return(
        <button type="button" onClick={clicked} disabled={props.disabled}>{props.text}</button>
    );
}

function PrintButton(props){
    const navigate = useNavigate();
    function clicked(){
        setTimeout(() => navigate('/Home/'+props.path), 250);
    }    
    return(
        <button type="button" onClick={clicked} disabled={props.disabled}>{props.text}</button>
    );
}



function Home(){
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
            console.log("party requested");
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

    const [score, setScore] = useState([]);
    const [selectedGame, setSelectedGame] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false);
    function openModal(){
        setIsModalOpen(true);
    }
    function showScores(gameName){
        socket.emit('getScores', gameName);
        setSelectedGame(gameName);
        
    }
    const closeModal = () => setIsModalOpen(false);

    useEffect(() => {
        socket.on("globalScores", (globalScores) => {
            setScore(globalScores);
        });
        const cleanup = () => {
            socket.off('globalScores');
        }
        return cleanup;
    }, [socket]);

    function ScoreTable({ score, selectedGame }) {
        console.log(selectedGame)
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
            console.log("score n'est pas un tableau");
          }
      }

      const customStyles = {
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)'
        }
      };

    return (
        <div>
          <form onSubmit={submit}>
            <h2>Projet HAI405I</h2>
            <p style={{ color: "red" }}>{error}</p>
            <CreateButton
              path="createParty"
              text="Créer une partie"
              disabled={isSubmit}
            />
            <hr></hr>
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
            <input
              type="text"
              placeholder="Identifiant de la partie à rejoindre"
              onChange={(event) => setIdPartyRequested(event.target.value)}
            />
            <button type="submit" disabled={isSubmit}>
              {isSubmit ? "Veuillez patienter" : "Rejoindre via l'identifiant saisi"}
            </button>
            <div>
              <button type="button" onClick={openModal}>
                Statistiques
              </button>
              <Modal
                    isOpen={isModalOpen}
                    onRequestClose={closeModal}
                    style={customStyles}
                    >
                    <h1>Statistiques</h1>
                    <button type="button" onClick={() => showScores("Bataille")}>
                        Bataille
                    </button>
                    <button type="button" onClick={() => showScores("6 Qui Prend")}>
                        6 Qui Prend
                    </button>
                    <button type="button" onClick={() => showScores("Memory")}>
                        Mémory
                    </button>
                    <button type="button" onClick={() => showScores("Regicide")}>
                        Régicide
                    </button>
                    <ScoreTable score={score} selectedGame={selectedGame}/>
                    <button type="button" onClick={closeModal}>
                        Fermer
                    </button>
              </Modal>

            </div>
            <Deconnection disabled={isSubmit} />
          </form>
        </div>
      );
}

export default Home;