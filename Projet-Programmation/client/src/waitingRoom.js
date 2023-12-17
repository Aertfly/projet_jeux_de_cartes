import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { useIdJ } from './index.js'
import { useIdParty } from './index.js';

import Deconnection from './deconnection.js';

function Quitter(props){
    const {socket} = useContext(SocketContext);
    const {idJ} = useIdJ();
    const navigate = useNavigate();
    function clicked(){
        socket.emit('playerLeaving',{
            'player' : idJ,
            'party' : props.idParty,
            'Pseudo' : "Roger"
        });
        navigate('/');
    }
    return(
        <button type='button' onClick={clicked}>Quitter ?</button>
    );
}

const WaitingRoom = ()=>{
    const { idParty } = useParams();
    return(
        <div>
            <h1>Bienvenue dans la Partie : {idParty}</h1>
            <Quitter idParty={idParty}/>
            <Deconnection />
        </div>
    );
}

export default WaitingRoom;