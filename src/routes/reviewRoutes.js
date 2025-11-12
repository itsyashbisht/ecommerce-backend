import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addReview,
  getProductReviewsById,
  getReviewById,
  removeReview,
} from "../controllers/review.controllers.js";

const router = Router();
// USING MIDDLEWARE ONCE FOR ALL THE ROUTES BELOW
router.use(verifyJWT);

router.route("/:productId/add-review").post(addReview);
router.route("/remove/:reviewId").delete(removeReview);
router.route("/:productId/reviews").get(getProductReviewsById);
router.route("/:reviewId").get(getReviewById);

export default router;
