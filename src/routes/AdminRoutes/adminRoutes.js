import express from "express";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { requireAdmin, requireAdminAndHR } from "../../middleware/roleMiddleware.js";

import {
  getDSAList,
  getALLData,
  getRoleList,
  searchDSA,
  getContactUs,
  getAdminProfile,
  updateAdminProfile,
  getAllTickets,
  solveTicket,
  updateDSAUser,
  updateRoleUser,
  deleteDSAUser,
  updateContactStatus,
  getUnassignedDSAs,
  getRMList,
  assignDSAToRM,
  addRoleUser,
  getCibilRequests,
  getAllDetailLeads,
  exportDetailLeads,
  getAllReferralLeads,
  getAllCarrerApplication,
  updateDetailLead
} from "../../controllers/AdminController/adminController.js";

import { uploadCSV } from "../../middleware/uploadCSVMiddleware.js";
import { uploadCSVToDB, uploadDetailLeadsCSV } from "../../controllers/AdminController/uploadCSV.js";

const router = express.Router();

// Profile Routes
router.get("/adminProfile", authenticateToken, requireAdminAndHR, getAdminProfile);
router.put("/adminProfile/update", authenticateToken, requireAdmin, updateAdminProfile);

// Get DSA list , Update , Delete DSA , Search DSA
router.get("/dsalist", authenticateToken, requireAdmin, getDSAList);
router.put("/dsalist/:id", authenticateToken, requireAdmin, updateDSAUser);
router.delete("/dsalist/:id", authenticateToken, requireAdmin, deleteDSAUser);
router.get("/dsalist/search", authenticateToken, requireAdmin, searchDSA);

// Get All Data for Admin Dashboard
router.get("/getalldata", authenticateToken, requireAdmin, getALLData);

// Get Role List and Update User Role
router.get("/rolelist", authenticateToken, requireAdmin, getRoleList);
router.put("/rolelist/:id", authenticateToken, requireAdmin, updateRoleUser);

// Get Contact Us Enquiries and Update Status
router.get("/contactus", authenticateToken, requireAdminAndHR, getContactUs);
router.put("/contactus/status/:enquiry_id", authenticateToken, requireAdminAndHR, updateContactStatus);

// Get Carrer Application Enquiries 
router.get("/career-applications", authenticateToken, requireAdminAndHR, getAllCarrerApplication);

router.get("/tickets", authenticateToken, requireAdmin, getAllTickets);
router.put("/tickets/:id/solve", authenticateToken, requireAdmin, solveTicket);

// ✅ Get Unassigned DSAs
router.get("/unassigned-dsas", authenticateToken, requireAdmin, getUnassignedDSAs);

// ✅ Get RM List
router.get("/rmlist", authenticateToken, requireAdmin, getRMList);

// ✅ Assign DSA to RM (Admin Only)
router.put("/assign-dsa-to-rm", authenticateToken, requireAdmin, assignDSAToRM);

// ✅ Add New User with Role (Admin Only)
router.post("/add-role-user", authenticateToken, requireAdmin, addRoleUser);

// ✅ Upload Users via CSV (Admin Only)
router.post("/upload-users-csv", authenticateToken, uploadCSV.single('file'), uploadCSVToDB);

// Upload Detail Leads via CSV (Admin Only)
router.post("/upload-detail-leads-csv", authenticateToken, uploadCSV.single("file"), uploadDetailLeadsCSV);

// ✅ Get CIBIL Requests
router.get("/get-cibil-request", authenticateToken, requireAdmin, getCibilRequests);

router.get("/get-all-detail-leads", authenticateToken, requireAdmin, getAllDetailLeads);
router.get("/get-all-detail-leads/export", authenticateToken, requireAdmin, exportDetailLeads);
router.put("/get-all-detail-leads/:id", authenticateToken, requireAdmin, updateDetailLead);
router.get("/get-all-referral-leads", authenticateToken, requireAdmin, getAllReferralLeads);

export default router;
