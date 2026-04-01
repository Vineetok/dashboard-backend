import express from "express";

import { authenticateToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/roleMiddleware.js";

import { uploadExcelMiddleware } from "../../middleware/uploadAndCompress.js";
import { downloadTdsExcel, uploadTdsExcel, getTdsData } from "../../controllers/AdminController/adminController.js";

const router = express.Router();

// TDS Routes
router.get("/tds/download", authenticateToken, requireAdmin, downloadTdsExcel);
router.post("/tds/upload", authenticateToken, requireAdmin, uploadExcelMiddleware, uploadTdsExcel);
router.get("/tds/data", authenticateToken, requireAdmin, getTdsData);

export default router;