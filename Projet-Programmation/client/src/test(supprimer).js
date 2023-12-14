import React, { createContext, useContext, useState } from 'react';
import io from 'socket.io-client'
const socket = io('http://localhost:3001');


// Créez un contexte pour stocker l'ID du joueur
const PlayerIdContext = createContext();

// Fournisseur de contexte pour stocker et mettre à jour l'ID du joueur
const PlayerIdProvider = ({ children }) => {
  const [playerId, setPlayerId] = useState('');

  // Fonction pour mettre à jour l'ID du joueur
  const updatePlayerId = (newPlayerId) => {
    setPlayerId(newPlayerId);
  };

  return (
    <PlayerIdContext.Provider value={{ playerId, updatePlayerId }}>
      {children}
    </PlayerIdContext.Provider>
  );
};

// Hook pour utiliser l'ID du joueur dans d'autres composants
const usePlayerId = () => {
  const context = useContext(PlayerIdContext);
  if (!context) {
    throw new Error('usePlayerId doit être utilisé à l\'intérieur de PlayerIdProvider');
  }
  return context;
};

// Composant pour enregistrer l'ID du joueur
const RegisterPlayerId = () => {
  const { playerId, updatePlayerId } = usePlayerId();

  const handleChange = (event) => {
    const newPlayerId = event.target.value;
    if(newPlayerId)updatePlayerId(parseInt(newPlayerId));
    else{
        updatePlayerId("");
    }
  };

  return (
    <div>
      <input
        type="text"
        value={playerId}
        onChange={handleChange}
        placeholder="Entrez l'ID du joueur"
      />
    </div>
  );
};

// Composant pour afficher l'ID du joueur
const DisplayPlayerId = () => {
  const { playerId } = usePlayerId();

  return (
    <div>
      <p>ID du joueur : {playerId}</p>
    </div>
  );
};

// Composant principal qui utilise les composants ci-dessus
const App = () => {
  return (
    <PlayerIdProvider>
      <div>
        <RegisterPlayerId />
        <DisplayPlayerId />
        <Button />
      </div>
    </PlayerIdProvider>
  );
};





function Button() {
    const { playerId } = usePlayerId();
    const idParty = "ABCD";
  
    function click() {
      socket.emit('start', {
        'idPlayer': playerId,
        'idParty': idParty
      });
    }
    return (
      <button onClick={click}>Start</button>
    );
  }

function Test(){
    return(
        <>
        <App />
        </>
    )
}

export default Test;