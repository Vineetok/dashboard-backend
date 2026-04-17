import pool from "../../../config/db.js";

export const getRecentInvestments = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ================= UNLISTED SHARES ================= */
    const unlistedResult = await pool.query(
      `
      SELECT
        'UNLISTED' AS type,
        t.id AS transaction_id,
        t.share_id AS product_id,
        s.shares_name AS name,
        t.quantity,
        s.price,
        (t.quantity * s.price) AS total_amount,
        t.status,
        t.createdat
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
        'MUTUAL_FUND' AS type,
        id AS transaction_id,
        scheme_code AS product_id,
        fund_name AS name,
        units AS quantity,
        nav_at_investment AS price,
        amount AS total_amount,
        'COMPLETED' AS status,
        createdAt AS createdat
      FROM tbl_mutual_fund_investments
      WHERE user_id = $1
      `,
      [userId]
    );

    /* ================= COMBINE + SORT ================= */

    const combined = [...unlistedResult.rows, ...mfResult.rows];

    const sorted = combined
      .sort((a, b) => new Date(b.createdat) - new Date(a.createdat))
      .slice(0, 10);

    /* ================= FORMAT ================= */

    const data = sorted.map(item => ({
      type: item.type,
      transaction_id: item.transaction_id,
      product_id: item.product_id,
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price),
      total_amount: Number(item.total_amount),
      status: item.status,
      createdat: item.createdat
    }));

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Recent Investments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};