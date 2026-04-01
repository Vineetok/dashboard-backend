import pool from "../../../config/db.js";

export const getOverallReports = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ================= UNLISTED SHARES ================= */
    const unlistedSummary = await pool.query(
      `
      SELECT
        COALESCE(SUM(t.quantity), 0) AS total_holdings,
        COALESCE(SUM(t.quantity * s.price), 0) AS total_value,
        COUNT(t.id) AS total_transactions,
        COUNT(CASE WHEN t.status = 'PENDING' THEN 1 END) AS pending_transactions,
        COUNT(DISTINCT t.share_id) AS total_companies
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
      `,
      [userId]
    );

    /* ================= UNLISTED HOLDINGS ================= */
    const holdings = await pool.query(
      `
      SELECT
        t.share_id,
        SUM(t.quantity) AS quantity,
        s.price AS current_price,
        SUM(t.quantity * s.price) AS holding_value
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
      GROUP BY t.share_id, s.price
      ORDER BY holding_value DESC
      `,
      [userId]
    );

    /* ================= FUTURE PRODUCTS PLACEHOLDER ================= */
    const mutualFunds = {
      total_schemes: 0,
      total_units: 0,
      total_value: 0,
      investments: []
    };

    const bonds = {
      total_bonds: 0,
      total_value: 0,
      investments: []
    };

    const fd = {
      total_fd: 0,
      total_value: 0,
      investments: []
    };

    const ipo = {
      total_ipo: 0,
      total_value: 0,
      investments: []
    };

    /* ================= OVERALL TOTAL ================= */
    const totalInvested =
      Number(unlistedSummary.rows[0].total_value) +
      mutualFunds.total_value +
      bonds.total_value +
      fd.total_value +
      ipo.total_value;

    return res.json({
      success: true,
      data: {
        overall: {
          total_invested: totalInvested,
          total_products: 5,
          active_products: 1
        },

        unlisted_shares: {
          ...unlistedSummary.rows[0],
          holdings: holdings.rows
        },

        mutual_funds: mutualFunds,

        bonds: bonds,

        fd: fd,

        ipo: ipo
      }
    });

  } catch (error) {
    console.error("Overall Reports Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};