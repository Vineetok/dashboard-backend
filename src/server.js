import dotenv from "dotenv";
import app from "./app.js";
import { fetchAMFINav } from "./products/investments/mutual-funds/services/mfApiService.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0"; // fallback if HOST not set

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  
  // Preload Mutual Fund data cache
  console.log("📦 Preloading Mutual Fund data...");
  fetchAMFINav()
    .then(() => console.log("✅ Mutual Fund cache warmed up"))
    .catch(err => console.error("❌ Mutual Fund preload failed:", err.message));
});