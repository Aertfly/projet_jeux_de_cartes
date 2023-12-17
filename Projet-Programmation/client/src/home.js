import React, { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Deconnection from "./deconnection.js";
import { SocketContext } from './socket.js';
import { useIdJ } from './index.js';
import { Outlet } from "react-router-dom";

function CreateButton(props){
    const navigate = useNavigate();
    function clicked(){
        setTimeout(() => navigate('/Home/'+props.path), 250);
    }    
    return(
        <button type="button" onClick={clicked} disabled={props.disabled}>{props.text}</button>
    );
}

function PrintButton(props){
    const navigate = useNavigate();
    function clicked(){
        setTimeout(() => navigate('/Home/'+props.path), 250);
    }    
    return(
        <button type="button" onClick={clicked} disabled={props.disabled}>{props.text}</button>
    );
}



function Home(){
    const [idPartyRequested,setIdPartyRequested] = useState("");
    const {socket } = useContext(SocketContext);
    const {idJ, setIdJ } = useIdJ();
    const [isSubmit,setIsSubmit] = useState(false);
    const navigate = useNavigate();
    function submit(event){
        event.preventDefault();
        if(idPartyRequested){
            socket.emit('joinRequest',{'idPlayer':idJ,'idParty':idPartyRequested});
            setIsSubmit(true)
            socket.on('joinGame',data=>{
                setTimeout(() => navigate('/Home/waitingRoom/'+idPartyRequested), 250);
            })
        }
        else{
            alert("Veuillez rentrer une id valide");
        }
    }
    return(
        <form onSubmit={submit}>
        <h2>Souhaitez-vous créer ou rejoindre une partie en ligne?</h2>
        <CreateButton path='createParty' text="Créer partie" disabled={isSubmit}/>
        <PrintButton path='listParty' text="Afficher parties disponibles" disabled={isSubmit}/>
        <Outlet/>
        <h2>Si vous voulez rejoindre la partie d'un ami, renseigner l'ID de la partie ici :</h2>
        <input
            type="text"
            onChange={(event)=>setIdPartyRequested(event.target.value)}
        />
         <button type="submit">{isSubmit?"Veuiller Patienter":"Rejoindre la partie !"}</button>
        <Deconnection disabled={isSubmit}/>
        </form>
    );
}

export default Home;