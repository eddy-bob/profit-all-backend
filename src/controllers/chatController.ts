import { Request, Response } from "express";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";
import { SocketService } from "../services/socketService";
import { IAuthRequest } from "../types";

export class ChatController {
  constructor(private socketService: SocketService) {}

  // Get all chats (admin only)
  getAllChats = async (_req: Request, res: Response) => {
    try {
      const chats = await Chat.find()
        .populate("participants", "email")
        .sort({ createdAt: -1 });
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  };

  // Get user's chats
  getUserChats = async (req: IAuthRequest, res: Response) => {
    try {
      const userId = req.user?._id;
      const chats = await Chat.find({ participants: userId })
        .populate("participants", "email")
        .sort({ createdAt: -1 });
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user chats" });
    }
  };

  // Get chat by ID
  getChatById = async (req: Request, res: Response) => {
    try {
      const chat = await Chat.findById(req.params.id).populate(
        "participants",
        "email"
      );

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      return res.json(chat);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch chat" });
    }
  };

  // Create new chat
  createChat = async (req: IAuthRequest, res: Response) => {
    try {
      const { participants } = req.body;
      const userId = req.user?._id;

      // Ensure the current user is included in participants
      if (!participants.includes(userId)) {
        participants.push(userId);
      }

      const chat = new Chat({ participants });
      await chat.save();

      const populatedChat = await Chat.findById(chat._id).populate(
        "participants",
        "email"
      );

      // Broadcast new chat to all participants
      participants.forEach((participantId: string) => {
        this.socketService.broadcastToRoom(participantId, {
          type: "new_message",
          data: populatedChat,
        });
      });

      return res.status(201).json(populatedChat);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create chat" });
    }
  };

  // Get messages for a chat
  getMessages = async (req: Request, res: Response) => {
    try {
      const messages = await Message.find({ chat: req.params.id })
        .populate("sender", "email")
        .sort({ createdAt: 1 });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  };
}
