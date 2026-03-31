import pool from '../../../config/db.js';

export const getGoalById = async (req, res) => {
  try {
    const {goal_id} = req.params;
    const user_id = req.user.id;

    const {rows} = await pool.query (
      `SELECT *
       FROM tbl_goals
       WHERE id = $1 AND user_id = $2`,
      [goal_id, user_id]
    );

    if (rows.length === 0) {
      return res.status (404).json ({
        success: false,
        message: 'Goal not found',
      });
    }

    res.status (200).json ({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error ('Get Goal Error:', error);

    res.status (500).json ({
      success: false,
      message: 'Failed to fetch goal',
    });
  }
};
