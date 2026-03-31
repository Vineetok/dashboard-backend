import axios from "axios";
import pool from "../config/db.js";
import {
  getFinancialYear,
  getCustomerSubCategoryPrefix,
} from "../utils/generateFinancialYear.js";

import * as mfApiService from "../products/investments/mutual-funds/services/mfApiService.js";
import { fetchMarketIndices } from "../services/marketService.js";
const otpStore = new Map();

export const createCustomerDetailLead = async (req, res) => {
  try {
    const { department, product_type, sub_category, client, form_data } =
      req.body;

    if (
      !department ||
      !product_type ||
      !sub_category ||
      !client?.name ||
      !client?.mobile ||
      !form_data
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    /* 1️⃣ UPSERT CUSTOMER */
    const customerRes = await pool.query(
      `
        INSERT INTO tbl_customers (name, mobile, email)
        VALUES ($1,$2,$3)
        ON CONFLICT (mobile)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        `,
      [client.name, client.mobile, client.email || null],
    );
    const customerId = customerRes.rows[0].id;

    /* 2️⃣ ASSIGN RM */
    const rmRes = await pool.query(
      `
        SELECT id
        FROM tbl_registeredusers
        WHERE role='RM'
          AND LOWER(department)=LOWER($1)
          AND LOWER(sub_category) LIKE '%'||LOWER($2)||'%'
        ORDER BY id ASC
        LIMIT 1
        `,
      [department, sub_category],
    );
    const assignedRMId = rmRes.rows[0]?.id || null;

    /* 3️⃣ DEPARTMENT HEAD */
    const dhRes = await pool.query(
      `
        SELECT id FROM tbl_registeredusers
        WHERE role='DEPARTMENTHEAD' AND department=$1
        LIMIT 1
        `,
      [department],
    );
    const departmentHeadId = dhRes.rows[0]?.id || null;

    /* 4️⃣ GENERATE CUSTOMER LEAD ID */
    const fy = getFinancialYear();
    const prefix = getCustomerSubCategoryPrefix(sub_category);
    const likePattern = `${prefix}/${fy}/%`;

    const seqRes = await pool.query(
      `
        SELECT COUNT(*) + 1 AS seq
        FROM tbl_customer_detail_leads
        WHERE customer_detail_lead_id LIKE $1
        `,
      [likePattern],
    );

    const seq = String(seqRes.rows[0].seq).padStart(4, "0");
    const customerDetailLeadId = `${prefix}/${fy}/${seq}`;

    /* 5️⃣ INSERT LEAD */
    const leadRes = await pool.query(
      `
        INSERT INTO tbl_customer_detail_leads(
          customer_detail_lead_id,
          customer_id,
          rm_id,
          department_head_id,
          department,
          product_type,
          sub_category,
          lead_name,
          contact_number,
          email,
          form_data
        )
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING id
        `,
      [
        customerDetailLeadId,
        customerId,
        assignedRMId,
        departmentHeadId,
        department,
        product_type,
        sub_category,
        client.name,
        client.mobile,
        client.email || null,
        form_data,
      ],
    );

    const leadDbId = leadRes.rows[0].id;

    /* 6️⃣ ATTACH REQUIRED DOCUMENTS (SAME RULE ENGINE) */
    const rulesRes = await pool.query(
      `
        SELECT document_key, document_label, is_mandatory
        FROM tbl_detail_lead_document_rules r
        WHERE LOWER(r.department)=LOWER($1)
          AND LOWER(r.product_type)=LOWER($2)
          AND LOWER(r.sub_category)=LOWER($3)
          AND NOT EXISTS (
            SELECT 1
            FROM jsonb_each(r.conditions) c
            WHERE NOT (
              $4::jsonb -> c.key ?| ARRAY (
                SELECT jsonb_array_elements_text(c.value)
              )
            )
          )
        `,
      [department, product_type, sub_category, form_data],
    );

    for (const r of rulesRes.rows) {
      await pool.query(
        `
          INSERT INTO tbl_customer_detail_lead_required_documents
          (customer_detail_lead_db_id, document_key, document_label, is_mandatory)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT DO NOTHING
          `,
        [leadDbId, r.document_key, r.document_label, r.is_mandatory],
      );
    }

    return res.status(201).json({
      success: true,
      customer_detail_lead_id: customerDetailLeadId,
    });
  } catch (err) {
    console.error("Customer Detail Lead Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// MARKET INDICES
export const getMarketIndices = async (req, res) => {
  try {
    const data = await fetchMarketIndices();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Market fetch error",
      error: error.message,
    });
  }
};

// SEARCH MUTUAL FUNDS
export const searchMutualFunds = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      message: "Query parameter is required",
    });
  }

  try {
    const results = await mfApiService.searchFunds(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({
      message: "Search failed",
      error: error.message,
    });
  }
};

