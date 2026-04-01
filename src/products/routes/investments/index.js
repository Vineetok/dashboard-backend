import express from "express";
import mfRoutes from "./mutual-funds/mfRoutes.js";

const router = express.Router();

router.use("/mutual-funds", mfRoutes);

export default router;