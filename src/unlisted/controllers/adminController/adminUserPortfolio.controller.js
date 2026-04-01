import pool from '../../../config/db.js';

export const getUserPortfolio = async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        shares_name AS company_name,
        price,
        min_lot_size,
        depository_applicable,
        (price * COALESCE(min_lot_size, 0)) AS total_value
      FROM tbl_shares
      WHERE is_active = true
      ORDER BY shares_name ASC
    `;

    const {rows} = await pool.query (query);

    return res.status (200).json ({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error ('GET USER PORTFOLIO ERROR:', err);
    return res.status (500).json ({
      success: false,
      message: 'Failed to fetch portfolio',
    });
  }
};
