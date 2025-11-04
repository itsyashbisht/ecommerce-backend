import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteProduct,
  getAllProducts,
  productById,
  updateProductDetails,
  updateProductImages,
} from "../controllers/product.controllers.js";

const router = Router();

router.route("/products").get(verifyJWT, getAllProducts);
router.route("/productId").get(verifyJWT, productById);
router.route("/delete/productId").delete(verifyJWT, deleteProduct);
router.route("/update/productId").post(verifyJWT, updateProductDetails);
router.route("/update/productId/image").post(verifyJWT, updateProductImages);

export default router;
