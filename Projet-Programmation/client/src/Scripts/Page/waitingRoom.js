import React, { useContext, useState,useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from '../Shared/socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../index.js'
import Deconnection from '../Components/deconnection.js';
import Chat from '../Components/chatComponent.js';
import Leave from '../Components/Leave.js';

function OwnerOnly(props){
    function start(){
        console.log("On demande à lancer la partie");
        props.socket.emit('start',{'idParty':props.idParty,'idPlayer':props.idJ});
    }
    function addBot(){
        console.log("On demande à rajouter un robot");
        props.socket.emit('addBot',{'idParty':props.idParty,'idPlayer':props.idJ});
    }
    return(
        <>       
            <button hidden={props.hidden} onClick={start}>Lancer la partie</button>
            <button hidden={props.hidden} onClick={addBot}>Ajouter un robot</button>
        </>

    );
}

function Bots(props) {
    const botList = props.botList;  
    function changeType(name){
        props.socket.emit('changeType',{'idParty':props.idParty,'idPlayer':props.idJ,'botName':name})
    }
    return (
        <div>
            {botList.map((bot, index) => (
                <div key={index}>
                    <p>{"Robot : " + bot.name + " de type"}</p> 
                    <p onClick={props.owner ? changeType(bot.name):()=>{}}>bot.type</p>
                </div>
            ))}
        </div>
    );
}

function Player(props){
    const isMe = props.isMe
    const style = isMe ?{color:'red'} : {}
    return(
        <li style={style}>{  props.player.pseudo + (isMe?" (vous)":(props.player.owner?" (Propriétaire)":""))}</li>
    );
}


const WaitingRoom = ()=>{
    const {socket} = useContext(SocketContext);
    const {idJ,pseudo,playerList,setPlayerList} = usePlayer();
    const [botList,setBotList] = useState([]);
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
                        setTimeout(() => navigate('/Home/Games/Bataille/'+data.idParty), 250);
                        break;
                    case "6 Qui Prend"://traduit en SQP pour le reste du code
                        setTimeout(() => navigate('/Home/Games/6 Qui Prend/'+data.idParty), 250);
                        break;
                    case "Memory":
                        setTimeout(() => navigate('/Home/Games/Memory/'+data.idParty), 250);
                        break;
                    case "Régicide":
                        setTimeout(() => navigate('/Home/Games/Régicide/'+data.idParty), 250);
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

        socket.on('newBot',(data)=>{
            setBotList((prev) => {
                let copy = prev;    
                copy.append(data);
                return copy
            });
        });

        socket.on('removebot',(data)=>{
            setBotList((prev) => {
                let copy = prev;
                copy.splice(copy.indexOf(data.name),1);
                return copy;
            });
        });

        return () => {
            socket.off('gameStart');
            socket.off('refreshPlayerList');
            socket.off('newBot');
        };
    }, [socket,navigate,setPlayerList]);
    


    const paragraphStyle = {
        color:'black',
        backgroundColor: isMouseOver ? 'white' : 'black' 
      };
    
    return (
        <div className="waiting-room-container">
            <h1>Salle d'attente</h1>
            <span>Passer la souris pour afficher l'id de la partie
                <p
            onMouseEnter={() => setIsMouseOver(true)}
            onMouseLeave={() => setIsMouseOver(false)}
            style={paragraphStyle}
                >{idParty}</p>
            </span>
            <p style={{color:'red'}}>{msg}</p>
            <ul>
                Liste des joueurs :
                {playerList.length === 0?"En attente des données du serveur":playerList.map((player,index) => (
                    <Player player={player} key={index} isMe={pseudo === player.pseudo} />
                ))}
            </ul>

            <Leave idj={idJ} socket={socket} />
            <br />
            <OwnerOnly socket={socket} idParty={idParty} idJ={idJ} hidden={false} />
            <Deconnection />
            <Chat data={{party : idParty}} />
        </div>
    );
};

export default WaitingRoom;
