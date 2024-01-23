import React, { useEffect, useState } from 'react';
import { SocketContext } from '../../socket.js';
// pour accéder à ce composant, mettre "import Score from './scoreComponent.js';"

const Score = () => {
  const { socket } = useContext(SocketContext);
  const [scores, setScores] = useState({});

  useEffect(() => {
    socket.on('updateScores', (data) => { //Quand on reçoit une demande de modification du score
      setScores(prevScores => ({
        ...prevScores,
        [data.player]: data.score // Mise à jour du score du joueur dans l'objet scores
      }));
    });

    socket.on('otherPlayerLeft', (player) => { // Quand un joueur a quitté la partie
        setScores(prevScores => {
          const updatedScores = { ...prevScores };
          delete updatedScores[player]; // Suppression du joueur de la liste des scores
          return updatedScores;
        });
      });

    return () => {
      socket.off('updateScores');
      socket.off('otherPlayerLeft');
    };
  }, []);

  // On transforme l'objet en tableau pour faire l'affichage
  const scoresArray = Object.keys(scores).map(player => ({
    player,
    score: scores[player]
  }));

  const Style = {
    position: 'fixed',
    top: '10px',
    right: '100px',
    width: '200px', // Changer la largeur à deux fois plus grande
    height: '200px', // Changer la hauteur à deux fois plus grande
    backgroundColor: 'white',
    color: 'black',
    padding: '10px',
    borderRadius: '10px',
    border: '2px solid black',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  };

  const headerStyle = {
    textAlign: 'center', // Centrer le texte
  };

  return (
    <div style={Style}>
      <h2 style={headerStyle}>Scores de la partie</h2>
      <ul>
        {scoresArray.map((player, index) => (
          <li key={index}>
            Joueur : {player.player} - Score : {player.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Score;
