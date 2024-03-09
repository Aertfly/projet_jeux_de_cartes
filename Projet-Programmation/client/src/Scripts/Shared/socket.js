import React, { createContext } from 'react';
import io from 'socket.io-client';
const SocketContext = createContext();
const URL = 'http://localhost:3001';
const socket = io(URL);

const SocketProvider = ({ children }) => {
    
    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export { SocketContext, SocketProvider };
