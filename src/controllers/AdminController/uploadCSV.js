import fs from "fs";
import csv from "csv-parser";
import pool from "../../config/db.js";

export const uploadCSVToDB = async (req, res) => {
  const userRole = req.user?.role;

  if (!userRole || userRole !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "CSV file is required." });
  }

  const filePath = req.file.path;
  const records = [];

  let client;
  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => records.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    if (records.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "CSV file is empty." });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    // IMPORTANT: Clear dependent tables first (because they FK to tbl_registeredusers)

    // Adjust order if you have more tables referencing tbl_registeredusers(id)

    // await client.query(
    //   "TRUNCATE TABLE tbl_support_tickets RESTART IDENTITY CASCADE",
    // );

    // await client.query(
    //   "TRUNCATE TABLE tbl_referral_leads RESTART IDENTITY CASCADE",
    // );

    // ✅ 1) Clear users table (CASCADE also clears other dependent tables if any)
    // await client.query(
    //   "TRUNCATE TABLE tbl_registeredusers RESTART IDENTITY CASCADE",
    // );

    // ✅ 2) Insert users WITHOUT referred_by_rm first (avoid self-FK ordering issue)
    const insertQuery = `
      INSERT INTO tbl_registeredusers (
        id,
        adv_id,
        name,
        email,
        mobile,
        pan,
        city,
        head,
        category,
        password,
        date_joined,
        updated_at,
        role,
        department,
        sub_category,
        referral_code,
        pan_verified,
        state
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      )
    `;

    for (const row of records) {
      const values = [
        row.id && row.id !== "null" ? Number(row.id) : null,
        row.adv_id,
        row.name,
        row.email,
        row.mobile,
        row.pan,
        row.city,
        row.head,
        row.category,
        row.password,
        row.date_joined && row.date_joined !== "null" ? row.date_joined : null,
        row.updated_at && row.updated_at !== "null" ? row.updated_at : null,
        row.role,
        row.department,
        row.sub_category,
        row.referral_code && row.referral_code !== "null"
          ? row.referral_code
          : null,
        row.pan_verified,
        row.state,
      ];

      await client.query(insertQuery, values);
    }

    // ✅ 3) Second pass: set referred_by_rm only after all ids exist
    const updateRefQuery = `
      UPDATE tbl_registeredusers
      SET referred_by_rm = $1
      WHERE id = $2
    `;

    for (const row of records) {
      const ref =
        row.referred_by_rm && row.referred_by_rm !== "null"
          ? Number(row.referred_by_rm)
          : null;
      const id = row.id && row.id !== "null" ? Number(row.id) : null;

      if (ref !== null && id !== null) {
        await client.query(updateRefQuery, [ref, id]);
      }
    }

    // ✅ 4) Reset sequence to max(id)
    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('tbl_registeredusers', 'id'),
        COALESCE((SELECT MAX(id) FROM tbl_registeredusers), 1)
      );
    `);

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "CSV loaded into local DB successfully (table replaced).",
      insertedCount: records.length,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("CSV Upload Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  } finally {
    if (client) client.release();
    fs.unlinkSync(filePath);
  }
};

// Detail Leads CSV upload (with upsert logic and sequence reset)
export const uploadDetailLeadsCSV = async (req, res) => {
  const userRole = req.user?.role;

  if (!userRole || userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "CSV file is required.",
    });
  }

  const filePath = req.file.path;
  const records = [];

  let client;

  try {
    // ✅ 1️⃣ Read CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => records.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CSV file is empty.",
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    // await client.query(
    //   "TRUNCATE TABLE tbl_detail_leads RESTART IDENTITY CASCADE",
    // );

    const insertQuery = `
      INSERT INTO tbl_detail_leads (
        id,
        detail_lead_id,
        dsa_id,
        rm_id,
        assigned_rm_id,
        department_head_id,
        department,
        sub_category,
        lead_name,
        contact_number,
        email,
        status,
        is_self_login,
        form_data,
        product_type,
        created_at,
        lead_status,
        rm_acceptance_status,
        first_assigned_rm_id,
        previous_rm_id,
        rm_assigned_at,
        rm_accepted_at,
        rm_action_deadline,
        disbursement_amount,
        gross_payout_amount,
        gst_amount,
        tds_amount,
        net_payout_amount,
        payout_date,
        payout_id,
        payment_mode,
        transaction_reference_no,
        invoice_number,
        invoice_date,
        policy_number
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,
        $24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
      )
      ON CONFLICT (detail_lead_id)
      DO UPDATE SET
        dsa_id = EXCLUDED.dsa_id,
        rm_id = EXCLUDED.rm_id,
        assigned_rm_id = EXCLUDED.assigned_rm_id,
        department = EXCLUDED.department,
        sub_category = EXCLUDED.sub_category,
        lead_name = EXCLUDED.lead_name,
        contact_number = EXCLUDED.contact_number,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        form_data = EXCLUDED.form_data,
        product_type = EXCLUDED.product_type,
        lead_status = EXCLUDED.lead_status,
        rm_acceptance_status = EXCLUDED.rm_acceptance_status,
        disbursement_amount = EXCLUDED.disbursement_amount,
        gross_payout_amount = EXCLUDED.gross_payout_amount,
        gst_amount = EXCLUDED.gst_amount,
        tds_amount = EXCLUDED.tds_amount,
        net_payout_amount = EXCLUDED.net_payout_amount,
        payout_date = EXCLUDED.payout_date,
        payout_id = EXCLUDED.payout_id,
        payment_mode = EXCLUDED.payment_mode,
        transaction_reference_no = EXCLUDED.transaction_reference_no,
        invoice_number = EXCLUDED.invoice_number,
        invoice_date = EXCLUDED.invoice_date,
        policy_number = EXCLUDED.policy_number;
    `;

    let insertedCount = 0;

    const safeNumber = (value) => {
      if (!value) return null;
      const trimmed = value.toString().trim();
      if (trimmed === "" || trimmed.toLowerCase() === "null") return null;
      const num = Number(trimmed);
      return isNaN(num) ? null : num;
    };

    const safeTimestamp = (value) => {
      if (!value) return null;
      const trimmed = value.toString().trim();
      if (trimmed === "" || trimmed.toLowerCase() === "null") return null;
      const date = new Date(trimmed);
      return isNaN(date.getTime()) ? null : date;
    };

    const safeString = (value) => {
      if (!value) return null;
      const trimmed = value.toString().trim();
      if (trimmed === "" || trimmed.toLowerCase() === "null") return null;
      return trimmed;
    };

    for (const row of records) {

      const values = [
        safeNumber(row.id),
        safeString(row.detail_lead_id),
        safeNumber(row.dsa_id),
        safeNumber(row.rm_id),
        safeNumber(row.assigned_rm_id),
        safeNumber(row.department_head_id),
        safeString(row.department),
        safeString(row.sub_category),
        safeString(row.lead_name),
        safeString(row.contact_number),
        safeString(row.email),
        safeString(row.status) || "INCOMING_LEAD",
        row.is_self_login === "true",
        row.form_data ? JSON.parse(row.form_data) : {},
        safeString(row.product_type),
        safeTimestamp(row.created_at) || new Date(),
        safeString(row.lead_status) || "NEW",
        safeString(row.rm_acceptance_status) || "PENDING",
        safeNumber(row.first_assigned_rm_id),
        safeNumber(row.previous_rm_id),
        safeTimestamp(row.rm_assigned_at),
        safeTimestamp(row.rm_accepted_at),
        safeTimestamp(row.rm_action_deadline),
        safeNumber(row.disbursement_amount),
        safeNumber(row.gross_payout_amount),
        safeNumber(row.gst_amount),
        safeNumber(row.tds_amount),
        safeNumber(row.net_payout_amount),
        safeTimestamp(row.payout_date),
        safeString(row.payout_id),
        safeString(row.payment_mode),
        safeString(row.transaction_reference_no),
        safeString(row.invoice_number),
        safeTimestamp(row.invoice_date),
        safeString(row.policy_number),
      ];

      await client.query(insertQuery, values);
      insertedCount++;
    }

    // ✅ Reset sequence properly
    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('tbl_detail_leads', 'id'),
        COALESCE((SELECT MAX(id) FROM tbl_detail_leads), 1)
      );
    `);

    await client.query("COMMIT");
    return res.status(200).json({
      success: true,
      message: "Detail leads CSV uploaded successfully.",
      processed: records.length,
      affected: insertedCount,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Detail Leads CSV Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    if (client) client.release();
    fs.unlinkSync(filePath);
  }
};
