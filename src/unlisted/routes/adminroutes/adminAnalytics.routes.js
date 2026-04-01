import express from 'express';
import {authenticateToken} from '../../../middleware/authMiddleware.js';
import {requireUnlistedAdmin} from '../../../middleware/roleMiddleware.js';

// Analytics Controller
import {
  getSharesSummary,
  getHighInvestmentShares,
  exportSharesCSV,
  exportTransactionsCSV,
  filterShares,
  filterTransactions,
  getSharePriceTrends,
  getBuySellTrends,
} from '../../controllers/adminController/adminAnalytics.controller.js';

const router = express.Router ();

// Common middleware for all admin routes
const adminAuth = [authenticateToken, requireUnlistedAdmin];

/* ===========================
   SHARES SUMMARY
=========================== */
router.get ('/shares-summary', adminAuth, getSharesSummary);

router.get ('/alerts/high-investment', adminAuth, getHighInvestmentShares);

/* ===========================
   EXPORT CSV
=========================== */
router.get ('/shares/export', adminAuth, exportSharesCSV);
router.get ('/transactions/export', adminAuth, exportTransactionsCSV);

/* ===========================
   FILTER / SEARCH
=========================== */
router.get ('/shares/filter', adminAuth, filterShares);
router.get ('/transactions/filter', adminAuth, filterTransactions);

/* ===========================
   TREND / CHART DATA
=========================== */
router.get ('/trends/share-price', adminAuth, getSharePriceTrends);
router.get ('/trends/buy-sell', adminAuth, getBuySellTrends);

export default router;
