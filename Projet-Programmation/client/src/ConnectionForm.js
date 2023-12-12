import React, { useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); 

const ConnectionForm = () => {
  const [pseudo, setPseudo] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const handleConnection = () => {
    // Envoie les données au serveur pour l'inscription
    socket.emit('connexion', { pseudo: pseudo, password: motDePasse });
  };

  return (
    <form id="connectionForm">
      <input 
        type="text" 
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
        placeholder="pseudo" 
        required 
      />
      <input 
        type="password" 
        value={motDePasse}
        onChange={(e) => setMotDePasse(e.target.value)}
        placeholder="Mot de passe" 
        required 
      />
      <button type="button" onClick={handleConnection}>S'inscrire</button>
      Connexion
    </form>
    
  );
};

export default ConnectionForm;
