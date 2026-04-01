import express from "express";

import { authenticateToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/roleMiddleware.js";

import { getAllTickets, solveTicket } from "../../controllers/AdminController/adminController.js";

const router = express.Router();

router.get("/tickets", authenticateToken, requireAdmin, getAllTickets);
router.put("/tickets/:id/solve", authenticateToken, requireAdmin, solveTicket);

export default router;