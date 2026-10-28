import { io } from 'socket.io-client';

// http://localhost:5000/api  ->  http://localhost:5000
const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

let socket = null;

// Therapist dashboard
export const connectSocket = (token) => {
  if (socket) return socket;                 // reuse the existing connection
  socket = io(SOCKET_URL, { auth: { token } });
  return socket;
};

// Client portal (same connection logic, kept as its own name because ClientPortal.jsx imports it)
export const connectPortalSocket = (token) => connectSocket(token);

export const getSocket = () => socket;
export const getPortalSocket = getSocket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
export const disconnectPortalSocket = disconnectSocket;
