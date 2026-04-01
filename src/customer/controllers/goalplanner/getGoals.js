import pool from '../../../config/db.js';

export const getGoals = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {rows} = await pool.query (
      `SELECT *
       FROM tbl_goals
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.status (200).json ({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error ('Get Goals Error:', error);

    res.status (500).json ({
      success: false,
      message: 'Failed to fetch goals',
    });
  }
};
