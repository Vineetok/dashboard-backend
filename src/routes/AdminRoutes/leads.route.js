import express from "express";

import { requireAdmin } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

import { getAllDetailLeads, exportDetailLeads, updateDetailLead, getAllReferralLeads } from "../../controllers/AdminController/adminController.js";

import { uploadDetailLeadsCSV } from "../../controllers/AdminController/uploadCSV.js";
import { uploadCSV } from "../../middleware/uploadCSVMiddleware.js";

const router = express.Router();

// Get Detail Leads
router.get("/get-all-detail-leads", authenticateToken, requireAdmin, getAllDetailLeads);
router.get("/get-all-detail-leads/export", authenticateToken, requireAdmin, exportDetailLeads);
router.put("/get-all-detail-leads/:id", authenticateToken, requireAdmin, updateDetailLead);

// Get Referral Leads
router.get("/get-all-referral-leads", authenticateToken, requireAdmin, getAllReferralLeads);

// Upload Detail Leads via CSV
router.post("/upload-detail-leads-csv", authenticateToken, uploadCSV.single("file"), uploadDetailLeadsCSV);

export default router;