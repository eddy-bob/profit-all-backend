import { Response } from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { SocketService } from '../services/socketService';
import { IAuthRequest } from '../types';

export class MessageController {
  constructor(private socketService: SocketService) {}

  createMessage = async (req: IAuthRequest, res: Response) => {
    try {
      const chatId = req.params.id;
      const userId = req.user?._id;
      const isAdmin = req.user?.role === 'admin';
      const { content } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!chatId) {
        return res.status(400).json({ error: 'Chat ID is required' });
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      if (!isAdmin && !chat.participants.includes(userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const message = new Message({
        chat: chatId,
        sender: userId,
        content
      });

      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'email');

      this.socketService.broadcastToRoom(chatId, {
        type: 'new_message',
        data: populatedMessage
      });

      return res.status(201).json(populatedMessage);
    } catch (error) {
      return res.status(500).json({ error: 'Error creating message' });
    }
  };
}