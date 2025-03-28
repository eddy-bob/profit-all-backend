import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { SocketService } from "./services/socketService";
import userRoutes from "./routes/userRoutes";
import { createOrderRoutes } from "./routes/orderRoutes";
import { createChatRoutes } from "./routes/chatRoutes";
import { createMessageRoutes } from "./routes/messageRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { seedAdmin } from "./utils/seeder";
import { connectDB } from "./config/database";

dotenv.config();

export const app = express();
export const server = http.createServer(app);
const socketService = new SocketService(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/orders", createOrderRoutes(socketService));
app.use("/api/chat", createChatRoutes(socketService));
app.use("/api/messages", createMessageRoutes(socketService));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling
app.use(errorHandler as ErrorRequestHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed admin user
    await seedAdmin();

    // Start server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`WebSocket server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}
