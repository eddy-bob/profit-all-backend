import { Router } from "express";
import { MessageController } from "../controllers/messageController";
import { SocketService } from "../services/socketService";
import { auth } from "../middleware/auth";
import { chatOwnershipGuard } from "../middleware/chatOwnershipGuard";

export const createMessageRoutes = (socketService: SocketService) => {
  //socketService.handleChatMessages(); // Initialize WebSocket chat handling

  const router = Router();
  const messageController = new MessageController(socketService);

  router.post(
    "/:id/messages",
    auth,
    chatOwnershipGuard,
    messageController.createMessage
  );

  return router;
};
