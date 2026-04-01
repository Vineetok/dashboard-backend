import express from "express";
import { requireDsa } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { getClientDetails, getAssignedRMForDSA, getUserTds } from "../../controllers/DsaController/dsaController.js";

const router = express.Router();

// Get all submitted client portfolio
router.get("/all-client-detail", authenticateToken, requireDsa, getClientDetails);

// Get assigned RM for DSA
router.get("/get-assigned-rm", authenticateToken, requireDsa, getAssignedRMForDSA);

// Get User TDS Pdf's
router.get("/tds", authenticateToken, requireDsa, getUserTds);

export default router;