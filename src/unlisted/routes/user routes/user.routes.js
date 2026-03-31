import express from "express";
import userDashboard from "../../controllers/userController/userDashboard.controller.js";
import userPortfolio from "../../controllers/userController/userPortfolio.controller.js";
import userTransactions from "../../controllers/userController/userTransaction.controller.js";
import filterTransactions from "../../controllers/userController/userTransactionsFilter.controller.js";
import getUserShares from "../../controllers/userController/userShares.controller.js";
import { authenticateToken } from "../../../middleware/authMiddleware.js";
import { requireDsaAndCustomer, requireUnlistedUser } from "../../../middleware/roleMiddleware.js";
import {
  getUserProfile,
  updateUserProfile,
  changePassword
} from "../../controllers/userController/userProfile.controller.js";
import {
  verifyPanAndUpdateProfile,
  verifyBankPennyDrop,
  generateAadhaarOtp,
  verifyAadhaarOtp,
} from "../../../controllers/DsaController/dsaController.js";
import { addDematAccount } from "../../controllers/userController/demat.js";
import createGoal from "../../../customer/controllers/goalplanner/createGoal.js";

const router = express.Router();

// ==========================
// DASHBOARD
// ==========================
router.get("/dashboard", userDashboard);

// ==========================
// PORTFOLIO
// ==========================
router.get("/portfolio", userPortfolio);

// ==========================
// TRANSACTIONS
// ==========================
router.get("/transactions", userTransactions);
router.get("/transactions/filter", filterTransactions);

// ==========================
// COMPANIES
// ==========================
router.get("/shares", getUserShares);

// ==========================
// PROFILE
// ==========================
router.get("/profile", getUserProfile);
router.put("/updateprofile", updateUserProfile);
router.put("/change-password", changePassword);
// router.delete("/delete-account", deleteAccount);

// ==========================
// DEMAT
// ==========================
router.post("/demat/add", addDematAccount);
router.post("/verify-pan", authenticateToken, requireDsaAndCustomer, verifyPanAndUpdateProfile);
router.post("/verify-bank", authenticateToken, requireDsaAndCustomer, verifyBankPennyDrop);
router.post("/aadhaar/generate-otp", authenticateToken, requireDsaAndCustomer, generateAadhaarOtp);
router.post("/aadhaar/verify-otp", authenticateToken, requireDsaAndCustomer, verifyAadhaarOtp);
router.post("/create-goal",authenticateToken, requireUnlistedUser,createGoal)

// ==========================
// LOGOUT
// ==========================
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logout successful. Please delete the token on client side.",
  });
});

export default router;
