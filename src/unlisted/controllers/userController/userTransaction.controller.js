import pool from '../../../config/db.js';

export const userTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
  SELECT
    t.id,
    s.shares_name AS company_name,
    t.type,
    t.quantity,
    s.price,
    t.quantity * s.price AS total_value,
    t.status,
    t.createdat
  FROM tbl_unlisted_transactions t
  JOIN tbl_shares s ON t.share_id = s.id
  WHERE t.user_id = $1
  ORDER BY t.createdat DESC
`;

    const {rows} = await pool.query (query, [userId]);
    res.status (200).json ({success: true, data: rows});
  } catch (error) {
    console.error ('User transactions error:', error);
    res
      .status (500)
      .json ({success: false, message: 'Failed to fetch transactions'});
  }
};

export default userTransactions;
