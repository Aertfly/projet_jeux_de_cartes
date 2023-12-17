import React, { useContext } from 'react';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { useIdJ } from './index.js';

import Deconnection from './deconnection.js';

const waitingRoom = ()=>{
    return(
        <body>
            <h1>Bienvenue dans la Partie : {idParty}</h1>
            <Deconnection />
        </body>
    );
}

export default waitingRoom;