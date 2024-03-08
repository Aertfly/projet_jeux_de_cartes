import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Deconnection from "./Component/deconnection.js";
import { SocketContext } from '../socket.js';
import { usePlayer } from '../index.js';
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
            socket.on('joinGame2',(data)=>{
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    function openModal(){
        setIsModalOpen(true);
    }
    function showScores(gameName){
        console.log("showScore appelé");
        socket.emit('getScores', gameName);
        
    }
    const closeModal = () => setIsModalOpen(false);

    useEffect(() => {
        socket.on("globalScores", (globalScores) => {
            console.log(globalScores);
            setScore(globalScores);
        });
        const cleanup = () => {
            socket.off('globalScores');
        }
        return cleanup;
    }, [socket]);

    function ScoreTable({ score }) {

        console.log(typeof score);
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
                <table>
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Pseudo</th>
                      <th>Total Points</th>
                      <th>Nombre de Parties</th>
                      <th>Score Moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {score.map((item) => (
                      <tr key={item.idJ}>
                        <td>{item.idJ}</td>
                        <td>{item.pseudo}</td>
                        <td>{item.totalPoints}</td>
                        <td>{item.nombreParties}</td>
                        <td>{Math.round(item.totalPoints / item.nombreParties)}</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              );
          } else {
            console.log("score n'est pas un tableau");
          }
      }

      

    return (
        <div>
          <form onSubmit={submit}>
            <h2>Souhaitez-vous créer ou rejoindre une partie ?</h2>
            <p style={{ color: "red" }}>{error}</p>
            <p>Créer une partie :</p>
            <CreateButton
              path="createParty"
              text="Créer une partie"
              disabled={isSubmit}
            />
            <p>Rejoindre une partie existante:</p>
            <PrintButton
              path="listParty"
              text="Afficher les parties disponibles"
              disabled={isSubmit}
            />
            <p>Rejoindre une partie que vous avez sauvegardée :</p>
            <PrintButton
              path="listPartySaved"
              text="Afficher les parties sauvegardées"
              disabled={isSubmit}
            />
            <Outlet />
            <h3>
              Si vous voulez rejoindre la partie d'un ami, renseignez l'ID de la partie
              :
            </h3>
            <input
              type="text"
              onChange={(event) => setIdPartyRequested(event.target.value)}
            />
            <button type="submit" disabled={isSubmit}>
              {isSubmit ? "Veuillez patienter" : "Rejoindre la partie !"}
            </button>
            <Deconnection disabled={isSubmit} />
            <div>
              <button type="button" onClick={openModal}>
                Ouvrir la fenêtre des scores
              </button>
              <Modal
                    isOpen={isModalOpen}
                    onRequestClose={closeModal}
                    contentLabel="fenetre-score"
                    >
                    <h1>Fenêtre des scores</h1>
                    <button type="button" onClick={() => showScores("Bataille")}>
                        Catégorie Bataille
                    </button>
                    <button type="button" onClick={() => showScores("6 Qui Prend")}>
                        Catégorie SQP
                    </button>
                    <ScoreTable score={score} />
                    <button type="button" onClick={closeModal}>
                        Fermer
                    </button>
              </Modal>

            </div>
          </form>
        </div>
      );
}

export default Home;