import pool from "../../../config/db.js";

export const getProductSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        'Unlisted Shares' AS product_type,
        COUNT(t.id) AS total_orders,
        COALESCE(SUM(t.quantity * s.price),0) AS total_amount
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
      `,
      [userId]
    );

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Product Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};