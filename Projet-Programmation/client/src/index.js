import "./page.css";
import IC from './Page/IC.js'
import CreateParty from './Page/createParty.js';
import Home from './Page/home.js';
import WaitingRoom from './Page/waitingRoom.js';
import ListParty from "./Page/listParty/listParty.js";
import NotFound from "./Page/notFound.js";
import ListPartySaved from "./Page/listParty/listPartySaved.js";
import { SocketProvider } from './socket.js';
import GameContainer from "./Games/gameContainer.js";
import Battle from './Games/battle.js';
import SQP from './Games/SQP.js';

import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals.js' ;

import React, { createContext, useState, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [idJ, setIdJ] = useState(null);
  const [pseudo, setPseudo] = useState(null);
  const [playerList, setPlayerList] = useState([]);
  return (
    <PlayerContext.Provider value={{ idJ, setIdJ, pseudo, setPseudo,playerList, setPlayerList }}>
      {children}
    </PlayerContext.Provider>
  );
};

root.render(
  <React.StrictMode>
    <PlayerProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route exact path="/" element={<IC />} />
            <Route path="/Home" element={<Home />}>
              <Route path="listParty" element={<ListParty/>}/>
              <Route path="listPartySaved" element={<ListPartySaved />}/>
            </Route>
            <Route path="/Home/createParty" element={<CreateParty />} />
            <Route path="/Home/waitingRoom/:idParty" element={<WaitingRoom />} />
            <Route path="/Home/Games" element={<GameContainer />}>
              <Route path="Bataille/:idParty" element={<Battle />} />
              <Route path="6 qui prend/:idParty" element={<SQP />} />  
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </SocketProvider>
    </PlayerProvider>
  </React.StrictMode>
);

reportWebVitals();