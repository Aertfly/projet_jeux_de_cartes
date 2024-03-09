import React, { useState, useContext } from 'react';
import { SocketContext } from '../../Shared/socket.js';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../index.js';

function Party(props) {
  const { socket } = useContext(SocketContext);
  const { idJ,setPlayerList} = usePlayer();
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
        <td>{props.min}</td>
        <td>{props.max}</td>
        <td>{props.type}</td>
        <td><button type='button' onClick={joinGame} disabled={props.disabled}>Rejoindre ?</button></td>
      </tr>
    </tbody>
  );
}

function Hide(){
    const navigate = useNavigate();
    function clicked(){
        setTimeout(() => navigate('/Home'), 250);
    };
    return (
        <button type='button' onClick={clicked}>Cacher ?</button>
    );
}

function ListParty() {
  const [parties, setParties] = useState([]);
  const { socket } = useContext(SocketContext);
  const {idJ} = usePlayer()
  const [error,setError] = useState("")

  useEffect(() => {
    const fetchParties = async () => {
      socket.on('savedListOut', (data) => {
        setParties(data);
      });
      socket.emit('savedList',idJ);
    };  
    const cleanup = () => {
      socket.off('savedListOut');
    };
    fetchParties();
    return cleanup;
  }, [socket,idJ]);

  const [allButtonsDisabled, setAllButtonsDisabled] = useState(false);

  const handleJoinClick = () => {
    setAllButtonsDisabled(true);
  };

  const handleError = (error) => {
    setError(error);
  };

  return (
    <div>
      <h3>Liste des Parties sauvergardées :</h3>
      <p style={{color:"red"}}>{error}</p>
      <table border="1">
        <thead>
          <tr>
            <th>ID Partie</th>
            <th>Min</th>
            <th>Max</th>
            <th>Type</th>
            <th>Cliquer ici</th>
          </tr>
        </thead>
        {parties.map((party) => (
          <Party
            key={party.idPartie}
            idParty={party.idPartie}
            min={party.joueursMin}
            max={party.joueursMax}
            type={party.type}
            disabled={allButtonsDisabled}
            onJoinClick={handleJoinClick}
            onError={handleError}
          />
        ))}
      </table>
      <Hide />
    </div>
  );
}

export default ListParty;
