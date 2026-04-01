import pool from '../../../config/db.js';

const adminDashboard = async (req, res) => {
  try {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM tbl_registeredusers WHERE role='CUSTOMER') AS total_users,
        (SELECT COUNT(*) FROM tbl_shares) AS total_companies,
        (SELECT COUNT(*) FROM tbl_unlisted_transactions) AS total_transactions,
       COALESCE((SELECT SUM(price * min_lot_size) FROM tbl_shares), 0) AS total_invested

    `;

    const {rows} = await pool.query (query);
    res.json (rows[0]);
  } catch (err) {
    console.error ('Admin Dashboard Error:', err.message);
    res.status (500).json ({message: 'Failed to fetch admin dashboard'});
  }
};

export default adminDashboard;
