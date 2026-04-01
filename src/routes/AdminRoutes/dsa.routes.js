import express from "express";

import { authenticateToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/roleMiddleware.js";

import { getDSAList, updateDSAUser, deleteDSAUser, getUnassignedDSAs, assignDSAToRM, getDSAKYCStatus } from "../../controllers/AdminController/adminController.js";

const router = express.Router();

// Get DSA list, Update, Delete 
router.get("/dsalist", authenticateToken, requireAdmin, getDSAList);
router.put("/dsalist/:id", authenticateToken, requireAdmin, updateDSAUser);
router.delete("/dsalist/:id", authenticateToken, requireAdmin, deleteDSAUser);

// Get DSA KYC Status
router.get("/get-dsa-kyc-status", authenticateToken, requireAdmin, getDSAKYCStatus);

// Get Unassigned DSAs
router.get("/unassigned-dsas", authenticateToken, requireAdmin, getUnassignedDSAs);

// Assign DSA to RM
router.put("/assign-dsa-to-rm", authenticateToken, requireAdmin, assignDSAToRM);

export default router;