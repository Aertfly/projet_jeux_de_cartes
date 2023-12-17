import "./page.css";
import IC from './IC.js'
import CreateParty from './createParty.js';
import Home from './home.js';
import WaitingRoom from './waitingRoom.js';
import ListParty from "./listParty.js";
import NotFound from "./notFound.js";
import { SocketProvider } from './socket.js';


import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals' ;

import React, { createContext, useState, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));

const IdJContext = createContext();

export const useIdJ = () => useContext(IdJContext);

export const IdJProvider = ({ children }) => {
  const [idJ, setIdJ] = useState(null);
  return (
    <IdJContext.Provider value={{ idJ, setIdJ }}>
      {children}
    </IdJContext.Provider>
  );
};

const PlayerListContext = createContext();
export const usePlayerList = () => useContext(PlayerListContext);
export const PlayerListProvider = ({ children }) => {
  const [PlayerList, setPlayerList] = useState([]);
  return (
    <PlayerListContext.Provider value={{ PlayerList, setPlayerList }}>
      {children}
    </PlayerListContext.Provider>
  );
};


root.render(
  <React.StrictMode>
    <IdJProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route exact path="/" element={<IC />} />
            <Route path="/Home" element={<Home />}>
              <Route path="listParty" element={<ListParty/>}/>
            </Route>
            <Route path="/Home/waitingRoom/:idParty" element={<WaitingRoom />} />
            <Route path="/Home/createParty" element={<CreateParty />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </SocketProvider>
    </IdJProvider>
  </React.StrictMode>
);

reportWebVitals();