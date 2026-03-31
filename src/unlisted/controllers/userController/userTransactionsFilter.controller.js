import pool from '../../../config/db.js';

const filterTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {status} = req.query;

    let query = `
      SELECT
        t.id,
        s.shares_name,
        t.quantity,
        s.price,
        (t.quantity * s.price) AS total_value,
        t.status,
        t.createdat
      FROM tbl_unlisted_transactions t
      JOIN tbl_shares s ON t.share_id = s.id
      WHERE t.user_id = $1
    `;

    const params = [userId];

    if (status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push (status);
    }

    query += ` ORDER BY t.createdat DESC`;

    const {rows} = await pool.query (query, params);

    return res.status (200).json ({
      success: true,
      totalRecords: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error ('User filter transactions error:', error);

    return res.status (500).json ({
      success: false,
      message: 'Failed to fetch filtered transactions',
      error: error.message,
    });
  }
};
export default filterTransactions;
