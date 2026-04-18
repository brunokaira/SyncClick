// client/src/hooks/use-socket.ts
// Separated from socket-provider.tsx to satisfy Vite Fast Refresh requirements
// (a file can't export both a React component and a non-component hook).
import { useContext } from "react";
import { SocketContext } from "@/context/socket-provider";

/** Access the shared socket instance from any component inside SocketProvider. */
const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return ctx;
};

export default useSocket;
