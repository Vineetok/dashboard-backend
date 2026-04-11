import pool from "../../../config/db.js";

export const getProductSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ================= UNLISTED SHARES ================= */
    const unlistedResult = await pool.query(
      `
      SELECT
        'Unlisted Shares' AS product_type,
        COUNT(t.id) AS total_orders,
        COALESCE(SUM(t.quantity * s.price), 0) AS total_amount
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
      `,
      [userId]
    );

    /* ================= MUTUAL FUNDS ================= */
    const mfResult = await pool.query(
      `
      SELECT
        'Mutual Funds' AS product_type,
        COUNT(id) AS total_orders,
        COALESCE(SUM(amount), 0) AS total_amount
      FROM tbl_mutual_fund_investments
      WHERE user_id = $1
      `,
      [userId]
    );

    /* ================= OTHER PRODUCTS (PLACEHOLDER) ================= */

    const bonds = {
      product_type: "Bonds",
      total_orders: 0,
      total_amount: 0
    };

    const fd = {
      product_type: "Fixed Deposit",
      total_orders: 0,
      total_amount: 0
    };

    const ipo = {
      product_type: "IPO",
      total_orders: 0,
      total_amount: 0
    };

    /* ================= COMBINE ================= */

    const data = [
      {
        product_type: unlistedResult.rows[0].product_type,
        total_orders: Number(unlistedResult.rows[0].total_orders),
        total_amount: Number(unlistedResult.rows[0].total_amount)
      },
      {
        product_type: mfResult.rows[0].product_type,
        total_orders: Number(mfResult.rows[0].total_orders),
        total_amount: Number(mfResult.rows[0].total_amount)
      },
      bonds,
      fd,
      ipo
    ];

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Product Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};