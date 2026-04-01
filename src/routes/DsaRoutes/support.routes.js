import express from "express";
import { requireDsa } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { createSupportTicket, getMyTickets } from "../../controllers/supportController.js";

const router = express.Router();

// Support Ticket routes
router.post("/support/ticket", authenticateToken, requireDsa, createSupportTicket);
router.get("/support/my-tickets", authenticateToken, requireDsa, getMyTickets);

export default router;