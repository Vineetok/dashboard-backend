import express from "express";
import { requireUnlistedUser } from "../../middleware/roleMiddleware.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";

// 🔹 Goal Planner
import { createGoal } from "../controllers/goalplanner/createGoal.js";
import { getGoals } from "../controllers/goalplanner/getGoals.js";
import { getGoalById } from "../controllers/goalplanner/getGoalById.js";
import { updateGoal } from "../controllers/goalplanner/updateGoal.js";
import { deleteGoal } from "../controllers/goalplanner/deleteGoal.js";
import { calculateGoal } from "../controllers/goalplanner/calculateGoal.js";
import { goalProgress } from "../controllers/goalplanner/goalProgress.js";

// 🔹 Wishlist
import { addWishlist } from "../controllers/wishlist/addWishlist.js";
import { getWishlist } from "../controllers/wishlist/getWishlist.js";
import { getWishlistById } from "../controllers/wishlist/getWishlistById.js";
import { removeWishlist } from "../controllers/wishlist/removeWishlist.js";
import { wishlistCount } from "../controllers/wishlist/wishlistCount.js";

import mainPortfolio from "../controllers/portfolio/portfolio.controller.js";

import { createSupportTicket } from '../controllers/support/createTicket.js';
import { getMyTickets } from '../controllers/support/getMyTickets.js';
import { getTicketDetails } from '../controllers/support/getTicketDetails.js';
import { replyTicket } from '../controllers/support/replyTicket.js';
import { closeTicket } from '../controllers/support/closeTicket.js';
import { getSupportCategories } from '../controllers/support/getSupportCategories.js';

import { getOverallReports } from "../controllers/reports/getOverallReports.js";
import { getProductSummary } from "../controllers/reports/getProductSummary.js";
import { getRecentInvestments } from "../controllers/reports/getRecentInvestments.js";
import { getPortfolioDistribution } from "../controllers/reports/getPortfolioDistribution.js";

import { getAssignedRM } from "../rm/getAssignedRM.js";

const router = express.Router();

/* ===============================
   🔹 GOAL ROUTES
================================ */
router.post("/create-goal", authenticateToken, requireUnlistedUser, createGoal);
router.get("/my-goals", authenticateToken, requireUnlistedUser, getGoals);
router.get("/goal/:goal_id", authenticateToken, requireUnlistedUser, getGoalById);
router.put("/update-goal/:goal_id", authenticateToken, requireUnlistedUser, updateGoal);
router.delete("/delete-goal/:goal_id", authenticateToken, requireUnlistedUser, deleteGoal);
router.post("/calculate-goal", authenticateToken, requireUnlistedUser, calculateGoal);
router.get("/goal-progress/:goal_id", authenticateToken, requireUnlistedUser, goalProgress);

/* ===============================
   🔹 WISHLIST ROUTES
================================ */
router.post("/add-wishlist", authenticateToken, requireUnlistedUser, addWishlist);
router.get("/my-wishlist", authenticateToken, requireUnlistedUser, getWishlist);
router.get("/wishlist/:id", authenticateToken, requireUnlistedUser, getWishlistById);
router.delete("/remove-wishlist/:id", authenticateToken, requireUnlistedUser, removeWishlist);
router.get("/wishlist-count", authenticateToken, requireUnlistedUser, wishlistCount);

/* ===============================
   🔥 PORTFOLIO ROUTE (NEW)
================================ */
router.get("/portfolio", authenticateToken, requireUnlistedUser,mainPortfolio);

/* ================= REPORT ROUTES ================= */
router.get("/reports/overview", authenticateToken, requireUnlistedUser, getOverallReports);

router.get("/reports/product-summary", authenticateToken, requireUnlistedUser, getProductSummary);

router.get("/reports/recent-investments", authenticateToken, requireUnlistedUser, getRecentInvestments);

router.get("/reports/portfolio-distribution", authenticateToken, requireUnlistedUser, getPortfolioDistribution);

/* ================= TICKET ROUTES ================= */

router.post("/create", authenticateToken, createSupportTicket);

router.get("/list", authenticateToken, getMyTickets);

router.get("/categories", authenticateToken, getSupportCategories);

router.post("/reply", authenticateToken, replyTicket);

router.post("/close", authenticateToken, closeTicket);

router.get("/:ticket_id", authenticateToken, getTicketDetails);

router.get("/rm/assigned-rm", authenticateToken, getAssignedRM);

export default router;

