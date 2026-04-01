import express from "express";

import profileRoutes from "./profile.routes.js";
import dsaRoutes from "./dsa.routes.js";
import leadsRoutes from "./leads.route.js";
import tdsRoutes from "./tds.route.js";
import usersRoutes from "./users.route.js";
import roleRoutes from "./role.route.js";
import contactRoutes from "./contactus.route.js";
import ticketRoutes from "./ticket.route.js";
import miscRoutes from "./misc.route.js";

const router = express.Router();

// Profile Routes
router.use("/", profileRoutes);

// DSA Routes
router.use("/", dsaRoutes);

// Leads Routes
router.use("/", leadsRoutes);

// TDS Routes
router.use("/", tdsRoutes);

// Users Routes
router.use("/", usersRoutes);

// Role Management Routes
router.use("/", roleRoutes);

// Contact Us Routes
router.use("/", contactRoutes);

// DSA Ticket Routes
router.use("/", ticketRoutes);

// Misc Routes
router.use("/", miscRoutes);

export default router;
