import { Response } from "express";
import { Order } from "../models/Order";
import { Chat } from "../models/Chat";
import { IAuthRequest } from "../types";
import { SocketService } from "src/services/socketService";
export class OrderController {
  constructor(private socketService: SocketService) {}
  createOrder = async (req: IAuthRequest, res: Response) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { symbol, price, type, quantity } = req.body;

      const order = new Order({
        userId,
        symbol,
        price,
        type,
        quantity,
      });

      await order.save();

      // Create a chat for this order
      const chat = new Chat({
        orderId: order._id,
        participants: [userId],
        isActive: true,
      });

      await chat.save();

      const userSocket = this.socketService.getClientByEmail(
        req.user?.email as string
      );
      const adminSocket = this.socketService.getClientByEmail(
        process.env.ADMIN_EMAIL as string
      );
      if (userSocket) {
        this.socketService.registerClient(
          req.user?.email as string,
          userSocket
        );
        this.socketService.joinRoom(userSocket, order._id.toString());
      }
      if (adminSocket) {
        this.socketService.registerClient(
          process.env.ADMIN_EMAIL as string,
          adminSocket
        );
        this.socketService.joinRoom(adminSocket, order._id.toString());
      }

      return res.status(201).json({ order, chat });
    } catch (error) {
      return res.status(500).json({ error: error || "Error creating order" });
    }
  };

  getOrders = async (req: IAuthRequest, res: Response) => {
    try {
      const userId = req.user?._id;
      const isAdmin = req.user?.role === "admin";

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const query = isAdmin ? {} : { userId };
      const orders = await Order.find(query).sort({ createdAt: -1 });

      return res.json(orders);
    } catch (error) {
      return res.status(500).json({ error: error || "Error fetching orders" });
    }
  };

  getOrderById = async (req: IAuthRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const userId = req.user?._id;
      console.log(userId);
      const isAdmin = req.user?.role === "admin";

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (!isAdmin && order.userId.toString() !== userId.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      return res.json(order);
    } catch (error) {
      return res.status(500).json({ error: error || "Error fetching order" });
    }
  };

  updateOrderStatus = async (req: IAuthRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      order.status = status;
      await order.save();

      // If order is completed, close the associated chat
      if (status === "COMPLETED" || status === "CANCELLED") {
        await Chat.findOneAndUpdate(
          { orderId },
          { isActive: false, participants: [] }
        );
      }

      return res.json(order);
    } catch (error) {
      return res
        .status(500)
        .json({ error: error || "Error updating order status" });
    }
  };
}
