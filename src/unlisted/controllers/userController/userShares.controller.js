import pool from '../../../config/db.js';

/* ===========================
   GET SHARES FOR USER PANEL
=========================== */
const getUserShares = async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        shares_name,
        logo_url,
        price,
        min_lot_size,
        depository_applicable
      FROM tbl_shares
      ORDER BY updated_at DESC
    `;

    const {rows} = await pool.query (query);

    res.status (200).json ({
      success: true,
      message: 'Shares fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error ('USER SHARES FETCH ERROR:', error);
    res.status (500).json ({
      success: false,
      message: 'Failed to fetch shares',
    });
  }
};

export default getUserShares;
