import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SERVER_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : 'http://localhost:3001');

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});
