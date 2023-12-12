import React, { useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); 

const InscriptionForm = () => {
  const [pseudo, setPseudo] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const handleInscription = () => {
    // Envoie les données au serveur pour l'inscription
    socket.emit('inscription', { pseudo: pseudo, password: motDePasse });
  };

  return (
    <form id="inscriptionForm">
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
      <button type="button" onClick={handleInscription}>S'inscrire</button>
      Inscription
    </form>
  );
};

export default InscriptionForm;
