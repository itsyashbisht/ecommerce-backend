import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addtoCart,
  clearCart,
  getUserCart,
  removeProductFromCart,
  UpdateItemQuantity,
} from "../controllers/cart.controllers.js";

const router = Router();
router.use(verifyJWT);

router.route("/addItem/:productId").post(addtoCart);
router.route("/removeItem/:productId").delete(removeProductFromCart);
router.route("/").get(getUserCart);
router.route("/update-item-quantity/:productId").patch(UpdateItemQuantity);
router.route("/clear-cart").delete(clearCart);

export default router;
