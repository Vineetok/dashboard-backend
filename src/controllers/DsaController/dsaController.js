import axios from "axios";
import pool from "../../config/db.js";
import { s3 } from "../../config/s3.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getFinancialYear } from "../../utils/generateFinancialYear.js";
import { getSubCategoryPrefix } from "../../utils/generateFinancialYear.js";
// const otpStore = new Map(); 
// import { resend } from "../config/resend.js";

import { compressAndUploadToS3, uploadProfileImageToS3 } from "../../middleware/uploadAndCompress.js";
import { getSandboxToken } from "../../services/sandboxAuth.js";

// 🔹 GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(400).json({ message: "User ID missing in token." });

    const query = `
      SELECT id, adv_id, name, email, mobile, pan, pan_verified, state, city, head, category, date_joined , entity_type
      FROM tbl_registeredusers
      WHERE id = $1
      LIMIT 1;
    `;

    const query2 = `SELECT * FROM tbl_dsa_kyc WHERE user_id = $1`;

    const { rows } = await pool.query(query, [userId]);
    const kycDetails = await pool.query(query2, [userId]);

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found." });

    return res.status(200).json({
      message: "Profile fetched successfully.",
      user: rows[0],
      kycDetails: kycDetails.rows[0] || null,
    });
  } catch (err) {
    console.error("Profile Error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 🔹 UPDATE PROFILE IMAGE
export const updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file)
      return res.status(400).json({ message: "Profile image required" });

    const { key, url } = await uploadProfileImageToS3(file, userId);

    await pool.query(
      `
      INSERT INTO tbl_dsa_kyc (user_id, profile_image_key, profile_image_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        profile_image_key = EXCLUDED.profile_image_key,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, key, url],
    );

    return res.status(200).json({
      message: "Profile image updated successfully",
      profile_image_url: url,
    });
  } catch (err) {
    console.error("Profile Image Upload Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { email, head, category, password } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    // Fetch existing user
    const { rows: users } = await pool.query(
      "SELECT * FROM tbl_registeredusers WHERE id = $1",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    // 🧩 Duplicate checks (excluding self)
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id FROM tbl_registeredusers WHERE email = $1 AND id != $2",
        [email, userId],
      );
      if (emailCheck.rows.length > 0)
        return res.status(400).json({ message: "Email already registered." });
    }

    // 🧩 Prepare update fields
    const updates = [];
    const values = [];
    let idx = 1;

    if (email) {
      updates.push(`email = $${idx++}`);
      values.push(email);
    }

    if (head) {
      updates.push(`head = $${idx++}`);
      values.push(head);
    }
    if (category) {
      updates.push(`category = $${idx++}`);
      values.push(category);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push(`password = $${idx++}`);
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    // 🧩 Execute update
    const query = `
      UPDATE tbl_registeredusers
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, adv_id, name, email, mobile, head, category, city, pan;
    `;
    values.push(userId);

    const { rows } = await pool.query(query, values);

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ! SEND EMAIL OTP NOT WORKING
// export const sendEmailOtp = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const userResult = await pool.query(
//       `SELECT id, name, email, email_verified 
//        FROM tbl_registeredusers 
//        WHERE id = $1`,
//       [userId]
//     );

//     if (userResult.rowCount === 0)
//       return res.status(404).json({ message: "User not found" });

//     const user = userResult.rows[0];

//     if (user.email_verified)
//       return res.status(400).json({ message: "Email already verified" });

//     // Generate OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     // Save OTP for 5 minutes
//     otpStore.set(userId, {
//       otp,
//       expiresAt: Date.now() + 5 * 60 * 1000,
//     });

//     // Send email using Resend
//     await resend.emails.send({
//       from: "Infinity Arthvishva <no-reply@infinityarthvishva.com>",
//       to: user.email,
//       subject: "Your Email Verification OTP – Infinity Arthvishva",
//       html: `
//       <div style="font-family: Arial, sans-serif; background:#f5f7fb; padding:30px;">
//         <div style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">

//           <div style="text-align:center;padding:20px;">
//             <img src="https://www.infinityarthvishva.com/logo.png" style="width:140px"/>
//           </div>

//           <div style="background:linear-gradient(90deg,#2076C7,#1CADA3);padding:18px;color:white;">
//             <h2 style="margin:0;font-size:20px;">Email Verification OTP</h2>
//           </div>

//           <div style="padding:30px;color:#333;line-height:1.6;">
//             <p>Dear <b>${user.name}</b>,</p>

//             <p>
//             Please use the following One-Time Password (OTP) to verify your email
//             address for your <b>Infinity Arthvishva</b> account.
//             </p>

//             <div style="text-align:center;margin:25px 0;">
//               <span style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#2076C7;">
//                 ${otp}
//               </span>
//             </div>

//             <p style="font-size:14px;color:#666;">
//             This OTP will expire in <b>5 minutes</b>. For security reasons,
//             please do not share this OTP with anyone.
//             </p>

//             <hr style="margin:25px 0;border:none;border-top:1px solid #eee;"/>

//             <p style="font-size:14px;">
//               📧 info@infinityarthvishva.com<br/>
//               📞 1800 532 7600<br/>
//               🌐 www.infinityarthvishva.com
//             </p>

//             <p style="margin-top:20px;">
//               Regards,<br/>
//               <b>Team Infinity Arthvishva</b>
//             </p>

//             <small style="color:#888;font-size:12px;">
//               This is an automated email. Please do not reply.
//             </small>
//           </div>
//         </div>
//       </div>
//       `,
//     });

//     return res.status(200).json({
//       message: "OTP sent to your email successfully",
//     });
//   } catch (error) {
//     console.error("Send Email OTP Error:", error);
//     return res.status(500).json({ message: "Failed to send OTP" });
//   }
// };

// ! VERIFY EMAIL OTP NOT WORKING
// export const verifyEmailOtp = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { otp } = req.body;

//     if (!otp)
//       return res.status(400).json({ message: "OTP is required" });

//     const record = otpStore.get(userId);

//     if (!record)
//       return res.status(400).json({ message: "OTP not found. Please request again." });

//     if (Date.now() > record.expiresAt)
//       return res.status(400).json({ message: "OTP expired. Please request a new one." });

//     if (record.otp !== otp)
//       return res.status(400).json({ message: "Invalid OTP" });

//     // Update email verified
//     await pool.query(
//       `UPDATE tbl_registeredusers
//        SET email_verified = TRUE,
//            updated_at = CURRENT_TIMESTAMP
//        WHERE id = $1`,
//       [userId]
//     );

//     // Remove OTP
//     otpStore.delete(userId);

//     return res.status(200).json({
//       message: "Email verified successfully",
//     });
//   } catch (error) {
//     console.error("Verify Email OTP Error:", error);
//     return res.status(500).json({ message: "OTP verification failed" });
//   }
// };

// 🔹 GET SUBMITTED REFERRAL LEADS (DSA ONLY)
export const getReferralLeads = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    const query = `
      SELECT
        rl.id,
        rl.ref_id,
        rl.lead_name,
        rl.contact_number,
        rl.email,
        rl.department,
        rl.sub_category,
        rl.notes,
        rl.referral_lead_status,
        rl.created_at
      FROM tbl_referral_leads rl
      WHERE rl.dsa_id = $1
      ORDER BY rl.created_at DESC
    `;

    const { rows } = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching referral leads:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching referral leads",
    });
  }
};

