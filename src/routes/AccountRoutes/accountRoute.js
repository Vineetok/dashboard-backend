import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";

import { getAccountsProfile } from "../../controllers/AccountsController/accountController.js";

const router = express.Router();

router.get("/accountProfile", authenticateToken, getAccountsProfile);

export default router;