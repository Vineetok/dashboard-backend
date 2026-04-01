import express from "express";

import { requireAdminAndHR } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

import { getContactUs, updateContactStatus } from "../../controllers/AdminController/adminController.js";

const router = express.Router();

// Get Contact Us Enquiries and Update Status
router.get("/contactus", authenticateToken, requireAdminAndHR, getContactUs);
router.put("/contactus/status/:enquiry_id", authenticateToken, requireAdminAndHR, updateContactStatus);

export default router;