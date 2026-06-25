import { io } from 'socket.io-client';
import { useRealtimeStore } from '../store/realtimeStore';

let socket = null;

export const socketManager = {
    connect: (token) => {
        if (socket?.connected) return socket;

        const baseURL = `http://${window.location.hostname}:5000`;
        
        socket = io(baseURL, {
            auth: { token },
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        const store = useRealtimeStore.getState();

        socket.on('connect', () => {
            console.log('✅ Realtime connected');
            store.setConnected();
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Realtime disconnected:', reason);
            store.setDisconnected();
        });

        socket.on('connect_error', (err) => {
            console.error('⚠️ Realtime connection error:', err.message);
            store.setDisconnected();
            store.incrementReconnectAttempt();
        });

        return socket;
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        useRealtimeStore.getState().resetRealtimeState();
    },

    getSocket: () => socket
};
