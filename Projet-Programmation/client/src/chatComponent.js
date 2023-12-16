import React, { useEffect, useState } from 'react';
import io from 'socket.io-client'
const socket = io('http://localhost:3001');

function Chat({ data }) {
    const [texte, setTexte] = useState('');
    const [messages, setMessages] = useState([]);

    const [player, setPlayer] = useState('');
    const [party, setParty] = useState('');
    setPlayer(data.player);
    setParty(data.party);

    useEffect(() => {
        socket.on('newMessage', (data) => { // Quand un message est reçu dans le chat
            console.log("message bien envoyé")
            const { username, message } = data;
            setMessages(prevMessages => [...prevMessages, { username, message }]);
        });

        return () => {
            socket.off('newMessage'); // Nettoie l'écouteur d'événements lorsque le composant est démonté
        };
    }, []);

  const envoyerMessage = (message, player, party) => { // Pour envoyer un mesage à tous dans la partie
    console.log("le joueur", player, "envoie le message suivant :", message);
    socket.emit('chat', { message: message, player: player, party: party });
  };

  const handleKeyPress = (e) => { // Pour voir si le joueur presse Entrée, pour valider l'envoie du message
    if (e.key === 'Enter') {
      envoyerMessage(texte, player, party);
      setTexte('');
    }
  };

  const styles = { // Tout en bas à droite
    position: 'fixed',
    bottom: '20px',
    right: '20px',
  };

  return (
    <div style={styles}>
      <div>
        {messages.map((msg, index) => ( // Le chat avec les messages de tous les joueurs
          <div key={index}>
            <strong>{msg.player}: </strong>{msg.message}
          </div>
        ))}
      </div>
      <input // Le champ de texte pour envoyer un message
        type="text"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Envoyer un message"
      />
    </div>
  );
}

export default Chat;
