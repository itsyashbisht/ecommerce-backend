import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createOrder, getMyOrders } from "../controllers/order.controllers.js";

const router = Router();
// MIDDLEWARE USED.
router.use(verifyJWT);

router.route("/create-order").post(createOrder);
router.route("/orders").get(getMyOrders);

export default router;
