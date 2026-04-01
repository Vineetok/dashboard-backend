import pool from "../../../config/db.js";

export const getRecentInvestments = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        t.id AS transaction_id,
        t.share_id,
        t.quantity,
        s.price,
        (t.quantity * s.price) AS total_amount,
        t.status,
        t.createdat
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
      ORDER BY t.createdat DESC
      LIMIT 10
      `,
      [userId]
    );

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Recent Investments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};