import pool from "../../../config/db.js";

export const getPortfolioDistribution = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ================= UNLISTED SHARES ================= */
    const unlistedResult = await pool.query(
      `
      SELECT
        'UNLISTED' AS type,
        t.share_id AS id,
        s.company_name AS name,
        SUM(t.quantity) AS total_quantity,
        s.price AS current_price,
        SUM(t.quantity * s.price) AS total_value
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
      GROUP BY t.share_id, s.company_name, s.price
      `,
      [userId]
    );

    /* ================= MUTUAL FUNDS ================= */
    const mfResult = await pool.query(
      `
      SELECT
        'MUTUAL_FUND' AS type,
        scheme_code AS id,
        fund_name AS name,
        SUM(units) AS total_units,
        AVG(nav_at_investment) AS avg_nav,
        SUM(amount) AS total_value
      FROM tbl_mutual_fund_investments
      WHERE user_id = $1
      GROUP BY scheme_code, fund_name
      `,
      [userId]
    );

    /* ================= COMBINE ================= */

    const unlistedData = unlistedResult.rows.map(item => ({
      type: item.type,
      id: item.id,
      name: item.name,
      quantity: Number(item.total_quantity),
      price: Number(item.current_price),
      value: Number(item.total_value)
    }));

    const mfData = mfResult.rows.map(item => ({
      type: item.type,
      id: item.id,
      name: item.name,
      quantity: Number(item.total_units),
      price: Number(item.avg_nav), // can replace with live NAV later
      value: Number(item.total_value)
    }));

    const combinedData = [...unlistedData, ...mfData];

    /* ================= TOTAL & PERCENTAGE ================= */

    const totalPortfolioValue = combinedData.reduce(
      (sum, item) => sum + item.value,
      0
    );

    const distribution = combinedData.map(item => ({
      ...item,
      percentage:
        totalPortfolioValue > 0
          ? ((item.value / totalPortfolioValue) * 100).toFixed(2)
          : 0
    }));

    /* ================= RESPONSE ================= */

    return res.status(200).json({
      success: true,
      data: {
        total_value: totalPortfolioValue,
        distribution
      }
    });

  } catch (error) {
    console.error("Portfolio Distribution Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};