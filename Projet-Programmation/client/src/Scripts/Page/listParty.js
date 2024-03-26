import React, { useState, useContext } from 'react';
import { SocketContext } from '../Shared/socket.js';
import { usePlayer } from '../../index.js';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


function Party(props) {
  const { socket } = useContext(SocketContext);
  const { idJ,setPlayerList } = usePlayer();
  const navigate = useNavigate();
  

  const joinGame = () => {
    props.onJoinClick();
    socket.emit('joinRequest', { 'idPlayer': idJ, 'idParty': props.idParty });
    socket.on('joinGame', data => {
      if(data.message){
        props.onError(data.message);
      }else{
        setPlayerList(data.playerList);
        setTimeout(() => navigate('/Home/waitingRoom/' + data.idParty), 500);
      }
    });
  };
  

  return (
      <tbody>
        <tr>
          <td>{props.idParty}</td>
          <td>{props.type}</td>
          <td>{props.min}</td>
          <td>{props.nbPlayer +"/"+ props.max}</td>
          <td><button type='button' onClick={joinGame} disabled={props.disabled}>Rejoindre</button></td>
        </tr>
      </tbody>
  );
}



function ListParty(props) {
  const {idJ} = usePlayer()
  const [parties, setParties] = useState([]);
  const { socket } = useContext(SocketContext);
  const [error,setError] = useState("")

  useEffect(() => {
    const fetchParties = async () => {
      socket.on('joinableListOut', (data) => {
          setParties(data);
      });
      socket.on('savedListOut', (data) => {
          setParties(data);
      });
      props.save ? socket.emit('savedList', idJ) : socket.emit('joinableList');
    };
    
    const cleanup = () => {
      socket.off('joinableListOut');
      socket.off('savedListOut');
    };

    fetchParties();
    return cleanup;
  }, [socket]);

  const [allButtonsDisabled, setAllButtonsDisabled] = useState(false);

  const handleJoinClick = () => {
    setAllButtonsDisabled(true);
  };

  const handleError = (error) => {
    setError(error);
  };

  return (
    <div>
      <h3>{props.save?"Vos parties sauvegardées":"Parties disponibles"}</h3>
      <p style={{color:"red"}}>{error}</p>
      <table border="1">
        <thead>
          <tr>
            <th>Identifiant</th>
            <th>Jeu</th>
            <th>Joueurs Requis</th>
            <th>Nombre de joueurs</th>
            <th style={{ color: 'transparent' }}>Rejoindre</th>
          </tr>
        </thead>
        {parties.map((party) => (
          <Party
            key={party.idPartie}
            idParty={party.idPartie}
            min={party.joueursMin}
            max={party.joueursMax}
            type={party.type}
            nbPlayer={party.nbJoueur}
            disabled={allButtonsDisabled}
            onJoinClick={handleJoinClick}
            onError={handleError}
          />
        ))}
      </table>
      <button type='button' onClick={props.hide}>Masquer la liste</button>
      <button type='button' onClick={()=>{props.save ? socket.emit('savedList', idJ) : socket.emit('joinableList');}}>Actualiser</button>
    </div>
  );
}

export default ListParty;
