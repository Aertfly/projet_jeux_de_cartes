import React, { useContext } from 'react';
import { SocketContext } from '../../socket.js';
// pour accéder à ce composant, mettre "import Save from './saveComponent.js';"

function Save({ data }) {
    // Enregistrement de la valeur de la data
    const { socket } = useContext(SocketContext);
    const party = data.party
  const handleSave = () => {
    console.log("La partie", party, "demande à être mise en pause");
    socket.emit('saveParty', { 'partie': party });
  };

  const Style = {
    position: 'fixed',
    bottom: '10px',
    left: '10px',
  };

  return (
    <div>
      <button style={Style} onClick={handleSave}>Sauvegarder</button>
    </div>
  );
};

export default Save;
