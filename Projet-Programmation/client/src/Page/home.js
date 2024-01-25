import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Deconnection from "./Component/deconnection.js";
import { SocketContext } from '../socket.js';
import { usePlayer } from '../index.js';
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
    const {idJ, setPlayerList } = usePlayer();
    const [isSubmit,setIsSubmit] = useState(false);
    const [error,setError] = useState("")
    const navigate = useNavigate();
    function submit(event){
        event.preventDefault();
        if(idPartyRequested){
            socket.emit('joinRequest',{'idPlayer':idJ,'idParty':idPartyRequested});
            setIsSubmit(true);
            console.log("party requested");
            socket.on('joinGame2',(data)=>{
                if(data.message){
                    setTimeout(() =>{
                        setError(data.message);
                        setIsSubmit(false);
                    }, 500);
                }else{
                    setPlayerList(data.playerList);
                    setTimeout(() => navigate('/Home/waitingRoom/'+data.idParty), 250);
                }
            })
        }
        else{
            alert("Veuillez rentrer un identifiant valide");
        }
    }
    return(
        <form onSubmit={submit}>
        <h2>Souhaitez-vous créer ou rejoindre une partie ?</h2>
        <p style={{color:"red"}}>{error}</p>
        <p>Créer une partie :</p>
        <CreateButton path='createParty' text="Créer une partie" disabled={isSubmit}/>
        <p>Rejoindre une partie existante:</p>
        <PrintButton path='listParty' text="Afficher les parties disponibles" disabled={isSubmit}/>
        <p>Rejoindre une partie que vous avez sauvegardée :</p>
        <PrintButton path='listPartySaved' text="Afficher les parties sauvegardée" disabled={isSubmit}/>
        <Outlet/>
        <h3>Si vous voulez rejoindre la partie d'un ami, renseignez l'ID de la partie :</h3>
        <input
            type="text"
            onChange={(event)=>setIdPartyRequested(event.target.value)}
        />
         <button type="submit" disabled={isSubmit} >{isSubmit?"Veuillez patienter":"Rejoindre la partie !"}</button>
        <Deconnection disabled={isSubmit}/>
        </form>
    );
}

export default Home;