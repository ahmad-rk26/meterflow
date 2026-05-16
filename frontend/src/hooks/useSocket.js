import { useState, useEffect } from 'react';
import io from 'socket.io-client';

let socketInstance = null;

export const useSocket = () => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!socketInstance) {
            socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
            });
        }
        setSocket(socketInstance);
        return () => { };
    }, []);

    return socket;
};

export default useSocket;
