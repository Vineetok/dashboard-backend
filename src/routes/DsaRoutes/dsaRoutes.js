import express from "express";
import { requireDsa, requireDsaAndCustomer } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import {
  getReferralLeads,
  getDetailLeads,
  getProfile,
  updateProfile,
  createReferralLead,
  createDetailLead,
  getAssignedRMForDSA,
  uploadDetailLeadDocument,
  getAllDocuments,
  getClientDetails,
  getSignedUrl,
  verifyPanAndUpdateProfile,
  verifyBankPennyDrop,
  refreshToken,
  updateProfileImage,
  generateAadhaarOtp,
  verifyAadhaarOtp,
  verifyGST,
  verifyPanAadhaarLink,
  getCompletedDetailLeads,
  // sendEmailOtp,
  // verifyEmailOtp,
} from "../../controllers/DsaController/dsaController.js";
import { uploadAndCompress, uploadProfileImageMiddleware } from "../../middleware/uploadAndCompress.js";
import {
  createSupportTicket,
  getMyTickets,
} from "../../controllers/supportController.js";

const router = express.Router();

// ✅ Get & Edit profile
router.get("/profile", authenticateToken, requireDsaAndCustomer, requireDsa, getProfile);
router.put("/profile", authenticateToken, requireDsa, updateProfile);
router.put("/profile/image", authenticateToken, requireDsaAndCustomer, uploadProfileImageMiddleware, updateProfileImage);
router.get("/refresh-token", authenticateToken, refreshToken);

// Send OTP for Email Verify
// router.post("/send-email-otp", authenticateToken, requireDsaAndCustomer, sendEmailOtp);
// router.post("/verify-email-otp", authenticateToken, requireDsaAndCustomer, verifyEmailOtp);

// ✅ Get & Create Referral Lead
router.post("/create-referral-lead", authenticateToken, requireDsa, createReferralLead);
router.get("/get-referral-leads", authenticateToken, requireDsa, getReferralLeads);

// ✅ Get & Create Detail Lead
router.post("/create-detail-lead", authenticateToken, requireDsa, createDetailLead);
router.get("/get-my-detail-leads", authenticateToken, requireDsa, getDetailLeads);
router.get("/detail-lead/:leadId/all-documents", authenticateToken, requireDsa, getAllDocuments);
router.post("/detail-leads/:leadId/documents", authenticateToken, uploadAndCompress, uploadDetailLeadDocument);
router.get("/detail-lead-documents/:documentId/signed-url", authenticateToken, getSignedUrl);
router.get("/get-completed-detail-leads", authenticateToken, requireDsa, getCompletedDetailLeads);

// ✅ Support Ticket routes
router.post("/support/ticket", authenticateToken, requireDsa, createSupportTicket);
router.get("/support/my-tickets", authenticateToken, requireDsa, getMyTickets);

router.get("/all-client-detail", authenticateToken, requireDsa, getClientDetails);

// Get assigned RM for DSA
router.get("/get-assigned-rm", authenticateToken, requireDsa, getAssignedRMForDSA);

// Verification routes
router.post("/verify-pan", authenticateToken, requireDsaAndCustomer, verifyPanAndUpdateProfile);
router.post("/verify-bank", authenticateToken, requireDsaAndCustomer, verifyBankPennyDrop);
router.post("/aadhaar/generate-otp", authenticateToken, requireDsaAndCustomer, generateAadhaarOtp);
router.post("/aadhaar/verify-otp", authenticateToken, requireDsaAndCustomer, verifyAadhaarOtp);
router.post("/verify-gst", authenticateToken, requireDsaAndCustomer, verifyGST);
router.post("/verify-pan-aadhaar-link", authenticateToken, requireDsaAndCustomer, verifyPanAadhaarLink);
export default router;
