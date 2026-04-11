import pool from "../../../config/db.js";

export const getOverallReports = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ================= UNLISTED SHARES ================= */
    const unlistedSummaryResult = await pool.query(
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

    const unlistedSummary = unlistedSummaryResult.rows[0] || {};

    const holdingsResult = await pool.query(
      `
      SELECT
        t.share_id,
        s.company_name,
        SUM(t.quantity) AS quantity,
        s.price AS current_price,
        SUM(t.quantity * s.price) AS holding_value
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
      GROUP BY t.share_id, s.company_name, s.price
      ORDER BY holding_value DESC
      `,
      [userId]
    );

    /* ================= MUTUAL FUNDS ================= */

    // Summary
    const mfSummaryResult = await pool.query(
      `
      SELECT
        COUNT(DISTINCT scheme_code) AS total_schemes,
        COALESCE(SUM(units), 0) AS total_units,
        COALESCE(SUM(amount), 0) AS total_invested
      FROM tbl_mutual_fund_investments
      WHERE user_id = $1
      `,
      [userId]
    );

    const mfSummary = mfSummaryResult.rows[0] || {};

    // Holdings per scheme
    const mfHoldingsResult = await pool.query(
      `
      SELECT
        scheme_code,
        fund_name,
        SUM(units) AS total_units,
        SUM(amount) AS total_invested,
        AVG(nav_at_investment) AS avg_nav
      FROM tbl_mutual_fund_investments
      WHERE user_id = $1
      GROUP BY scheme_code, fund_name
      ORDER BY total_invested DESC
      `,
      [userId]
    );

    const mutualFunds = {
      total_schemes: Number(mfSummary.total_schemes) || 0,
      total_units: Number(mfSummary.total_units) || 0,
      total_value: Number(mfSummary.total_invested) || 0, // replace later with live NAV
      investments: mfHoldingsResult.rows || []
    };

    /* ================= OTHER PRODUCTS ================= */

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

    /* ================= OVERALL ================= */

    const unlistedValue = Number(unlistedSummary.total_value) || 0;

    const totalInvested =
      unlistedValue +
      mutualFunds.total_value +
      bonds.total_value +
      fd.total_value +
      ipo.total_value;

    const activeProducts =
      (unlistedValue > 0 ? 1 : 0) +
      (mutualFunds.total_value > 0 ? 1 : 0);

    return res.status(200).json({
      success: true,
      data: {
        overall: {
          total_invested: totalInvested,
          total_products: 5,
          active_products: activeProducts
        },

        unlisted_shares: {
          total_holdings: Number(unlistedSummary.total_holdings) || 0,
          total_value: unlistedValue,
          total_transactions: Number(unlistedSummary.total_transactions) || 0,
          pending_transactions: Number(unlistedSummary.pending_transactions) || 0,
          total_companies: Number(unlistedSummary.total_companies) || 0,
          holdings: holdingsResult.rows || []
        },

        mutual_funds: mutualFunds,

        bonds,
        fd,
        ipo
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