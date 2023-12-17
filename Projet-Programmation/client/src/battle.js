import React, { useContext, useState,useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SocketContext } from './socket.js';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './index.js'
import Deconnection from './deconnection.js';
import chat from './chatComponent.js';

var sockets = null;

function gestionTours(playerId,socket) {
    if(sockets == null){
        socket.on('newTurn', (data) => {
            // La connexion est active
            if (data.joueurs.includes(playerId)) {
                console.log("C'est mon tour de jouer ! - Tour " + data.numeroTour);
            }
        });

        socket.on('conveyAction', (data) => {
            console.log("conveyAction reçu");
            console.log(data);
        });

        socket.on('reveal', (data) => {
            console.log("reveal reçu");
            console.log(data);
        });
    }
}

function carteVersTexte(carte){
    return carte.valeur + " de " + carte.enseigne;
}

function ChoisirCarteForm(props) {
    const { socket } = useContext(SocketContext);
    gestionTours(props.playerId,socket);
    const cartes = props.cartes;
    const [carteChoisie, setCarteChoisie] = React.useState(null); // Ajouter un état pour la carte choisie

    const elements = cartes.map((carte) => {
        return (
            <>
                <label htmlFor={carteVersTexte(carte)}>
                    {carteVersTexte(carte)}
                </label>
                <input
                    type="radio"
                    name="carte"
                    id={carteVersTexte(carte)}
                    value={carteVersTexte(carte)}
                    key={carteVersTexte(carte)}
                    onChange={(e) => setCarteChoisie(carte)} // Mettre à jour l'état quand on change de carte
                />      
                <br />
            </>      
        );
    });

    const jouerCarte = (e) => {
        e.preventDefault(); // Empêcher le comportement par défaut du formulaire
        console.log('playerAction :');
        console.log({ "carte": carteChoisie, "player": "Pierre", "action": "joue", "playerId": props.playerId });
        socket.emit('playerAction', { "carte": carteChoisie, "action": "joue", "playerId": props.playerId }); // Émettre la carte choisie sur la route 'playerAction'
    }

    return (
        <form onSubmit={jouerCarte}>
            {elements}
            <input type="submit" value="Jouer la carte" />
        </form>
    );
}


function Main2() {
    return (
        <>
        <Deconnection/>
            <ChoisirCarteForm cartes={
                [{"enseigne":"Pique","valeur":2},{"enseigne":"Carreau","valeur":4}]
            } playerId={4} /> 
            
            
            
            {/* 
            <ChoisirCarteForm cartes={
                [{"enseigne":"Pique","valeur":2},{"enseigne":"Carreau","valeur":4}]
            } playerId={4} /> 
            */}

            {/* 
            <ChoisirCarteForm cartes={
                [{"enseigne":"Trèfle","valeur":3},{"enseigne":"Coeur","valeur":5}]
            } playerId={5} />
            */}
            {/*<chat />*/}
        </>
    );
}

export default Main2;