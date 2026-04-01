import express from "express";

import { authenticateToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/roleMiddleware.js";
import { getALLData } from "../../controllers/AdminController/adminController.js";

import { uploadCSV } from "../../middleware/uploadCSVMiddleware.js";
import { uploadCSVToDB } from "../../controllers/AdminController/uploadCSV.js";

const router = express.Router();

// Get All Users Data
router.get("/getalldata", authenticateToken, requireAdmin, getALLData);

// Upload All Users via CSV
router.post("/upload-users-csv", authenticateToken, uploadCSV.single('file'), uploadCSVToDB);

export default router;