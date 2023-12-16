import IC from './IC.js'
import CreateParty from './createParty.js';
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

root.render(
  <React.StrictMode>
    <IdJProvider>
    <SocketProvider>

      <Router>
        <Routes>
          <Route exact path="/" element={<IC />} />
          <Route path="/home" element={<CreateParty />} />
        </Routes>
      </Router>

    </SocketProvider>
    </IdJProvider>
  </React.StrictMode>
);

reportWebVitals();