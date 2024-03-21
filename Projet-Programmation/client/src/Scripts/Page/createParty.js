import { React, useState, useContext, useEffect } from 'react';
import { SocketContext } from '../Shared/socket.js';
import Deconnection from '../Components/deconnection.js';
import { usePlayer } from '../../index.js';
import { useNavigate } from 'react-router-dom';

const GameSelector = ({ selectedGame, onGameSelect }) => {
  const games = ["Bataille", "Régicide", "6 Qui Prend", "Memory"];

  return (
    <ul>
      {games.map((game, index) => (
        <li 
          key={index} 
          style={{ 
            cursor: 'pointer', 
            color: selectedGame === game ? 'red' : 'black'
          }}
          onClick={() => onGameSelect(game)}
        >
          {game}
        </li>
      ))}
    </ul>
  );
};
  
function CreatePartyForm() {

  const [minValue, setMinValue] = useState(2);
  const [maxValue, setMaxValue] = useState(10);
  const { socket } = useContext(SocketContext);
  const [estPublic, setEstPublic] = useState(false);
  const [estSoumis, setEstSoumis] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const {idJ ,setPlayerList,pseudo} = usePlayer();
  const navigate = useNavigate();
  
  const handleMinChange = (e) => {
    setMinValue(e.target.value);
  };

  const handleMaxChange = (e) => {
    setMaxValue(e.target.value);
  };

  const handlePublicClick = () => {
    setEstPublic(!estPublic);
  };
  const handleSoumisClick = () => {
    setEstSoumis(!estSoumis);
  };

  useEffect(()=>{
    socket.on('joinGame',data=>{
      setPlayerList(data.playerList);
      setTimeout(() => navigate('/Home/waitingRoom/'+data.idParty), 250);
    })
    return () => {socket.off('joinGame')};
  },[]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedGame) {
      alert("Veuillez sélectionner un jeu avant de soumettre.");
      setEstSoumis(false);
      return;
    }
    if (estSoumis){
      socket.emit('createParty',{minValue,maxValue,estPublic,selectedGame,idJ,pseudo})

    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Valeur Min:
          <input
            type="number"
            value={minValue}
            onChange={handleMinChange}
            min="2"
            max = {maxValue}
            
          />
        </label>
        <br />
        <label>
          Valeur Max:
          <input
            type="number"
            value={maxValue}
            onChange={handleMaxChange}
            min= {minValue}
            max = "10"
          />
        </label>
        <br />
        <GameSelector 
          selectedGame={selectedGame} 
          onGameSelect={setSelectedGame}
        />
        <br />
        <button type="button" onClick={handlePublicClick}>{estPublic ? 'Public' : 'Privé'}</button>
        <button type="submit" onClick={handleSoumisClick}>{estSoumis ? 'Soumis' : 'Soumettre'}</button>
        
        <Deconnection />
      </form>
    </div>
  );
}

function CreateParty () {
    return (
        <>
        <CreatePartyForm  />
        </>
    )
}
export default CreateParty;


