import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// MIDDLEWARE USED.
router.use(verifyJWT);

router.route("/orders").get(getMyOrders);
router.route("/create-order").post(createOrder);
router.route("/all-orders").get(getAllOrders);
router.route("/:orderId").get(getOrderById);
router.route("/cancel-order/:orderId").patch(cancelOrder);
router.route("/update-order-status/:orderId").patch(updateOrderStatus);

export default router;
