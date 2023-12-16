import React, { useState } from 'react';
import io from 'socket.io-client';
const socket = io('http://localhost:3001');
// pour accéder à ce composant, mettre "import Save from './saveComponent.js';"

function Save({ data }) {
    // Enregistrement de la valeur de la data
    const [party, setParty] = useState('');
    setParty(data.party);

  const handleSave = () => {
    console.log("La partie", party, "demande à être mise en pause");
    socket.emit('saveParty', { partie: party });
  };

  return (
    <div>
      <button onClick={handleSave}>Sauvegarder la partie</button>
    </div>
  );
};

export default Save;