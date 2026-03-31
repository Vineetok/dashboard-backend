import express from "express";
import { requireUnlistedUser } from "../../middleware/roleMiddleware.js";
import { createGoal } from "../controllers/goalplanner/createGoal.js";
import { getGoals } from "../controllers/goalplanner/getGoals.js";
import { getGoalById } from "../controllers/goalplanner/getGoalById.js";
import { updateGoal } from "../controllers/goalplanner/updateGoal.js";
import { deleteGoal } from "../controllers/goalplanner/deleteGoal.js";
import { calculateGoal } from "../controllers/goalplanner/calculateGoal.js";
import { goalProgress } from "../controllers/goalplanner/goalProgress.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { addWishlist } from "../controllers/wishlist/addWishlist.js";
import { getWishlist } from "../controllers/wishlist/getWishlist.js";
import { getWishlistById } from "../controllers/wishlist/getWishlistById.js";
import { removeWishlist } from "../controllers/wishlist/removeWishlist.js";
import { wishlistCount } from "../controllers/wishlist/wishlistCount.js";

import mfRoutes from "../../products/investments/mutual-funds/routes/mfRoutes.js";

const router = express.Router();
router.post("/create-goal",authenticateToken, requireUnlistedUser, createGoal);
router.get("/my-goals",authenticateToken,requireUnlistedUser, getGoals);
router.get("/goal/:goal_id", authenticateToken,requireUnlistedUser, getGoalById);
router.put("/update-goal/:goal_id",authenticateToken, requireUnlistedUser, updateGoal);
router.delete("/delete-goal/:goal_id",authenticateToken, requireUnlistedUser, deleteGoal);
router.post("/calculate-goal",authenticateToken,requireUnlistedUser, calculateGoal);
router.get("/goal-progress/:goal_id", authenticateToken,requireUnlistedUser, goalProgress);
router.post("/add-wishlist", authenticateToken, requireUnlistedUser, addWishlist);
router.get("/my-wishlist", authenticateToken, requireUnlistedUser, getWishlist);
router.get("/wishlist/:id", authenticateToken, requireUnlistedUser, getWishlistById);
router.delete("/remove-wishlist/:id", authenticateToken, requireUnlistedUser, removeWishlist);
router.get("/wishlist-count", authenticateToken, requireUnlistedUser, wishlistCount);

// Mutual Funds
router.use("/mutual-funds", mfRoutes);

export default router;






