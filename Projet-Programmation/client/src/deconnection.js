import React, { useContext } from 'react';
import { SocketContext } from './socket.js';
import { ConnexionContext, ConnexionProvider } from './IC.js'; 
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js';

function Deco(props) {
  const { socket } = useContext(SocketContext);
  const { estConnecte, setEstConnecte } = useContext(ConnexionContext);
  const navigate = useNavigate();
  const {idJ, setIdJ, pseudo } = usePlayer();

  const handleDeconnection = () => {
    setIdJ(null); 
    setEstConnecte("Déconnecté");
    socket.emit('deconnexion');
    navigate('/');
  };

  window.onload = function(e) {
    e.preventDefault();
    handleDeconnection();
    e.returnValue = 'Déconnecté'; 
  };

  socket.on('deconnexion', () => {
    setEstConnecte("Déconnecté");
    socket.emit('playerLeaving',idJ);
    navigate('/');
  })

  socket.on('firstConnection', () => {
    setEstConnecte("Déconnecté");
    navigate('/');
  })

  return (
    <div>
      {estConnecte === "Déconnecté" ? (
        null
      ) : <>
      <p>Vous êtes connecté sous le compte : {pseudo} d'id : {idJ}</p>
      <button onClick={handleDeconnection} className='deconnection-button' disabled={props.disabled}>Se déconnecter</button>
      </>
      }
          
    </div>
  );
}


export default function Deconnection(props) {
  return (
    <>
    <ConnexionProvider>
      <Deco disabled={props.disabled}/>
    </ConnexionProvider>
    </>
  );
}

