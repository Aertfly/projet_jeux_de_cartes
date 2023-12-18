import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js'
import Deconnection from './deconnection.js';
import chat from './chatComponent.js';

var sockets = null;


function gestionTours(playerId, socket) {
  if (sockets == null) {
    socket.on('newTurn', (data) => {

      if (data.joueurs.includes(playerId)) {
        console.log("C'est mon tour de jouer ! - Tour " + data.numeroTour);
      }
    });

    socket.on('conveyAction', (data) => {
      console.log("conveyAction reçu");
      console.log(data);
    });

    socket.on('reveal', (data) => {
      console.log("reveal reçu");
      console.log(data);
    });


  }
}

function carteVersTexte(carte) {
  return carte.valeur + " de " + carte.enseigne;
}

function ChoisirCarteForm(props) {
  const { socket } = useContext(SocketContext);
  gestionTours(props.playerId, socket);
  const cartes = props.cartes;
  const [carteChoisie, setCarteChoisie] = React.useState(null); // Ajouter un état pour la carte choisie

  const elements = cartes.map((carte) => {
    return (
      <>
        <label htmlFor={carteVersTexte(carte)}>
          {carteVersTexte(carte)}
        </label>
        <input
          type="radio"
          name="carte"
          id={carteVersTexte(carte)}
          value={carteVersTexte(carte)}
          key={carteVersTexte(carte)}
          onChange={(e) => setCarteChoisie(carte)} // Mettre à jour l'état quand on change de carte
        />
        <br />
      </>
    );
  });

  const jouerCarte = (e) => {
    e.preventDefault(); // Empêcher le comportement par défaut du formulaire
    console.log('playerAction :');
    console.log({ "carte": carteChoisie, "player": "Pierre", "action": "joue", "playerId": props.playerId });
    socket.emit('playerAction', { "carte": carteChoisie, "action": "joue", "playerId": props.playerId }); // Émettre la carte choisie sur la route 'playerAction'
  }

  return (
    <form onSubmit={jouerCarte}>
      {elements}
      <input type="submit" value="Jouer la carte" />
    </form>
  );
}

const GameBoard = ({ numberOfPlayers }) => {
  const [playerPositions, setPlayerPositions] = useState([]);

  useEffect(() => {
    const calculatePlayerPositions = () => {
      const radius = 300; // Remplacez 100 par la valeur souhaitée pour le rayon du cercle
      const angleIncrement = (2 * Math.PI) / numberOfPlayers;
      const positions = [];

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      for (let i = 0; i < numberOfPlayers; i++) {
        const angle = i * angleIncrement;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        positions.push({ x, y });
      }

      setPlayerPositions(positions);
    };

    calculatePlayerPositions();
  }, [numberOfPlayers]);

  return (
    <div style={{
        backgroundColor: '#004400', // couleur de fond de test
        backgroundSize: 'cover', 
        width: 'cover', // largeur de test
        height: 'cover', // hauteur de test
        color: 'white'
  }} className="game-board">
      {playerPositions.map((position, index) => (
        <Player key={index} x={position.x} y={position.y} />
      ))}
    </div>
  );
};

const Player = ({ x, y }) => {
  const playerStyle = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
  };

  return <div  className="player" style={playerStyle}>
    Roger Enzo 
  </div>;
};

const Battle = () => {
  const [cards, setCards] = useState();
  const { socket } = useContext(SocketContext);
  console.log(usePlayer());
  console.log("--");
  const { idJ, playerList } = usePlayer();
  const { idParty } = useParams();

  function recupererCartes() {
    console.log(idJ);
    console.log(idParty);
    socket.emit("requestCards", { "idJ": idJ, "idParty": idParty });;
  }

  useEffect(() => {
    socket.on("dealingCards", (data) => {
      console.log("Cartes reçues via dealingCards");
      setCards(data);
    });
  }, [socket]);

  /*useEffect(()=>{
    const importAll = (context) => context.keys().map(context);
    const images = importAll(require.context('../img', false, /\.(png)$/));
    console.log(images)
  },[]);*/

  return (
    <div>
      <GameBoard numberOfPlayers={10} />;
      <p>Auteur des cartes : David Bellot (david.bellot@free.fr) avec aide de Brigitte Bigi (Brigitte.Bigi@imag.fr) sous licence LGPL et sous © 2005 David Bellot</p>
    </div>
  );
};

export default Battle;