import express from 'express';
import {authenticateToken} from '../../middleware/authMiddleware.js';
import {requireUnlistedAdmin} from '../../middleware/roleMiddleware.js';

// ROUTES IMPORT
import userroutes from '../routes/user routes/user.routes.js';
import customerRoutes from '../../customer/routes/customerRoutes.js';
import unlistedAdminRoutes from '../routes/admin routes/admin.routes.js';
import adminAnalyticsRoutes
  from '../routes/admin routes/adminAnalytics.routes.js';
import publicroutes from '../routes/public routes/publicroutes.js';

const router = express.Router ();

/* ===========================
   USER ROUTES (Protected)
=========================== */
router.use ('/user', authenticateToken, userroutes);

router.use('/customer', authenticateToken, customerRoutes);

/* ===========================
   ADMIN ROUTES (Protected + Role)
=========================== */
router.use (
  '/admin',
  authenticateToken,
  requireUnlistedAdmin,
  unlistedAdminRoutes
);

/* ===========================
   ADMIN ANALYTICS
=========================== */
router.use (
  '/admin/analytics',
  authenticateToken,
  requireUnlistedAdmin,
  adminAnalyticsRoutes
);

/* ===========================
   PUBLIC ROUTES
=========================== */
router.use ('/public', publicroutes);

export default router;
