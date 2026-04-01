import express from "express";

import { authenticateToken } from "../../middleware/authMiddleware.js";
import { requireAdmin, requireAdminAndHR } from "../../middleware/roleMiddleware.js";

import { getCibilRequests, getAllCarrerApplication, getRMList } from "../../controllers/AdminController/adminController.js";

const router = express.Router();

// Get CIBIL Requests
router.get("/get-cibil-request", authenticateToken, requireAdmin, getCibilRequests);

// Get Carrer Application Enquiries 
router.get("/career-applications", authenticateToken, requireAdminAndHR, getAllCarrerApplication);

// Get RM List
router.get("/rmlist", authenticateToken, requireAdmin, getRMList);

export default router;