import React, { useContext, useState,useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js'
import Deconnection from './deconnection.js';



function Quitter(props){
    function clicked(){
        props.socket.emit('playerLeaving',{
            'player' : props.idJ,
            'party'  : props.idParty,
            'pseudo' : props.pseudo   
        });
        props.navigate('/home');
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

function Start(props){
    function clicked(){
        props.socket.emit('start',{'idParty':props.idParty,'idJ':props.idJ})
    }
    return(
        <button hidden={props.hidden} onClick={clicked}>Start ?</button>
    );
}

const WaitingRoom = ()=>{
    const {socket} = useContext(SocketContext);
    const {idJ,pseudo} = usePlayer();
    const {idParty } = useParams();
    const [players, setPlayers] = useState([]);
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        socket.on('playerList', players => {
            console.log(players);
            setPlayers(players);
        });

        socket.on('gameStart',data =>{
            if(data.message){
                setTimeout(() => navigate('/Home/Party/'+data.partyId), 250);
            }
            else{
                setMsg(data.message);
                console.log(data.message);
            }
        });

    }, [socket]);
    
    return (
        <div>
            <h1>Bienvenue dans la Partie : {idParty}</h1>
            <p style={{color:'red'}}>{msg}</p>
            <ul>Liste des joueurs :</ul>
            {players.length==0?players.map((pseudo) => (
            <Player pseudo={pseudo} />
            )):<li>Attente</li>}
            <Quitter idParty={idParty} idJ={idJ} pseudo={pseudo} socket={socket} navigate={navigate}/>
            <Start socket={socket} idParty={idParty} idJ={idJ} hidden={false} />
            <Deconnection />
        </div>
    );
};

export default WaitingRoom;

