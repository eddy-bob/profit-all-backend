import express from 'express';
import { ChatController } from '../controllers/chatController';
import { auth } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { chatOwnershipGuard } from '../middleware/chatOwnershipGuard';
import { SocketService } from '../services/socketService';

const router = express.Router();

export const createChatRoutes = (socketService: SocketService) => {
  const chatController = new ChatController(socketService);

  // Admin routes
  router.get('/', auth, roleGuard(['admin']), chatController.getAllChats);

  // User routes
  router.get('/my-chats', auth, chatController.getUserChats);
  router.get('/:id', auth, chatOwnershipGuard, chatController.getChatById);
  router.get('/:id/messages', auth, chatOwnershipGuard, chatController.getMessages);
  router.post('/', auth, chatController.createChat);

  return router;
}; 