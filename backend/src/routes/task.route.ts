import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
  getDeletedTaskLogsController,
  clearDeletedTaskLogsController,
} from "../controllers/task.controller";

const taskRoutes = Router();

taskRoutes.post(
  "/project/:projectId/workspace/:workspaceId/create",
  createTaskController
);

taskRoutes.delete("/:id/workspace/:workspaceId/delete", deleteTaskController);

taskRoutes.put(
  "/:id/project/:projectId/workspace/:workspaceId/update",
  updateTaskController
);

taskRoutes.get("/workspace/:workspaceId/all", getAllTasksController);

taskRoutes.get(
  "/:id/project/:projectId/workspace/:workspaceId",
  getTaskByIdController
);

// Deletion audit log
taskRoutes.get(
  "/workspace/:workspaceId/deleted-logs",
  getDeletedTaskLogsController
);

// Clear all deletion audit logs (OWNER / ADMIN only)
taskRoutes.delete(
  "/workspace/:workspaceId/deleted-logs",
  clearDeletedTaskLogsController
);

export default taskRoutes;
