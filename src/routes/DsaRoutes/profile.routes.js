import express from "express";
import { requireDsa, requireDsaAndCustomer } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { uploadProfileImageMiddleware } from "../../middleware/uploadAndCompress.js";
import { getProfile, getKycStatus, updateProfile, updateProfileImage, refreshToken, getReferralCode, createAgreement } from "../../controllers/DsaController/dsaController.js";

const router = express.Router();

// Get Refresh token
router.get("/refresh-token", authenticateToken, refreshToken);

// Get Profile & kyc status
router.get("/profile", authenticateToken, requireDsaAndCustomer, getProfile);
router.get("/profile/kyc-status", authenticateToken, requireDsaAndCustomer, getKycStatus);
router.put("/profile", authenticateToken, requireDsa, updateProfile);
router.put("/profile/image", authenticateToken, requireDsaAndCustomer, uploadProfileImageMiddleware, updateProfileImage);

// Generate Referral Code
router.get("/profile/share-referral", authenticateToken, requireDsa, getReferralCode);

// Create Agreement
router.post("/profile/create-agreement", authenticateToken, requireDsa, createAgreement);

export default router;
