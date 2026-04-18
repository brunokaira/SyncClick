// client/src/context/socket-provider.tsx
// Manages ONE socket connection for the entire app.
// Components should never call socket.connect() or socket.disconnect() directly.
import {
  createContext,
  useEffect,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import useWorkspaceId from "@/hooks/use-workspace-id";

interface SocketContextValue {
  /** The shared socket instance (read-only) */
  socket: typeof socket;
}

export const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Wrap the authenticated portion of the app with this provider.
 * It:
 *  1. Connects the shared socket once.
 *  2. Joins / leaves the workspace room whenever the workspaceId changes.
 *  3. Invalidates React Query caches on task & project events so every
 *     consumer (table, recent-tasks, analytics …) refreshes automatically.
 */
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();


  // ── 1. Connect the socket once on mount, disconnect on final unmount ──
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Only disconnect when the provider itself is removed (e.g. user logs out)
      socket.disconnect();
    };
  }, []);

  // ── 2. Join / leave workspace room when workspaceId changes ──
  useEffect(() => {
    if (!workspaceId) return;

    socket.emit("join-workspace", workspaceId);

    return () => {
      socket.emit("leave-workspace", workspaceId);
    };
  }, [workspaceId]);

  // ── 3. Global cache-invalidation handlers ──
  useEffect(() => {
    if (!workspaceId) return;

    // --- Task events ---
    const invalidateTasks = () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["allTasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["projectAnalytics"] });
    };

    // --- Project events ---
    const invalidateProjects = () => {
      queryClient.invalidateQueries({ queryKey: ["allprojects", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics", workspaceId] });
    };

    socket.on("task-created", invalidateTasks);
    socket.on("task-updated", invalidateTasks);
    socket.on("task-deleted", invalidateTasks);
    socket.on("project-created", invalidateProjects);
    socket.on("project-updated", invalidateProjects);
    socket.on("project-deleted", invalidateProjects);

    return () => {
      socket.off("task-created", invalidateTasks);
      socket.off("task-updated", invalidateTasks);
      socket.off("task-deleted", invalidateTasks);
      socket.off("project-created", invalidateProjects);
      socket.off("project-updated", invalidateProjects);
      socket.off("project-deleted", invalidateProjects);
    };
  }, [workspaceId, queryClient]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
