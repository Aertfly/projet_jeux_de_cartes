import "./page.css";
import IC from './IC.js'
import CreateParty from './createParty.js';
import Home from './home.js';
import WaitingRoom from './waitingRoom.js';
import ListParty from "./listParty.js";
import NotFound from "./notFound.js";
import ListPartySaved from "./listPartySaved.js";
import { SocketProvider } from './socket.js';
import Party from './battle.js';

import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals' ;

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
            <Route path="/Home/Party/:idParty" element={<> <Party /> </>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </SocketProvider>
    </PlayerProvider>
  </React.StrictMode>
);

reportWebVitals();