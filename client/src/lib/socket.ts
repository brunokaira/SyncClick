// client/src/lib/socket.ts
// A single shared socket instance for the entire app.
// Connecting / disconnecting is managed by SocketProvider, not individual components.
//
// IMPORTANT: Socket.IO must connect to the SERVER ROOT (no /api suffix).
// REST calls use VITE_API_BASE_URL = http://localhost:8000/api
// Socket.IO uses  VITE_SOCKET_URL   = http://localhost:8000
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false, // We manually connect inside SocketProvider after auth
  withCredentials: true,
});