// 🔹 CREATE REFERRAL LEAD (DSA ONLY)
export const createReferralLead = async (req, res) => {
  try {
    const dsaId = req.user?.id;
    const role = req.user?.role;

    if (!dsaId || role !== "DSA") {
      return res.status(403).json({
        success: false,
        message: "Only DSA can create referral leads",
      });
    }

    const {
      lead_name,
      contact_number,
      email,
      department,
      sub_category,
      notes,
    } = req.body;

    if (!lead_name || !contact_number || !department || !sub_category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 1️⃣ Get DSA referral RM (if any)
    const dsaRes = await pool.query(
      `SELECT referred_by_rm FROM tbl_registeredusers WHERE id = $1`,
      [dsaId],
    );

    const referralRMId = dsaRes.rows[0]?.referred_by_rm || null;

    // 2️⃣ Auto-assign RM (PRIMARY FIX)
    const rmRes = await pool.query(
      `
    SELECT id
    FROM tbl_registeredusers
    WHERE role = 'RM'
      AND (
        LOWER(department) = LOWER($1)
        OR LOWER(department) = LOWER(TRIM(TRAILING 's' FROM $1))
      )
      AND LOWER(sub_category) LIKE '%' || LOWER($2) || '%'
    ORDER BY id ASC
    LIMIT 1
  `,
      [department, sub_category],
    );

    const assignedRMId = rmRes.rows[0]?.id || null;

    if (!assignedRMId) {
      return res.status(400).json({
        success: false,
        message: "No RM available for selected department and category",
      });
    }

    // 3️⃣ Decide STATUS (🔥 IMPORTANT)
    let status = "INCOMING";

    if (referralRMId && referralRMId === assignedRMId) {
      status = "MY_REFERRAL";
    }

    // 3️⃣ OPTIONAL: Find Department Head (NO FAILURE)
    const deptHeadRes = await pool.query(
      `
      SELECT id
      FROM tbl_registeredusers
      WHERE role = 'DEPARTMENTHEAD'
        AND department = $1
      LIMIT 1
      `,
      [department],
    );

    const departmentHeadId = deptHeadRes.rows[0]?.id || null;

    // 4️⃣ Insert Referral Lead
    await pool.query(
      `
      INSERT INTO tbl_referral_leads
      (
        dsa_id,
        rm_id,
        assigned_rm_id,
        department_head_id,
        lead_name,
        contact_number,
        email,
        department,
        sub_category,
        notes,
        status
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
      `,
      [
        dsaId,
        referralRMId, // original RM (referral ownership)
        assignedRMId, // working RM (execution)
        departmentHeadId, // optional visibility
        lead_name,
        contact_number,
        email || null,
        department,
        sub_category,
        notes || null,
        status,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Referral lead created successfully",
    });
  } catch (error) {
    console.error("Create Referral Lead Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 CREATE DETAIL LEAD
export const createDetailLead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const {
      department,
      product_type,
      sub_category,
      client,
      meta = {},
      form_data,
    } = req.body;

    // 🔴 MINIMAL VALIDATION (DO NOT OVERVALIDATE)
    if (
      !department ||
      !product_type ||
      !sub_category ||
      !client?.name ||
      !client?.mobile ||
      !form_data
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload structure",
      });
    }

    // 1️⃣ Referral RM (DSA only)
    let referralRMId = null;
    if (role === "DSA") {
      const dsaRes = await pool.query(
        `SELECT referred_by_rm FROM tbl_registeredusers WHERE id = $1`,
        [userId],
      );
      referralRMId = dsaRes.rows[0]?.referred_by_rm || null;
    }

    // 2️⃣ Assign RM
    const rmRes = await pool.query(
      `
      SELECT id
      FROM tbl_registeredusers
      WHERE role = 'RM'
        AND (
        LOWER(department) = LOWER($1)
        OR LOWER(department) = LOWER(TRIM(TRAILING 's' FROM $1))
      )
        AND LOWER(sub_category) LIKE '%' || LOWER($2) || '%'
      ORDER BY id ASC
      LIMIT 1
      `,
      [department, sub_category],
    );

    const assignedRMId = rmRes.rows[0]?.id;
    if (!assignedRMId) {
      return res.status(400).json({
        success: false,
        message: "No RM available",
      });
    }

    // 3️⃣ Status
    let status = "INCOMING_LEAD";
    if (referralRMId && referralRMId === assignedRMId) {
      status = "MY_DETAIL_LEAD";
    }

    // 4️⃣ Department Head
    const deptHeadRes = await pool.query(
      `
      SELECT id
      FROM tbl_registeredusers
      WHERE role = 'DEPARTMENTHEAD'
        AND department = $1
      LIMIT 1
      `,
      [department],
    );

    const departmentHeadId = deptHeadRes.rows[0]?.id || null;

    // 5️⃣ Generate Lead ID
    const fy = getFinancialYear();
    const prefix = getSubCategoryPrefix(sub_category);
    const likePattern = `${prefix}/${fy}/%`;

    const seqRes = await pool.query(
      `
  SELECT COALESCE(
    MAX(
      CAST(SPLIT_PART(detail_lead_id, '/', 3) AS INTEGER)
    ), 0
  ) + 1 AS seq
  FROM tbl_detail_leads
  WHERE sub_category = $1
  AND detail_lead_id LIKE $2
  `,
      [sub_category, likePattern],
    );

    const seq = String(seqRes.rows[0].seq).padStart(4, "0");
    const detailLeadId = `${prefix}/${fy}/${seq}`;

    // 6️⃣ INSERT (RAW DATA STORED AS-IS)
    const leadInsert = await pool.query(
      `INSERT INTO tbl_detail_leads(
    detail_lead_id,
    dsa_id,
    rm_id,
    assigned_rm_id,
    department_head_id,
    department,
    product_type,
    sub_category,
    lead_name,
    contact_number,
    email,
    status,
    is_self_login,
    form_data)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  RETURNING id`,
      [
        detailLeadId,
        role === "DSA" ? userId : null,
        referralRMId,
        assignedRMId,
        departmentHeadId,
        department,
        product_type,
        sub_category,
        client.name,
        client.mobile,
        client.email || null,
        status,
        meta.is_self_login ?? false,
        form_data,
      ],
    );
    const leadDbId = leadInsert.rows[0]?.id;

    if (!leadDbId) {
      throw new Error("Lead insert failed: leadDbId is null");
    }

    await pool.query(
      `UPDATE tbl_detail_leads
      SET
        lead_status = 'NEW',
        rm_acceptance_status = 'PENDING',
        first_assigned_rm_id = assigned_rm_id,
        rm_assigned_at = NOW(),
        rm_action_deadline = NOW() + INTERVAL '3 days'
      WHERE id = $1
      `,
      [leadDbId],
    );

    const rulesRes = await pool.query(
      `
    SELECT
      r.document_key,
      r.document_label,
      r.is_mandatory
    FROM tbl_detail_lead_document_rules r
    WHERE LOWER(r.department) = LOWER($1)
      AND LOWER(r.product_type) = LOWER($2)
      AND LOWER(r.sub_category) = LOWER($3)
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
        `INSERT INTO tbl_detail_lead_required_documents
        (detail_lead_db_id, document_key, document_label, is_mandatory)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (detail_lead_db_id, document_key) DO NOTHING`,
        [leadDbId, r.document_key, r.document_label, r.is_mandatory],
      );
    }

    return res.status(201).json({
      success: true,
      detail_lead_id: detailLeadId,
    });
  } catch (err) {
    console.error("Create Detail Lead Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET DETAIL LEADS
export const getDetailLeads = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    const query = `
      SELECT
        dl.id,
        dl.detail_lead_id,
        dl.lead_name,
        dl.contact_number,
        dl.email,
        dl.is_self_login,
        dl.lead_status,
        dl.form_data,
        dl.department,
        dl.sub_category,
        dl.created_at,
        dl.disbursement_amount
      FROM tbl_detail_leads  dl
      WHERE dl.dsa_id = $1
      ORDER BY dl.created_at DESC
    `;

    const { rows } = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching referral leads:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching referral leads",
    });
  }
};

// 🔹 GET COMPLETED DETAIL LEADS
export const getCompletedDetailLeads = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User not found.",
      });
    }

    const query = `
      SELECT
        dl.id,
        dl.detail_lead_id,
        dl.lead_name,
        dl.contact_number,
        dl.is_self_login,
        dl.lead_status,
        dl.department,
        dl.product_type,

        dl.disbursement_amount,
        dl.gross_payout_amount,
        dl.gst_amount,
        dl.tds_amount,
        dl.net_payout_amount,
        dl.payout_date,
        dl.payout_id,
        dl.payment_mode,
        dl.transaction_reference_no,
        dl.invoice_number,
        dl.invoice_date,
        dl.policy_number,

        dl.created_at
      FROM tbl_detail_leads dl
      WHERE dl.dsa_id = $1
        AND dl.lead_status = 'COMPLETED'
      ORDER BY dl.created_at DESC
    `;

    const { rows } = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching completed detail leads:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching completed detail leads",
    });
  }
};

// 🔹 GET CLIENT DETAILS FROM REFERRAL + DETAIL LEADS (DSA)
export const getClientDetails = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User not found.",
      });
    }

    const query = `
      SELECT
        'REFERRAL LEAD' AS source,
        rl.ref_id AS lead_id,
        rl.lead_name,
        rl.contact_number,
        rl.email,
        rl.department,
        rl.sub_category,
        rl.created_at
      FROM tbl_referral_leads rl
      WHERE rl.dsa_id = $1

      UNION ALL

      SELECT
        'DETAIL LEAD' AS source,
        dl.detail_lead_id AS lead_id,
        dl.lead_name,
        dl.contact_number,
        dl.email,
        dl.department,
        dl.sub_category,
        dl.created_at
      FROM tbl_detail_leads dl
      WHERE dl.dsa_id = $1

      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching client details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching client details",
    });
  }
};

