import express from "express";

import profileRoutes from "./profile.routes.js";
import referralRoutes from "./referral.routes.js";
import verificationRoutes from "./verification.routes.js";
import detailLeadRoutes from "./detailLead.routes.js";
import supportRoutes from "./support.routes.js";
import miscRoutes from "./misc.routes.js";

const router = express.Router();

// Profile Route
router.use("/", profileRoutes);

// Referral Lead Route
router.use("/", referralRoutes);

// KYC Verification Route
router.use("/", verificationRoutes);

// Detail Lead Route
router.use("/", detailLeadRoutes);

// Support Ticket Route
router.use("/", supportRoutes);

// Misc Route
router.use("/", miscRoutes);

export default router;