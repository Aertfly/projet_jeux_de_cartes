import React, { useContext, useState,useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js'
import { useIdParty } from './index.js';

import Deconnection from './deconnection.js';

<<<<<<< Updated upstream
function Quitter(props){
    const {socket} = useContext(SocketContext);
    const {idJ} = usePlayer();
    const navigate = useNavigate();
    function clicked(){
        socket.emit('playerLeaving',{
            'player' : idJ,
            'party'    : props.idParty,
            'Pseudo' : "Roger"
        });
        navigate('/');
    }
    return(
        <button type='button' onClick={clicked}>Quitter ?</button>
    );
}

const WaitingRoom = ()=>{
=======
const WaitingRoom = () => {
>>>>>>> Stashed changes
    const { socket } = useContext(SocketContext);
    const { idParty } = useParams();
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        socket.on('playerList', players => {
            console.log(players);
            setPlayers(players);
        });

    }, [socket]);

    return (
        <div>
<<<<<<< Updated upstream
            <h1>Bienvenue dans la Partie : {idParty} <br/> Liste des joueurs : {players}</h1>
            <Quitter idParty={idParty}/>
=======
            <h1>Bienvenue dans la Partie : {idParty}</h1>
            <h2>Liste des joueurs : {players}</h2>
>>>>>>> Stashed changes
            <Deconnection />
        </div>
    );
};

export default WaitingRoom;