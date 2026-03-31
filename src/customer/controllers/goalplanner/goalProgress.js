import pool from '../../../config/db.js';

export const goalProgress = async (req, res) => {
  try {
    const {goal_id} = req.params;

    const {rows} = await pool.query (
      `SELECT target_amount, current_savings
       FROM tbl_goals
       WHERE id = $1`,
      [goal_id]
    );

    if (rows.length === 0) {
      return res.status (404).json ({
        success: false,
        message: 'Goal not found',
      });
    }

    const goal = rows[0];

    const progress = goal.current_savings / goal.target_amount * 100;

    res.status (200).json ({
      success: true,
      progress_percentage: Math.round (progress),
    });
  } catch (error) {
    console.error ('Goal Progress Error:', error);

    res.status (500).json ({
      success: false,
      message: 'Failed to calculate goal progress',
    });
  }
};
