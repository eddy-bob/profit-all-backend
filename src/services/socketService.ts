import { WebSocket, WebSocketServer } from "ws";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  senderId?: string;
  isAdmin?: boolean;
  chatId?: string;
  orderId?: string;
  rooms?: Set<string>; // Add rooms property to track joined rooms
}

interface WebSocketMessage {
  type:
    | "message"
    | "join_chat"
    | "leave_chat"
    | "error"
    | "new_message"
    | "chat_closed";
  content?: string;
  chatId?: string;
  senderId?: string;
  data?: any;
}

export class SocketService {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private userSockets: Map<string, AuthenticatedWebSocket> = new Map(); // Add a map to store user sockets
  private emailToSocketMap = new Map<string, AuthenticatedWebSocket>(); // Add emailToSocketMap

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
    this.handleRejoinRooms();
  }

  private setupWebSocket() {
    this.wss.on("connection", async (ws: AuthenticatedWebSocket, req) => {
      try {
        // Extract token from query parameters
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
          ws.close(1008, "Authentication required");
          return;
        }

        // Verify token and get user
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your_jwt_secret_key"
        ) as { _id: string };

        const user = await User.findById(decoded._id);
        if (!user) {
          ws.close(1008, "User not found");
          return;
        }
        ws.userId = user._id.toString();
        ws.isAdmin = user.role === "admin";
        ws.rooms = new Set(); // Initialize rooms property

        // Store the WebSocket connection for the user
        this.userSockets.set(ws.userId, ws);
        this.registerClient(user.email, ws); // Register client by email
        console.log(`User ${user.email} connected`);
        // Handle incoming messages
        ws.on("message", async (message: string) => {
          console.log(message);
          try {
            const parsedMessage: WebSocketMessage = JSON.parse(message);
            await this.handleMessage(ws, parsedMessage);
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                data: { message: "Invalid message format" },
              })
            );
          }
        });

        // Handle client disconnect
        ws.on("close", () => {
          this.handleDisconnect(ws);
        });
      } catch (error) {
        ws.close(1008, "Authentication failed");
      }
    });
  }

  private async handleMessage(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    if (!message.chatId && message.type !== "leave_chat") {
      ws.send(
        JSON.stringify({
          type: "error",
          content: "Chat ID is required",
        })
      );
      return;
    }

    switch (message.type) {
      case "join_chat":
        await this.handleJoinChat(ws, message.chatId!);
        break;
      case "message":
        await this.handleSendMessage(ws, message);
        break;
      case "leave_chat":
        this.handleLeaveChat(ws);
        break;
      default:
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Unknown message type",
          })
        );
    }
  }

  private async handleJoinChat(ws: AuthenticatedWebSocket, chatId: string) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Chat not found",
          })
        );
        return;
      }

      // Check if user has access to this chat
      if (!ws.isAdmin && !chat.participants.includes(ws.chatId!)) {
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Access denied",
          })
        );
        return;
      }

      // Add client to chat
      if (!this.clients.has(chatId)) {
        this.clients.set(chatId, new Set());
      }
      this.clients.get(chatId)?.add(ws);
      ws.chatId = chatId;
      ws.rooms?.add(chatId); // Add chatId to rooms

      ws.send(
        JSON.stringify({
          type: "joined_chat",
          content: "Successfully joined chat",
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          content: "Error joining chat",
        })
      );
    }
  }

  private async handleSendMessage(
    ws: AuthenticatedWebSocket,
    content: {
      senderId?: string;
      content?: string;
      chatId?: string;
      orderId?: string;
    }
  ) {
    try {
      this.handleRejoinRooms();
      if (!content.chatId) {
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Not in a chat",
          })
        );
        return;
      }

      const chat = await Chat.findById(content.chatId);
      if (!chat) {
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Chat not found",
          })
        );
        return;
      }
      if (chat.isActive === false) {
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Chat closed by admin",
          })
        );
        return;
      }

      // Check if user has access to this chat
      if (!ws.isAdmin && !chat.participants.includes(content.senderId!)) {
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Access denied",
          })
        );
        return;
      }

      const message = new Message({
        chat: content.chatId,
        sender: content.senderId,
        content: content.content,
      });

      await message.save();

      // Broadcast message to all clients in the chat
      this.broadcastToRoom(content.orderId as string, {
        type: "newMessage",
        message: message,
        orderId: content.orderId,
      });
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          content: "Error sending message",
        })
      );
    }
  }

  private handleLeaveChat(ws: AuthenticatedWebSocket) {
    if (ws.chatId) {
      const roomClients = this.clients.get(ws.chatId);
      if (roomClients) {
        roomClients.delete(ws);
        if (roomClients.size === 0) {
          this.clients.delete(ws.chatId);
        }
      }
      ws.rooms?.delete(ws.chatId); // Remove chatId from rooms
      ws.chatId = undefined;
      ws.send(
        JSON.stringify({
          type: "left_chat",
          data: { message: "Left chat room" },
        })
      );
    }
  }

  private handleDisconnect(ws: AuthenticatedWebSocket) {
    if (ws.chatId) {
      this.handleLeaveChat(ws);
    }
    // Remove the WebSocket connection for the user
    this.userSockets.delete(ws.userId!);
  }

  public notifyChatClosed(chatId: string) {
    this.broadcastToRoom(chatId, {
      type: "chat_closed",
      data: { chatId },
    });
  }

  public getWSS(): WebSocketServer {
    return this.wss;
  }
  public handleRejoinRooms() {
    this.wss.on("connection", async (ws: AuthenticatedWebSocket) => {
      // Rejoin all rooms with pending orders on mount
      try {
        const pendingOrders = await Chat.find({ isActive: true });
        pendingOrders.forEach((order) => {
          if (order.orderId) {
            if (ws.isAdmin) {
              this.joinRoom(ws, order.orderId.toString());
            }
            if (order.participants.includes(ws.userId!)) {
              // Check if user is a participant
              this.joinRoom(ws, order.orderId.toString());
            }
          }
        });

        ws.send(
          JSON.stringify({
            type: "rejoined_rooms",
            data: { rooms: Array.from(ws.rooms || []) },
          })
        );
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Error rejoining rooms",
          })
        );
      }
    });
  }

  public handleChatMessages() {
    this.wss.on("connection", (ws: AuthenticatedWebSocket) => {
      ws.on("message", async (data: string) => {
        console.log(data);
        try {
          const messageData = JSON.parse(data);

          // Check if the message is for creating a chat
          if (messageData.type === "message") {
            const { orderId, senderId, content, chatId } = messageData;

            // Persist the chat message in the database
            const chat = await Chat.findOne({ orderId });
            if (!chat) {
              return ws.send(
                JSON.stringify({
                  error: "Chat not found for the given orderId",
                })
              );
            }

            const newMessage = new Message({
              chat: chatId,
              sender: senderId,
              content,
              createdAt: new Date(),
            });

            await newMessage.save();

            // Broadcast the message to the WebSocket room
            this.broadcastToRoom(orderId, {
              type: "newMessage",
              message: newMessage,
              orderId,
            });
          }
        } catch (error) {
          console.error("Error handling chat message:", error);
          ws.send(JSON.stringify({ error: "Failed to process chat message" }));
        }
      });
    });
  }

  public broadcastToRoom(roomId: string, message: any) {
    this.wss.clients.forEach((client: AuthenticatedWebSocket) => {
      if (client.rooms && client.rooms.has(roomId)) {
        client.send(JSON.stringify(message));
      }
    });
  }

  public joinRoom(client: AuthenticatedWebSocket, roomId: string) {
    if (!client.rooms) {
      client.rooms = new Set(); // Initialize rooms if not already done
    }
    client.rooms.add(roomId); // Add the roomId to the client's rooms
  }

  public registerClient(email: string, client: AuthenticatedWebSocket) {
    this.emailToSocketMap.set(email, client);
  }

  public getClientByEmail(email: string): AuthenticatedWebSocket | undefined {
    return this.emailToSocketMap.get(email);
  }
}
