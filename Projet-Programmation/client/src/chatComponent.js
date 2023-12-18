import React, { useState, useContext } from 'react';
import { SocketContext } from './socket.js';
import { useEffect } from 'react';
import { usePlayer } from './index.js';
// pour accéder à ce composant, mettre "import Chat from './chatComponent.js';"

function Chat({ data }) {
    const {socket} = useContext(SocketContext);
    const [texte, setTexte] = useState('');
    const [messages, setMessages] = useState([]);

    // Enregistrement des valeurs de la data
    const {idJ,pseudo} = usePlayer();
    const [party, setParty] = useState('');

    useEffect(() => {
        setParty(data.party)
        socket.on('newMessage', (data) => { // Quand un message est reçu dans le chat
            console.log("message bien envoyé")
            const { username, message } = data;
            setMessages(prevMessages => [...prevMessages, { username, message }]);
        });

        socket.on('otherPlayerLeft', (username) => {
          const leftPlayerMessage = `Le joueur ${username} a quitté.`;
          setMessages(prevMessages => [...prevMessages, { username: 'Server', message: leftPlayerMessage }]);
        })
        return () => {
            socket.off('newMessage'); // Nettoie l'écouteur d'événements lorsque le composant est démonté
        };
    }, [socket, data.party]);

  const envoyerMessage = (message, pseudo, party) => { // Pour envoyer un mesage à tous dans la partie
    console.log("le joueur", pseudo, "envoie le message suivant :", message);
    socket.emit('chat', { message: message, username : pseudo, party: party });
  };

  const handleKeyPress = (e) => { // Pour voir si le joueur presse Entrée, pour valider l'envoie du message
    if (e.key === 'Enter') {
      envoyerMessage(texte, pseudo, party);
      setTexte('');
    }
  };

  const styles = {
    position: 'fixed',
    bottom: '50px',
    right: '50px',
    backgroundColor: 'green',
    width: '300px',
    height: '200px'
  };

  return (
    <div style={styles}>
      <div>
        {messages.map((msg, index) => ( // Le chat avec les messages de tous les joueurs
          <div key={index}>
            <strong>{msg.username}: </strong>{msg.message}
          </div>
        ))}
      </div>
      <input // Le champ de texte pour envoyer un message
        type="text"
        style={{position: 'fixed',
        bottom: '50px',
        right: '50px', width: '280px',
        height: '50px'}}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Envoyer un message"
      />
    </div>
  );
}

export default Chat;
