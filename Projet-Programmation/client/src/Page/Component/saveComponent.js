import React, {useContext } from 'react';
import { SocketContext } from '../../socket.js';
// pour accéder à ce composant, mettre "import Save from './saveComponent.js';"

function Save({ data }) {
    // Enregistrement de la valeur de la data
    const { socket } = useContext(SocketContext);

  const handleSave = () => {
    console.log("La partie", data.party , "demande à être mise en pause");
    socket.emit('saveParty', { 'partie': data.party });
  };

  return (
    <div>
      <button onClick={handleSave}>Sauvegarder</button>
    </div>
  );
};

export default Save;
