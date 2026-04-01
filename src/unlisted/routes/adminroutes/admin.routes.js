import express from "express";
import { authenticateToken } from "../../../middleware/authMiddleware.js";
import { requireUnlistedAdmin } from "../../../middleware/roleMiddleware.js";

// Dashboard
import adminDashboard from "../../controllers/adminController/adminDashboard.controller.js";

// // Companies
// import { getAllCompanies,addCompany, updateCompany,deleteCompany,} from "../../controllers/adminController/adminCompany.controller.js";

// Users
import { getAllUsers,addUser, updateUser, deleteUser} from "../../controllers/adminController/adminUsers.controller.js";


// Transactions
import { getAllTransactions,getPendingTransactions, approveTransaction,rejectTransaction,addTransaction,} from "../../controllers/adminController/adminTransactions.controller.js";

import { getAllShares, addShare, updateShare, deleteShare, uploadSharesWithHistory,getSharePriceGraph } from "../../controllers/adminController/adminShares.controller.js";

// User Portfolio
import { getUserPortfolio } from "../../controllers/adminController/adminUserPortfolio.controller.js";

import { createEnquiry, getAllEnquiries } from '../../controllers/adminController/enquiryController.js';

import {getDematAccount} from "../../controllers/userController/demat.js"


const router = express.Router();


/* ===========================
   DASHBOARD
=========================== */
router.get( "/dashboard",authenticateToken,requireUnlistedAdmin,adminDashboard);

/* ===========================
   COMPANIES
=========================== */
// router.get("/companies",  getAllCompanies);
// router.post("/companies/add", authenticateToken, requireUnlistedAdmin, addCompany);
// router.put("/companies/update", authenticateToken, requireUnlistedAdmin, updateCompany);
// router.delete("/companies/delete", authenticateToken, requireUnlistedAdmin, deleteCompany);
// these all are for future use api 
/* ===========================
   USERS
=========================== */

router.get("/users", authenticateToken, requireUnlistedAdmin, getAllUsers);

router.post("/users/add", authenticateToken, requireUnlistedAdmin, addUser);

router.put("/users/update/:id", authenticateToken, requireUnlistedAdmin, updateUser);

router.delete("/users/delete/:id", authenticateToken, requireUnlistedAdmin, deleteUser);

/* ===========================
   TRANSACTIONS
=========================== */
router.get("/transactions", authenticateToken, requireUnlistedAdmin, getAllTransactions);
router.get("/transactions/pending", authenticateToken, requireUnlistedAdmin, getPendingTransactions);
router.post("/transactions/add", authenticateToken, requireUnlistedAdmin, addTransaction);
router.post("/transactions/approve", authenticateToken, requireUnlistedAdmin, approveTransaction);
router.post("/transactions/reject", authenticateToken, requireUnlistedAdmin, rejectTransaction);

/* ===========================
   SHARES
=========================== */
router.get("/shares", getAllShares);
router.post("/shares/add", authenticateToken, requireUnlistedAdmin, addShare);
router.put("/shares/update/:id", authenticateToken, requireUnlistedAdmin, updateShare);
router.delete("/shares/delete/:id", authenticateToken, requireUnlistedAdmin, deleteShare);

router.post("/shares/uploadSharesWithHistory", authenticateToken, requireUnlistedAdmin, uploadSharesWithHistory);

router.get("/shares/:share_id/graph", getSharePriceGraph);

/* ===========================
   USER PORTFOLIO
=========================== */
router.get("/user/portfolio", authenticateToken, requireUnlistedAdmin, getUserPortfolio);

router.get(
  "/user/demat/:userId",
  authenticateToken,
  requireUnlistedAdmin,
  getDematAccount
);

router.post('/enquiries', createEnquiry);

router.get("/enquiries", requireUnlistedAdmin, getAllEnquiries);

/* ===========================
   LOGOUT
=========================== */
router.post("/logout", authenticateToken, requireUnlistedAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Logout successful. Please delete the token on client side.",
  });
});

export default router;
 