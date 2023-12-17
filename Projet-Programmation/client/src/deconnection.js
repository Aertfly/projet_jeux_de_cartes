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
    socket.emit('playerDisconnect',{
      'player' : idJ,
      'party'    : props.idParty,
      'pseudo' : pseudo
  });
    navigate('/');
  })

  socket.on('disconnectComplete', () => {
    setEstConnecte("Déconnecté");
    socket.emit('playerLeaving',{
      'player' : idJ,
      'party'    : props.idParty,
      'pseudo' : pseudo
  });
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
//juste pour faciliter navigation pendant test
function BackButton(props){
  const navigate = useNavigate();
  function handle(){
    navigate(props.path);
    console.log("return");
  }
  return(
    <div>
    <button type='button' onClick={handle} className='deconnection-button'  disabled={props.disabled} hidden={props.disabled}>Retour</button>
    </div>
  );
}

export default function Deconnection(props) {
  return (
    <>
    <ConnexionProvider>
      <Deco disabled={props.disabled}/>
    </ConnexionProvider>
    <BackButton disabled={!props.goBack} path={props.path} />
    </>
  );
}

