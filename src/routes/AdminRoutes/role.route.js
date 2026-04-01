import express from "express";

import { authenticateToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/roleMiddleware.js";

import { getRoleList, updateRoleUser, addRoleUser } from "../../controllers/AdminController/adminController.js";

const router = express.Router();

// Get Role List and Update User Role
router.get("/rolelist", authenticateToken, requireAdmin, getRoleList);
router.put("/rolelist/:id", authenticateToken, requireAdmin, updateRoleUser);

// Add New User with Role
router.post("/add-role-user", authenticateToken, requireAdmin, addRoleUser);

export default router;