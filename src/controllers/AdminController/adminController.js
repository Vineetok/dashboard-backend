import pool from "../../config/db.js";
import bcrypt from "bcrypt";
import { Parser } from "json2csv";

// 🔹 GET DSA LIST
export const getDSAList = async (req, res) => {
  const userRole = req.user?.role;

  // 2. Security Check: Ensure role exists AND matches the required admin value
  if (!userRole || userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  try {
    const query = `
      SELECT 
        id,
        adv_id,
        name,
        email,
        mobile,
        pan,
        city,
        head,
        category,
        role,
        date_joined,
        updated_at
      FROM tbl_registeredusers
      WHERE role = 'DSA'
      ORDER BY id DESC;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: rows.length,
      dsalist: rows,
    });
  } catch (err) {
    console.error("Error fetching DSA list:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 GET DSA LIST
export const getALLData = async (req, res) => {
  const userRole = req.user?.role;

  // 2. Security Check: Ensure role exists AND matches the required admin value
  if (!userRole || userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  try {
    const query = `
      SELECT * FROM tbl_registeredusers ORDER BY id ASC;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: rows.length,
      dsalist: rows,
    });
  } catch (err) {
    console.error("Error fetching All Data list:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 GET OTHER ROLE LIST
export const getRoleList = async (req, res) => {
  const userRole = req.user?.role;

  // 2. Security Check: Ensure role exists AND matches the required admin value
  if (!userRole || userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  try {
    const query = `
  SELECT 
    id,
    name,
    email,
    mobile,
    city,
    date_joined,
    updated_at,
    role,
    department,
    sub_category
  FROM tbl_registeredusers
  WHERE role IN ('RM', 'PP', 'HR', 'DIRECTOR', 'DEPARTMENTHEAD', 'ADMIN')
  ORDER BY id ASC;
`;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: rows.length,
      rolelist: rows,
    });
  } catch (err) {
    console.error("Error fetching DSA list:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 EDIT OTHER ROLE DETAILS
export const updateRoleUser = async (req, res) => {
  const userRole = req.user?.role;

  // 🔐 Security Check
  if (!userRole || userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  try {
    const { id } = req.params;
    const { name, email, mobile, city, role, department, sub_category } =
      req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // 🧩 Check if user exists
    const existingUser = await pool.query(
      "SELECT id FROM tbl_registeredusers WHERE id = $1",
      [id],
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 🧩 Prepare dynamic update
    const updates = [];
    const values = [];
    let idx = 1;

    if (name) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${idx++}`);
      values.push(email);
    }
    if (mobile) {
      updates.push(`mobile = $${idx++}`);
      values.push(mobile);
    }
    if (city) {
      updates.push(`city = $${idx++}`);
      values.push(city);
    }
    if (role) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if (department) {
      updates.push(`department = $${idx++}`);
      values.push(department);
    }
    if (sub_category) {
      updates.push(`sub_category = $${idx++}`);
      values.push(sub_category);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update.",
      });
    }

    // 🧩 Execute update
    const query = `
      UPDATE tbl_registeredusers
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${idx} AND role <> 'DSA'
      RETURNING 
        id,
        name,
        email,
        mobile,
        city,
        role,
        department,
        sub_category,
        updated_at;
    `;

    values.push(id);

    const { rows } = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Error updating role user:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 SEARCH DSA LIST
export const searchDSA = async (req, res) => {
  const userRole = req.user?.role;

  if (!userRole || userRole !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  try {
    let { search = "" } = req.query;
    const normalizedSearch = `%${search
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")}%`;

    const query = `
      SELECT 
        id,
        adv_id,
        name,
        email,
        mobile,
        pan,
        city,
        head,
        category,
        role,
        date_joined,
        updated_at
      FROM tbl_registeredusers
      WHERE role = 'DSA'
      AND (
        REPLACE(LOWER(adv_id), '_', '') LIKE $1 OR
        LOWER(name) LIKE $1 OR
        LOWER(email) LIKE $1 OR
        LOWER(mobile) LIKE $1
      )
      ORDER BY id ASC;
    `;

    const { rows } = await pool.query(query, [normalizedSearch]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      dsalist: rows,
    });
  } catch (err) {
    console.error("Error fetching DSA list:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 UPDATE DSA
export const updateDSAUser = async (req, res) => {
  const adminRole = req.user?.role;

  // Only ADMIN can edit users
  if (!adminRole || adminRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  const { id } = req.params;

  const {
    name,
    email,
    mobile,
    pan,
    city,
    password,
    role, // admin can change role
  } = req.body;

  try {
    if (!name || !email || !mobile || !pan || !city || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, Email, Mobile, PAN, City & Role are required.",
      });
    }

    let hashedPassword = null;

    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = `
      UPDATE tbl_registeredusers
      SET 
        name = $1,
        email = $2,
        mobile = $3,
        pan = $4,
        city = $5,
        role = $6,
        updated_at = CURRENT_TIMESTAMP
        ${hashedPassword ? ", password = $7" : ""}
      WHERE id = ${hashedPassword ? "$8" : "$7"}
      RETURNING 
        id,
        adv_id,
        name,
        email,
        mobile,
        pan,
        city,
        role,
        date_joined,
        updated_at;
    `;

    const params = hashedPassword
      ? [name, email, mobile, pan, city, role, hashedPassword, id]
      : [name, email, mobile, pan, city, role, id];

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: rows[0],
    });
  } catch (error) {
    console.error("Update DSA Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// 🔹 DELETE DSA
export const deleteDSAUser = async (req, res) => {
  const adminRole = req.user?.role;

  if (!adminRole || adminRole !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  const { id } = req.params;

  try {
    const query = `
      DELETE FROM tbl_registeredusers 
      WHERE id = $1 
      RETURNING id, name, email
    `;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or already deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      deletedUser: rows[0],
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 GET CONTACT US ENQUIRY
export const getContactUs = async (req, res) => {
  try {
    const userRole = req.user?.role;

    // 2. Security Check: Ensure role exists AND matches the required admin value
    if (!userRole || (userRole !== "ADMIN" && userRole !== "HR")) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const query = `
      SELECT 
        enquiry_id,
        name,
        email,
        phone,
        message,
        entry_time,
        status
      FROM tbl_contactus
      ORDER BY entry_time ASC; 
    `;

    const countQuery = `
      SELECT COUNT(*) AS open_count
      FROM tbl_contactus
      WHERE status = 'Open';
    `;

    const { rows } = await pool.query(query);
    const countResult = await pool.query(countQuery);

    return res.status(200).json({
      success: true,
      count: rows.length,
      openCount: countResult.rows[0].open_count,
      contactus: rows,
    });
  } catch (error) {
    console.error("Error fetching contact data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 UPDATE CONTACT US STATUS (Close Inquiry)
export const updateContactStatus = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const { enquiry_id } = req.params;
    const { status } = req.body; // expecting "CLOSED"

    if (!userRole || (userRole !== "ADMIN" && userRole !== "HR")) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    if (!enquiry_id) {
      return res.status(400).json({
        success: false,
        message: "Enquiry ID is required",
      });
    }

    const updateQuery = `
      UPDATE tbl_contactus
      SET status = $1
      WHERE enquiry_id = $2
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [status, enquiry_id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      updated: rows[0],
    });
  } catch (error) {
    console.error("Error updating contact status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 GET ADMIN PROFILE
export const getAdminProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userRole || (userRole !== "ADMIN" && userRole !== "HR")) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const query = `
      SELECT id, name, email, mobile, role
      FROM tbl_registeredusers
      WHERE id = $1 AND (role = 'ADMIN' OR role = 'HR')
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// 🔹 UPDATE ADMIN PROFILE
export const updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userRole || userRole !== "ADMIN") {
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

// 🔹 GET ALL TICKET
export const getAllTickets = async (req, res) => {
  const role = req.user?.role;

  if (!role || role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  try {
    const query = `
      SELECT 
        id,
        ticket_id,
        user_id,
        name,
        email,
        mobile,
        category,
        subject,
        description,
        status,
        admin_id,
        admin_solution,
        solved_at,
        created_at,
        updated_at
      FROM tbl_support_tickets
      ORDER BY created_at DESC;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: rows.length,
      tickets: rows,
    });
  } catch (err) {
    console.error("Error fetching tickets:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 SOLVE TICKET
export const solveTicket = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const ticketId = req.params.id;
    const { solution } = req.body;

    if (!adminId)
      return res
        .status(401)
        .json({ message: "Unauthorized. Admin not found." });

    if (!solution)
      return res.status(400).json({ message: "Solution message is required." });

    const updateQuery = `
      UPDATE tbl_support_tickets
      SET 
        admin_solution = $1,
        admin_id = $2,
        status = 'Closed',
        solved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [
      solution,
      adminId,
      ticketId,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Ticket not found." });

    return res.status(200).json({
      message: "Ticket resolved successfully.",
      ticket: rows[0],
    });
  } catch (error) {
    console.error("Solve Ticket Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 🔹 GET UNASSIGNED DSAs (ADMIN ONLY)
export const getUnassignedDSAs = async (req, res) => {
  const role = req.user?.role;

  if (!role || role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  const query = `
    SELECT id, adv_id, name, email, mobile, city, head, category
    FROM tbl_registeredusers
    WHERE role = 'DSA'
      AND referred_by_rm IS NULL
    ORDER BY date_joined DESC;
  `;

  const { rows } = await pool.query(query);

  res.json({
    success: true,
    count: rows.length,
    dsas: rows,
  });
};

// 🔹 GET RM LIST (ADMIN ONLY)
export const getRMList = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const query = `
      SELECT
        id, 
        name,
        department,
        sub_category
      FROM tbl_registeredusers
      WHERE role IN ('RM')
      ORDER BY name ASC;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: rows.length,
      rms: rows,
    });
  } catch (error) {
    console.error("Get RM List Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 ASSIGN DSA TO RM (ADMIN ONLY)
export const assignDSAToRM = async (req, res) => {
  const role = req.user?.role;

  if (!role || role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  const { dsa_id, rm_id } = req.body;

  await pool.query(
    `
    UPDATE tbl_registeredusers
    SET referred_by_rm = $1
    WHERE id = $2 AND role = 'DSA'
    `,
    [rm_id, dsa_id],
  );

  res.json({
    success: true,
    message: "DSA assigned to RM successfully",
  });
};

// 🔹 ADD NEW USER WITH ROLE (ADMIN ONLY)
export const addRoleUser = async (req, res) => {
  const userRole = req.user?.role;

  // 🔐 Admin only
  if (!userRole || userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  try {
    const {
      adv_id,
      name,
      email,
      mobile,
      pan,
      city,
      head,
      category,
      password,
      role,
      department,
      sub_category,
    } = req.body;

    if (
      !adv_id ||
      !name ||
      !email ||
      !mobile ||
      !pan ||
      !city ||
      !head ||
      !category ||
      !password ||
      !role ||
      !department ||
      !sub_category
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // 🔐 HASH PASSWORD (ONLY ADDITION)
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO tbl_registeredusers (
        adv_id,
        name,
        email,
        mobile,
        pan,
        city,
        head,
        category,
        password,
        role,
        department,
        sub_category
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      )
      RETURNING
        id,
        adv_id,
        name,
        email,
        mobile,
        role,
        department,
        sub_category,
        date_joined;
    `;

    const values = [
      adv_id,
      name,
      email,
      mobile,
      pan,
      city,
      head,
      category,
      hashedPassword,
      role,
      department,
      sub_category,
    ];

    const { rows } = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: "User added successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Add Role User Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const getCibilRequests = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    const query = `SELECT * FROM tbl_cibil_requests ORDER BY ID DESC`;
    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      cibil: rows,
    });
  } catch (error) {
    console.error("Get RM List Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 GET ALL DETAIL LEADS (ADMIN ONLY) WITH PAGINATION
export const getAllDetailLeads = async (req, res) => {
  try {
    // 🔹 Pagination params
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 5000);
    const offset = (page - 1) * limit;

    // 🔹 Total count (fast)
    const countQuery = `SELECT COUNT(*) FROM tbl_detail_leads;`;
    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].count);

    // 🔹 Paged data
    const dataQuery = `
      SELECT *
      FROM tbl_detail_leads
      ORDER BY id DESC
      LIMIT $1 OFFSET $2;
    `;

    const { rows } = await pool.query(dataQuery, [limit, offset]);

    return res.json({
      success: true,
      page,
      limit,
      total_count: totalCount,
      total_pages: Math.ceil(totalCount / limit),
      count: rows.length,
      detail_leads: rows,
    });
  } catch (error) {
    console.error("Get All Detail Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 EXPORT ALL DETAIL LEADS (ADMIN ONLY)
export const exportDetailLeads = async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM tbl_detail_leads
      ORDER BY id ASC;
    `;

    const { rows } = await pool.query(query);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "No data found",
      });
    }

    // Convert JSON to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(rows);

    // Set headers for CSV download
    res.header("Content-Type", "text/csv");
    res.attachment("detail_leads.csv");

    return res.send(csv);

  } catch (error) {
    console.error("Export Detail Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// EDIT DETAIL LEAD FIELDS
export const updateDetailLead = async (req, res) => {
  try {
    const { id } = req.params; // id used only for finding record

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead id is required",
      });
    }

    const updates = req.body;

    // Prevent id update
    if (updates.id) {
      delete updates.id;
    }

    const fields = Object.keys(updates);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update",
      });
    }

    // Build dynamic query
    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const values = Object.values(updates);
    // console.log("The value is:", values);

    const query = `
      UPDATE tbl_detail_leads
      SET ${setClause}
      WHERE id = $${fields.length + 1}
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [...values, id]);
    // console.log("Query after inserting :", rows);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.json({
      success: true,
      message: "Lead updated successfully",
      detail_lead: rows[0],
    });
  } catch (error) {
    console.error("Update Detail Lead Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 EXPORT ALL DETAIL REFERRAL LEADS (ADMIN ONLY)
export const getAllReferralLeads = async (req, res) => {
  try {
    const role = req.user?.role;

    if (role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const query = `
      SELECT 
        rl.id,
        rl.ref_id,

        -- DSA Details
        rl.dsa_id,
        dsa.name AS dsa_name,
        dsa.email AS dsa_email,
        dsa.mobile AS dsa_mobile,
        dsa.city AS dsa_city,

        -- RM Details
        rl.rm_id,
        rm.name AS rm_name,
        rm.email AS rm_email,
        rm.mobile AS rm_mobile,

        -- Department Head Details
        rl.department_head_id,
        dh.name AS department_head_name,

        -- Assigned RM
        rl.assigned_rm_id,
        arm.name AS assigned_rm_name,

        -- Lead Details
        rl.lead_name,
        rl.contact_number,
        rl.email AS lead_email,
        rl.department,
        rl.sub_category,
        rl.notes,
        rl.referral_lead_status,
        rl.created_at

      FROM tbl_referral_leads rl

      LEFT JOIN tbl_registeredusers dsa 
        ON rl.dsa_id = dsa.id

      LEFT JOIN tbl_registeredusers rm 
        ON rl.rm_id = rm.id

      LEFT JOIN tbl_registeredusers dh 
        ON rl.department_head_id = dh.id

      LEFT JOIN tbl_registeredusers arm 
        ON rl.assigned_rm_id = arm.id

      ORDER BY rl.id DESC;
    `;

    const { rows } = await pool.query(query);

    return res.json({
      success: true,
      count: rows.length,
      referral_leads: rows,
    });

  } catch (error) {
    console.error("Export Referral Leads Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔹 EXPORT ALL CARRER APPLICATIONS LEADS (ADMIN AND HR ONLY)
export const getAllCarrerApplication = async (req, res) => {
  try {
    const role = req.user?.role;

    if (role !== "ADMIN" && role !== "HR") {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const query = `
      SELECT *
      FROM tbl_career_applications
      ORDER BY id DESC;
    `;

    const { rows } = await pool.query(query);

    return res.json({
      success: true,
      count: rows.length,
      career_applications: rows,
    });
  } catch (error) {
    console.error("Career Applications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};