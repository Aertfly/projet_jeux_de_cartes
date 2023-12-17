import React, { useState, useContext } from 'react';
import { SocketContext } from './socket.js';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js';

function Party(props) {
  const { socket } = useContext(SocketContext);
  const { idJ } = usePlayer();
  const navigate = useNavigate();

  const joinGame = () => {
    // Disable all buttons before making the request
    props.onJoinClick();
    
    socket.emit('joinRequest', { 'idPlayer': idJ, 'idParty': props.idParty });
    socket.on('joinGame', data => {
      setTimeout(() => navigate('/Home/waitingRoom/' + props.idParty), 500);
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

  useEffect(() => {
    const fetchParties = async () => {
      try {
        socket.emit('savedList');
        socket.on('savedListOut', (data) => {
          setParties(data);
        });
      } catch (error) {
        console.error('Erreur :', error);
      }
    };
    fetchParties();
  }, [socket]);

  const [allButtonsDisabled, setAllButtonsDisabled] = useState(false);

  const handleJoinClick = () => {
    setAllButtonsDisabled(true);
  };

  return (
    <div>
      <h3>Liste des Parties sauvergardées :</h3>
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
          />
        ))}
      </table>
      <Hide />
    </div>
  );
}

export default ListParty;
