import pool from "../config/db.js";
import axios from "axios";
import { generateCibilPdf } from "../utils/generateCibilPdf.js";

// Check CIBIL Score
export const checkCibilScore = async (req, res) => {
  try {
    const { fullName, email, mobile, pan, gender, dob } = req.body;

    // 🔸 Validation
    if (!fullName || !email || !mobile || !pan || !dob || !gender)
      return res.status(400).json({ message: "All fields are required." });

    // 🔸 Check for existing recent request (optional)
    const existing = await pool.query(
      `SELECT * FROM tbl_cibil_requests 
       WHERE pan = $1 OR email = $2 OR mobile = $3 
       ORDER BY created_at DESC LIMIT 1`,
      [pan, email, mobile]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "CIBIL check already requested recently for you.",
      });
    }

    // 🔹 Prepare CIBIL API Body (as per your format)
    const cibilPayload = {
      api_id: process.env.CIBIL_API_ID,
      api_key: process.env.CIBIL_API_KEY,
      token_id: "",
      name: fullName,
      mobile: mobile,
      pan: pan.toUpperCase(),
      gender: gender,
      consent: "Y",
    };

    // 🔹 Call External CIBIL API
    const cibilResponse = await axios.post(
      process.env.CIBIL_URL,
      cibilPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // 🔹 Extract score from response (adjust based on real API response)
    const score = cibilResponse.data
      ?.data
      ?.GetCustomerAssetsResponse
      ?.GetCustomerAssetsSuccess
      ?.Asset
      ?.TrueLinkCreditReport
      ?.Borrower
      ?.CreditScore
      ?.riskScore;

    // 🔸 Insert record with score pending
    const insertQuery = `
      INSERT INTO tbl_cibil_requests 
      (full_name, email, mobile, pan, dob, gender, cibil_score, status, raw_report)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', $8)
      RETURNING request_id, full_name, email, mobile, pan, dob, gender, created_at;
    `;

    const { rows } = await pool.query(insertQuery, [
      fullName,
      email,
      mobile,
      pan.toUpperCase(),
      dob,
      gender,
      score,
      cibilResponse.data,
    ]);

    const queryResult = rows[0];

    return res.status(201).json({
      message: "Your CIBIL score retrieved successfully.",
      cibil_score: score,
      data: queryResult,
      cibilPayload: cibilResponse.data,
    });
  } catch (err) {
    console.error("CIBIL Check Error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Download CIBIL Report as PDF
export const downloadCibilReport = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT raw_report FROM tbl_cibil_requests WHERE request_id = $1",
      [id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Report not found" });

    const rawReport = result.rows[0].raw_report;

    const pdfBuffer = await generateCibilPdf(rawReport);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=cibil-report.pdf`
    );

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Cibil Error :", err);
    return res.status(500).json({ message: "PDF generation failed" });
  }
};