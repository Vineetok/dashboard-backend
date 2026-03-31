import express from "express";
import {
    createCustomerDetailLead, getMarketIndices, searchMutualFunds, getFundDetails, submitCareerApplication, sendMobileOtp,
    verifyMobileOtp,
} from "../controllers/publicController.js";

const router = express.Router();

// Create Customer Detail Lead From Website
router.post("/create-customer-detail-lead", createCustomerDetailLead);

// Career Application
router.post("/submit-career-application", submitCareerApplication);

// Mutual Fund routes
router.get('/indices', getMarketIndices);
router.get('/search', searchMutualFunds);
router.get('/:schemeCode', getFundDetails);

// Verify Mobile OTP 
router.post("/send-mobile-otp", sendMobileOtp);
router.post("/verify-mobile-otp", verifyMobileOtp);

export default router;