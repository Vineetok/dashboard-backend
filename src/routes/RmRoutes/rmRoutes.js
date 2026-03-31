import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import {
  getReferralLeads,
  getIncomingAssignedLeads,
  getOutgoingReferralLeads,
  getReferredDSAs,
  getRMProfile,
  updateRMProfile,
  getIncomingCustomerDetailLeads,
  getCustomerDetailLeadDocuments,
  getMyDetailLeads,
  getIncomingDetailLeads,
  getOutgoingDetailLead,
  acceptDetailLead,
  rejectDetailLead,
  updateReferralLeadStatus,
  updateDetailLeadStatus,
} from "../../controllers/RmController/rmController.js";

const router = express.Router();
router.get("/get-referral-leads", authenticateToken, getReferralLeads);
router.put("/:leadId/referral-status",authenticateToken,updateReferralLeadStatus);
router.get("/get-incoming-assigned-lead", authenticateToken, getIncomingAssignedLeads);
router.get("/get-outgoing-assigned-lead", authenticateToken, getOutgoingReferralLeads);
router.get("/get-mydsa", authenticateToken, getReferredDSAs);
router.get("/get-rm-profile", authenticateToken, getRMProfile);
router.put("/update-profile", authenticateToken, updateRMProfile);

router.get("/get-my-detail-lead",authenticateToken,getMyDetailLeads);
router.put("/:leadId/detail-lead-status",authenticateToken,updateDetailLeadStatus);
router.get("/get-incoming-detail-lead",authenticateToken,getIncomingDetailLeads);
router.get("/get-outgoing-detail-lead",authenticateToken,getOutgoingDetailLead);

router.post("/detail-leads/:id/accept",authenticateToken,acceptDetailLead);
router.post("/detail-leads/:id/reject",authenticateToken,rejectDetailLead);

router.get("/customer-detail-leads",authenticateToken,getIncomingCustomerDetailLeads);
router.get("/customer-detail-lead-documents/:leadId",authenticateToken,getCustomerDetailLeadDocuments);
export default router;