// GET FUND 
export const getFundDetails = async (req, res) => {
  const { schemeCode } = req.params;

  try {
    const details = await mfApiService.getFullFundDetails(schemeCode);
    res.json(details);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching fund details",
      error: error.message,
    });
  }
};

// CARRER APPLICATION
export const submitCareerApplication = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      current_city,
      total_experience,
      notice_period,
      current_ctc,
      expected_ctc,
      linkedin_url,
      applying_for
    } = req.body;

    // Basic validation
    if (
      !full_name || !email || !phone || !current_city ||
      !total_experience || !notice_period ||
      !current_ctc || !expected_ctc || !applying_for
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled."
      });
    }

    const insertQuery = `
      INSERT INTO tbl_career_applications 
      (full_name, email, phone, current_city, total_experience, notice_period,
       current_ctc, expected_ctc, linkedin_url, applying_for)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;

    const values = [
      full_name,
      email,
      phone,
      current_city,
      total_experience,
      notice_period,
      current_ctc,
      expected_ctc,
      linkedin_url || null,
      applying_for
    ];

    const result = await pool.query(insertQuery, values);

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Career Application Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// SEND MOBILE OTP (Only for mobile verification purpose) Not Using
export const sendMobileOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) return res.status(400).json({ message: "Mobile is required" });

    if (!/^[6-9]\d{9}$/.test(mobile))
      return res.status(400).json({ message: "Invalid mobile number" });

    // Send OTP via UDO
    const response = await axios.post(
      process.env.UDO_VERIFY_URL,
      {
        configId: process.env.UDO_CONFIG_ID,
        to: `91${mobile}`,
      },
      {
        headers: {
          apikey: process.env.UDO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    const { verifyId } = response.data;

    // Store OTP session for 2 minutes
    otpStore.set(mobile, {
      verifyId,
      expiresAt: Date.now() + 2 * 60 * 1000,
      purpose: "cibil_verification",
    });

    return res.status(200).json({
      message: "Mobile OTP sent successfully",
    });
  } catch (err) {
    console.error("sendMobileOtp error:", err);
    return res.status(500).json({ message: "Failed to send mobile OTP" });
  }
};

// VERIFY MOBILE OTP (Only for mobile verification purpose) Not Using
export const verifyMobileOtp = async (req, res) => {
  try {
    // const userId = req.user.id;
    const { mobile, otp } = req.body;

    if (!mobile || !otp)
      return res.status(400).json({ message: "Mobile and OTP are required" });

    const record = otpStore.get(mobile);

    if (
      !record ||
      record.purpose !== "cibil_verification" ||
      Date.now() > record.expiresAt
    ) {
      otpStore.delete(mobile);
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    let response;

    try {
      response = await axios.post(
        process.env.UDO_VALIDATE_URL,
        {
          verifyId: record.verifyId,
          otp,
        },
        {
          headers: {
            apikey: process.env.UDO_API_KEY,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (err) {
      if (err.response?.status === 401) {
        return res.status(400).json({ message: "Incorrect or expired OTP" });
      }
      throw err;
    }

    // if (response.data?.status === "success") {
    //   // 1️⃣ Update mobile in registered users
    //   await pool.query(
    //     `UPDATE tbl_registeredusers
    //  SET mobile = $1, updated_at = CURRENT_TIMESTAMP
    //  WHERE id = $2`,
    //     [mobile, userId],
    //   );

    //   // 2️⃣ Update phone verification in KYC table
    //   await pool.query(
    //     `UPDATE tbl_dsa_kyc
    //  SET phone_number = $1,
    //      phone_verified = TRUE,
    //      updated_at = CURRENT_TIMESTAMP
    //  WHERE user_id = $2`,
    //     [mobile, userId],
    //   );
    // }

    if (response.data?.error) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP valid → remove from store
    otpStore.delete(mobile);

    return res.status(200).json({
      message: "Mobile verified successfully",
      verified: true,
    });
  } catch (err) {
    console.error("verifyMobileOtp error:", err);
    return res.status(500).json({ message: "Mobile OTP verification failed" });
  }
};
