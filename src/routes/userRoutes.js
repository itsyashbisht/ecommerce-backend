import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  changeCurrentPassword,
  getAllUsers,
  getMe,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  setRoleToAdmin,
  updateUserDetails
} from "../controllers/user.controllers.js";

const router = Router();

router.route("/all-users").get(verifyJWT, getAllUsers);
router.route("/me").get(verifyJWT, getMe);
router.route("/set-admin").patch(verifyJWT, setRoleToAdmin);
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/refresh-token").get(refreshAccessToken);
router.route("/update-details").post(verifyJWT, updateUserDetails);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

export default router;
