import "./page.css";
import IC from './IC.js'
import CreateParty from './createParty.js';
import Home from './home.js';
import WaitingRoom from './waitingRoom.js';
import NotFound from "./notFound.js";
import { SocketProvider } from './socket.js';


import ReactDOM from 'react-dom';
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

root.render(
  <React.StrictMode>
    <IdJProvider>
    <SocketProvider>

      <Router>
        <Routes>
          <Route exact path="/" element={<IC />} />
          <Route path="/Home" element={<Home />}/>
          <Route path="/Home/createParty" element={<CreateParty />} />
          <Route path="/Home/waitingRoom" element={<WaitingRoom />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>

    </SocketProvider>
    </IdJProvider>
  </React.StrictMode>
);

reportWebVitals();