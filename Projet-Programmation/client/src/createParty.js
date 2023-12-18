import { React, useState, useContext } from 'react';
import { SocketContext } from './socket.js';
import Deconnection from './deconnection.js';
import { usePlayer } from './index.js';
import { useNavigate } from 'react-router-dom';

const GameSelector = ({ selectedGame, onGameSelect }) => {
  const games = ["Bataille", "Uno", "Kems", "Président"];

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
  const { idJ } = usePlayer();
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

  socket.on('joinGame',data=>{
    setTimeout(() => navigate('/Home/waitingRoom/'+data), 250);
  })

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedGame) {
      alert("Veuillez sélectionner un jeu avant de soumettre.");
      setEstSoumis(false);
      return;
    }
    if (estSoumis){
      socket.emit('createParty',{minValue,maxValue,estPublic,selectedGame,idJ})
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


