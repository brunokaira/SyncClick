import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import http from "http"; // <-- Imported HTTP module
import { Server } from "socket.io"; // <-- Imported Socket.io
import cors from "cors";
import session from "cookie-session";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { BadRequestException } from "./utils/appError";
import { ErrorCodeEnum } from "./enums/error-code.enum";

import "./config/passport.config";
import passport from "passport";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";

const app = express();

// REQUIRED FOR RENDER: Tells Express to trust the proxy load balancer
app.set("trust proxy", 1);
const BASE_PATH = config.BASE_PATH;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("join-workspace", (workspaceId) => {
    socket.join(workspaceId);
    console.log(`Socket ${socket.id} joined workspace: ${workspaceId}`);
  });

  socket.on("leave-workspace", (workspaceId) => {
    socket.leave(workspaceId);
    console.log(`Socket ${socket.id} left workspace: ${workspaceId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// FIXED: The Cross-Domain Cookie Configuration
app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    // The exact fixes required for Vercel -> Render communication:
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    partitioned: config.NODE_ENV === "production",
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.get(
  `/`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException(
      "This is a bad request",
      ErrorCodeEnum.AUTH_INVALID_TOKEN
    );
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);

app.use(errorHandler);

// NOTE: Changed from app.listen to server.listen
server.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});