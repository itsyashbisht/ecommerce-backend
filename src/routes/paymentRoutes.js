import { Router } from "express";
import {
  getRazorpayKey,
  paymentVerification,
} from "../controllers/payment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/verify").post(paymentVerification);
router.route("/razorpay-key").get(getRazorpayKey);

export default router;
