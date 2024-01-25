import React, { useContext, useState,useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from '../socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../index.js'
import Deconnection from './Component/deconnection.js';
import Chat from './Component/chatComponent.js';


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
    const {idJ,pseudo,playerList,setPlayerList} = usePlayer();
    const {idParty} = useParams();
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();
    const [isMouseOver, setIsMouseOver] = useState(false);
    useEffect(() => {
        socket.on('gameStart',data =>{
            if(data.message){
                setMsg(data.message);
                console.log(data.message);
            }
            else{
                switch (data.type) {
                    case "Bataille":
                        setTimeout(() => navigate('/Home/Bataille/'+data.idParty), 250);
                        break;
                    case "6 Qui Prend"://traduit en SQP pour le reste du code
                        setTimeout(() => navigate('/Home/6 Qui Prend/'+data.idParty), 250);
                        break;
                    default :
                        setMsg("Jeu inconnu");

                }
            }
        });
        socket.on('refreshPlayerList',data=>{
            console.log("Refresh",data.playerList);
            setPlayerList(data.playerList);
        });
    }, [socket,navigate,setPlayerList]);
    

    function Player(props){
        return(
            <li>{props.pseudo}</li>
        );
    }
    const paragraphStyle = {
        color:'black',
        backgroundColor: isMouseOver ? 'white' : 'black' 
      };
    
    return (
        <div className="waiting-room-container">
            <h1>Bienvenue dans la Partie : </h1>
            <span>Passer la souris pour afficher l'id de la partie !
                <p
            onMouseEnter={() => setIsMouseOver(true)}
            onMouseLeave={() => setIsMouseOver(false)}
            style={paragraphStyle}
                >{idParty}</p>
            </span>
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
