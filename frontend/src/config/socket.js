import socket from 'socket.io-client';

let socketInstance = null;

export const initializeSocket = (projectId) => {
    let url = import.meta.env.VITE_API_URL;
    if (url.endsWith('/api')) {
        url = url.slice(0, -4);
    }
    socketInstance = socket(url, {
        auth: {
            token: localStorage.getItem('token'),
        },
        query: { projectId },
    });
    return socketInstance;
};

export const reciveMessage = (eventName, callback) => {
    socketInstance.on(eventName, callback);
}

export const sendMessage = (eventName, data) => {
    socketInstance.emit(eventName, data);
}