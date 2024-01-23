import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
const socket = io('http://localhost:3001');
// pour accéder à ce composant, mettre "import Score from './scoreComponent.js';"

const Score = () => {
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

  return (
    <div>
      <h2>Scores de la partie</h2>
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
