import pool from "../../../config/db.js";

export const getMyTickets = async (req, res) => {
  try {
    const customer_id = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        ticket_id,
        category,
        product_type,
        reference_id,
        issue_type,
        severity,
        subject,
        description,
        status,
        created_at,
        updated_at
      FROM tbl_cus_support_tickets
      WHERE customer_id = $1
      ORDER BY created_at DESC
      `,
      [customer_id]
    );

    return res.status(200).json({
      status: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Get My Tickets Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};