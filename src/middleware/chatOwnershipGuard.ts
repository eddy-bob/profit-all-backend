import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { Chat } from '../models/Chat';

export const chatOwnershipGuard = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const chatId = req.params.id;
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (!isAdmin && !chat.participants.includes(userId.toString())) {
      return res.status(403).json({ error: 'Access denied. You can only access chats you are a participant in.' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Error checking chat access' });
  }
}; 