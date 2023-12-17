import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js'
import Deconnection from './deconnection.js';

function Quitter(props) {
    const { socket } = useContext(SocketContext);
    const { idJ, pseudo } = usePlayer();
    const navigate = useNavigate();
    function clicked() {
        socket.emit('playerLeaving', {
            'player': idJ,
            'party': props.idParty,
            'pseudo': pseudo
        });
        navigate('/home');
    }
    return (
        <button type='button' onClick={clicked}>Quitter ?</button>
    );
}

function Player(props) {
    return (
        <li>props.pseudo</li>
    );
}

const WaitingRoom = () => {
    const { socket } = useContext(SocketContext);
    const { idParty } = useParams();

    const createPlayerList = (playersList) => {
        if (playersList && playersList.length > 0) {
            return playersList.map((pseudo, index) => (
                <li key={index}>{pseudo}</li> // Utiliser l'index comme clé si les pseudos ne sont pas garantis uniques
            ));
        } else {
            return <li>Attente</li>;
        }
    };

    let playersList = []; // Initialiser une liste vide

    // Gérer la réception des données du socket
    socket.on('playerList', (newPlayersList) => {
        console.log("Players List Received:", newPlayersList);
        playersList = newPlayersList; // Mettre à jour la liste des joueurs
        <div>{playersList}</div>
        console.log("playersList");console.log(playersList);
        
    });

    return (
        <div>
            <h1>Bienvenue dans la Partie : {idParty}</h1>
            <ul>Liste des joueurs :</ul>
            {createPlayerList(playersList)}
            <Quitter idParty={idParty} />
            <Deconnection />
        </div>
    );
};

export default WaitingRoom;

