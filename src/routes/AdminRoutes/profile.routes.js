import express from "express";

import { authenticateToken } from "../../middleware/authMiddleware.js";
import { requireAdmin, requireAdminAndHR } from "../../middleware/roleMiddleware.js";

import { getAdminProfile, updateAdminProfile } from "../../controllers/AdminController/adminController.js";

const router = express.Router();

// Profile Routes
router.get("/adminProfile", authenticateToken, requireAdminAndHR, getAdminProfile);
router.put("/adminProfile/update", authenticateToken, requireAdmin, updateAdminProfile);

export default router;