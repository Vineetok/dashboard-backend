import pool from "../../config/db.js";
import bcrypt from "bcrypt";

// 🔹 GET MY REFERRAL LEADS (RM ONLY)
export const getReferralLeads = async (req, res) => {
  try {
    const rmId = req.user?.id;
    const role = req.user?.role;

    if (!rmId || role !== "RM") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
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
        rl.status,
        rl.referral_lead_status,
        rl.rejection_note,
        rl.created_at,

        -- 🔹 DSA DETAILS
        dsa.id      AS dsa_id,
        dsa.name    AS dsa_name,
        dsa.adv_id  AS dsa_adv_id,
        dsa.mobile  AS dsa_mobile

      FROM tbl_referral_leads rl

      -- DSA who created lead
      JOIN tbl_registeredusers dsa
        ON dsa.id = rl.dsa_id

      -- RM who owns the referral
      JOIN tbl_registeredusers rm
        ON rm.id = rl.assigned_rm_id

      WHERE
        rl.assigned_rm_id = $1
        AND rl.status = 'MY_REFERRAL'
        AND LOWER(TRIM(rl.department)) = LOWER(TRIM(rm.department))
        AND LOWER(TRIM(rm.sub_category)) LIKE '%' || LOWER(TRIM(rl.sub_category)) || '%'

      ORDER BY rl.created_at DESC
    `;

    const { rows } = await pool.query(query, [rmId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      leads: rows,
    });
  } catch (error) {
    console.error("RM MY_REFERRAL Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
  
// 🔹 UPDATE REFERRAL LEAD STATUS (RM ONLY)
export const updateReferralLeadStatus = async (req, res) => {
  try {
    const rmId = req.user?.id;
    const role = req.user?.role;
    const { leadId } = req.params;
    const { referral_lead_status, rejection_note } = req.body;

    if (!rmId || role !== "RM") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!referral_lead_status) {
      return res.status(400).json({
        success: false,
        message: "referral_lead_status is required",
      });
    }

    // ✅ Allowed referral lead statuses
    const allowedStatuses = [
      "SUBMITTED",
      "IN_PROGRESS",
      "FOLLOW_UP",
      "COMPLETED",
      "REJECTED",
    ];

    if (!allowedStatuses.includes(referral_lead_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral_lead_status value",
      });
    }

    // If rejected → rejection note mandatory
    if (referral_lead_status === "REJECTED" && !rejection_note) {
      return res.status(400).json({
        success: false,
        message: "Rejection note is required when rejecting a lead",
      });
    }

    const query = ` UPDATE tbl_referral_leads
                    SET 
                    referral_lead_status = $1,
                    rejection_note = $2
                    WHERE id = $3
                    AND assigned_rm_id = $4
                    RETURNING id, ref_id, referral_lead_status, rejection_note;
                  `;

    const rejectionNoteValue =
      referral_lead_status === "REJECTED" ? rejection_note : null;

    const { rows } = await pool.query(query, [
      referral_lead_status,
      rejectionNoteValue,
      leadId,
      rmId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or not assigned to this RM",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Referral lead status updated successfully",
      lead: rows[0],
    });

  } catch (error) {
    console.error("Update Referral Lead Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET INCOMING ASSIGNED LEADS (RM ONLY)
export const getIncomingAssignedLeads = async (req, res) => {
  try {
    const rmId = req.user?.id;
    const role = req.user?.role;

    if (!rmId || role !== "RM") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 1️⃣ Get RM department (ONLY department needed)
    const rmResult = await pool.query(
      `
      SELECT department
      FROM tbl_registeredusers
      WHERE id = $1 AND role = 'RM'
      LIMIT 1
      `,
      [rmId],
    );

    if (rmResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "RM profile not found",
      });
    }

    const { department } = rmResult.rows[0];

    // 2️⃣ Fetch INCOMING leads assigned to this RM
    const query = `
      SELECT
        rl.id,
        rl.ref_id,
        rl.lead_name,
        rl.contact_number,
        rl.email,
        rl.department,
        rl.sub_category,
        rl.status,
        rl.rejection_note,
        rl.referral_lead_status,
        rl.created_at,

        rm.name AS rm_name,
        rm.mobile AS rm_mobile,

        -- 🔹 DSA DETAILS
        dsa.id     AS dsa_id,
        dsa.name   AS dsa_name,
        dsa.adv_id AS dsa_adv_id,
        dsa.mobile AS dsa_mobile
    
      FROM tbl_referral_leads rl

      JOIN tbl_registeredusers dsa
        ON dsa.id = rl.dsa_id

      JOIN tbl_registeredusers rm
        ON rm.id = rl.assigned_rm_id 

      WHERE
        rl.assigned_rm_id = $1
        AND rl.status = 'INCOMING'
        AND LOWER(TRIM(rl.department)) = LOWER(TRIM($2))

      ORDER BY rl.created_at DESC
    `;

    const { rows } = await pool.query(query, [rmId, department]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      leads: rows,
    });
  } catch (error) {
    console.error("Incoming Assigned Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET OUTGOING REFERRAL LEADS (RM ONLY): DSAs referred by THIS RM created a lead, but it got assigned to ANOTHER RM
export const getOutgoingReferralLeads = async (req, res) => {
  try {
    const rmId = req.user?.id;
    const role = req.user?.role;

    if (!rmId || role !== "RM") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
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
        rl.status,
        rl.referral_lead_status,
        rl.created_at,

        -- ✅ DSA who created the lead (your DSA)
        dsa.id      AS dsa_id,
        dsa.name    AS dsa_name,
        dsa.adv_id  AS dsa_adv_id,
        dsa.mobile  AS dsa_mobile,

        -- ✅ Referral RM (YOU)
        ref_rm.id   AS referral_rm_id,
        ref_rm.name AS referral_rm_name,

        -- ✅ Assigned RM (OTHER RM who will work on it)
        assigned_rm.id         AS assigned_rm_id,
        assigned_rm.name       AS assigned_rm_name,
        assigned_rm.sub_category AS assigned_rm_sub_category

      FROM tbl_referral_leads rl

      JOIN tbl_registeredusers dsa
        ON dsa.id = rl.dsa_id

      JOIN tbl_registeredusers ref_rm
        ON ref_rm.id = rl.rm_id

      JOIN tbl_registeredusers assigned_rm
        ON assigned_rm.id = rl.assigned_rm_id

      WHERE
        rl.rm_id = $1
        AND rl.assigned_rm_id IS NOT NULL
        AND rl.assigned_rm_id <> rl.rm_id
        AND rl.status = 'INCOMING'

      ORDER BY rl.created_at DESC
    `;

    const { rows } = await pool.query(query, [rmId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      leads: rows,
    });
  } catch (error) {
    console.error("Outgoing Referral Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET CUSTOMER DETAIL LEADS ASSIGNED TO RM (RM ONLY)
export const getIncomingCustomerDetailLeads = async (req, res) => {
  try {
    const rmId = req.user?.id;
    const role = req.user?.role;

    if (!rmId || role !== "RM") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    /* 1️⃣ GET RM DEPARTMENT */
    const rmResult = await pool.query(
      `
      SELECT department
      FROM tbl_registeredusers
      WHERE id = $1 AND role = 'RM'
      LIMIT 1
      `,
      [rmId],
    );

    if (rmResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "RM profile not found",
      });
    }

    const { department } = rmResult.rows[0];

    /* 2️⃣ FETCH CUSTOMER LEADS ASSIGNED TO RM */
    const query = `
      SELECT
        cl.id,
        cl.customer_detail_lead_id,
        cl.lead_name,
        cl.contact_number,
        cl.email,
        cl.department,
        cl.product_type,
        cl.sub_category,
        cl.status,
        cl.created_at,

        -- 🔹 CUSTOMER INFO
        c.id     AS customer_id,
        c.name   AS customer_name,
        c.mobile AS customer_mobile,
        c.email  AS customer_email

      FROM tbl_customer_detail_leads cl

      JOIN tbl_customers c
        ON c.id = cl.customer_id

      WHERE
        cl.rm_id = $1
        AND cl.status = 'INCOMING_LEAD'
        AND LOWER(TRIM(cl.department)) = LOWER(TRIM($2))

      ORDER BY cl.created_at DESC
    `;

    const { rows } = await pool.query(query, [rmId, department]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      leads: rows,
    });
  } catch (error) {
    console.error("Incoming Customer Detail Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET MY DETAIL LEADS (RM ONLY)
export const getMyDetailLeads = async (req, res) => {
  try {
    const rmId = req.user?.id;
    if (!rmId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const query = `
      SELECT
        dl.id,
        dl.detail_lead_id,
        dl.lead_name,
        dl.contact_number,
        dl.email,
        dl.department,
        dl.sub_category,
        dl.product_type,
        dl.lead_status,
        dl.rm_acceptance_status,
        dl.rm_action_deadline,
        dl.is_self_login,
        dl.created_at,

        -- FORM DATA
        dl.form_data,

        -- DSA DETAILS
        dsa.id     AS dsa_id,
        dsa.name   AS dsa_name,
        dsa.mobile AS dsa_mobile,

        -- RM (SELF)
        arm.id     AS rm_id,
        arm.name   AS rm_name,

        -- 📄 PENDING DOCUMENTS
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'document_key', rd.document_key,
                'document_label', rd.document_label,
                'is_mandatory', rd.is_mandatory
              )
            ),
            '[]'::json
          )
          FROM tbl_detail_lead_required_documents rd
          WHERE rd.detail_lead_db_id = dl.id
            AND rd.uploaded = false
        ) AS pending_documents,

        -- 📄 UPLOADED DOCUMENTS
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'document_key', d.document_key,
                'document_label', d.document_label,
                'file_url', d.file_url,
                'uploaded_at', d.uploaded_at
              )
            ),
            '[]'::json
          )
          FROM tbl_detail_lead_documents d
          WHERE d.detail_lead_id = dl.id
        ) AS uploaded_documents

      FROM tbl_detail_leads dl
      LEFT JOIN tbl_registeredusers dsa ON dsa.id = dl.dsa_id
      LEFT JOIN tbl_registeredusers arm ON arm.id = dl.assigned_rm_id

      WHERE
        dl.rm_id = $1
        AND dl.assigned_rm_id = $1
        AND dl.status = 'MY_DETAIL_LEAD'

      ORDER BY dl.created_at DESC
    `;

    const { rows } = await pool.query(query, [rmId]);

    return res.json({ success: true, count: rows.length, leads: rows });
  } catch (err) {
    console.error("My Detail Leads Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 RM UPDATE LEAD STATUS
export const updateDetailLeadStatus = async (req, res) => {
  try {
    const rmId = req.user?.id;
    // const role = req.user?.role;
    const leadId = req.params.leadId;
    const { lead_status } = req.body;

    // ✅ Allowed referral lead statuses
    const allowedStatuses = [
      "SUBMITTED",
      "IN_PROGRESS",
      "FOLLOW_UP",
      "SANCTIONED",
      "COMPLETED",
      "REJECTED",
    ];

    // 📌 Lead ID validation
    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "Lead ID missing",
      });
    }

    // 📌 Status validation
    if (!lead_status || !allowedStatuses.includes(lead_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead status",
      });
    }

    const result = await pool.query(
      `
      UPDATE tbl_detail_leads
      SET 
        lead_status = $1
      WHERE id = $2
        AND assigned_rm_id = $3
      RETURNING id, lead_status
      `,
      [lead_status, leadId, rmId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or not assigned to you",
      });
    }

    return res.json({
      success: true,
      message: "Lead status updated successfully",
      data: result.rows[0],
    });

  } catch (err) {
    console.error("Update Lead Status Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🔹 GET INCOMING DETAIL LEADS (RM ONLY)
export const getIncomingDetailLeads = async (req, res) => {
  try {
    const rmId = req.user?.id;
    if (!rmId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const query = `
      SELECT
        dl.id,
        dl.detail_lead_id,
        dl.lead_name,
        dl.contact_number,
        dl.email,
        dl.department,
        dl.product_type,
        dl.sub_category,
        dl.status,
        dl.lead_status,
        dl.rm_acceptance_status,
        dl.rm_action_deadline,
        dl.created_at,

        -- FORM DATA
        dl.form_data,

        -- DSA DETAILS
        dsa.id     AS dsa_id,
        dsa.name   AS dsa_name,
        dsa.mobile AS dsa_mobile,

        -- RM (SELF)
        arm.name   AS rm_name,

        -- REFERRAL RM
        rrm.id     AS referral_rm_id,
        rrm.name   AS referral_rm_name,

        -- ✅ UPLOADED DOCUMENTS
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', ld.id,
              'document_key', ld.document_key,
              'document_label', ld.document_label,
              'file_url', ld.file_url,
              'uploaded_at', ld.uploaded_at
            )
          ) FILTER (WHERE ld.id IS NOT NULL),
          '[]'
        ) AS uploaded_documents,
   
        -- ⏳ REQUIRED / PENDING DOCUMENTS
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', pd.id,
              'document_key', pd.document_key,
              'document_label', pd.document_label,
              'is_mandatory', pd.is_mandatory,
              'uploaded', pd.uploaded,
              'created_at', pd.created_at
            )
          ) FILTER (WHERE pd.id IS NOT NULL),
        '[]'
      ) AS pending_documents

      FROM tbl_detail_leads dl

      LEFT JOIN tbl_registeredusers dsa ON dsa.id = dl.dsa_id
      LEFT JOIN tbl_registeredusers rrm ON rrm.id = dl.rm_id
      LEFT JOIN tbl_registeredusers arm ON arm.id = dl.assigned_rm_id

      -- 🔗 Uploaded docs
      LEFT JOIN tbl_detail_lead_documents ld
      ON ld.detail_lead_id = dl.id

      -- 🔗 Pending docs
      LEFT JOIN tbl_detail_lead_required_documents pd
      ON pd.detail_lead_db_id = dl.id
      AND pd.uploaded = false

      WHERE
        dl.assigned_rm_id = $1
        AND dl.rm_id IS DISTINCT FROM $1
        AND dl.status = 'INCOMING_LEAD'
      
      GROUP BY
      dl.id,
      dsa.id,
      arm.name,
      rrm.id

      ORDER BY dl.created_at DESC
    `;

    const { rows } = await pool.query(query, [rmId]);

    return res.json({ success: true, count: rows.length, leads: rows });
  } catch (err) {
    console.error("Incoming Detail Leads Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 RM ACCEPT LEAD
export const acceptDetailLead = async (req, res) => {
  try {
    const rmId = req.user?.id;
    const role = req.user?.role;
    const leadId = req.params.id;

    if (!rmId || role !== "RM") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!leadId) {
      return res
        .status(400)
        .json({ success: false, message: "Lead ID missing" });
    }

    const result = await pool.query(
      `
      UPDATE tbl_detail_leads
      SET
        rm_acceptance_status = 'ACCEPTED',
        lead_status = 'IN_PROGRESS',
        rm_accepted_at = NOW()
      WHERE id = $1
        AND assigned_rm_id = $2
        AND rm_acceptance_status = 'PENDING'
      RETURNING id
      `,
      [leadId, rmId],
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Lead not found or already actioned",
      });
    }

    return res.json({
      success: true,
      message: "Lead accepted successfully",
    });
  } catch (err) {
    console.error("Accept Lead Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 RM NOT ACCEPT LEAD
export const rejectDetailLead = async (req, res) => {
  try {
    const rmId = req.user?.id;
    const role = req.user?.role;
    const leadId = req.params.id;

    if (!rmId || role !== "RM") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!leadId) {
      return res
        .status(400)
        .json({ success: false, message: "Lead ID missing" });
    }

    const result = await pool.query(
      `
      UPDATE tbl_detail_leads
      SET
        rm_acceptance_status = 'NOT_ACCEPTED',
        lead_status = 'NEW'
      WHERE id = $1
        AND assigned_rm_id = $2
        AND rm_acceptance_status = 'PENDING'
      RETURNING id
      `,
      [leadId, rmId],
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Lead not found or already actioned",
      });
    }

    return res.json({
      success: true,
      message: "Lead marked as not accepted",
    });
  } catch (err) {
    console.error("Reject Lead Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 GET OUTGOING DETAIL LEADS (RM ONLY)
export const getOutgoingDetailLead = async (req, res) => {
  try {
    const rmId = req.user?.id;
    const role = req.user?.role;

    if (!rmId || role !== "RM") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 🔹 Fetch outgoing detail leads
    const query = `
      SELECT
        dl.id,
        dl.detail_lead_id,
        dl.lead_name,
        dl.contact_number,
        dl.email,
        dl.department,
        dl.product_type,
        dl.sub_category,
        dl.lead_status,
        dl.created_at,
        dl.rm_acceptance_status,
        
        -- 🔹 DSA DETAILS
        dsa.id     AS dsa_id,
        dsa.name   AS dsa_name,
        dsa.adv_id AS dsa_adv_id,

        -- 🔹 Assigned RM DETAILS
        arm.id     AS assigned_rm_id,
        arm.name   AS assigned_rm_name,
        arm.mobile AS assigned_rm_mobile,

        -- ✅ UPLOADED DOCUMENTS
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', ud.id,
              'document_key', ud.document_key,
              'document_label', ud.document_label,
              'file_url', ud.file_url,
              'uploaded_at', ud.uploaded_at
            )
          ) FILTER (WHERE ud.id IS NOT NULL),
          '[]'
        ) AS uploaded_documents,

        -- ⏳ PENDING / REQUIRED DOCUMENTS
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', rd.id,
              'document_key', rd.document_key,
              'document_label', rd.document_label,
              'is_mandatory', rd.is_mandatory,
              'uploaded', rd.uploaded,
              'created_at', rd.created_at
            )
          ) FILTER (WHERE rd.id IS NOT NULL),
          '[]'
        ) AS pending_documents

      FROM tbl_detail_leads dl

      JOIN tbl_registeredusers arm
        ON arm.id = dl.assigned_rm_id

      LEFT JOIN tbl_registeredusers dsa
        ON dsa.id = dl.dsa_id

      -- 🔗 Uploaded docs
      LEFT JOIN tbl_detail_lead_documents ud
        ON ud.detail_lead_id = dl.id

      -- 🔗 Required / Pending docs
      LEFT JOIN tbl_detail_lead_required_documents rd
        ON rd.detail_lead_db_id = dl.id
        AND rd.uploaded = false

      WHERE
        dl.rm_id = $1
        AND dl.assigned_rm_id IS NOT NULL
        AND dl.assigned_rm_id <> $1

      GROUP BY
        dsa.id,
        dl.id,
        arm.id

      ORDER BY dl.created_at DESC;
    `;

    const { rows } = await pool.query(query, [rmId]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      leads: rows,
    });
  } catch (error) {
    console.error("Get Outgoing Detail Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET DSAs REGISTERED VIA RM REFERRAL CODE
export const getReferredDSAs = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (!["RM"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    let query = `
      SELECT
        dsa.id,
        dsa.adv_id,
        dsa.name,
        dsa.email,
        dsa.mobile,
        dsa.city,
        dsa.head,
        dsa.category,
        dsa.date_joined,

        rm.id AS rm_id,
        rm.name AS rm_name,
        rm.referral_code AS rm_referral_code

      FROM tbl_registeredusers dsa
      JOIN tbl_registeredusers rm
        ON dsa.referred_by_rm = rm.id

      WHERE dsa.role = 'DSA'
    `;

    const params = [];

    // 🔐 RM sees only their DSAs
    if (role === "RM") {
      query += ` AND dsa.referred_by_rm = $1 `;
      params.push(userId);
    }

    query += ` ORDER BY dsa.date_joined DESC `;

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      dsas: rows,
    });
  } catch (error) {
    console.error("Get Referred DSAs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET LEAD MANAGER PROFILE
export const getRMProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // 🔐 Role check
    if (!userRole || userRole !== "RM") {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const query = `
      SELECT 
        id,
        adv_id,
        name,
        email,
        mobile,
        role,
        department,
        sub_category,
        referral_code,
        city,
        date_joined,
        updated_at
      FROM tbl_registeredusers
      WHERE id = $1 AND role = 'RM'
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "RM profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      user: rows[0],
    });
  } catch (error) {
    console.error("Department Head Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const updateRMProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userRole || userRole !== "RM") {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const { email, mobile, password } = req.body;

    if (!email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Email and Mobile are required.",
      });
    }

    let hashedPassword = null;

    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = `
      UPDATE tbl_registeredusers
      SET 
        email = $1,
        mobile = $2,
        ${hashedPassword ? "password = $3," : ""}
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${hashedPassword ? "$4" : "$3"}
      RETURNING id, name, email, mobile, role;
    `;

    const params = hashedPassword
      ? [email, mobile, hashedPassword, userId]
      : [email, mobile, userId];

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Update Admin Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 FETCH CUSTOMER DETAIL LEAD DOCUMENTS (PENDING & UPLOADED)
export const getCustomerDetailLeadDocuments = async (req, res) => {
  try {
    const leadDbId = req.params.leadId;
    const role = req.user.role;

    if (!["RM", "DEPARTMENTHEAD"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!leadDbId) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }

    /* 1️⃣ PENDING DOCUMENTS */
    const pending = await pool.query(
      `
      SELECT
        document_key,
        document_label,
        is_mandatory
      FROM tbl_customer_detail_lead_required_documents
      WHERE customer_detail_lead_db_id = $1
        AND uploaded = false
      ORDER BY created_at ASC
      `,
      [leadDbId],
    );

    /* 2️⃣ UPLOADED DOCUMENTS */
    const uploaded = await pool.query(
      `
      SELECT
        document_key,
        document_label,
        file_url,
        uploaded_at
      FROM tbl_customer_detail_lead_documents
      WHERE customer_detail_lead_id = $1
      ORDER BY uploaded_at DESC
      `,
      [leadDbId],
    );

    return res.status(200).json({
      success: true,
      pending: pending.rows,
      uploaded: uploaded.rows,
    });
  } catch (error) {
    console.error("Get Customer Documents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
