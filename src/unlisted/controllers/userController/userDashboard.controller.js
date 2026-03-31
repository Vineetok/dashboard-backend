import pool from "../../../config/db.js";

const userDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const debugQuery = `
      SELECT
        t.id AS transaction_id,
        t.quantity,
        s.price
      FROM tbl_unlisted_transactions t
      LEFT JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
    `;

    const debugRows = await pool.query(debugQuery, [userId]);

    const dashboardQuery = `
      SELECT
        COALESCE(SUM(t.quantity * s.price), 0) AS total_invested,
        COUNT(t.id) AS total_transactions,
        COUNT(CASE WHEN t.status = 'PENDING' THEN 1 END) AS pending_transactions
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
    `;

    const { rows } = await pool.query(dashboardQuery, [userId]);

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("User dashboard error:", error);
    res.status(500).json({ success: false, message: "Failed to load user dashboard" });
  }
};

export default userDashboard;
