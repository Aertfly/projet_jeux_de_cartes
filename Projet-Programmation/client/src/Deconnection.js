import React, { useContext } from 'react';
import './Deconnection.css';
import { SocketContext } from './socket.js';
import { ConnexionContext, ConnexionProvider } from './IC.js'; 
import { useNavigate } from 'react-router-dom';
import { useIdJ } from './index.js';

function Deco() {
  const { socket } = useContext(SocketContext);
  const { estConnecte, setEstConnecte } = useContext(ConnexionContext);
  const navigate = useNavigate();
  const { idJ, setIdJ } = useIdJ();

  const handleDeconnection = () => {
    socket.emit('deconnexion');
    setIdJ(null); 
    setEstConnecte("Déconnecté");
    navigate('/');
    console.log(socket.id);
  };

  window.onload = function(e) {
    e.preventDefault();
    handleDeconnection();
    e.returnValue = 'Déconnecté'; 
  };

  socket.on('deconnexion', () => {
    setEstConnecte("Déconnecté");
    navigate('/');
  })

  return (
    <div>
      {estConnecte === "Déconnecté" ? (
        null
      ) : <button onClick={handleDeconnection} className='deconnection-button'>Se déconnecter</button>}
      Votre Idj : { idJ }
    </div>
  );
}

export default function Deconnection() {
  return (
    <ConnexionProvider>
      <Deco />
    </ConnexionProvider>
  );
}

