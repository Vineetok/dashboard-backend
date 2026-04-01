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

    let totalInvestment = 0;
    let currentValue = 0;

    const holdings = rows.map(item => {
      const quantity = Number(item.total_quantity);
      const price = Number(item.price);
      const investment = Number(item.invested_value);
      const currentVal = quantity * price;

      totalInvestment += investment;
      currentValue += currentVal;

      return {
        shareId: item.share_id,
        companyName: item.company_name,
        quantity,
        price,
        investment,
        currentValue: currentVal,
        returns: currentVal - investment
      };
    });

    const unlisted = {
      totalInvestment,
      currentValue,
      returns: currentValue - totalInvestment,
      holdings
    };

    const mutualFunds = null;
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