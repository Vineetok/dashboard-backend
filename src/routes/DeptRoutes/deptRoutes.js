import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { requireDept } from "../../middleware/roleMiddleware.js";

import {
  getDeptHeadProfile,
  updateDepartmentProfile,
  getRMList,
  getDepartmentHeadReferralLeads,
  getDepartmentHeadCustomerDetailLeads,
  getDepartmentHeadDetailLeads,
  getEligibleRMsForReassign,
  reAssignDetailLeadRM,
} from "../../controllers/DepartmentController/deptController.js";

const router = express.Router();

router.get("/profile", authenticateToken, requireDept, getDeptHeadProfile);
router.put("/update-profile", authenticateToken, requireDept, updateDepartmentProfile);
router.get("/getrmlist", authenticateToken, requireDept, getRMList);

router.get("/getdeptReferralLeads", authenticateToken, requireDept, getDepartmentHeadReferralLeads);

router.get("/getcustomer-detail-lead", authenticateToken, requireDept, getDepartmentHeadCustomerDetailLeads);

router.get("/getdept-detail-leads", authenticateToken, requireDept, getDepartmentHeadDetailLeads);
router.get("/get-eligible-rms/:detailLeadId", authenticateToken, requireDept, getEligibleRMsForReassign);
router.post("/reassign-detail-lead-rm", authenticateToken, requireDept, reAssignDetailLeadRM);
export default router;
