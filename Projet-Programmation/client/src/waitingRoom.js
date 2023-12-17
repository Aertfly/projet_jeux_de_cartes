import React, { useContext, useState,useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js'
import Deconnection from './deconnection.js';

function Quitter(props){
    const {socket} = useContext(SocketContext);
    const {idJ,pseudo} = usePlayer();
    const navigate = useNavigate();
    function clicked(){
        socket.emit('playerLeaving',{
            'player' : idJ,
            'party'    :props.idParty,
            'pseudo' : pseudo   
        });
        navigate('/home');
    }
    return(
        <button type='button' onClick={clicked}>Quitter ?</button>
    );
}

function Player(props){
    return(
        <li>props.pseudo</li>
    );
}

const WaitingRoom = ()=>{
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
            <h1>Bienvenue dans la Partie : {idParty}</h1>
            <ul>Liste des joueurs :</ul>

            {players?players.map((pseudo) => (
            <Player pseudo={pseudo} />
            )):<li>Attente</li>}
            <Quitter idParty={idParty}/>
            <Deconnection />
        </div>
    );
};

export default WaitingRoom;