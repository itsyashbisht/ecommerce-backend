import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  changeCurrentPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserDetails,
} from "../controllers/user.controllers";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/refresh-token").get(refreshAccessToken);
router.route("/update-details").post(verifyJWT, updateUserDetails);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