// 🔹 Upload Document API DSA
export const uploadDetailLeadDocument = async (req, res) => {
  const client = await pool.connect();
  try {
    const { leadDbId, metadata } = req.body;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files provided" });
    }

    // Parse the metadata sent from frontend
    const parsedMeta = JSON.parse(metadata);

    // 1. Verify Lead exists
    const leadRes = await client.query(
      `SELECT id, detail_lead_id, department FROM tbl_detail_leads WHERE detail_lead_id = $1`,
      [leadDbId],
    );

    if (leadRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    const {
      id: detailLeadDbId, // INTEGER
      detail_lead_id: leadCode, // HL/2025-26/0028
      department,
    } = leadRes.rows[0];

    await client.query("BEGIN"); // Start transaction

    // 2. Process each file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const meta = parsedMeta[i]; // This matches the file at the same index

      // Upload to S3
      const { url: fileUrl } = await compressAndUploadToS3(file, {
        userId,
        leadCode,
        department,
        document_key: meta.key,
      });
      // console.log("KEYYYYYYY ",fileUrl);

      // Insert into DB
      await client.query(
        `INSERT INTO tbl_detail_lead_documents 
        (detail_lead_id, document_key, document_label, file_url) 
        VALUES ($1, $2, $3, $4)`,
        [detailLeadDbId, meta.key, meta.label, fileUrl],
      );

      // Update Requirement status
      await client.query(
        `UPDATE tbl_detail_lead_required_documents 
         SET uploaded = true 
         WHERE detail_lead_db_id = $1 AND document_key = $2`,
        [detailLeadDbId, meta.key],
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: `${req.files.length} documents uploaded successfully`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Detailed Upload Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  } finally {
    client.release();
  }
};

export const getSignedUrl = async (req, res) => {
  try {
    const { documentId } = req.params;

    // 1️⃣ Get S3 key from DB
    const docRes = await pool.query(
      `
      SELECT file_url
      FROM tbl_detail_lead_documents
      WHERE id = $1
      `,
      [documentId],
    );

    if (!docRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const s3Key = docRes.rows[0].file_url;

    // 2️⃣ Generate signed URL
    const url = s3.getSignedUrl("getObject", {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      // Expires: 300, // 5 minutes
    });

    return res.json({
      success: true,
      url,
    });
  } catch (err) {
    console.error("Signed URL Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate download link",
    });
  }
};

//🔹 Fetch Pending & Uploaded Documents API
export const getAllDocuments = async (req, res) => {
  const leadDbId = req.params.leadId;

  const pending = await pool.query(
    `SELECT document_key, document_label FROM tbl_detail_lead_required_documents
     WHERE detail_lead_db_id = $1 AND uploaded = false`,
    [leadDbId],
  );

  const uploaded = await pool.query(
    `SELECT document_key, document_label, file_url, uploaded_at
     FROM tbl_detail_lead_documents WHERE detail_lead_id = $1`,
    [leadDbId],
  );

  res.json({
    success: true,
    pending: pending.rows,
    uploaded: uploaded.rows,
  });
};

// 🔹 GET ASSIGNED RM FOR DSA
export const getAssignedRMForDSA = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // 🔐 Only DSA can access this
    if (role !== "DSA") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const query = `
      SELECT
        rm.name,
        rm.mobile,
        rm.city,
        rm.department,
        rm.sub_category
      FROM tbl_registeredusers dsa
      LEFT JOIN tbl_registeredusers rm
        ON dsa.referred_by_rm = rm.id
      WHERE dsa.id = $1
        AND rm.role IN ('RM')
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [userId]);

    // 🟡 No RM assigned yet
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        assigned: false,
        rm: null,
        message: "No RM assigned yet",
      });
    }

    return res.status(200).json({
      success: true,
      assigned: true,
      rm: rows[0],
    });
  } catch (error) {
    console.error("Get Assigned RM Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 REFRESH TOKEN (Mobile - GET)
export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    // Must be: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token missing." });
    }

    const token = authHeader.split(" ")[1];

    // Verify existing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-sign token with extended expiry
    const newToken = jwt.sign(
      {
        id: decoded.id,
        adv_id: decoded.adv_id,
        email: decoded.email,
        role: decoded.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30h" },
    );

    return res.status(200).json({
      message: "Token refreshed successfully.",
      token: newToken,
      version: "1.0.0",
    });
  } catch (err) {
    console.error("Refresh Token Error:", err.message);

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// 🔹 VERIFY PAN USING SANDBOX API + UPDATE PROFILE
const formatName = (name = "") => {
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Verify Pan and Update Profile Name
export const verifyPanAndUpdateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { pan, name_as_per_pan, date_of_birth } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user." });
    }

    if (!pan || !name_as_per_pan || !date_of_birth) {
      return res.status(400).json({
        message: "PAN, Name and Date of Birth are required.",
      });
    }

    const token = await getSandboxToken();

    const response = await axios.post(
      `${process.env.SANDBOX_BASE_URL}/kyc/pan/verify`,
      {
        "@entity": "in.co.sandbox.kyc.pan_verification.request",
        pan: pan.toUpperCase(),
        name_as_per_pan,
        date_of_birth,
        consent: "Y",
        reason: "PAN Verification",
      },
      {
        headers: {
          Authorization: token,
          "x-api-key": process.env.SANDBOX_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const apiRes = response.data;

    if (apiRes.code !== 200 || !apiRes.data || apiRes.data.status !== "valid") {
      return res.status(400).json({
        message: "PAN verification failed.",
      });
    }

    if (
      apiRes.data.name_as_per_pan_match !== true ||
      apiRes.data.date_of_birth_match !== true
    ) {
      return res.status(400).json({
        message: "PAN details do not match with provided information.",
      });
    }

    // ✅ NEW: Update main user table name + pan + pan_verified
    const formattedName = formatName(name_as_per_pan);

    await pool.query(
      `
      UPDATE tbl_registeredusers
      SET 
        name = $1,
        pan = $2,
        pan_verified = true,
        updated_at = NOW()
      WHERE id = $3
      `,
      [formattedName, apiRes.data.pan, userId],
    );

    return res.status(200).json({
      message: "PAN verified successfully.",
      data: {
        pan: apiRes.data.pan,
        name: formattedName,
        status: apiRes.data.status,
        category: apiRes.data.category,
        aadhaar_seeding_status: apiRes.data.aadhaar_seeding_status,
      },
    });
  } catch (err) {
    console.error("PAN Verification Error:", err?.response?.data || err);

    return res.status(500).json({
      message: "PAN verification service failed.",
    });
  }
};

// Verify Bank Account using Penny Drop API
const normalizeName = (name = "") =>
  name
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const verifyBankPennyDrop = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bank_name, bank_account_number, ifsc_code } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!bank_account_number || !ifsc_code || !bank_name) {
      return res.status(400).json({
        message: "Bank name, account number and IFSC are required",
      });
    }

    // 🔹 Get user & PAN verification status first
    const { rows: users } = await pool.query(
      `SELECT name, pan_verified FROM tbl_registeredusers WHERE id = $1`,
      [userId],
    );

    if (!users.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🚨 NEW: Block bank verification if PAN not verified
    if (!users[0].pan_verified) {
      return res.status(400).json({
        message: "Please verify your PAN first before bank verification.",
      });
    }

    // 🔐 Get Sandbox JWT Token
    const token = await getSandboxToken();

    // 🔹 Call Sandbox Penny Drop API (GET)
    const response = await axios.get(
      `${process.env.SANDBOX_BASE_URL}/bank/${ifsc_code}/accounts/${bank_account_number}/verify`,
      {
        headers: {
          Authorization: token, // ⚠️ NO Bearer
          "x-api-key": process.env.SANDBOX_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );

    const apiRes = response.data;

    if (
      apiRes.code !== 200 ||
      !apiRes.data ||
      apiRes.data.account_exists !== true
    ) {
      return res.status(400).json({
        message: apiRes?.data?.message || "Bank verification failed",
      });
    }

    const profileName = normalizeName(users[0].name);
    const bankNameAtBank = normalizeName(apiRes.data.name_at_bank || "");

    // Split into tokens & remove very small words (like A, K, M)
    const profileTokens = profileName
      .split(" ")
      .filter((token) => token.length > 1);

    const bankTokens = bankNameAtBank
      .split(" ")
      .filter((token) => token.length > 1);

    if (!profileTokens.length || !bankTokens.length) {
      return res.status(400).json({
        message: "Unable to validate bank account holder name",
      });
    }

    // Count matching words
    const matchCount = profileTokens.filter((token) =>
      bankTokens.includes(token),
    ).length;

    // Require at least 1 meaningful word match
    const nameMatched = matchCount >= 1;

    if (!nameMatched) {
      return res.status(400).json({
        message: "Bank account holder name does not match profile name",
        account_holder_name: apiRes.data.name_at_bank,
      });
    }

    // 🔹 UPSERT into tbl_dsa_kyc
    await pool.query(
      `
      INSERT INTO tbl_dsa_kyc (
        user_id,
        bank_name,
        bank_account_number,
        ifsc_code,
        bank_verified,
        updated_at
      )
      VALUES ($1, $2, $3, $4, true, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        bank_name = EXCLUDED.bank_name,
        bank_account_number = EXCLUDED.bank_account_number,
        ifsc_code = EXCLUDED.ifsc_code,
        bank_verified = true,
        updated_at = NOW()
      `,
      [userId, bank_name, bank_account_number, ifsc_code],
    );

    return res.status(200).json({
      status: "success",
      message: apiRes.data.message,
      data: {
        bank_name,
        account_holder_name: apiRes.data.name_at_bank,
        utr: apiRes.data.utr,
        amount_deposited: apiRes.data.amount_deposited,
      },
    });
  } catch (error) {
    console.error(
      "Bank Verification Error:",
      error?.response?.data || error.message
    );

    // Sandbox API error response
    if (error.response) {
      return res.status(error.response.status || 500).json({
        status: "error",
        message:
          error.response.data?.message ||
          error.response.data?.error ||
          "Bank verification failed from provider",
        provider_error: error.response.data,
      });
    }

    // Timeout error
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        status: "error",
        message: "Bank verification service timed out. Please try again.",
      });
    }

    // Network / unknown error
    return res.status(500).json({
      status: "error",
      message: "Internal server error during bank verification",
      error: error.message,
    });
  }
};

// 🔹 Generate Aadhaar OTP
export const generateAadhaarOtp = async (req, res) => {
  try {
    const { aadhaar_number } = req.body;

    if (!aadhaar_number || aadhaar_number.length !== 12) {
      return res.status(400).json({
        message: "Valid 12-digit Aadhaar number is required",
      });
    }

    // 🔐 Step 1: Get JWT Token
    const token = await getSandboxToken();

    // 🔹 Step 2: Call Aadhaar OTP API
    const response = await axios.post(
      `${process.env.SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp`,
      {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        aadhaar_number,
        consent: "Y",
        reason: "Aadhaar Verification",
      },
      {
        headers: {
          Authorization: token, // ⚠️ NO Bearer
          "x-api-key": process.env.SANDBOX_API_KEY,
          "x-api-version": process.env.SANDBOX_API_VERSION,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const apiRes = response.data;

    if (apiRes.code !== 200) {
      return res.status(400).json({
        message: apiRes.message || "OTP generation failed",
      });
    }

    return res.status(200).json({
      status: "success",
      message: apiRes?.data?.message || "OTP sent successfully",
      reference_id: apiRes?.data?.reference_id,
      transaction_id: apiRes?.transaction_id,
    });
  } catch (error) {
    console.error("Aadhaar OTP Error:", error?.response?.data || error.message);

    return res.status(500).json({
      message: "Aadhaar OTP service failed",
    });
  }
};

// 🔹 Verify Aadhaar OTP
export const verifyAadhaarOtp = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { reference_id, otp, aadhaar_number } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!reference_id || !otp || !aadhaar_number) {
      return res.status(400).json({
        message: "Reference ID, OTP and Aadhaar number are required",
      });
    }

    // 🔐 Get Sandbox JWT
    const token = await getSandboxToken();

    // 🔹 Call Aadhaar Verify API
    const response = await axios.post(
      `${process.env.SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp/verify`,
      {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        reference_id: String(reference_id),
        otp: String(otp),
      },
      {
        headers: {
          Authorization: token, // ⚠️ NO Bearer
          "x-api-key": process.env.SANDBOX_API_KEY,
          "x-api-version": process.env.SANDBOX_API_VERSION,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    const apiRes = response.data;

    // 🔴 Handle invalid OTP / expired
    if (!apiRes?.data || apiRes.data.status !== "VALID") {
      return res.status(400).json({
        message: apiRes?.data?.message || "Aadhaar verification failed",
      });
    }

    // ✅ Aadhaar Verified → UPSERT in tbl_dsa_kyc
    await pool.query(
      `
      INSERT INTO tbl_dsa_kyc (
        user_id,
        aadhaar_number,
        aadhaar_verified,
        aadhaar_kyc_data,
        updated_at
      )
      VALUES ($1, $2, true, $3, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        aadhaar_number = EXCLUDED.aadhaar_number,
        aadhaar_verified = true,
        aadhaar_kyc_data = EXCLUDED.aadhaar_kyc_data,
        updated_at = NOW()
      `,
      [userId, aadhaar_number, JSON.stringify(apiRes.data)],
    );

    // 🔹 Optional: Check if full KYC complete
    // const { rows } = await pool.query(
    //   `SELECT bank_verified, aadhaar_verified, gst_verified
    //    FROM tbl_dsa_kyc WHERE user_id = $1`,
    //   [userId]
    // );

    // if (rows.length) {
    //   const { bank_verified, aadhaar_verified, gst_verified } = rows[0];

    //   if (bank_verified && aadhaar_verified) {
    //     await pool.query(
    //       `UPDATE tbl_dsa_kyc
    //        SET kyc_completed = true, updated_at = NOW()
    //        WHERE user_id = $1`,
    //       [userId]
    //     );
    //   }
    // }

    return res.status(200).json({
      status: "success",
      message: "Aadhaar verified successfully",
      data: {
        name: apiRes.data.name,
        gender: apiRes.data.gender,
        date_of_birth: apiRes.data.date_of_birth,
        aadhaar_verified: true,
        aadhaar_number: aadhaar_number,
      },
    });
  } catch (error) {
    console.error(
      "Aadhaar Verify Error:",
      error?.response?.data || error.message,
    );

    return res.status(500).json({
      message: "Aadhaar verification service failed",
    });
  }
};

// Verify GST using GSTIN Search API
export const verifyGST = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { gst_number } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!gst_number) {
      return res.status(400).json({
        message: "GST number is required",
      });
    }

    // 🔎 Basic GSTIN format validation (15 chars)
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstRegex.test(gst_number)) {
      return res.status(422).json({
        message: "Invalid GSTIN format",
      });
    }

    // 🔐 Get Sandbox JWT
    const token = await getSandboxToken();

    // 🔹 Call GST Search API
    const response = await axios.post(
      `${process.env.SANDBOX_BASE_URL}/gst/compliance/public/gstin/search`,
      {
        gstin: gst_number,
      },
      {
        headers: {
          Authorization: token, // ⚠️ NO Bearer
          "x-api-key": process.env.SANDBOX_API_KEY,
          "x-api-version": process.env.SANDBOX_API_VERSION,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    const apiRes = response.data;

    // ❌ No record found
    if (
      apiRes?.data?.status_cd === "0" ||
      apiRes?.data?.error?.error_cd === "FO8000"
    ) {
      return res.status(404).json({
        message: "No GST record found",
      });
    }

    const gstData = apiRes?.data?.data;

    if (!gstData) {
      return res.status(400).json({
        message: "GST verification failed",
      });
    }

    // ✅ GST Verified (Status should be Active ideally)
    const isActive = gstData.sts === "Active";

    await pool.query(
      `
      INSERT INTO tbl_dsa_kyc (
        user_id,
        gst_number,
        gst_verified,
        gst_kyc_data,
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        gst_number = EXCLUDED.gst_number,
        gst_verified = EXCLUDED.gst_verified,
        gst_kyc_data = EXCLUDED.gst_kyc_data,
        updated_at = NOW()
      `,
      [userId, gst_number, isActive, JSON.stringify(gstData)],
    );

    return res.status(200).json({
      message: "GST verified successfully",
      data: {
        gst_number: gst_number,
        legal_name: gstData.lgnm,
        trade_name: gstData.tradeNam,
        constitution: gstData.ctb,
        gst_status: gstData.sts,
        registration_date: gstData.rgdt,
        gst_verified: isActive,
      },
    });
  } catch (error) {
    console.error("GST Verify Error:", error?.response?.data || error.message);

    return res.status(500).json({
      message: "GST verification service failed",
    });
  }
};

// Verify PAN–Aadhaar Link Status
export const verifyPanAadhaarLink = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔹 Get PAN from tbl_registeredusers
    const { rows } = await pool.query(
      `SELECT pan, pan_verified FROM tbl_registeredusers WHERE id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Correct destructuring
    const { pan, pan_verified } = rows[0];

    if (!pan || pan === "NA") {
      return res.status(400).json({
        message: "PAN not available. Please update your PAN first",
      });
    }

    // 🔹 Get Aadhaar from tbl_dsa_kyc
    const { rows: kycRows } = await pool.query(
      `SELECT aadhaar_number FROM tbl_dsa_kyc WHERE user_id = $1`,
      [userId]
    );

    if (kycRows.length === 0 || !kycRows[0].aadhaar_number) {
      return res.status(404).json({
        message:
          "Aadhaar number not found. Please complete Aadhaar verification first.",
      });
    }

    const aadhaar = String(kycRows[0].aadhaar_number).trim();

    // 🔎 Validate PAN format
    const panRegex =
      /^[A-Z]{3}[PCFTGHLABJ]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}$/;

    if (!panRegex.test(pan.toUpperCase())) {
      return res.status(422).json({
        message: "Invalid PAN format",
      });
    }

    // 🔐 Get Sandbox JWT
    const token = await getSandboxToken();

    // 🔹 Call Sandbox PAN–Aadhaar Status API
    const response = await axios.post(
      `${process.env.SANDBOX_BASE_URL}/kyc/pan-aadhaar/status`,
      {
        "@entity": "in.co.sandbox.kyc.pan_aadhaar.status",
        pan: pan.toUpperCase(),
        aadhaar_number: aadhaar,
        consent: "Y",
        reason: "verify",
      },
      {
        headers: {
          Authorization: token,
          "x-api-key": process.env.SANDBOX_API_KEY,
          "x-api-version": process.env.SANDBOX_API_VERSION,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const apiRes = response.data;

    if (!apiRes?.data) {
      return res.status(400).json({
        message: "PAN-Aadhaar verification failed",
      });
    }

    const seedingStatus = apiRes.data.aadhaar_seeding_status;
    const isLinked = seedingStatus === "y";

    // 🔹 Update status in tbl_dsa_kyc
    await pool.query(
      `
      UPDATE tbl_dsa_kyc
      SET pan_aadhaar_linked = $1,
          updated_at = NOW()
      WHERE user_id = $2
      `,
      [isLinked, userId]
    );

    // 🔹 Optional: Check if full KYC complete
    const { rows: kycStatusRows } = await pool.query(
      `SELECT bank_verified, aadhaar_verified
       FROM tbl_dsa_kyc WHERE user_id = $1`,
      [userId]
    );

    if (kycStatusRows.length) {
      const { bank_verified, aadhaar_verified } = kycStatusRows[0];

      if (bank_verified && aadhaar_verified && pan_verified) {
        await pool.query(
          `UPDATE tbl_dsa_kyc
           SET kyc_completed = true, updated_at = NOW()
           WHERE user_id = $1`,
          [userId]
        );
      }
    }

    return res.status(200).json({
      message: apiRes.data.message,
      data: {
        pan_number: pan,
        pan_aadhaar_linked: isLinked,
      },
    });

  } catch (error) {
    console.error(
      "PAN-Aadhaar Verify Error:",
      error?.response?.data || error.message
    );

    return res.status(500).json({
      message: "PAN-Aadhaar verification service failed",
    });
  }
};