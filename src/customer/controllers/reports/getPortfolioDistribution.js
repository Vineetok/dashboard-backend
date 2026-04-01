import pool from "../../../config/db.js";

export const getPortfolioDistribution = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        t.share_id,
        SUM(t.quantity) AS total_quantity,
        s.price AS current_price,
        SUM(t.quantity * s.price) AS total_value
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
      GROUP BY t.share_id, s.price
      ORDER BY total_value DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Portfolio Distribution Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};