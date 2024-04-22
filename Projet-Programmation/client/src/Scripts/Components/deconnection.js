import React, { useContext, useEffect, useCallback } from 'react';
import { SocketContext } from '../Shared/socket.js';
import { ConnexionContext, ConnexionProvider } from '../Page/IC.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../index.js';

function Deco(props) {
  const { socket } = useContext(SocketContext);
  const { estConnecte, setEstConnecte } = useContext(ConnexionContext);
  const navigate = useNavigate();
  const { idJ, setIdJ, pseudo } = usePlayer();

  const handleDeconnection = useCallback(() => {
    setIdJ(null);
    setEstConnecte("Déconnecté");
    socket.emit('deconnexion');
    navigate('/');
    socket.emit('playerLeaving', idJ);
  }, [socket, setIdJ, setEstConnecte, navigate, idJ]);

  useEffect(() => {
    window.onload = function (e) {
      e.preventDefault();
      handleDeconnection();
      e.returnValue = 'Déconnecté';
    };
    
    socket.on('firstConnection', () => {
      setEstConnecte("Déconnecté");
      navigate('/');
    });

    socket.on('leave',()=>{
      navigate('/home');
  });

    // Clean up the event listener when the component unmounts
    return () => {
      window.onload = null;
    };
  }, [socket, setEstConnecte, navigate, handleDeconnection]);

  return (
    <div>
      {estConnecte === "Déconnecté" ? (
        null
      ) : (
        <>
          <p>Vous êtes {pseudo}, d'identifiant {idJ}</p>
          <button onClick={handleDeconnection} className='deconnection-button' disabled={props.disabled}>
            Se déconnecter
          </button>
        </>
      )}
    </div>
  );
}

export default function Deconnection(props) {
  return (
    <>
      <ConnexionProvider>
        <Deco disabled={props.disabled} />
      </ConnexionProvider>
    </>
  );
}
