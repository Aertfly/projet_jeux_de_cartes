import React, { useContext, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { SocketContext } from '../socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../index.js'
import Deconnection from '../Page/Component/deconnection.js';
import Chat from '../Page/Component/chatComponent.js';
import Save from '../Page/Component/saveComponent.js';
import imgPlaceholder from '../img/NoImagePlaceholder.png';//Ranjithsiji, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons


function GameContainer(){
    const { socket } = useContext(SocketContext);
    const { idJ, pseudo } = usePlayer();
    const { idParty } = useParams();
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [Info, setInfo] = useState([]);
    const [myAction, setMyAction] = useState(null);
    const [OtherPlayerAction, setOtherPlayerAction] = useState([]);
    const [images,setImages] = useState({"./":imgPlaceholder});

    const contextValue = {
        idJ,
        pseudo,
        idParty,
        images,
        setImages,
        Info,
        setInfo,
        myAction,
        setMyAction,
        OtherPlayerAction,
        setOtherPlayerAction,
        cards,
        setCards,   
        socket,
        navigate,
    };

    return (
        <>
        <Deconnection />
        <Save data={{ party: idParty }}/>
        <Chat data={{ party: idParty }} />
        <Outlet context={contextValue} />
        </>
    );
}


export default GameContainer;