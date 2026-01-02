import { Router } from "express";
import { paymentVerification } from "../controllers/payment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/verify").post(paymentVerification);

export default router;
