import express from "express";
import {
  sendRegisterOtp,
  verifyRegisterOtp,
  registerPartner,
  loginPartner,
  sendLoginOtp,
  verifyLoginOtp,
  verifyUser,
  updatePassword,
  customerRegisterPartner,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register/send-otp", sendRegisterOtp);
router.post("/register/verify-otp", verifyRegisterOtp);
router.post("/register", registerPartner);
router.post("/customer-register", customerRegisterPartner);
router.post("/login", loginPartner);

router.post("/login/otp/send", sendLoginOtp);
router.post("/login/otp/verify", verifyLoginOtp);

router.post("/verify", verifyUser);
router.post("/update-password", updatePassword);


export default router;
