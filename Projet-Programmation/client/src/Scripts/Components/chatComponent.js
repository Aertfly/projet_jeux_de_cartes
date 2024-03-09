import React, { useState, useContext } from 'react';
import { SocketContext } from '../Shared/socket.js';
import { useEffect } from 'react';
import { usePlayer } from '../../index.js';
import { useRef } from 'react';
// pour accéder à ce composant, mettre "import Chat from './chatComponent.js';"

function Chat({ data }) {
    const {socket} = useContext(SocketContext);
    const [texte, setTexte] = useState('');
    const [messages, setMessages] = useState([]);
    const chatContainerRef = useRef();

    // Enregistrement des valeurs de la data
    const {pseudo} = usePlayer();
    const [party, setParty] = useState('');

    useEffect(() => {
        setParty(data.party)
        socket.on('newMessage', (data) => { // Quand un message est reçu dans le chat
            console.log("message bien envoyé")
            const { username, message } = data;
            setMessages(prevMessages => [...prevMessages, { username, message }]);
            scrollToBottom();
        });

        socket.on('otherPlayerLeft', (username) => {
          const leftPlayerMessage = `Le joueur ${username} a quitté.`;
          setMessages(prevMessages => [...prevMessages, { username: 'Server', message: leftPlayerMessage }]);
          scrollToBottom();
        })
        return () => {
            socket.off('newMessage'); // Nettoie l'écouteur d'événements lorsque le composant est démonté
            socket.off('otherPlayerLeft');
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
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const styles = {
    position: 'fixed',
    bottom: '140px',
    right: '50px',
    color:'black',
    backgroundColor: 'gray',
    width: '300px',
    height: '200px',
    overflowY: 'auto',
  };

  return (
    <div style={styles}>
      <div ref={chatContainerRef} style={{ height: '100%', overflowY: 'auto', textAlign: 'left', paddingLeft: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.username}: </strong>{msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        style={{ position: 'fixed', bottom: '50px', right: '50px', width: '280px', height: '50px' }}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Envoyer un message"
      />
    </div>
  );
}

export default Chat;
