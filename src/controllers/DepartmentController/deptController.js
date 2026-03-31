import pool from "../../config/db.js";
import bcrypt from "bcrypt";

// 🔹 GET DEPARTMENT HEAD PROFILE
export const getDeptHeadProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // 🔐 Role check
    if (!userRole || userRole !== "DEPARTMENTHEAD") {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const query = `
      SELECT 
        name,
        email,
        mobile,
        role,
        department,
        sub_category,
        city,
        date_joined,
        updated_at
      FROM tbl_registeredusers
      WHERE id = $1 AND role = 'DEPARTMENTHEAD'
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department Head profile not found.",
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

export const updateDepartmentProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userRole || userRole !== "DEPARTMENTHEAD") {
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

// 🔹 GET RM LIST UNDER DEPARTMENT HEAD
export const getRMList = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // 🔐 Only Department Head allowed
    if (!userRole || userRole !== "DEPARTMENTHEAD") {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // 1️⃣ Get department of logged-in Department Head
    const deptQuery = `
      SELECT department
      FROM tbl_registeredusers
      WHERE id = $1 AND role = 'DEPARTMENTHEAD'
      LIMIT 1;
    `;

    const deptResult = await pool.query(deptQuery, [userId]);

    if (deptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department Head not found.",
      });
    }

    const department = deptResult.rows[0].department;

    // 2️⃣ Get RM list under same department
    const rmQuery = `
      SELECT
        id,
        name,
        email,
        mobile,
        department,
        sub_category,
        city,
        date_joined
      FROM tbl_registeredusers
      WHERE role = 'RM'
        AND department = $1
      ORDER BY date_joined DESC;
    `;

    const { rows } = await pool.query(rmQuery, [department]);

    return res.status(200).json({
      success: true,
      message: "RM list fetched successfully.",
      total: rows.length,
      rms: rows,
    });
  } catch (error) {
    console.error("Get RM List Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 GET DEPARTMENT-WISE REFERRAL LEADS
export const getDepartmentHeadReferralLeads = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || role !== "DEPARTMENTHEAD") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 1️⃣ Get Department of Department Head
    const deptRes = await pool.query(
      `
      SELECT department
      FROM tbl_registeredusers
      WHERE id = $1
      `,
      [userId],
    );

    if (deptRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Department not found",
      });
    }

    const department = deptRes.rows[0].department;

    // 2️⃣ Fetch Leads of that Department
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
        rl.created_at,

        dsa.id     AS dsa_id,
        dsa.name   AS dsa_name,
        dsa.adv_id AS dsa_adv_id,
        dsa.mobile AS dsa_mobile,

        assigned_rm.id   AS assigned_rm_id,
        assigned_rm.name AS assigned_rm_name,
        assigned_rm.department AS assigned_rm_department,
        assigned_rm.sub_category AS assigned_rm_sub_category

      FROM tbl_referral_leads rl

      JOIN tbl_registeredusers dsa
        ON dsa.id = rl.dsa_id

      JOIN tbl_registeredusers assigned_rm
        ON assigned_rm.id = rl.assigned_rm_id

      WHERE assigned_rm.department = $1
      ORDER BY rl.created_at DESC;
        `;

    const { rows } = await pool.query(query, [department]);

    return res.status(200).json({
      success: true,
      department,
      count: rows.length,
      leads: rows,
    });
  } catch (error) {
    console.error("Department Head Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET DEPARTMENT-WISE CUSTOMER DETAIL LEADS (DEPARTMENT HEAD)
export const getDepartmentHeadCustomerDetailLeads = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || role !== "DEPARTMENTHEAD") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 1️⃣ Get Department of Department Head
    const deptRes = await pool.query(
      `
      SELECT department
      FROM tbl_registeredusers
      WHERE id = $1
      `,
      [userId],
    );

    if (deptRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Department not found",
      });
    }

    const department = deptRes.rows[0].department;

    // 2️⃣ Fetch Customer Detail Leads of that Department
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

        -- 🔹 CUSTOMER DETAILS
        c.id     AS customer_id,
        c.name   AS customer_name,
        c.mobile AS customer_mobile,
        c.email  AS customer_email,

        -- 🔹 ASSIGNED RM DETAILS
        rm.id     AS assigned_rm_id,
        rm.name   AS assigned_rm_name,
        rm.department AS assigned_rm_department,
        rm.sub_category AS assigned_rm_sub_category

      FROM tbl_customer_detail_leads cl

      JOIN tbl_customers c
        ON c.id = cl.customer_id

      LEFT JOIN tbl_registeredusers rm
        ON rm.id = cl.rm_id

      WHERE
        LOWER(TRIM(cl.department)) = LOWER(TRIM($1))

      ORDER BY cl.created_at DESC
    `;

    const { rows } = await pool.query(query, [department]);

    return res.status(200).json({
      success: true,
      department,
      count: rows.length,
      leads: rows,
    });
  } catch (error) {
    console.error("Department Head Customer Detail Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET DETAIL LEADS FOR DEPARTMENT HEAD (WITH SLA + PAGINATION)
export const getDepartmentHeadDetailLeads = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || role !== "DEPARTMENTHEAD") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 🔹 Pagination from frontend
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    // 🔹 Get department
    const deptRes = await pool.query(
      `SELECT department FROM tbl_registeredusers WHERE id = $1`,
      [userId],
    );

    if (!deptRes.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Department not found",
      });
    }

    const department = deptRes.rows[0].department;

    // 🔹 Total count
    const totalRes = await pool.query(
      `
      SELECT COUNT(*) 
      FROM tbl_detail_leads
      WHERE department = $1
      `,
      [department],
    );

    const totalRecords = Number(totalRes.rows[0].count);

    // 🔹 Main query
    const query = `
      SELECT
        dl.id,
        dl.detail_lead_id,
        dl.lead_name,
        dl.contact_number,
        dl.email,
        dl.department,
        dl.product_type,
        dl.lead_status,
        dl.is_self_login,
        dl.form_data,
        dl.rm_acceptance_status,
        dl.created_at,

        -- 🔹 SLA LOGIC
        CASE
          WHEN dl.rm_action_deadline IS NOT NULL
               AND NOW() > dl.rm_action_deadline
          THEN true
          ELSE false
        END AS is_deadline_breached,

        dl.rm_action_deadline,

        dsa.id   AS dsa_id,
        dsa.adv_id AS dsa_adv_id,
        dsa.name AS dsa_name,
        dsa.mobile AS dsa_mobile,

        -- 🔹 RM HISTORY
        jsonb_build_object(
          'first_rm', jsonb_build_object(
            'id', first_rm.id,
            'name', first_rm.name
          ),
          'previous_rm', jsonb_build_object(
            'id', prev_rm.id,
            'name', prev_rm.name
          ),
          'current_rm', jsonb_build_object(
            'id', curr_rm.id,
            'name', curr_rm.name
          ),
          'assigned_at', dl.rm_assigned_at,
          'accepted_at', dl.rm_accepted_at
        ) AS rm_history,

        -- 🔹 UPLOADED DOCUMENTS (WITH VIEW OPTION)
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'document_key', drd.document_key,
              'document_label', drd.document_label,
              'file_url', dld.file_url,
              'uploaded_at', dld.uploaded_at
            )
          ) FILTER (
            WHERE drd.uploaded = true AND dld.file_url IS NOT NULL
          ),
          '[]'
        ) AS uploaded_documents,

        -- 🔹 PENDING MANDATORY DOCUMENTS
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'document_key', drd.document_key,
              'document_label', drd.document_label
            )
          ) FILTER (
            WHERE drd.is_mandatory = true AND drd.uploaded = false
          ),
          '[]'
        ) AS pending_documents,


        -- 🔹 DOCUMENT SUMMARY (FAST)
        COUNT(DISTINCT drd.id) FILTER (WHERE drd.is_mandatory = true) AS total_mandatory_docs,
        COUNT(DISTINCT drd.id) FILTER (WHERE drd.is_mandatory = true AND drd.uploaded = true) AS uploaded_mandatory_docs

      FROM tbl_detail_leads dl

      LEFT JOIN tbl_registeredusers first_rm ON first_rm.id = dl.first_assigned_rm_id
      LEFT JOIN tbl_registeredusers prev_rm ON prev_rm.id = dl.previous_rm_id
      LEFT JOIN tbl_registeredusers curr_rm ON curr_rm.id = dl.assigned_rm_id
      LEFT JOIN tbl_registeredusers dsa ON dsa.id = dl.dsa_id
      LEFT JOIN tbl_detail_lead_required_documents drd ON drd.detail_lead_db_id = dl.id
      LEFT JOIN tbl_detail_lead_documents dld ON dld.detail_lead_id = dl.id AND dld.document_key = drd.document_key

      WHERE dl.department = $1

      GROUP BY
        dl.id,
        first_rm.id,
        prev_rm.id,
        curr_rm.id,
        dsa.id

      ORDER BY dl.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await pool.query(query, [department, limit, offset]);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
      leads: rows,
    });
  } catch (error) {
    console.error("Department Head Detail Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET ELIGIBLE RMs FOR REASSIGNMENT (DEPARTMENT MATCH)
export const getEligibleRMsForReassign = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { detailLeadId } = req.params;

    if (!userId || role !== "DEPARTMENTHEAD") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 🔹 Get lead department
    const leadRes = await pool.query(
      `
      SELECT department, assigned_rm_id
      FROM tbl_detail_leads
      WHERE id = $1
      `,
      [detailLeadId],
    );

    if (!leadRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Detail lead not found",
      });
    }

    const { department, assigned_rm_id } = leadRes.rows[0];

    // 🔹 Fetch RMs from SAME department
    const rmRes = await pool.query(
      `
      SELECT
        id,
        name
      FROM tbl_registeredusers
      WHERE role = 'RM'
        AND department = $1
        AND id <> COALESCE($2, 0)
      ORDER BY name ASC
      `,
      [department, assigned_rm_id],
    );

    return res.status(200).json({
      success: true,
      rms: rmRes.rows,
    });
  } catch (error) {
    console.error("Get Eligible RMs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 REASSIGN RM TO DETAIL LEAD (DEPARTMENT HEAD ONLY)
export const reAssignDetailLeadRM = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { detailLeadId, newRmId } = req.body;

    if (!userId || role !== "DEPARTMENTHEAD") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!detailLeadId || !newRmId) {
      return res.status(400).json({
        success: false,
        message: "detailLeadId and newRmId are required",
      });
    }

    // 🔹 Fetch lead info
    const leadRes = await pool.query(
      `
      SELECT
        assigned_rm_id,
        first_assigned_rm_id,
        department
      FROM tbl_detail_leads
      WHERE id = $1
      `,
      [detailLeadId]
    );

    if (!leadRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Detail lead not found",
      });
    }

    const { assigned_rm_id, first_assigned_rm_id, department } =
      leadRes.rows[0];

    // 🔹 Validate RM belongs to same department
    const rmRes = await pool.query(
      `
      SELECT id
      FROM tbl_registeredusers
      WHERE id = $1
        AND role = 'RM'
        AND department = $2
      `,
      [newRmId, department]
    );

    if (!rmRes.rows.length) {
      return res.status(400).json({
        success: false,
        message: "RM does not belong to the same department",
      });
    }

    // 🔹 Update lead (history-safe)
    await pool.query(
      `
      UPDATE tbl_detail_leads
      SET
        first_assigned_rm_id = COALESCE(first_assigned_rm_id, assigned_rm_id),
        previous_rm_id = assigned_rm_id,
        assigned_rm_id = $1,
        rm_assigned_at = NOW(),
        rm_accepted_at = NULL,
        rm_acceptance_status = 'PENDING',
        rm_action_deadline = NOW() + INTERVAL '24 HOURS'
      WHERE id = $2
      `,
      [newRmId, detailLeadId]
    );

    return res.status(200).json({
      success: true,
      message: "RM reassigned successfully",
    });
  } catch (error) {
    console.error("Reassign RM Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

