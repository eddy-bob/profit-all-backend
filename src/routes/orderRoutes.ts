import { Router } from "express";
import { OrderController } from "../controllers/orderController";
import { auth } from "../middleware/auth";
import { roleGuard } from "../middleware/roleGuard";
import { SocketService } from "../services/socketService";

export const createOrderRoutes = (socketService: SocketService) => {
  const router = Router();
  const orderController = new OrderController(socketService);

  // Create order (requires authentication)
  router.post("/", auth, orderController.createOrder);

  // Get all orders (requires authentication)
  router.get("/", auth, orderController.getOrders);

  // Get order by ID (requires authentication)
  router.get("/:id", auth, orderController.getOrderById);

  // Update order status (requires admin role)
  router.patch(
    "/:id/status",
    auth,
    roleGuard(["admin"]),
    orderController.updateOrderStatus
  );
  return router;
};
