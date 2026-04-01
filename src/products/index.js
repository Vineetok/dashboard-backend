import express from "express";

import investmentsRoutes from "./routes/investments/index.js";
// import financeRoutes from "./routes/finance/index.js";
// import loansRoutes from "./routes/loans/index.js";

const router = express.Router();

router.use("/investments", investmentsRoutes);
// router.use("/finance", financeRoutes);
// router.use("/loans", loansRoutes);

export default router;