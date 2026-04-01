import express from "express";
import { getAllShares, getSharePriceGraph, getOverallMarketGraph, getTopMoversPublic } from "../../controllers/adminController/adminShares.controller.js";
import { createEnquiry } from '../../controllers/adminController/enquiryController.js';
// import { getAllCompanies } from "../../controllers/adminController/adminCompany.controller.js";
import {
  getCorporateActions,
  getCorporateActionsByShare,
  getCorporateActionsByType
} from "../../controllers/publicController/publicController.js";

const router = express.Router();

router.get("/shares", getAllShares);

router.post('/enquiries', createEnquiry);

router.get("/graph", getOverallMarketGraph);
router.get("/:share_id/graph", getSharePriceGraph);
// router.get("/companies", getAllCompanies);

router.get("/top-movers", getTopMoversPublic);

// ✅ Get all corporate actions (latest first)
router.get("/corporate-actions", getCorporateActions);

// ✅ Get corporate actions by share
router.get("/corporate-actions/share/:shareId", getCorporateActionsByShare);

// ✅ Get corporate actions by type (PRESS / ARTICLE / REPORT)
router.get("/corporate-actions/type/:type", getCorporateActionsByType);

export default router;

