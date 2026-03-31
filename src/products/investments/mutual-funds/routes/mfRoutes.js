import express from 'express';
import * as mfController from '../controllers/mfController.js';
import { authenticateToken } from '../../../../middleware/authMiddleware.js';


const router = express.Router();

router.get('/search', mfController.searchFunds);
router.get('/details/:schemeCode',mfController.getFundDetails);
router.get('/top-performing', mfController.getTopPerforming);


export default router;
