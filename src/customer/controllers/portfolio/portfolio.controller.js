import pool from "../../../config/db.js";

const mainPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        s.id AS share_id,
        s.shares_name AS company_name,
        SUM(
          CASE 
            WHEN t.type = 'BUY' THEN t.quantity
            WHEN t.type = 'SELL' THEN -t.quantity
          END
        ) AS total_quantity,
        s.price,
        SUM(
          CASE 
            WHEN t.type = 'BUY' THEN t.quantity * s.price
            WHEN t.type = 'SELL' THEN -t.quantity * s.price
          END
        ) AS invested_value
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1 AND t.status = 'APPROVED'
      GROUP BY s.id, s.shares_name, s.price
      HAVING SUM(
        CASE 
          WHEN t.type = 'BUY' THEN t.quantity
          WHEN t.type = 'SELL' THEN -t.quantity
        END
      ) > 0
      ORDER BY invested_value DESC;
    `;

    const { rows } = await pool.query(query, [userId]);

    // Mutual fund holdings for the customer portfolio
    const mfQuery = `
      SELECT
        scheme_code,
        fund_name,
        SUM(units) AS total_units,
        AVG(nav_at_investment) AS nav,
        SUM(amount) AS invested_value
      FROM tbl_mutual_fund_investments
      WHERE user_id = $1
      GROUP BY scheme_code, fund_name
      ORDER BY invested_value DESC;
    `;
    const { rows: mfRows } = await pool.query(mfQuery, [userId]);

    let totalInvestment = 0;
    let currentValue = 0;

    const holdings = rows.map(item => {
      const quantity = Number(item.total_quantity);
      const price = Number(item.price);
      const invested_value = Number(item.invested_value);
      const current_value = quantity * price;

      totalInvestment += invested_value;
      currentValue += current_value;

      return {
        share_id: item.share_id,
        company_name: item.company_name,
        total_quantity: quantity,
        price,
        invested_value,
        current_value,
        returns: current_value - invested_value
      };
    });

    const unlisted = {
      totalInvestment,
      currentValue,
      returns: currentValue - totalInvestment,
      holdings
    };

    let mfTotalInvestment = 0;
    let mfCurrentValue = 0;

    const mfHoldings = mfRows.map(item => {
      const units = Number(item.total_units);
      const nav = Number(item.nav) || 0;
      const invested_value = Number(item.invested_value);
      const current_value = units * nav;

      mfTotalInvestment += invested_value;
      mfCurrentValue += current_value;

      return {
        scheme_code: item.scheme_code,
        fund_name: item.fund_name,
        units,
        nav,
        invested_value,
        current_value
      };
    });

    const mutualFunds = {
      totalInvestment: mfTotalInvestment,
      currentValue: mfCurrentValue,
      returns: mfCurrentValue - mfTotalInvestment,
      holdings: mfHoldings
    };

    const loans = null;
    const insurance = null;

    res.status(200).json({
      success: true,
      message: "Main portfolio fetched successfully",
      data: {
        summary: {
          totalInvestment,
          currentValue,
          totalReturns: currentValue - totalInvestment
        },
        portfolio: {
          unlisted_shares: unlisted,
          mutual_funds: mutualFunds,
          loans: loans,
          insurance: insurance
        }
      }
    });

  } catch (error) {
    console.error("Main portfolio error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio"
    });
  }
};

export default mainPortfolio;