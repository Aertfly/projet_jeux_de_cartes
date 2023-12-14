import React from 'react';
import { useState } from 'react';
import io from 'socket.io-client'
const socket = io('http://localhost:3001');

function InscriptionForm () {
    const [pseudo, setPseudo] = useState('')
    const [motDePasse, setMotDePasse] = useState('')
  
    const handleInscription = () => {
      socket.emit('inscription', { pseudo: pseudo, password: motDePasse })
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
    )
  }
  
  function DeconnectionForm () {
    const handleDeconnection = () => {
        socket.emit('deconnexion')
        console.log(socket.id)
      }
  
    return (
        <button onClick={handleDeconnection}>Se déconnecter !</button>
    )
    
  }
  
  function ConnectionForm () {
    const [pseudo, setPseudo] = useState('');
    const [motDePasse, setMotDePasse] = useState('')
    const handleConnection = () => {
      socket.emit('connexion', { pseudo: pseudo, password: motDePasse })
    }
  
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
        <button type="button" onClick={handleConnection}>Se Connecter</button>
        Connexion
      </form>
      
    )
  }


  const Test = () =>{
    function click() {
        var idJ = 10;
        var idParty = "#tra54d";
        var data = {'idJ' : idJ , 'idParty' : idParty };
        console.log("J'envoie mon idj",idJ);
        socket.emit('start',data);
    }
    return(
        <button onClick={click}>Start</button>
    );
}



  function Main () {
    return (
        <>
        <ConnectionForm />
        <InscriptionForm />
        <DeconnectionForm />
        <Test />
        </>
    )
  };

  export default Main;