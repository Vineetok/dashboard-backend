import express from "express";
import { requireDsa } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { createReferralLead, getReferralLeads } from "../../controllers/DsaController/dsaController.js";

const router = express.Router();

// Get & Create Referral Lead
router.post("/create-referral-lead", authenticateToken, requireDsa, createReferralLead);
router.get("/get-referral-leads", authenticateToken, requireDsa, getReferralLeads);

export default router;