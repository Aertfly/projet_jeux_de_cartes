import React from 'react';
import io from 'socket.io-client';
const socket = io('http://localhost:3001');
// pour accéder à ce composant, mettre "import Save from './saveComponent.js';"

function Save({ idPartie }) {
  const handleSave = () => {
    console.log("La partie", idPartie, "demande à être mise en pause");
    socket.emit('saveParty', { partie: idPartie });
  };

  return (
    <div>
      <button onClick={handleSave}>Sauvegarder la partie</button>
    </div>
  );
};

export default Save;