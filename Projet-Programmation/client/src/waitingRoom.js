import React, { useContext, useState,useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js'
import Deconnection from './deconnection.js';
import Chat from './chatComponent.js';


function Quitter(props){
    function clicked(){
        props.socket.emit('playerLeaving',props.idJ);
        props.navigate('/home');
    }
    return(
        <button type='button' onClick={clicked}>Quitter ?</button>
    );
}

function Start(props){
    function clicked(){
        console.log(props.idJ);
        props.socket.emit('start',{'idParty':props.idParty,'idPlayer':props.idJ})
    }
    return(
        <button hidden={props.hidden} onClick={clicked}>Start ?</button>
    );
}

const WaitingRoom = ()=>{
    const {socket} = useContext(SocketContext);
    const {idJ,pseudo,playerList} = usePlayer();
    const {idParty} = useParams();
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();
    useEffect(() => {
        socket.on('gameStart',data =>{
            if(data.message){
                setMsg(data.message);
                console.log(data.message);
            }
            else{
                console.log(data);
                setTimeout(() => navigate('/Home/Party/'+data.idParty), 250);
            }
        });

    }, [socket]);

    function Player(props){
        return(
            <li>{props.pseudo}</li>
        );
    }

    return (
        <div className="waiting-room-container">
            <h1>Bienvenue dans la Partie : {idParty}</h1>
            <p style={{color:'red'}}>{msg}</p>
            <ul>
                Liste des joueurs :
                {playerList.length === 0?"En attente des données du serveur":playerList.map(name => (
                    <Player pseudo={name} />
                ))}
            </ul>
            <Quitter idParty={idParty} idJ={idJ} pseudo={pseudo} socket={socket} navigate={navigate}/>
            <Start socket={socket} idParty={idParty} idJ={idJ} hidden={false} />
            <Deconnection />
            <Chat data={{party : idParty}} />
        </div>
    );
};

export default WaitingRoom;
