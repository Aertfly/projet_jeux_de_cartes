import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { useIdJ } from './index.js';
import { useIdParty } from './index.js';

import Deconnection from './deconnection.js';

const WaitingRoom = ()=>{
    const { socket } = useContext(SocketContext);
    const { idParty } = useParams();
    const [players, SetPlayers] = useState("");
    socket.on('playerList',playerList => {
        SetPlayers(playerList);
    })
    return(
        <div>
            <h1>Bienvenue dans la Partie : {idParty} <br/> Liste des joueurs : {players}</h1>
            <Deconnection />
        </div>
    );
}

export default WaitingRoom;