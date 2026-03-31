import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
// console.log("🔥 Connected DB:", process.env.DB_NAME);

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: isProduction
    ? { rejectUnauthorized: false } // AWS Lightsail requires SSL
    : false, // Local PostgreSQL rejects SSL
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ DB connection error:", err));

export default pool;
