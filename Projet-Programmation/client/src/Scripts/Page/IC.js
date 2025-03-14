
import CryptoJS from 'crypto-js';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { SocketContext } from '../Shared/socket.js';

import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../index.js';

const InscriptionContext = createContext();
export const ConnexionContext = createContext();

export const ConnexionProvider = ({ children }) => {
  const [estConnecte, setEstConnecte] = useState("");

  return (
    <ConnexionContext.Provider value={{ estConnecte, setEstConnecte }}>
      {children}
    </ConnexionContext.Provider>
  );
};

const InscriptionProvider = ({ children }) => {
  const [estInscrit, setEstInscrit] = useState("");

  return (
    <InscriptionContext.Provider value={{ estInscrit, setEstInscrit }}>
      {children}
    </InscriptionContext.Provider>
  );
};

function InscriptionState() {
  const { estInscrit } = useContext(InscriptionContext);
  return (
    <div>
      {estInscrit !== "" ? <button className="connectionState">{estInscrit}</button> : null}
    </div>
  );
}

function InscriptionForm() {
  const { socket } = useContext(SocketContext);
  const [pseudoInput, setPseudoInput] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const { estInscrit, setEstInscrit } = useContext(InscriptionContext);

  const handleInscription = () => {
    const hashedPassword = CryptoJS.SHA256(motDePasse).toString();
    socket.emit('inscription', { pseudo: pseudoInput, password: hashedPassword });
  };

  socket.on('resultatInscription', (dataMessage) => {
    setEstInscrit(dataMessage);
  });

  return (
    <form id="inscriptionForm">
      <h2>Si vous n'avez pas de compte, inscrivez-vous :</h2>
      <input 
        type="text" 
        value={pseudoInput}
        onChange={(setValue) => setPseudoInput(setValue.target.value)}
        placeholder="pseudo" 
        required 
      />
      <input 
        type="password" 
        value={motDePasse}
        onChange={(setValue) => setMotDePasse(setValue.target.value)}
        placeholder="Mot de passe" 
        required 
      />
      <div className="button-container">
        {estInscrit !== "Inscription réussie, veuillez vous connecter!" ? (
          <button type="button" onClick={handleInscription}>S'inscrire</button>
        ) : null}
        <InscriptionState />
      </div>
    </form>
  );
}

function ConnectionState() {
  const { estConnecte } = useContext(ConnexionContext);
  return (
    <div>
      {estConnecte !== "" ? <button className="connectionState" disabled>{estConnecte}</button> : null}
    </div>
  );
}

function ConnectionForm() {
  const { socket } = useContext(SocketContext);
  const [pseudoInput, setPseudoInput] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const { estConnecte, setEstConnecte } = useContext(ConnexionContext);
  const navigate = useNavigate();
  const { setIdJ,setPseudo } = usePlayer();

  const handleConnection = () => {
    const hashedPassword = CryptoJS.SHA256(motDePasse).toString();
    socket.emit('connexion', { pseudo: pseudoInput, password: hashedPassword });
  };
  useEffect(()=>{
    socket.on('resultatConnexion', (dataMessage) => {
      setEstConnecte(dataMessage);
    });
  
    socket.on('infoPlayer', (data) => {
      setTimeout(() => navigate('/Home'), 500);
      setIdJ(data.idJ);
      setPseudo(data.pseudo);
      socket.emit('test', data.idJ)
    });
    
    return ()=>{
      socket.off('resultatConnexion');
      socket.off('infoPlayer');
    }
  },[])


  return (
    <form id="connectionForm">
      <h2>Si vous avez un compte, connectez-vous :</h2>
      <input 
        type="text" 
        value={pseudoInput}
        onChange={(setValue) => setPseudoInput(setValue.target.value)}
        placeholder="pseudo" 
        required 
      />
      <input 
        type="password" 
        value={motDePasse}
        onChange={(setValue) => setMotDePasse(setValue.target.value)}
        placeholder="Mot de passe" 
        required 
      />
      <div className="button-container">
        {estConnecte !== "Connexion réussie" ? (
          <button type="button" onClick={handleConnection}>Se connecter</button>
        ) : null}   
        <ConnectionState />
      </div>
    </form>
  );
}

function IC() {
  return (
    <ConnexionProvider>  

        <ConnectionForm />

        <InscriptionProvider>
          <InscriptionForm />
        </InscriptionProvider>
    
    </ConnexionProvider>
  );

}

export default IC;
