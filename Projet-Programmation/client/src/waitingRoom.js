import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { useIdJ } from './index.js';
import { useIdParty } from './index.js';

import Deconnection from './deconnection.js';

const WaitingRoom = ()=>{
    const { idParty } = useParams();
    return(
        <div>
            <h1>Bienvenue dans la Partie :{idParty}</h1>
            <Deconnection />
        </div>
    );
}

export default WaitingRoom;