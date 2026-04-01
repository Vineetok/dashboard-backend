import express from "express";
import { requireDsaAndCustomer } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

import { sendEmailOtp, verifyEmailOtp, verifyPanAndUpdateProfile, generateAadhaarOtp, verifyAadhaarOtp, verifyPanAadhaarLink, verifyBankPennyDrop, verifyGST } from "../../controllers/DsaController/dsaController.js";

const router = express.Router();

// Verification routes 

// Step 1: Mobile (mobile is verifie at the time of sign up) & Email verification
router.post("/send-email-otp", authenticateToken, requireDsaAndCustomer, sendEmailOtp);
router.post("/verify-email-otp", authenticateToken, requireDsaAndCustomer, verifyEmailOtp);

// Step 2: Pan , Aadhaar + Pan-aadharr link
router.post("/verify-pan", authenticateToken, requireDsaAndCustomer, verifyPanAndUpdateProfile);
router.post("/aadhaar/generate-otp", authenticateToken, requireDsaAndCustomer, generateAadhaarOtp);
router.post("/aadhaar/verify-otp", authenticateToken, requireDsaAndCustomer, verifyAadhaarOtp);
router.post("/verify-pan-aadhaar-link", authenticateToken, requireDsaAndCustomer, verifyPanAadhaarLink);

// Step 3: Bank + GST
router.post("/verify-bank", authenticateToken, requireDsaAndCustomer, verifyBankPennyDrop);
router.post("/verify-gst", authenticateToken, requireDsaAndCustomer, verifyGST);

export default router;