import "./Styles/page.css";
import IC from './Scripts/Page/IC.js'
import CreateParty from './Scripts/Page/createParty.js';
import Home from './Scripts/Page/home.js';
import WaitingRoom from './Scripts/Page/waitingRoom.js';
import ListParty from "./Scripts/Page/listParty/listParty.js";
import NotFound from "./Scripts/Page/notFound.js";
import ListPartySaved from "./Scripts/Page/listParty/listPartySaved.js";
import { SocketProvider } from './Scripts/Shared/socket.js';
import GameContainer from "./Scripts/Shared/gameContainer.js";
import {Battle} from './Scripts/Games/battle.js';
import {SQP} from './Scripts/Games/SQP.js';
import Regicide from "./Scripts/Games/regicide.js";
import Memory from "./Scripts/Games/memory.js"
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
              <Route path="Memory/:idParty" element={<Memory />} />    
              <Route path="Régicide/:idParty" element={<Regicide />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </SocketProvider>
    </PlayerProvider>
  </React.StrictMode>
);

reportWebVitals();