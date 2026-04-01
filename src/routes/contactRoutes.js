import express from "express";
import { contactUs } from "../controllers/contactController.js";

const router = express.Router();

// POST /api/contact
router.post("/", contactUs);

export default router;
