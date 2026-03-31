import express from "express";
import { checkCibilScore, downloadCibilReport } from "../controllers/cibilController.js";

const router = express.Router();

// 🔹 POST → CHECK CIBIL SCORE
router.post("/check", checkCibilScore);

// 🔹 GET → DOWNLOAD CIBIL REPORT
router.get("/report/:id/download", downloadCibilReport)

export default router;
