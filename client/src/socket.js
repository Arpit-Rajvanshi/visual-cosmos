import { io } from 'socket.io-client';

// Connect to backend (adjust URL to production later)
const SOCKET_URL = `http://${window.location.hostname}:3001`;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});
