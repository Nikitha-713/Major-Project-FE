import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;
  socket = io('http://localhost:5000', {
    auth: { token },
  });
  return socket;
};

export const connectPortalSocket = (portalToken) => {
  if (socket) return socket;
  socket = io('http://localhost:5000', {
    auth: { portalToken },
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
    return socket;
};