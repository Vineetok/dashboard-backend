import express from "express";
import { requireDsa } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { createDetailLead, getDetailLeads, getAllDocuments, uploadDetailLeadDocument, getSignedUrl, getCompletedDetailLeads } from "../../controllers/DsaController/dsaController.js";
import { uploadAndCompress } from "../../middleware/uploadAndCompress.js";

const router = express.Router();

// Get & Create Detail Lead
router.post("/create-detail-lead", authenticateToken, requireDsa, createDetailLead);
router.get("/get-my-detail-leads", authenticateToken, requireDsa, getDetailLeads);
router.get("/detail-lead/:leadId/all-documents", authenticateToken, requireDsa, getAllDocuments);
router.post("/detail-leads/:leadId/documents", authenticateToken, uploadAndCompress, uploadDetailLeadDocument);
router.get("/detail-lead-documents/:documentId/signed-url", authenticateToken, getSignedUrl);
router.get("/get-completed-detail-leads", authenticateToken, requireDsa, getCompletedDetailLeads);

export default router;